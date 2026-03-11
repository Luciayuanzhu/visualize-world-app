export const PRE_WORLD_MIN_CHARACTERS = 50;

export type DirectionControl = "forward" | "backward" | "left" | "right";

export const DIRECTION_INTERACT_PROMPTS: Record<DirectionControl, string> = {
  forward:
    "Move forward in a strong first-person exploration motion, as if walking several steps deeper into the current environment. Preserve exact scene continuity and make the spatial advance clearly visible with strong parallax and newly revealed detail ahead.",
  backward:
    "Move backward in a strong first-person exploration motion, as if stepping back several steps in the same environment. Preserve exact scene continuity and make the retreat clearly visible with a wider reveal of the nearby surroundings.",
  left:
    "Turn left sharply in first-person within the same continuous scene, revealing what lies to the left right now. Keep all world details consistent and make the directional change immediate and obvious.",
  right:
    "Turn right sharply in first-person within the same continuous scene, revealing what lies to the right right now. Keep all world details consistent and make the directional change immediate and obvious.",
};
