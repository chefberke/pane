'use client';
import { useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { MousePointer2, Hand, Search, Type, RefreshCw } from 'lucide-react';
import type { ToolbarStatus, ToolbarActions } from './types';
import Tip from './Tip';
import { Btn, Sep } from './Btn';

/** Floating bottom toolbar with mode toggles and canvas actions. */
export default function Toolbar({ status, actions }: { status: ToolbarStatus; actions: ToolbarActions }) {
  const { isPanMode, hasRefreshable, isRefreshing } = status;
  const { addText, togglePanMode, search, refresh } = actions;

  const [rotation, setRotation] = useState(0);

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 backdrop-blur-md rounded-2xl px-2 py-2 pointer-events-auto"
      style={{
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-default)',
        boxShadow: 'var(--shadow-float)',
      }}
      onDoubleClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* Mode: segmented control */}
      <LayoutGroup>
        <div
          className="flex items-center rounded-[11px] p-0.5 gap-0.5"
          style={{ background: 'var(--color-surface-sunken)' }}
        >
          <Tip label="Select" shortcut="V">
            <button
              onClick={() => { if (isPanMode) togglePanMode(); }}
              className="relative w-7 h-7 flex items-center justify-center rounded-[9px] cursor-pointer"
            >
              {!isPanMode && (
                <motion.div
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-[9px] shadow-sm"
                  style={{ background: 'var(--color-surface-control-active)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className="relative z-10 transition-colors duration-100"
                style={{ color: !isPanMode ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
              >
                <MousePointer2 size={13} />
              </span>
            </button>
          </Tip>
          <Tip label="Pan" shortcut="H">
            <button
              onClick={() => { if (!isPanMode) togglePanMode(); }}
              className="relative w-7 h-7 flex items-center justify-center rounded-[9px] cursor-pointer"
            >
              {isPanMode && (
                <motion.div
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-[9px] shadow-sm"
                  style={{ background: 'var(--color-surface-control-active)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className="relative z-10 transition-colors duration-100"
                style={{ color: isPanMode ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
              >
                <Hand size={13} />
              </span>
            </button>
          </Tip>
        </div>
      </LayoutGroup>

      <Sep />

      <Tip label="Search blocks" shortcut="⌘K">
        <Btn onClick={search}>
          <Search size={14} />
        </Btn>
      </Tip>

      <Sep />

      <Tip label="Text note" shortcut="T">
        <Btn onClick={addText}>
          <Type size={14} />
        </Btn>
      </Tip>

      {hasRefreshable && (
        <>
          <Sep />
          <Tip label="Refresh embeds">
            <button
              onClick={() => { if (!isRefreshing) { setRotation(r => r + 360); refresh(); } }}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
              style={{ color: 'var(--color-text-tertiary)' }}
              disabled={isRefreshing}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
              }}
            >
              <motion.span
                className="inline-flex"
                animate={{ rotate: rotation }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <RefreshCw size={14} />
              </motion.span>
            </button>
          </Tip>
        </>
      )}

    </div>
  );
}
