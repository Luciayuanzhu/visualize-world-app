import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconstructWorldState } from "@/lib/gemini";
import { toSessionDetail } from "@/lib/serialization/session";
import { EMPTY_WORLD_STATE } from "@/lib/world-state";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const session = await db.worldSession.findFirst({
    where: { id, userId: user.uid },
    include: {
      scenes: {
        orderBy: { index: "asc" },
        include: {
          segments: {
            orderBy: { startedAt: "desc" },
            select: { id: true, status: true, lastFrameKey: true, recordingVideoKey: true },
            take: 1,
          },
        },
      },
      revisions: { orderBy: { createdAt: "desc" }, take: 1 },
      snapshots: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const currentScene =
    session.scenes.find((scene) => scene.id === session.currentSceneId) ?? session.scenes[session.scenes.length - 1] ?? null;

  if (!currentScene) {
    return NextResponse.json({ error: "No active scene" }, { status: 400 });
  }

  const latestSnapshot = session.snapshots[0];
  const worldState = latestSnapshot
    ? {
        canonFacts: Array.isArray(latestSnapshot.canonFacts) ? (latestSnapshot.canonFacts as string[]) : [],
        sceneState:
          latestSnapshot.sceneState && typeof latestSnapshot.sceneState === "object"
            ? {
                characters: [],
                props: [],
                ...(latestSnapshot.sceneState as Record<string, unknown>),
              }
            : EMPTY_WORLD_STATE.sceneState,
        styleGuide:
          latestSnapshot.styleGuide && typeof latestSnapshot.styleGuide === "object"
            ? (latestSnapshot.styleGuide as Record<string, string>)
            : {},
        directorCues: Array.isArray(latestSnapshot.directorCues) ? (latestSnapshot.directorCues as string[]) : [],
      }
    : EMPTY_WORLD_STATE;
  const latestSegment = currentScene.segments[0] ?? null;
  const frameKey =
    latestSegment?.lastFrameKey ?? `frames/${id}/${currentScene.id}/sleep-${randomUUID()}.jpg`;
  const reconstructed = await reconstructWorldState({
    sessionId: id,
    draft: currentScene.draftContent,
    sessionTitle: session.title,
    sceneTitle: currentScene.name,
    worldState,
  });

  const updatedSession = await db.$transaction(async (tx) => {
    if (latestSegment && latestSegment.status !== "ended") {
      await tx.streamSegment.update({
        where: { id: latestSegment.id },
        data: {
          status: "ended",
          endedAt: new Date(),
          lastFrameKey: frameKey,
        },
      });

      await tx.frameCapture.create({
        data: {
          sceneId: currentScene.id,
          segmentId: latestSegment.id,
          frameKey,
          captureReason: "sleep",
        },
      });
    }

    await tx.scene.update({
      where: { id: currentScene.id },
      data: {
        resumePrompt: reconstructed.startPrompt,
      },
    });

    await tx.worldSession.update({
      where: { id },
      data: {
        status: "sleeping",
      },
    });

    return tx.worldSession.findUniqueOrThrow({
      where: { id },
      include: {
        scenes: {
          orderBy: { index: "asc" },
          include: {
            segments: {
              orderBy: { startedAt: "desc" },
              select: { id: true, lastFrameKey: true, recordingVideoKey: true },
              take: 1,
            },
          },
        },
        revisions: { orderBy: { createdAt: "desc" }, take: 1 },
        snapshots: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
  });

  return NextResponse.json({
    session: toSessionDetail(updatedSession),
    frameKey,
    resumePrompt: reconstructed.startPrompt,
  });
}
