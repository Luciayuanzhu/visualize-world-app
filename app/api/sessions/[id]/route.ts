import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toSessionDetail, toSessionSummary } from "@/lib/serialization/session";
import { updateSessionSchema } from "@/lib/validation/contracts";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const session = await db.worldSession.findFirst({
    where: { id, userId: user.uid },
    include: {
      scenes: {
        orderBy: { index: "asc" },
        include: {
          segments: {
            orderBy: { startedAt: "desc" },
            select: { id: true, lastFrameKey: true, lastFrameDataUrl: true, recordingVideoKey: true },
            take: 1,
          },
        },
      },
      revisions: { orderBy: { createdAt: "desc" }, take: 1 },
      snapshots: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(toSessionDetail(session));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await db.worldSession.findFirst({
    where: { id, userId: user.uid },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const updated = await db.worldSession.update({
    where: { id },
    data: {
      title: parsed.data.title,
      status: parsed.data.status,
      currentSceneId: parsed.data.currentSceneId,
    },
  });

  return NextResponse.json(toSessionSummary(updated));
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const session = await db.worldSession.findFirst({
    where: { id, userId: user.uid },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await db.worldSession.delete({ where: { id } });

  return NextResponse.json({
    id,
    ok: true,
  });
}
