export interface WorldSession {
  id: string;
  userId: string;
  title: string;
  currentSceneId: string | null;
  status: string;
  leaseOwner: string | null;
  leaseToken: string | null;
  leaseExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  sessionId: string;
  index: number;
  name: string;
  draftOffsetStart: number;
  draftOffsetEnd: number | null;
  status: string;
}

export interface StreamSegment {
  id: string;
  sceneId: string;
  sessionId: string;
  odysseyStreamId: string | null;
  status: string;
  lastFrameKey: string | null;
}
