'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IDLE_HINT_MS, IDLE_HINT_BLINK_PERIOD_MS, IDLE_HINT_BLINK_VISIBLE_MS } from '../constants';
import { useLatestRef } from './useLatestRef';

interface Options {
  enabled: boolean;
}

interface IdleHintApi {
  idleHint: { x: number; y: number } | null;
  reportPointer: (sx: number, sy: number) => void;
}

/** After the user goes ~30s without an action, blinks a "double-click to add" nudge under the cursor every few seconds; any real action (click, key, pan/zoom) resets it. */
export function useCanvasIdleHint({ enabled }: Options): IdleHintApi {
  const [idleHint, setIdleHint] = useState<{ x: number; y: number } | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useLatestRef(enabled);

  const clearTimers = useCallback(() => {
    if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = null; }
    if (blinkTimer.current) { clearInterval(blinkTimer.current); blinkTimer.current = null; }
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
  }, []);

  // One wink: show under the current cursor, then fade out after the visible window.
  const flashOnce = useCallback(() => {
    if (!enabledRef.current || !lastPos.current) return;
    setIdleHint(lastPos.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setIdleHint(null), IDLE_HINT_BLINK_VISIBLE_MS);
  }, [enabledRef]);

  const startBlinking = useCallback(() => {
    if (blinkTimer.current) return;
    flashOnce();
    blinkTimer.current = setInterval(flashOnce, IDLE_HINT_BLINK_PERIOD_MS);
  }, [flashOnce]);

  // (Re)start the idle countdown; once it elapses with no action, blinking begins.
  const scheduleIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (enabledRef.current) startBlinking();
    }, IDLE_HINT_MS);
  }, [startBlinking, enabledRef]);

  /** Tracks the cursor so a blink lands under it. Pure movement is NOT an action, so it does not restart the idle countdown — it only keeps a visible wink from lagging behind the pointer. */
  const reportPointer = useCallback((sx: number, sy: number) => {
    lastPos.current = { x: sx, y: sy };
    setIdleHint(prev => (prev ? null : prev));
  }, []);

  // Real interactions anywhere count as an action: hide any nudge and restart the countdown.
  useEffect(() => {
    const onAction = () => {
      clearTimers();
      setIdleHint(prev => (prev ? null : prev));
      scheduleIdle();
    };
    window.addEventListener('keydown', onAction);
    window.addEventListener('wheel', onAction, { passive: true });
    window.addEventListener('pointerdown', onAction);
    return () => {
      window.removeEventListener('keydown', onAction);
      window.removeEventListener('wheel', onAction);
      window.removeEventListener('pointerdown', onAction);
    };
  }, [clearTimers, scheduleIdle]);

  // Leaving the tab/app (tab switch, alt-tab) must hide any wink and stop the
  // timers, so a frozen hint isn't left on screen and throttled timers don't
  // fire coalesced on return. Returning just restarts a fresh idle countdown.
  useEffect(() => {
    const hide = () => {
      clearTimers();
      setIdleHint(prev => (prev ? null : prev));
    };
    const resume = () => {
      if (enabledRef.current) scheduleIdle();
    };
    const onVisibility = () => (document.hidden ? hide() : resume());
    window.addEventListener('blur', hide);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [clearTimers, scheduleIdle, enabledRef]);

  // Start counting when the canvas is idle-eligible; stop everything when busy.
  useEffect(() => {
    if (enabled) scheduleIdle();
    else clearTimers();
  }, [enabled, scheduleIdle, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // While busy/ineligible the hint must stay hidden even mid-blink.
  return { idleHint: enabled ? idleHint : null, reportPointer };
}
