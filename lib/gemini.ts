import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AssistDraftRequest,
  AssistDraftResponse,
  EvolveRequest,
  EvolveResponse,
  ReconstructResponse,
} from "@/types/api";
import { DEMO_WORLD_STATE } from "@/lib/mocks/session";

const GEMINI_MODEL = "gemini-2.5-flash";

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

export async function evolveWorld(input: EvolveRequest): Promise<EvolveResponse> {
  const delta = input.delta.trim();
  const shouldTransition = /door|stair|outside|courtyard|balcony|forest|hall/i.test(delta);

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

export async function reconstructWorldState(_sessionId: string): Promise<ReconstructResponse> {
  return {
    startPrompt:
      "The vault returns in stillness, amber dust drifting over ancient shelves as the relay glows awake again.",
    worldState: DEMO_WORLD_STATE,
  };
}

export async function assistDraft(input: AssistDraftRequest): Promise<AssistDraftResponse> {
  const prompt =
    input.action === "continue"
      ? buildContinuePrompt(input)
      : buildPolishPrompt(input);
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
  if (input.action === "continue") {
    const continuation = output.replace(/^```[\s\S]*?\n/, "").replace(/```$/, "").trim();
    return continuation.length > 0 ? continuation : fallbackAssistOutput(input);
  }

  const polished = output.replace(/^```[\s\S]*?\n/, "").replace(/```$/, "").trim();
  return polished.length > 0 ? polished : input.draft;
}

function fallbackAssistOutput(input: AssistDraftRequest) {
  if (input.action === "continue") {
    return "A low tremor moved through the air, and for a moment the world seemed to lean closer, as if waiting to hear what would happen next.";
  }

  return input.draft;
}
