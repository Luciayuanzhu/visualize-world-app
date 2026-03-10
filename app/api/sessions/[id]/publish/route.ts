import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { evolveWorld, generateSceneTitle, generateSessionTitle } from "@/lib/gemini";
import { toSessionDetail } from "@/lib/serialization/session";
import { publishSessionSchema } from "@/lib/validation/contracts";
import { EMPTY_WORLD_STATE, mergeWorldState } from "@/lib/world-state";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = publishSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await db.worldSession.findFirst({
    where: { id, userId: user.uid },
    include: {
      scenes: {
        orderBy: { index: "asc" },
        include: {
          segments: { orderBy: { startedAt: "desc" }, take: 1 },
        },
      },
      revisions: { orderBy: { createdAt: "desc" }, take: 1 },
      snapshots: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const latestSnapshot = session.snapshots[0];
  const draft = parsed.data.draft;
  const currentScene =
    session.scenes.find((scene) => scene.id === session.currentSceneId) ?? session.scenes[session.scenes.length - 1] ?? null;
  const currentSceneStarted = (currentScene?.segments.length ?? 0) > 0;
  const publishedFromOffset = currentScene?.publishedFromOffset ?? 0;
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

  const delta = currentSceneStarted ? draft.slice(publishedFromOffset) : draft;
  const rawActionResult = await evolveWorld({
    sessionId: id,
    delta,
    context: draft.slice(Math.max(0, draft.length - 800)),
    worldState,
  });
  const actionResult =
    !currentSceneStarted && rawActionResult.action.type === "transition"
      ? {
          ...rawActionResult,
          action: {
            type: "interact" as const,
            prompt: rawActionResult.action.startPrompt,
          },
        }
      : rawActionResult;
  const nextWorldState = mergeWorldState(worldState, actionResult.worldStateUpdates);
  const nextSceneIndex = actionResult.action.type === "transition" ? (session.scenes.at(-1)?.index ?? 0) + 1 : currentScene?.index ?? 1;
  const targetSceneFallbackName =
    actionResult.action.type === "transition" ? actionResult.action.nextSceneName : currentScene?.name ?? `Scene ${nextSceneIndex}`;
  const resolvedSceneTitle = shouldAutofillSceneTitle(targetSceneFallbackName)
    ? await generateSceneTitle({
        draft,
        fallback: targetSceneFallbackName,
        sceneIndex: nextSceneIndex,
        sessionTitle: session.title,
      })
    : targetSceneFallbackName;
  const resolvedSessionTitle = shouldAutofillSessionTitle(session.title)
    ? await generateSessionTitle({
        draft,
        fallback: session.title,
      })
    : session.title;

  const result = await db.$transaction(async (tx) => {
    let targetSceneId = currentScene?.id ?? null;
    let launch: {
      segmentId: string;
      prompt: string;
      frameKey: string | null;
    } | null = null;

    if (!targetSceneId) {
      const scene = await tx.scene.create({
        data: {
          sessionId: id,
          index: 1,
          name: "Scene 1",
          draftOffsetStart: 0,
          draftContent: "",
          publishedFromOffset: 0,
          status: "active",
        },
      });
      targetSceneId = scene.id;
    }

    if (actionResult.action.type === "transition") {
      if (currentScene) {
        await tx.scene.update({
          where: { id: currentScene.id },
          data: {
            status: "complete",
            draftOffsetEnd: draft.length,
          },
        });
      }

      const nextIndex = (session.scenes.at(-1)?.index ?? 0) + 1;
      const scene = await tx.scene.create({
        data: {
          sessionId: id,
          index: nextIndex,
          name: resolvedSceneTitle,
          draftOffsetStart: publishedFromOffset,
          draftContent: draft,
          publishedFromOffset: draft.length,
          status: "active",
        },
      });
      targetSceneId = scene.id;
      const segment = await tx.streamSegment.create({
        data: {
          sceneId: targetSceneId,
          sessionId: id,
          status: "starting",
        },
      });
      launch = {
        segmentId: segment.id,
        prompt: actionResult.action.startPrompt,
        frameKey: currentScene?.segments[0]?.lastFrameKey ?? null,
      };
    } else if (!currentSceneStarted) {
      const prompt = actionResult.action.type === "interact" ? actionResult.action.prompt : draft.slice(0, 280);
      const segment = await tx.streamSegment.create({
        data: {
          sceneId: targetSceneId,
          sessionId: id,
          status: "starting",
        },
      });
      launch = {
        segmentId: segment.id,
        prompt,
        frameKey: null,
      };
    }

    await tx.scene.update({
      where: { id: targetSceneId },
      data: {
        name: resolvedSceneTitle,
        draftContent: draft,
        publishedFromOffset: draft.length,
      },
    });

    await tx.editorRevision.create({
      data: {
        sessionId: id,
        content: draft,
        publishedFromOffset: draft.length,
      },
    });

    await tx.worldStateSnapshot.create({
      data: {
        sessionId: id,
        sceneId: targetSceneId,
        canonFacts: nextWorldState.canonFacts as Prisma.InputJsonValue,
        sceneState: nextWorldState.sceneState as unknown as Prisma.InputJsonValue,
        styleGuide: nextWorldState.styleGuide as Prisma.InputJsonValue,
        directorCues: nextWorldState.directorCues as Prisma.InputJsonValue,
      },
    });

    await tx.worldSession.update({
      where: { id },
      data: {
        title: resolvedSessionTitle,
        currentSceneId: targetSceneId,
        status: "active",
      },
    });

    const updatedSession = await tx.worldSession.findUniqueOrThrow({
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

    return {
      updatedSession,
      launch,
    };
  });

  return NextResponse.json({
    session: toSessionDetail(result.updatedSession),
    action: actionResult.action,
    worldStateUpdates: actionResult.worldStateUpdates,
    launch: result.launch,
  });
}

function shouldAutofillSceneTitle(name: string) {
  return /^Scene\s+\d+$/i.test(name.trim());
}

function shouldAutofillSessionTitle(title: string) {
  return title.trim().toLowerCase() === "untitled world";
}
