import type { ActionPlan, WorldState, WorldStateUpdates } from "@/types/world";

export interface SessionSummary {
  id: string;
  title: string;
  status: string;
  currentSceneId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionDetail extends SessionSummary {
  draftContent: string;
  lastPublishedOffset: number;
  scenes: Array<{
    id: string;
    index: number;
    name: string;
    status: string;
  }>;
  worldState: WorldState | null;
}

export interface EvolveRequest {
  sessionId: string;
  delta: string;
  context: string;
  worldState: WorldState;
}

export interface EvolveResponse {
  action: ActionPlan;
  worldStateUpdates?: WorldStateUpdates;
}

export interface CreateSessionRequest {
  title?: string;
}

export interface CreateSessionResponse extends SessionSummary {}

export interface UpdateSessionRequest {
  title?: string;
  status?: "active" | "sleeping" | "ended";
}

export interface CreateSceneRequest {
  name?: string;
  draftOffsetStart?: number;
}

export interface ReconstructRequest {
  sessionId: string;
  elapsedMs: number;
}

export interface ReconstructResponse {
  startPrompt: string;
  worldState: WorldState;
}

export interface LeaseResponse {
  leaseToken: string;
  expiresAt: string;
}

export interface CreateSegmentRequest {
  sceneId: string;
  sessionId: string;
}

export interface StartSegmentAckRequest {
  odysseyStreamId: string;
}

export interface EndSegmentAckRequest {
  recordingVideoKey?: string;
  recordingThumbnailKey?: string;
  recordingEventsKey?: string;
  lastFrameKey?: string;
}

export interface RecordingReadUrlResponse {
  readUrl: string;
}

export interface FrameUploadUrlResponse {
  uploadUrl: string;
  frameKey: string;
}
