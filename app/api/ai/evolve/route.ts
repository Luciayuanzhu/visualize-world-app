import { NextResponse } from "next/server";
import { evolveWorld } from "@/lib/gemini";
import { evolveRequestSchema, evolveResponseSchema } from "@/lib/validation/contracts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = evolveRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const validated = evolveResponseSchema.parse(await evolveWorld(parsed.data));

  return NextResponse.json(validated);
}
