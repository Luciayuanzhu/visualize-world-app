import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  const session = await db.worldSession.create({
    data: {
      userId: user.uid,
      title: "Untitled World",
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

  return NextResponse.redirect(new URL(`/session/${session.id}`, new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")));
}
