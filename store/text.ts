import { create } from "zustand";

interface TextSlice {
  draftContent: string;
  lastPublishedOffset: number;
  setDraftContent: (draftContent: string) => void;
  setLastPublishedOffset: (offset: number) => void;
}

export const useTextStore = create<TextSlice>((set) => ({
  draftContent: "",
  lastPublishedOffset: 0,
  setDraftContent: (draftContent) => set({ draftContent }),
  setLastPublishedOffset: (lastPublishedOffset) => set({ lastPublishedOffset }),
}));
