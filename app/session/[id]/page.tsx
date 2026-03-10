import { SessionShell } from "@/components/session/SessionShell";
import { getMockSessionScreen } from "@/lib/mocks/session";

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ state?: string; unpublished?: string }>;
}) {
  const { id } = await params;
  const { state, unpublished } = await searchParams;
  const screen = getMockSessionScreen({ id, state, unpublished });

  return (
    <SessionShell
      title={screen.title}
      initialDraft={screen.draft}
      initialLiveState={screen.liveState}
      lastPublishedOffset={screen.lastPublishedOffset}
      scenes={screen.scenes.map((scene) => ({ id: scene.id, name: scene.name }))}
      activeSceneId={screen.activeSceneId}
      activeSceneName={screen.activeSceneName}
    />
  );
}
