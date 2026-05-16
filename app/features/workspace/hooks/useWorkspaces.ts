import { db } from '@/app/lib/db';

/** Returns all workspaces owned by the given user, with real-time updates. */
export function useWorkspaces(userId: string) {
  return db.useQuery({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workspaces: { $: { where: { userId } as any } },
  });
}
