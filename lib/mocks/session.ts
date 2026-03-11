import type { SessionDetail, SessionSummary } from "@/types/api";
import type { LiveState, WorldState } from "@/types/world";

export const DEMO_DRAFT = `Chapter 4: The Glimmering Vault

The air inside the vault tasted of ozone and ancient parchment. Elias traced his fingers along the copper casing of the relay, feeling the faint hum of energy vibrating through the metal. It had been decades since anyone had dared to wake the system.

"Is it ready?" Sarah whispered from the doorway.

Elias watched the first glow begin to pulse inside the central sphere. The light moved like a heartbeat through the machinery, golden and patient, as though the world itself had been waiting for someone to speak to it again.

He did not answer at once. The gears beneath the floor were already shifting.
`;

export const DEMO_WORLD_STATE: WorldState = {
  canonFacts: ["A dormant vault lies beneath the city.", "The relay has begun to awaken."],
  sceneState: {
    location: "The Glimmering Vault",
    timeOfDay: "Dusk",
    weather: "Still air",
    mood: "Tense, reverent",
    characters: ["Elias", "Sarah"],
    props: ["Copper relay", "Central sphere", "Ancient shelves"],
    camera: "Slow forward drift",
  },
  styleGuide: {
    realism: "cinematic realism",
    palette: "amber, obsidian, parchment",
    motionStyle: "slow and deliberate",
  },
  directorCues: [],
};

const DEMO_SCENES = [
  {
    id: "scene-1",
    index: 1,
    name: "Scene 1",
    status: "complete",
    hasStarted: true,
    draftContent: DEMO_DRAFT,
    publishedFromOffset: DEMO_DRAFT.length - 280,
    latestSegmentId: "segment-1",
    latestLastFrameKey: "frames/demo/scene-1/sleep-1.jpg",
    latestLastFrameDataUrl: null,
    latestRecordingVideoKey: null,
    resumePrompt: "A dim vault corridor waits in amber silence.",
  },
  {
    id: "scene-2",
    index: 2,
    name: "Outer Hall",
    status: "active",
    hasStarted: true,
    draftContent: DEMO_DRAFT,
    publishedFromOffset: DEMO_DRAFT.length - 146,
    latestSegmentId: "segment-2",
    latestLastFrameKey: "frames/demo/scene-2/sleep-2.jpg",
    latestLastFrameDataUrl: null,
    latestRecordingVideoKey: null,
    resumePrompt: "The outer hall glows with drifting dust and dormant machinery.",
  },
  {
    id: "scene-3",
    index: 3,
    name: "Scene 3",
    status: "queued",
    hasStarted: false,
    draftContent: "",
    publishedFromOffset: 0,
    latestSegmentId: null,
    latestLastFrameKey: null,
    latestLastFrameDataUrl: null,
    latestRecordingVideoKey: null,
    resumePrompt: null,
  },
];

export function getMockSessionSummary(id = "demo-session"): SessionSummary {
  return {
    id,
    title: "Untitled World",
    status: "active",
    currentSceneId: "scene-2",
    createdAt: new Date("2026-03-09T10:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-03-09T10:15:00.000Z").toISOString(),
  };
}

export function getMockSessionDetail(id = "demo-session"): SessionDetail {
  return {
    ...getMockSessionSummary(id),
    draftContent: DEMO_DRAFT,
    lastPublishedOffset: DEMO_DRAFT.length - 146,
    scenes: DEMO_SCENES,
    worldState: DEMO_WORLD_STATE,
  };
}

export function parseLiveState(value?: string): LiveState {
  switch (value) {
    case "starting":
    case "live":
    case "updating":
    case "transitioning":
    case "sleeping":
    case "resuming":
    case "replay":
    case "error":
      return value;
    default:
      return "idle";
  }
}

export function getMockSessionScreen(options?: {
  id?: string;
  state?: string;
  unpublished?: string;
}) {
  const liveState = parseLiveState(options?.state);
  const replayMode = liveState === "replay";
  const worldStarted = liveState !== "idle";
  const hasUnpublishedText = options?.unpublished === "0" ? false : worldStarted;
  const draft = worldStarted ? DEMO_DRAFT : "";

  return {
    sessionId: options?.id ?? "demo-session",
    title: "Untitled World",
    liveState,
    draft,
    lastPublishedOffset: worldStarted && hasUnpublishedText ? DEMO_DRAFT.length - 146 : DEMO_DRAFT.length,
    hasWorldStarted: worldStarted,
    hasUnpublishedText,
    replayMode,
    scenes: worldStarted ? DEMO_SCENES : [],
    activeSceneId: worldStarted ? (replayMode ? "scene-1" : "scene-2") : null,
    activeSceneName: replayMode ? "The Descent" : "Vault Opening",
  };
}

export function getMockSessionList(): SessionSummary[] {
  return [
    getMockSessionSummary("demo-session"),
    {
      ...getMockSessionSummary("vault-echoes"),
      title: "Vault Echoes",
      currentSceneId: "scene-1",
      updatedAt: new Date("2026-03-08T22:40:00.000Z").toISOString(),
    },
    {
      ...getMockSessionSummary("mountain-choir"),
      title: "Mountain Choir",
      currentSceneId: "scene-3",
      updatedAt: new Date("2026-03-07T18:24:00.000Z").toISOString(),
    },
  ];
}
