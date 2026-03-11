export type LiveState =
  | "idle"
  | "starting"
  | "live"
  | "updating"
  | "transitioning"
  | "sleeping"
  | "resuming"
  | "replay"
  | "error";

export type SleepReason = "manual" | "timeout" | "disconnect";

export type ActionPlan =
  | { type: "noop" }
  | { type: "interact"; prompt: string }
  | {
      type: "transition";
      endCurrent: true;
      nextSceneName: string;
      startPrompt: string;
    };

export interface SceneState {
  location?: string;
  timeOfDay?: string;
  weather?: string;
  mood?: string;
  characters: string[];
  props: string[];
  camera?: string;
}

export interface WorldState {
  canonFacts: string[];
  sceneState: SceneState;
  styleGuide: {
    realism?: string;
    palette?: string;
    motionStyle?: string;
  };
  directorCues: string[];
}

export interface WorldStateUpdates {
  canonFacts?: string[];
  sceneState?: Partial<SceneState>;
  directorCues?: string[];
}
