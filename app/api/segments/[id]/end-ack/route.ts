import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logServer } from "@/lib/server-log";
import { endAckSchema } from "@/lib/validation/contracts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = endAckSchema.safeParse(body);

  if (!parsed.success) {
    logServer("warn", "segment end ack invalid payload", { segmentId: id });
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const segment = await db.streamSegment.findUnique({
    where: { id },
  });

  if (!segment) {
    logServer("warn", "segment end ack missing segment", { segmentId: id });
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }

  await db.streamSegment.update({
    where: { id },
    data: {
      status: "ended",
      endedAt: new Date(),
      lastFrameKey: parsed.data.lastFrameKey,
      recordingVideoKey: parsed.data.recordingVideoKey,
      recordingThumbnailKey: parsed.data.recordingThumbnailKey,
      recordingEventsKey: parsed.data.recordingEventsKey,
    },
  });

  if (parsed.data.lastFrameKey) {
    await db.frameCapture.create({
      data: {
        sceneId: segment.sceneId,
        segmentId: id,
        frameKey: parsed.data.lastFrameKey,
        captureReason: "manual",
      },
    });
  }

  logServer("info", "segment end ack stored", {
    segmentId: id,
    lastFrameKey: parsed.data.lastFrameKey ?? null,
    recordingVideoKey: parsed.data.recordingVideoKey ?? null,
  });

  return NextResponse.json({ ok: true, segmentId: id, ...parsed.data });
}
