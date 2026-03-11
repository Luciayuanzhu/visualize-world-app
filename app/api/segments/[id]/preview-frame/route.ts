import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logServer } from "@/lib/server-log";
import { previewFrameSchema } from "@/lib/validation/contracts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = previewFrameSchema.safeParse(body);

  if (!parsed.success) {
    logServer("warn", "segment preview frame invalid payload", { segmentId: id });
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const segment = await db.streamSegment.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!segment) {
    logServer("warn", "segment preview frame missing segment", { segmentId: id });
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }

  await db.streamSegment.update({
    where: { id },
    data: {
      lastFrameDataUrl: parsed.data.lastFrameDataUrl,
    },
  });

  logServer("info", "segment preview frame stored", {
    segmentId: id,
    hasFrameData: true,
  });

  return NextResponse.json({ ok: true, segmentId: id });
}
