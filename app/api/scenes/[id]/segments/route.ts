import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSegmentSchema } from "@/lib/validation/contracts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = createSegmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scene = await db.scene.findFirst({
    where: {
      id,
      sessionId: parsed.data.sessionId,
    },
  });

  if (!scene) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  const segment = await db.streamSegment.create({
    data: {
      sceneId: id,
      sessionId: parsed.data.sessionId,
      status: "starting",
    },
  });

  return NextResponse.json(
    {
      segmentId: segment.id,
      sceneId: id,
      sessionId: parsed.data.sessionId,
    },
    { status: 201 },
  );
}
