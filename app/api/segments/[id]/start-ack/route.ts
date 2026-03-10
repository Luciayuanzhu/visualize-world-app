import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startAckSchema } from "@/lib/validation/contracts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = startAckSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const segment = await db.streamSegment.findUnique({
    where: { id },
  });

  if (!segment) {
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }

  await db.streamSegment.update({
    where: { id },
    data: {
      odysseyStreamId: parsed.data.odysseyStreamId,
      status: "live",
    },
  });

  return NextResponse.json({ ok: true, segmentId: id, odysseyStreamId: parsed.data.odysseyStreamId });
}
