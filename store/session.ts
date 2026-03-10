import { create } from "zustand";
import type { LiveState } from "@/types/world";
import type { WorldSession } from "@/types/db";

interface SessionSlice {
  session: WorldSession | null;
  liveState: LiveState;
  leaseToken: string | null;
  setSession: (session: WorldSession | null) => void;
  setLiveState: (liveState: LiveState) => void;
  setLeaseToken: (leaseToken: string | null) => void;
}

export const useSessionStore = create<SessionSlice>((set) => ({
  session: null,
  liveState: "idle",
  leaseToken: null,
  setSession: (session) => set({ session }),
  setLiveState: (liveState) => set({ liveState }),
  setLeaseToken: (leaseToken) => set({ leaseToken }),
}));
