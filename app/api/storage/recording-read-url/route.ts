import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const segmentId = typeof body?.segmentId === "string" && body.segmentId.length > 0 ? body.segmentId : "segment-demo";

  return NextResponse.json({
    readUrl: `https://example.com/recordings/${segmentId}.mp4`,
  });
}
