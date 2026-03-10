import { create } from "zustand";
import type { Scene, StreamSegment } from "@/types/db";
import type { WorldState } from "@/types/world";

interface WorldSlice {
  currentScene: Scene | null;
  currentSegment: StreamSegment | null;
  worldState: WorldState | null;
  scenes: Scene[];
  setCurrentScene: (scene: Scene | null) => void;
  setCurrentSegment: (segment: StreamSegment | null) => void;
  setWorldState: (worldState: WorldState | null) => void;
  setScenes: (scenes: Scene[]) => void;
}

export const useWorldStore = create<WorldSlice>((set) => ({
  currentScene: null,
  currentSegment: null,
  worldState: null,
  scenes: [],
  setCurrentScene: (currentScene) => set({ currentScene }),
  setCurrentSegment: (currentSegment) => set({ currentSegment }),
  setWorldState: (worldState) => set({ worldState }),
  setScenes: (scenes) => set({ scenes }),
}));
