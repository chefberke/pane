'use client';
import { useWorkspaceRedirect } from '../features/workspace/hooks/useWorkspaceRedirect';

/** Post-login redirect hub — imports local canvas if needed and routes to the right workspace. */
export default function WorkspaceHubPage() {
  const { status } = useWorkspaceRedirect();

  if (status === 'error') {
    return (
      <div
        className="flex items-center justify-center w-full h-full"
        style={{ background: 'var(--color-canvas)', color: 'var(--color-text-muted)' }}
      >
        <p className="text-[13px]">Something went wrong. Please refresh and try again.</p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full"
      style={{ background: 'var(--color-canvas)' }}
    />
  );
}
