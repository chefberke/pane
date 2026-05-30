'use client';
import { memo, useRef, useState } from 'react';

interface Props {
  label: string;
  children: React.ReactNode;
}

const TIP_DELAY = 300;

/** Small floating tooltip shown above a frame action-pill icon button after a short hover delay. */
function ActionTip({ label, children }: Props) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => { timer.current = setTimeout(() => setVisible(true), TIP_DELAY); };
  const hide = () => { if (timer.current) clearTimeout(timer.current); setVisible(false); };

  return (
    <div className="relative flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-50 flex flex-col items-center">
          <div
            className="text-[10px] font-medium leading-none rounded-md px-2 py-1 whitespace-nowrap backdrop-blur-sm"
            style={{
              background: 'var(--color-surface-raised)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            {label}
          </div>
          <div
            className="w-1.5 h-1.5 rotate-45 -mt-[3px] rounded-[1px] border-r border-b"
            style={{
              background: 'var(--color-surface-raised)',
              borderColor: 'var(--color-border-default)',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default memo(ActionTip);
