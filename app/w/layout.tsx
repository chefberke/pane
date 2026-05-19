'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../features/auth/hooks/useAuth';
import LoadingScreen from '../features/loading/LoadingScreen';

/** Auth-guarded layout for all /w/* routes. */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/sign-in');
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="w-screen h-screen">
        <LoadingScreen />
      </div>
    );
  }

  return <div className="w-screen h-screen overflow-hidden">{children}</div>;
}
