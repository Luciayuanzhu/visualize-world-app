import { create } from "zustand";

interface InteractSlice {
  queue: string[];
  isInteracting: boolean;
  recentPrompts: string[];
  enqueue: (prompt: string) => void;
  shift: () => void;
}

export const useInteractStore = create<InteractSlice>((set) => ({
  queue: [],
  isInteracting: false,
  recentPrompts: [],
  enqueue: (prompt) =>
    set((state) => ({
      queue: [...state.queue, prompt],
      recentPrompts: [...state.recentPrompts.slice(-4), prompt],
    })),
  shift: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
