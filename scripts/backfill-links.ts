/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * One-time backfill: sets the `workspace` link on every existing
 * workspaceMembers / workspaceShares / workspaceInvites row.
 *
 * The permission rules in instant.perms.ts traverse these links
 * (e.g. workspaces.view uses data.ref('members.userId')). Rows created before
 * the links existed only have the flat `workspaceId` string, so without this
 * backfill they would be invisible to the new rules — locking existing members
 * out of their workspaces.
 *
 * Run it ONCE, after `bun run db:push` has applied the schema links:
 *
 *   bun run db:backfill
 *
 * It is idempotent: linking an already-linked row is a no-op, so re-running is
 * safe. Requires NEXT_PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN in the
 * environment (bun auto-loads .env.local).
 */
import { init } from '@instantdb/admin';
import schema from '../instant.schema';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_APP_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error(
    'Missing env. Set NEXT_PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN ' +
    '(e.g. in .env.local) before running the backfill.',
  );
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

// Entities that gained a forward `workspace` link, keyed for readable logs.
const ENTITIES = ['workspaceMembers', 'workspaceShares', 'workspaceInvites'] as const;

/** Links every row of one entity to its workspace via the flat workspaceId field. */
async function backfillEntity(entity: (typeof ENTITIES)[number]): Promise<void> {
  const res = (await (db as any).query({ [entity]: {} })) as any;
  const rows: any[] = res?.[entity] ?? [];

  const txs = rows
    .filter((row) => typeof row.workspaceId === 'string' && row.workspaceId)
    .map((row) => (db.tx as any)[entity][row.id].link({ workspace: row.workspaceId }));

  const skipped = rows.length - txs.length;
  if (txs.length) await db.transact(txs);

  console.log(
    `${entity}: linked ${txs.length}/${rows.length} row(s)` +
    (skipped ? ` (${skipped} skipped — no workspaceId)` : ''),
  );
}

async function main() {
  console.log('Backfilling workspace links…');
  for (const entity of ENTITIES) await backfillEntity(entity);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
