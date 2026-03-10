import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { frameReadRequestSchema } from "@/lib/validation/contracts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = frameReadRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const segment = parsed.data.segmentId
    ? await db.streamSegment.findUnique({
        where: { id: parsed.data.segmentId },
        select: { lastFrameDataUrl: true },
      })
    : null;

  if (segment?.lastFrameDataUrl) {
    return NextResponse.json({ readUrl: segment.lastFrameDataUrl });
  }

  if (parsed.data.frameKey) {
    const capture = await db.frameCapture.findFirst({
      where: { frameKey: parsed.data.frameKey },
      orderBy: { capturedAt: "desc" },
      select: { frameDataUrl: true },
    });

    if (capture?.frameDataUrl) {
      return NextResponse.json({ readUrl: capture.frameDataUrl });
    }
  }

  return NextResponse.json({ readUrl: null });
}
