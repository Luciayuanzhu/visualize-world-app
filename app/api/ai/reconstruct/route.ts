import { NextResponse } from "next/server";
import { reconstructWorldState } from "@/lib/gemini";
import { reconstructRequestSchema, reconstructResponseSchema } from "@/lib/validation/contracts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = reconstructRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const response = reconstructResponseSchema.parse(await reconstructWorldState(parsed.data.sessionId));

  return NextResponse.json(response);
}
