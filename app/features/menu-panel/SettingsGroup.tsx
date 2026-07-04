'use client';
import { memo } from 'react';
import { Settings, Command, HelpCircle, Trash2, FileUp } from 'lucide-react';
import { Row } from './primitives';

interface Props {
  hasUser: boolean;
  trashCount: number;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenTrash: () => void;
  onImport: () => void;
  onOpenFeedback: () => void;
}

/** Settings, shortcuts, import, trash, and help rows at the bottom of the panel. */
function SettingsGroup({ hasUser, trashCount, onOpenSettings, onOpenShortcuts, onOpenTrash, onImport, onOpenFeedback }: Props) {
  return (
    <div style={{ borderTop: '1px solid var(--color-border-default)' }} className="py-2">
      <Row icon={<Settings size={14} />} label="Settings" onClick={onOpenSettings} />
      <Row icon={<Command size={14} />} label="Keyboard shortcuts" shortcut="?" onClick={onOpenShortcuts} />
      {hasUser && <Row icon={<FileUp size={14} />} label="Import canvas…" onClick={onImport} />}
      {hasUser && (
        <Row
          icon={<Trash2 size={14} />}
          label="Trash"
          shortcut={trashCount > 0 ? String(trashCount) : undefined}
          onClick={onOpenTrash}
        />
      )}
      <Row icon={<HelpCircle size={14} />} label="Help & feedback" onClick={onOpenFeedback} />
    </div>
  );
}

export default memo(SettingsGroup);
