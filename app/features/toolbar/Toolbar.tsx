'use client';
import { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import type { ToolbarStatus, ToolbarActions } from './types';
import Tip from './Tip';
import { Btn, Sep } from './Btn';

/** Floating bottom toolbar with mode toggles, zoom controls, and canvas actions. */
export default function Toolbar({ status, actions }: { status: ToolbarStatus; actions: ToolbarActions }) {
  const { scale, blockCount, isDark, isPanMode, hasRefreshable, isRefreshing } = status;
  const { zoomIn, zoomOut, reset, addText, clear, toggleTheme, togglePanMode, search, refresh } = actions;

  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    if (isRefreshing) setRotation(r => r + 360);
  }, [isRefreshing]);

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/50 border border-black/[0.06] dark:border-white/[0.06] px-2 py-2 pointer-events-auto"
      onDoubleClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Mode: segmented control */}
      <LayoutGroup>
        <div className="flex items-center bg-gray-100 dark:bg-[#2a2a2a] rounded-[11px] p-0.5 gap-0.5">
          <Tip label="Select" shortcut="V">
            <button
              onClick={() => { if (isPanMode) togglePanMode(); }}
              className="relative w-7 h-7 flex items-center justify-center rounded-[9px]"
            >
              {!isPanMode && (
                <motion.div
                  layoutId="mode-pill"
                  className="absolute inset-0 bg-white dark:bg-[#444] rounded-[9px] shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className={['relative z-10 transition-colors duration-100', !isPanMode ? 'text-gray-800 dark:text-[#eee]' : 'text-gray-400 dark:text-[#555]'].join(' ')}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 1.5L11 6l-4 1.4L5.5 11.5 2 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill={!isPanMode ? 'currentColor' : 'none'} fillOpacity={!isPanMode ? 0.15 : 0} />
                </svg>
              </span>
            </button>
          </Tip>
          <Tip label="Pan" shortcut="H">
            <button
              onClick={() => { if (!isPanMode) togglePanMode(); }}
              className="relative w-7 h-7 flex items-center justify-center rounded-[9px]"
            >
              {isPanMode && (
                <motion.div
                  layoutId="mode-pill"
                  className="absolute inset-0 bg-white dark:bg-[#444] rounded-[9px] shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className={['relative z-10 transition-colors duration-100', isPanMode ? 'text-gray-800 dark:text-[#eee]' : 'text-gray-400 dark:text-[#555]'].join(' ')}>
                <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
                  <path d="M6 2a1 1 0 0 1 2 0v5.5M6 2V5M6 2a1 1 0 0 0-2 0v4.5M4 5a1 1 0 0 0-2 0v2.5m0 0V9a4.5 4.5 0 0 0 9 0V6.5a1 1 0 0 0-2 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
          </Tip>
        </div>
      </LayoutGroup>

      <Sep />

      <Tip label="Zoom out" shortcut="−">
        <Btn onClick={zoomOut}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </Btn>
      </Tip>

      <Tip label="Reset zoom" shortcut="0">
        <button
          onClick={reset}
          className="h-8 px-2 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#2e2e2e] text-[11px] font-semibold text-gray-500 dark:text-[#888] hover:text-gray-800 dark:hover:text-[#ccc] transition-colors tabular-nums min-w-[42px]"
        >
          {Math.round(scale * 100)}%
        </button>
      </Tip>

      <Tip label="Zoom in" shortcut="+">
        <Btn onClick={zoomIn}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </Btn>
      </Tip>

      <Sep />

      <Tip label="Search blocks" shortcut="⌘K">
        <Btn onClick={search}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.35"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
          </svg>
        </Btn>
      </Tip>

      <Sep />

      <Tip label="Text note" shortcut="T">
        <Btn onClick={addText}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3h10M7 3v8M4.5 11h5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Btn>
      </Tip>

      <Tip label={isDark ? 'Light mode' : 'Dark mode'} shortcut="D">
        <Btn onClick={toggleTheme}>
          {isDark ? (
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="2.8" stroke="currentColor" strokeWidth="1.35"/>
              <path d="M7.5 1.5v1.2M7.5 12.3v1.2M1.5 7.5h1.2M12.3 7.5h1.2M3.4 3.4l.85.85M10.75 10.75l.85.85M3.4 11.6l.85-.85M10.75 4.25l.85-.85" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <path d="M7 2A5.5 5.5 0 1 0 13 8 4 4 0 0 1 7 2z" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </Btn>
      </Tip>

      {hasRefreshable && (
        <>
          <Sep />
          <Tip label="Refresh embeds">
            <button
              onClick={() => { if (!isRefreshing) refresh(); }}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 dark:text-[#888] hover:bg-gray-100 dark:hover:bg-[#2e2e2e] hover:text-gray-800 dark:hover:text-[#ccc] transition-colors disabled:opacity-40"
              disabled={isRefreshing}
            >
              <motion.svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                animate={{ rotate: rotation }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <path d="M7 2a5 5 0 1 0 4.33 2.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
                <path d="M11.5 1.5v3.5h-3.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
              </motion.svg>
            </button>
          </Tip>
        </>
      )}

      {blockCount > 0 && (
        <>
          <Sep />
          <Tip label="Clear canvas">
            <button
              onClick={clear}
              className="h-8 px-2.5 flex items-center rounded-xl text-[11px] font-medium text-gray-400 dark:text-[#555] hover:text-red-500 dark:hover:text-[#f87171] hover:bg-red-50 dark:hover:bg-[#2e1a1a] transition-colors"
            >
              Clear
            </button>
          </Tip>
        </>
      )}
    </div>
  );
}
