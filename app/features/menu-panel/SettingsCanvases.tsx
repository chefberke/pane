'use client';
import { memo } from 'react';
import { Cloud, HardDrive } from 'lucide-react';
import { SettingRow, ModalButton } from './primitives';

interface Props {
  count: number;
  trashCount: number;
  isSynced: boolean;
  onOpenTrash: () => void;
}

/** Canvases & storage section: canvas count, sync/storage status, and trash access. */
function SettingsCanvases({ count, trashCount, isSynced, onOpenTrash }: Props) {
  return (
    <div className="flex flex-col">
      <SettingRow label="Canvases" description="Your saved canvases">
        <span className="text-[15px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{count}</span>
      </SettingRow>

      <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

      <SettingRow label="Storage" description={isSynced ? 'Synced to your account' : 'Saved on this device'}>
        <span className="flex-shrink-0" style={{ color: 'var(--color-text-muted)', display: 'flex' }}>
          {isSynced ? <Cloud size={18} /> : <HardDrive size={18} />}
        </span>
      </SettingRow>

      <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

      <SettingRow label="Trash" description={trashCount > 0 ? `${trashCount} deleted ${trashCount === 1 ? 'canvas' : 'canvases'}` : 'Empty'}>
        <ModalButton label="Open trash" onClick={onOpenTrash} disabled={trashCount === 0} />
      </SettingRow>
    </div>
  );
}

export default memo(SettingsCanvases);
