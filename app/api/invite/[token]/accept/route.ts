/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from 'next/server';
import { adminDb, verifyBearer } from '@/app/lib/admin';
import { rateLimitRequest } from '@/app/lib/rateLimit';

interface Params {
  params: Promise<{ token: string }>;
}

/**
 * Accepts a workspace invite for the authenticated user. Validates the invite
 * token + email binding server-side, then creates the linked member row and marks
 * the invite accepted — preventing arbitrary self-add (members are `create: false`
 * for clients).
 */
export async function POST(request: NextRequest, { params }: Params) {
  if (!rateLimitRequest(request, 'invite-accept', 20, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { token } = await params;
  if (!token) return Response.json({ error: 'Token required' }, { status: 400 });

  const user = await verifyBearer(request);
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

  const res = await adminDb.query({
    workspaceInvites: { $: { where: { token } as any } },
  });
  const invite = (res as any)?.workspaceInvites?.[0];
  if (!invite) {
    return Response.json({ error: 'Invite not found or has been revoked.' }, { status: 404 });
  }

  const userEmail = user.email?.toLowerCase() ?? '';
  if (!userEmail || invite.email?.toLowerCase() !== userEmail) {
    return Response.json(
      { error: `This invite was sent to ${invite.email}.` },
      { status: 403 },
    );
  }

  // Idempotent: if already accepted, just return the target workspace.
  if (invite.acceptedAt) {
    return Response.json({ workspaceId: invite.workspaceId });
  }

  // Avoid creating a duplicate member row if one already exists.
  const existing = await adminDb.query({
    workspaceMembers: {
      $: { where: { workspaceId: invite.workspaceId, userId: user.id } as any },
    },
  });
  const alreadyMember = ((existing as any)?.workspaceMembers?.length ?? 0) > 0;

  const txs: any[] = [
    (adminDb.tx as any).workspaceInvites[invite.id].update({ acceptedAt: Date.now() }),
  ];
  if (!alreadyMember) {
    const memberId = crypto.randomUUID();
    txs.push(
      (adminDb.tx as any).workspaceMembers[memberId]
        .update({
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role === 'editor' ? 'editor' : 'viewer',
          invitedBy: invite.invitedBy,
          createdAt: Date.now(),
        })
        .link({ workspace: invite.workspaceId }),
    );
  }

  await adminDb.transact(txs);
  return Response.json({ workspaceId: invite.workspaceId });
}
