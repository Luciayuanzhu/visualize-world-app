import { SessionShell } from "@/components/session/SessionShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEMO_WORLD_STATE, getMockSessionScreen, parseLiveState } from "@/lib/mocks/session";
import { toSessionDetail } from "@/lib/serialization/session";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ state?: string; unpublished?: string }>;
}) {
  const { id } = await params;
  const { state, unpublished } = await searchParams;

  if (id === "demo") {
    const screen = getMockSessionScreen({ id, state, unpublished });

    return (
      <SessionShell
        sessionId={screen.sessionId}
        title={screen.title}
        initialDraft={screen.draft}
        initialLiveState={screen.liveState}
        lastPublishedOffset={screen.lastPublishedOffset}
        scenes={screen.scenes.map((scene) => ({
          id: scene.id,
          index: scene.index,
          name: scene.name,
          hasStarted: scene.hasStarted,
          draftContent: scene.draftContent,
          publishedFromOffset: scene.publishedFromOffset,
          latestSegmentId: null,
          latestLastFrameKey: null,
          latestRecordingVideoKey: null,
          resumePrompt: null,
        }))}
        activeSceneId={screen.activeSceneId}
        activeSceneName={screen.activeSceneName}
        initialWorldState={DEMO_WORLD_STATE}
        initialSceneStarted={screen.liveState !== "idle"}
      />
    );
  }

  const user = await requireUser();
  const session = await db.worldSession.findFirst({
    where: { id, userId: user.uid },
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

  if (!session) {
    const screen = getMockSessionScreen({ id, state, unpublished });

    return (
      <SessionShell
        sessionId={screen.sessionId}
        title={screen.title}
        initialDraft={screen.draft}
        initialLiveState={screen.liveState}
        lastPublishedOffset={screen.lastPublishedOffset}
        scenes={screen.scenes.map((scene) => ({
          id: scene.id,
          index: scene.index,
          name: scene.name,
          hasStarted: scene.hasStarted,
          draftContent: scene.draftContent,
          publishedFromOffset: scene.publishedFromOffset,
          latestSegmentId: null,
          latestLastFrameKey: null,
          latestRecordingVideoKey: null,
          resumePrompt: null,
        }))}
        activeSceneId={screen.activeSceneId}
        activeSceneName={screen.activeSceneName}
        initialWorldState={DEMO_WORLD_STATE}
        initialSceneStarted={screen.liveState !== "idle"}
      />
    );
  }

  const detail = toSessionDetail(session);
  const activeScene =
    detail.scenes.find((scene) => scene.id === detail.currentSceneId) ??
    detail.scenes[detail.scenes.length - 1] ??
    null;
  const explicitState = parseLiveState(state);
  const derivedState =
    explicitState !== "idle"
      ? explicitState
      : detail.status === "sleeping"
        ? "sleeping"
        : activeScene?.hasStarted
          ? "sleeping"
          : "idle";

  return (
    <SessionShell
      sessionId={detail.id}
      title={detail.title}
      initialDraft={detail.draftContent}
      initialLiveState={derivedState}
      lastPublishedOffset={detail.lastPublishedOffset}
      scenes={detail.scenes.map((scene) => ({
        id: scene.id,
        index: scene.index,
        name: scene.name,
        hasStarted: scene.hasStarted,
        draftContent: scene.draftContent,
        publishedFromOffset: scene.publishedFromOffset,
        latestSegmentId: scene.latestSegmentId,
        latestLastFrameKey: scene.latestLastFrameKey,
        latestRecordingVideoKey: scene.latestRecordingVideoKey,
        resumePrompt: scene.resumePrompt,
      }))}
      activeSceneId={activeScene?.id ?? null}
      activeSceneName={activeScene?.name ?? "Untitled Scene"}
      initialWorldState={detail.worldState ?? DEMO_WORLD_STATE}
      initialSceneStarted={activeScene?.hasStarted ?? false}
    />
  );
}
