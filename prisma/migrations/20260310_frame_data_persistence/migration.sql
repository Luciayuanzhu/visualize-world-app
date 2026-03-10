ALTER TABLE "StreamSegment"
ADD COLUMN "lastFrameDataUrl" TEXT;

ALTER TABLE "FrameCapture"
ADD COLUMN "frameDataUrl" TEXT;
