import { NextResponse } from "next/server";
import { startAckSchema } from "@/lib/validation/contracts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = startAckSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json({ ok: true, segmentId: id, odysseyStreamId: parsed.data.odysseyStreamId });
}
