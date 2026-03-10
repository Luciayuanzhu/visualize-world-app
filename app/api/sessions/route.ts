import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toSessionSummary } from "@/lib/serialization/session";
import { createSessionSchema } from "@/lib/validation/contracts";

export async function GET() {
  const user = await requireUser();
  const sessions = await db.worldSession.findMany({
    where: { userId: user.uid },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    items: sessions.map(toSessionSummary),
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const parsed = createSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await db.worldSession.create({
    data: {
      userId: user.uid,
      title: parsed.data.title ?? "Untitled World",
      revisions: {
        create: {
          content: "",
          publishedFromOffset: 0,
        },
      },
      snapshots: {
        create: {
          canonFacts: [],
          sceneState: { characters: [], props: [] },
          styleGuide: {},
          directorCues: [],
        },
      },
    },
  });

  return NextResponse.json(
    toSessionSummary(session),
    { status: 201 },
  );
}
