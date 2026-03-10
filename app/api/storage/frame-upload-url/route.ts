import { NextResponse } from "next/server";
import { frameUploadRequestSchema } from "@/lib/validation/contracts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = frameUploadRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json({
    uploadUrl: "https://example.com/upload",
    frameKey: `frames/${parsed.data.sessionId}/${parsed.data.sceneId}/${crypto.randomUUID()}.${parsed.data.extension}`,
  });
}
