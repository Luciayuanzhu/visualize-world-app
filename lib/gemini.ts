import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type {
  AssistDraftRequest,
  AssistDraftResponse,
  EvolveRequest,
  EvolveResponse,
  ReconstructResponse,
} from "@/types/api";
import { actionPlanSchema, worldStateSchema, worldStateUpdatesSchema } from "@/lib/validation/contracts";
import { DEMO_WORLD_STATE } from "@/lib/mocks/session";
import type { WorldState } from "@/types/world";

const GEMINI_MODEL = "gemini-2.5-flash";

const evolveOutputSchema = z.object({
  action: actionPlanSchema,
  worldStateUpdates: worldStateUpdatesSchema.optional(),
});

const reconstructOutputSchema = z.object({
  startPrompt: z.string().min(1),
  worldState: worldStateSchema,
});

const titleOutputSchema = z.object({
  title: z.string().min(1).max(120),
});

interface ReconstructWorldStateInput {
  sessionId: string;
  draft?: string;
  sessionTitle?: string;
  sceneTitle?: string;
  worldState?: WorldState;
}

interface GenerateTitleInput {
  draft: string;
  fallback: string;
  sessionTitle?: string;
  sceneIndex?: number;
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: GEMINI_MODEL });
}

async function generateText(prompt: string) {
  const model = getModel();
  if (!model) {
    return null;
  }

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini generateContent failed", error);
    return null;
  }
}

async function generateJson<T>(prompt: string, schema: z.ZodSchema<T>) {
  const raw = await generateText(prompt);
  if (!raw) {
    return null;
  }

  const fenced = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return schema.parse(JSON.parse(fenced));
  } catch (error) {
    console.error("Gemini JSON parse failed", error, fenced);
    return null;
  }
}

export async function evolveWorld(input: EvolveRequest): Promise<EvolveResponse> {
  const delta = input.delta.trim();

  if (delta.length === 0) {
    return {
      action: { type: "noop" },
      worldStateUpdates: {
        canonFacts: input.worldState.canonFacts,
        sceneState: {},
        directorCues: input.worldState.directorCues,
      },
    };
  }

  const generated = await generateJson(
    [
      "You are a world-state compiler for a writing application with a live visual world.",
      "Use the user's latest text delta and current world state to decide whether the world should stay in the same scene or transition.",
      "Return valid JSON only.",
      "Rules:",
      "- Prefer interact for additions, mood shifts, lighting changes, and detail changes.",
      "- Use transition only for clear scene/location/time changes.",
      "- Prompts must be short, concrete, visual, and suitable for a live world model.",
      "- If no meaningful change exists, return noop.",
      "",
      "JSON shape:",
      JSON.stringify({
        action: {
          type: "interact | transition | noop",
          prompt: "string when interact",
          endCurrent: true,
          nextSceneName: "string when transition",
          startPrompt: "string when transition",
        },
        worldStateUpdates: {
          canonFacts: ["string"],
          sceneState: {
            location: "string",
            timeOfDay: "string",
            weather: "string",
            mood: "string",
            characters: ["string"],
            props: ["string"],
            camera: "string",
          },
          directorCues: ["string"],
        },
      }),
      "",
      `Current world state: ${JSON.stringify(input.worldState)}`,
      `Recent scene context: ${input.context || "none"}`,
      `Latest text delta: ${delta}`,
    ].join("\n"),
    evolveOutputSchema,
  );

  if (generated) {
    return generated;
  }

  return fallbackEvolveWorld(input);
}

export async function reconstructWorldState(input: ReconstructWorldStateInput): Promise<ReconstructResponse> {
  const generated = await generateJson(
    [
      "You are reconstructing a concise start prompt for a live visual world that is waking from rest.",
      "Return valid JSON only.",
      "The prompt should describe the current scene as it exists now, not retell prior events.",
      "Use concrete visual language and keep it under 35 words.",
      `Session title: ${input.sessionTitle ?? "Untitled World"}`,
      input.sceneTitle ? `Scene title: ${input.sceneTitle}` : "",
      `Current world state: ${JSON.stringify(input.worldState ?? DEMO_WORLD_STATE)}`,
      input.draft ? `Current draft excerpt: ${input.draft.slice(-1200)}` : "",
      `Session id: ${input.sessionId}`,
      "",
      'JSON shape: {"startPrompt":"string","worldState":{...same world state shape...}}',
    ]
      .filter(Boolean)
      .join("\n"),
    reconstructOutputSchema,
  );

  if (generated) {
    return generated;
  }

  return {
    startPrompt:
      "The world returns in stillness, amber dust drifting through a half-lit chamber as the current scene settles back into view.",
    worldState: input.worldState ?? DEMO_WORLD_STATE,
  };
}

export async function assistDraft(input: AssistDraftRequest): Promise<AssistDraftResponse> {
  const prompt = input.action === "continue" ? buildContinuePrompt(input) : buildPolishPrompt(input);
  const generated = await generateText(prompt);

  if (generated) {
    return {
      content: sanitizeAssistOutput(generated, input),
    };
  }

  return {
    content: fallbackAssistOutput(input),
  };
}

export async function generateSceneTitle(input: GenerateTitleInput) {
  const generated = await generateJson(
    [
      "You are titling a scene in a cinematic writing application.",
      "Return valid JSON only.",
      "Write a short scene title, 2 to 5 words, title case, concrete and evocative.",
      "Do not include punctuation unless necessary.",
      input.sessionTitle ? `World title: ${input.sessionTitle}` : "",
      typeof input.sceneIndex === "number" ? `Scene index: ${input.sceneIndex}` : "",
      `Draft excerpt: ${input.draft.slice(0, 1500)}`,
      'JSON shape: {"title":"string"}',
    ]
      .filter(Boolean)
      .join("\n"),
    titleOutputSchema,
  );

  if (generated?.title) {
    return generated.title.trim();
  }

  return fallbackTitle(input.fallback, input.draft, typeof input.sceneIndex === "number" ? `Scene ${input.sceneIndex}` : "Scene");
}

export async function generateSessionTitle(input: GenerateTitleInput) {
  const generated = await generateJson(
    [
      "You are titling a fiction world for a cinematic writing application.",
      "Return valid JSON only.",
      "Write a short world title, 2 to 6 words, title case, evocative but clear.",
      "Do not use quotation marks.",
      `Draft excerpt: ${input.draft.slice(0, 1800)}`,
      'JSON shape: {"title":"string"}',
    ].join("\n"),
    titleOutputSchema,
  );

  if (generated?.title) {
    return generated.title.trim();
  }

  return fallbackTitle(input.fallback, input.draft, "Untitled World");
}

function buildContinuePrompt(input: AssistDraftRequest) {
  return [
    "You are helping continue a fiction draft.",
    "Write exactly one additional paragraph that naturally follows the user's text.",
    "Preserve voice, tense, and pacing.",
    "Do not summarize. Do not explain your reasoning. Output only the new paragraph.",
    input.sessionTitle ? `Session title: ${input.sessionTitle}` : "",
    input.sceneTitle ? `Scene title: ${input.sceneTitle}` : "",
    "Current draft:",
    input.draft,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildPolishPrompt(input: AssistDraftRequest) {
  return [
    "You are polishing a fiction draft for clarity, rhythm, and sensory detail.",
    "Keep the same plot and meaning.",
    "Do not add new major events or characters.",
    "Return the full revised draft only.",
    input.sessionTitle ? `Session title: ${input.sessionTitle}` : "",
    input.sceneTitle ? `Scene title: ${input.sceneTitle}` : "",
    "Current draft:",
    input.draft,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function sanitizeAssistOutput(output: string, input: AssistDraftRequest) {
  const cleaned = output.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

  if (input.action === "continue") {
    return cleaned.length > 0 ? cleaned : fallbackAssistOutput(input);
  }

  return cleaned.length > 0 ? cleaned : input.draft;
}

function fallbackAssistOutput(input: AssistDraftRequest) {
  if (input.action === "continue") {
    return "A low tremor moved through the air, and for a moment the world seemed to lean closer, as if waiting to hear what would happen next.";
  }

  return input.draft;
}

function fallbackTitle(fallback: string, draft: string, hardFallback: string) {
  const trimmedFallback = fallback.trim();
  if (trimmedFallback.length > 0 && !isPlaceholderTitle(trimmedFallback)) {
    return trimmedFallback;
  }

  const firstMeaningfulLine =
    draft
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  if (!firstMeaningfulLine) {
    return hardFallback;
  }

  const words = firstMeaningfulLine
    .replace(/[^\p{L}\p{N}\s'-]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, hardFallback === "Untitled World" ? 5 : 4);
  const candidate = words.join(" ").trim();

  return candidate.length > 0 ? candidate : hardFallback;
}

function isPlaceholderTitle(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "untitled world" || /^scene\s+\d+$/i.test(value.trim());
}

function fallbackEvolveWorld(input: EvolveRequest): EvolveResponse {
  const delta = input.delta.trim();
  const shouldTransition = /door|stair|outside|courtyard|balcony|forest|hall/i.test(delta);

  if (shouldTransition) {
    return {
      action: {
        type: "transition",
        endCurrent: true,
        nextSceneName: "Outer Hall",
        startPrompt: "The camera drifts into a vast outer hall lit by amber dust and dormant machinery.",
      },
      worldStateUpdates: {
        canonFacts: [...input.worldState.canonFacts, "The relay leads into the outer hall."],
        sceneState: {
          location: "Outer Hall",
          mood: "Expansive, uneasy",
          props: ["Stone arches", "Dust-lit banners"],
        },
        directorCues: input.worldState.directorCues,
      },
    };
  }

  return {
    action: {
      type: "interact",
      prompt: "Warm amber light settles across the vault.",
    },
    worldStateUpdates: {
      canonFacts: input.worldState.canonFacts,
      sceneState: {
        mood: "Charged, awakening",
        props: [...input.worldState.sceneState.props, "Amber light"],
      },
      directorCues: input.worldState.directorCues,
    },
  };
}
