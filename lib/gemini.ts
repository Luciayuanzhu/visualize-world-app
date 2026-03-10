import type { EvolveRequest, EvolveResponse, ReconstructResponse } from "@/types/api";
import { DEMO_WORLD_STATE } from "@/lib/mocks/session";

export async function evolveWorld(input: EvolveRequest): Promise<EvolveResponse> {
  const delta = input.delta.trim();
  const shouldTransition = /door|stair|outside|courtyard|balcony|forest|hall/i.test(delta);

  if (delta.length === 0) {
    return {
      action: { type: "noop" },
      worldStateUpdates: {
        canonFacts: input.worldState.canonFacts,
        sceneState: {},
        directorCues: input.worldState.directorCues,
      },
    };
  }

  if (shouldTransition) {
    return {
      action: {
        type: "transition",
        endCurrent: true,
        nextSceneName: "Outer Hall",
        startPrompt: "The camera drifts into a vast outer hall lit by amber dust and dormant machinery.",
      },
      worldStateUpdates: {
        canonFacts: [...input.worldState.canonFacts, "The relay leads into the outer hall."],
        sceneState: {
          location: "Outer Hall",
          mood: "Expansive, uneasy",
          props: ["Stone arches", "Dust-lit banners"],
        },
        directorCues: input.worldState.directorCues,
      },
    };
  }

  return {
    action: {
      type: "interact",
      prompt: "Warm amber light settles across the vault.",
    },
    worldStateUpdates: {
      canonFacts: input.worldState.canonFacts,
      sceneState: {
        mood: "Charged, awakening",
        props: [...input.worldState.sceneState.props, "Amber light"],
      },
      directorCues: input.worldState.directorCues,
    },
  };
}

export async function reconstructWorldState(_sessionId: string): Promise<ReconstructResponse> {
  return {
    startPrompt:
      "The vault returns in stillness, amber dust drifting over ancient shelves as the relay glows awake again.",
    worldState: DEMO_WORLD_STATE,
  };
}
