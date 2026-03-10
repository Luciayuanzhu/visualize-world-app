import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getMockSessionList, getMockSessionSummary } from "@/lib/mocks/session";
import { createSessionSchema } from "@/lib/validation/contracts";

export async function GET() {
  await requireUser();

  return NextResponse.json({
    items: getMockSessionList(),
  });
}

export async function POST(request: Request) {
  await requireUser();
  const body = await request.json().catch(() => ({}));
  const parsed = createSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    {
      ...getMockSessionSummary(crypto.randomUUID()),
      title: parsed.data.title ?? "Untitled World",
    },
    { status: 201 },
  );
}
