import { NextResponse } from "next/server";
import { assistDraft } from "@/lib/gemini";
import { assistDraftSchema } from "@/lib/validation/contracts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = assistDraftSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await assistDraft(parsed.data);

  return NextResponse.json(result);
}
