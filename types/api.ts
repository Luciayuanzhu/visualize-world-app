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
    hasStarted: boolean;
    draftContent: string;
    publishedFromOffset: number;
    latestSegmentId: string | null;
    latestLastFrameKey: string | null;
    latestRecordingVideoKey: string | null;
    resumePrompt: string | null;
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

export interface AssistDraftRequest {
  action: "continue" | "polish";
  draft: string;
  sceneTitle?: string;
  sessionTitle?: string;
}

export interface AssistDraftResponse {
  content: string;
}

export interface CreateSessionRequest {
  title?: string;
}

export interface CreateSessionResponse extends SessionSummary {}

export interface UpdateSessionRequest {
  title?: string;
  status?: "active" | "sleeping" | "ended";
  currentSceneId?: string | null;
}

export interface CreateSceneRequest {
  name?: string;
  draftOffsetStart?: number;
}

export interface CreateSceneResponse {
  id: string;
  index: number;
  name: string;
  status: string;
  hasStarted: boolean;
  draftContent: string;
  publishedFromOffset: number;
  latestSegmentId: string | null;
  latestLastFrameKey: string | null;
  latestRecordingVideoKey: string | null;
  resumePrompt: string | null;
}

export interface UpdateSceneRequest {
  name?: string;
  draftContent?: string;
  publishedFromOffset?: number;
}

export interface PublishSessionRequest {
  draft: string;
}

export interface PublishSessionResponse {
  session: SessionDetail;
  action: ActionPlan;
  worldStateUpdates?: WorldStateUpdates;
  launch?: {
    segmentId: string;
    prompt: string;
    frameKey: string | null;
  } | null;
}

export interface ReconstructRequest {
  sessionId: string;
  elapsedMs: number;
  draft?: string;
  sessionTitle?: string;
  sceneTitle?: string;
  worldState?: WorldState;
}

export interface ReconstructResponse {
  startPrompt: string;
  worldState: WorldState;
}

export interface SleepSessionResponse {
  session: SessionDetail;
  frameKey: string | null;
  resumePrompt: string | null;
}

export interface WakeSessionResponse {
  session: SessionDetail;
  segmentId: string | null;
  startPrompt: string;
  frameKey: string | null;
}

export interface OdysseyClientConfigResponse {
  enabled: boolean;
  mode: "mock" | "odyssey";
  apiKey?: string;
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
  lastFrameDataUrl?: string;
}

export interface RecordingReadUrlResponse {
  readUrl: string | null;
}

export interface FrameUploadUrlResponse {
  uploadUrl: string;
  frameKey: string;
}

export interface FrameReadUrlResponse {
  readUrl: string | null;
}
