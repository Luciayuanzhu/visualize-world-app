import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSceneSchema } from "@/lib/validation/contracts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = createSceneSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await db.worldSession.findFirst({
    where: { id, userId: user.uid },
    include: {
      scenes: { orderBy: { index: "desc" }, take: 1 },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const nextIndex = (session.scenes[0]?.index ?? 0) + 1;

  if (session.currentSceneId) {
    await db.scene.update({
      where: { id: session.currentSceneId },
      data: {
        status: "complete",
        draftOffsetEnd: parsed.data.draftOffsetStart ?? undefined,
      },
    });
  }

  const scene = await db.scene.create({
    data: {
      sessionId: id,
      index: nextIndex,
      name: parsed.data.name ?? `Scene ${nextIndex}`,
      draftOffsetStart: parsed.data.draftOffsetStart ?? 0,
      draftContent: "",
      publishedFromOffset: 0,
      status: "active",
    },
  });

  await db.worldSession.update({
    where: { id },
    data: {
      currentSceneId: scene.id,
    },
  });

  return NextResponse.json(
    {
      id: scene.id,
      name: scene.name,
      index: scene.index,
      status: scene.status,
      hasStarted: false,
      draftContent: scene.draftContent,
      publishedFromOffset: scene.publishedFromOffset,
    },
    { status: 201 },
  );
}
