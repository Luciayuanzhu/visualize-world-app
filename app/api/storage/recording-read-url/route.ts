import { NextResponse } from "next/server";
import { recordingReadRequestSchema } from "@/lib/validation/contracts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = recordingReadRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.recordingVideoKey) {
    return NextResponse.json({
      readUrl: null,
    });
  }

  return NextResponse.json({
    readUrl: `https://example.com/recordings/${parsed.data.recordingVideoKey}`,
  });
}
