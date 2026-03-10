import { z } from "zod";

export const sceneStateSchema = z.object({
  location: z.string().optional(),
  timeOfDay: z.string().optional(),
  weather: z.string().optional(),
  mood: z.string().optional(),
  characters: z.array(z.string()),
  props: z.array(z.string()),
  camera: z.string().optional(),
});

export const worldStateSchema = z.object({
  canonFacts: z.array(z.string()),
  sceneState: sceneStateSchema,
  styleGuide: z.object({
    realism: z.string().optional(),
    palette: z.string().optional(),
    motionStyle: z.string().optional(),
  }),
  directorCues: z.array(z.string()),
});

export const worldStateUpdatesSchema = z.object({
  canonFacts: z.array(z.string()).optional(),
  sceneState: sceneStateSchema.partial().optional(),
  directorCues: z.array(z.string()).optional(),
});

export const actionPlanSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("noop"),
  }),
  z.object({
    type: z.literal("interact"),
    prompt: z.string().min(1),
  }),
  z.object({
    type: z.literal("transition"),
    endCurrent: z.literal(true),
    nextSceneName: z.string().min(1),
    startPrompt: z.string().min(1),
  }),
]);

export const createSessionSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["active", "sleeping", "ended"]).optional(),
  currentSceneId: z.string().uuid().nullable().optional(),
});

export const createSceneSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  draftOffsetStart: z.number().int().nonnegative().optional(),
});

export const updateSceneSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  draftContent: z.string().optional(),
  publishedFromOffset: z.number().int().nonnegative().optional(),
});

export const publishSessionSchema = z.object({
  draft: z.string(),
});

export const evolveRequestSchema = z.object({
  sessionId: z.string().min(1),
  delta: z.string(),
  context: z.string(),
  worldState: worldStateSchema,
});

export const evolveResponseSchema = z.object({
  action: actionPlanSchema,
  worldStateUpdates: worldStateUpdatesSchema.optional(),
});

export const assistDraftSchema = z.object({
  action: z.enum(["continue", "polish"]),
  draft: z.string().min(1),
  sceneTitle: z.string().trim().max(120).optional(),
  sessionTitle: z.string().trim().max(120).optional(),
});

export const reconstructRequestSchema = z.object({
  sessionId: z.string().min(1),
  elapsedMs: z.number().int().nonnegative(),
});

export const reconstructResponseSchema = z.object({
  startPrompt: z.string().min(1),
  worldState: worldStateSchema,
});

export const createSegmentSchema = z.object({
  sceneId: z.string().min(1),
  sessionId: z.string().min(1),
});

export const startAckSchema = z.object({
  odysseyStreamId: z.string().min(1),
});

export const endAckSchema = z.object({
  recordingVideoKey: z.string().optional(),
  recordingThumbnailKey: z.string().optional(),
  recordingEventsKey: z.string().optional(),
  lastFrameKey: z.string().optional(),
});

export const frameUploadRequestSchema = z.object({
  sessionId: z.string().min(1),
  sceneId: z.string().min(1),
  extension: z.enum(["jpg", "jpeg", "png"]).default("jpg"),
});
