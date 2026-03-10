import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { evolveWorld } from "@/lib/gemini";
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

  const updatedSession = await db.$transaction(async (tx) => {
    let targetSceneId = currentScene?.id ?? null;
    let targetSceneName = currentScene?.name ?? "Scene 1";

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
      targetSceneName = scene.name;
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
          name: actionResult.action.nextSceneName,
          draftOffsetStart: publishedFromOffset,
          draftContent: draft,
          publishedFromOffset: draft.length,
          status: "active",
        },
      });
      targetSceneId = scene.id;
      targetSceneName = scene.name;

      await tx.streamSegment.create({
        data: {
          sceneId: targetSceneId,
          sessionId: id,
          status: "live",
          odysseyStreamId: `mock-stream-${randomUUID()}`,
        },
      });
    } else if (!currentSceneStarted) {
      await tx.streamSegment.create({
        data: {
          sceneId: targetSceneId,
          sessionId: id,
          status: "live",
          odysseyStreamId: `mock-stream-${randomUUID()}`,
        },
      });
    }

    const resolvedSceneTitle = shouldAutofillSceneTitle(targetSceneName)
      ? summarizeSceneTitle(draft, targetSceneName)
      : targetSceneName;

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

    const resolvedSessionTitle = shouldAutofillSessionTitle(session.title) ? summarizeSessionTitle(draft, session.title) : session.title;

    await tx.worldSession.update({
      where: { id },
      data: {
        title: resolvedSessionTitle,
        currentSceneId: targetSceneId,
        status: "active",
      },
    });

    return tx.worldSession.findUniqueOrThrow({
      where: { id },
      include: {
        scenes: {
          orderBy: { index: "asc" },
          include: {
            segments: { select: { id: true }, take: 1 },
          },
        },
        revisions: { orderBy: { createdAt: "desc" }, take: 1 },
        snapshots: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
  });

  return NextResponse.json({
    session: toSessionDetail(updatedSession),
    action: actionResult.action,
    worldStateUpdates: actionResult.worldStateUpdates,
  });
}

function shouldAutofillSceneTitle(name: string) {
  return /^Scene\s+\d+$/i.test(name.trim());
}

function summarizeSceneTitle(draft: string, fallback: string) {
  const firstMeaningfulLine =
    draft
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  if (!firstMeaningfulLine) {
    return fallback;
  }

  const words = firstMeaningfulLine.replace(/[^\p{L}\p{N}\s'-]/gu, "").split(/\s+/).filter(Boolean).slice(0, 4);
  const candidate = words.join(" ").trim();

  return candidate.length > 0 ? candidate : fallback;
}

function shouldAutofillSessionTitle(title: string) {
  return title.trim().toLowerCase() === "untitled world";
}

function summarizeSessionTitle(draft: string, fallback: string) {
  const firstMeaningfulLine =
    draft
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  if (!firstMeaningfulLine) {
    return fallback;
  }

  const words = firstMeaningfulLine.replace(/[^\p{L}\p{N}\s'-]/gu, "").split(/\s+/).filter(Boolean).slice(0, 5);
  const candidate = words.join(" ").trim();

  return candidate.length > 0 ? candidate : fallback;
}
