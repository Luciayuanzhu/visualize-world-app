export const PRE_WORLD_MIN_CHARACTERS = 50;

export type DirectionControl = "forward" | "backward" | "left" | "right";

export const DIRECTION_INTERACT_PROMPTS: Record<DirectionControl, string> = {
  forward:
    "Continue moving forward through the current world with a clear, noticeable advance in space. Preserve the same environment, characters, lighting, and scene continuity. Show strong forward motion and reveal new details ahead.",
  backward:
    "Move backward noticeably from the current viewpoint, as if stepping back in the same scene. Preserve world continuity, lighting, and composition logic, and clearly reveal more of the surrounding space behind or around the viewer.",
  left:
    "Turn the camera and viewpoint clearly to the left within the same world and same moment. Do not change the setting or reset the scene. Make the leftward rotation obvious and reveal what is located to the left of the current view.",
  right:
    "Turn the camera and viewpoint clearly to the right within the same world and same moment. Do not change the setting or reset the scene. Make the rightward rotation obvious and reveal what is located to the right of the current view.",
};
