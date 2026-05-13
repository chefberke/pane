'use client';
import { useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { MousePointer2, Hand, Search, Type, Sun, Moon, RefreshCw } from 'lucide-react';
import type { ToolbarStatus, ToolbarActions } from './types';
import Tip from './Tip';
import { Btn, Sep } from './Btn';

/** Floating bottom toolbar with mode toggles and canvas actions. */
export default function Toolbar({ status, actions }: { status: ToolbarStatus; actions: ToolbarActions }) {
  const { isDark, isPanMode, hasRefreshable, isRefreshing } = status;
  const { addText, toggleTheme, togglePanMode, search, refresh } = actions;

  const [rotation, setRotation] = useState(0);

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-md rounded-2xl shadow-lg shadow-black/10 dark:shadow-black/50 border border-black/[0.06] dark:border-white/[0.06] px-2 py-2 pointer-events-auto"
      onDoubleClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
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
                <MousePointer2 size={13} />
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

      <Tip label={isDark ? 'Light mode' : 'Dark mode'} shortcut="D">
        <Btn onClick={toggleTheme}>
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </Btn>
      </Tip>

      {hasRefreshable && (
        <>
          <Sep />
          <Tip label="Refresh embeds">
            <button
              onClick={() => { if (!isRefreshing) { setRotation(r => r + 360); refresh(); } }}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 dark:text-[#888] hover:bg-gray-100 dark:hover:bg-[#2e2e2e] hover:text-gray-800 dark:hover:text-[#ccc] transition-colors disabled:opacity-40"
              disabled={isRefreshing}
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
