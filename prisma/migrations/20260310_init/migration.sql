-- CreateTable
CREATE TABLE "WorldSession" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled World',
    "currentSceneId" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "leaseOwner" TEXT,
    "leaseToken" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "draftOffsetStart" INTEGER NOT NULL DEFAULT 0,
    "draftOffsetEnd" INTEGER,
    "stateSnapshotId" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamSegment" (
    "id" UUID NOT NULL,
    "sceneId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "odysseyStreamId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'starting',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "lastFrameKey" TEXT,
    "recordingVideoKey" TEXT,
    "recordingThumbnailKey" TEXT,
    "recordingEventsKey" TEXT,

    CONSTRAINT "StreamSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameCapture" (
    "id" UUID NOT NULL,
    "segmentId" UUID NOT NULL,
    "sceneId" UUID NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frameKey" TEXT NOT NULL,
    "captureReason" TEXT NOT NULL,

    CONSTRAINT "FrameCapture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldStateSnapshot" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "sceneId" UUID,
    "canonFacts" JSONB NOT NULL DEFAULT '[]',
    "sceneState" JSONB NOT NULL DEFAULT '{}',
    "styleGuide" JSONB NOT NULL DEFAULT '{}',
    "directorCues" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldStateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorRevision" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "publishedFromOffset" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scene_sessionId_index_idx" ON "Scene"("sessionId", "index");

-- CreateIndex
CREATE INDEX "StreamSegment_sceneId_idx" ON "StreamSegment"("sceneId");

-- CreateIndex
CREATE INDEX "StreamSegment_sessionId_idx" ON "StreamSegment"("sessionId");

-- CreateIndex
CREATE INDEX "FrameCapture_segmentId_capturedAt_idx" ON "FrameCapture"("segmentId", "capturedAt" DESC);

-- CreateIndex
CREATE INDEX "WorldStateSnapshot_sessionId_createdAt_idx" ON "WorldStateSnapshot"("sessionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "EditorRevision_sessionId_createdAt_idx" ON "EditorRevision"("sessionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Job_status_runAt_idx" ON "Job"("status", "runAt");

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorldSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamSegment" ADD CONSTRAINT "StreamSegment_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamSegment" ADD CONSTRAINT "StreamSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorldSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameCapture" ADD CONSTRAINT "FrameCapture_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "StreamSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameCapture" ADD CONSTRAINT "FrameCapture_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldStateSnapshot" ADD CONSTRAINT "WorldStateSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorldSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldStateSnapshot" ADD CONSTRAINT "WorldStateSnapshot_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorRevision" ADD CONSTRAINT "EditorRevision_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorldSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

