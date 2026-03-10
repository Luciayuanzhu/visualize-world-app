import type { SessionDetail, SessionSummary } from "@/types/api";
import type { WorldState } from "@/types/world";
import type { EditorRevision, Scene, WorldSession, WorldStateSnapshot } from "@prisma/client";

type SessionWithRelations = WorldSession & {
  scenes: Scene[];
  revisions: EditorRevision[];
  snapshots: WorldStateSnapshot[];
};

const EMPTY_WORLD_STATE: WorldState = {
  canonFacts: [],
  sceneState: {
    characters: [],
    props: [],
  },
  styleGuide: {},
  directorCues: [],
};

export function toSessionSummary(session: WorldSession): SessionSummary {
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    currentSceneId: session.currentSceneId,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export function toSessionDetail(session: SessionWithRelations): SessionDetail {
  const latestRevision = session.revisions[0];
  const latestSnapshot = session.snapshots[0];

  return {
    ...toSessionSummary(session),
    draftContent: latestRevision?.content ?? "",
    lastPublishedOffset: latestRevision?.publishedFromOffset ?? 0,
    scenes: session.scenes.map((scene) => ({
      id: scene.id,
      index: scene.index,
      name: scene.name,
      status: scene.status,
    })),
    worldState: latestSnapshot ? toWorldState(latestSnapshot) : EMPTY_WORLD_STATE,
  };
}

function toWorldState(snapshot: WorldStateSnapshot): WorldState {
  const sceneState = asSceneState(snapshot.sceneState);

  return {
    canonFacts: asStringArray(snapshot.canonFacts),
    sceneState,
    styleGuide: asObject(snapshot.styleGuide) as WorldState["styleGuide"],
    directorCues: asStringArray(snapshot.directorCues),
  };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asSceneState(value: unknown): WorldState["sceneState"] {
  const obj = asObject(value);

  return {
    location: typeof obj.location === "string" ? obj.location : undefined,
    timeOfDay: typeof obj.timeOfDay === "string" ? obj.timeOfDay : undefined,
    weather: typeof obj.weather === "string" ? obj.weather : undefined,
    mood: typeof obj.mood === "string" ? obj.mood : undefined,
    camera: typeof obj.camera === "string" ? obj.camera : undefined,
    characters: Array.isArray(obj.characters) ? obj.characters.filter((item): item is string => typeof item === "string") : [],
    props: Array.isArray(obj.props) ? obj.props.filter((item): item is string => typeof item === "string") : [],
  };
}
