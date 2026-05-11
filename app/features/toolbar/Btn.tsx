'use client';

interface BtnProps {
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Icon-only square toolbar button with active/inactive visual states. */
export function Btn({ onClick, active = false, children, className = '' }: BtnProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-8 h-8 flex items-center justify-center rounded-xl transition-colors duration-100',
        active
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
          : 'text-gray-500 dark:text-[#888] hover:bg-gray-100 dark:hover:bg-[#2e2e2e] hover:text-gray-800 dark:hover:text-[#ccc]',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/** 1px vertical divider between toolbar sections. */
export function Sep() {
  return <div className="w-px h-4 bg-gray-200 dark:bg-[#333] mx-0.5 flex-shrink-0" />;
}
