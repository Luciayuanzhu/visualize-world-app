import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
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

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const origin = forwardedHost ? `${forwardedProto ?? "https"}://${forwardedHost}` : new URL(request.url).origin;

  return NextResponse.redirect(new URL(`/session/${session.id}`, origin));
}
