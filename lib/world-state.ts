import type { WorldState, WorldStateUpdates } from "@/types/world";

export const EMPTY_WORLD_STATE: WorldState = {
  canonFacts: [],
  sceneState: {
    characters: [],
    props: [],
  },
  styleGuide: {},
  directorCues: [],
};

export function mergeWorldState(worldState: WorldState, updates?: WorldStateUpdates): WorldState {
  if (!updates) {
    return worldState;
  }

  return {
    canonFacts: updates.canonFacts ?? worldState.canonFacts,
    sceneState: {
      ...worldState.sceneState,
      ...updates.sceneState,
      characters: updates.sceneState?.characters ?? worldState.sceneState.characters,
      props: updates.sceneState?.props ?? worldState.sceneState.props,
    },
    styleGuide: worldState.styleGuide,
    directorCues: updates.directorCues ?? worldState.directorCues,
  };
}
