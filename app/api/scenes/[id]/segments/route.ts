import { NextResponse } from "next/server";
import { createSegmentSchema } from "@/lib/validation/contracts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = createSegmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    {
      segmentId: crypto.randomUUID(),
      sceneId: id,
      sessionId: parsed.data.sessionId,
    },
    { status: 201 },
  );
}
