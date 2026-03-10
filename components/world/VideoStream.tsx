"use client";

import { forwardRef } from "react";

export const VideoStream = forwardRef<HTMLVideoElement, { src?: string | null }>(function VideoStream({ src }, ref) {
  if (!src) {
    return null;
  }

  return <video ref={ref} className="absolute inset-0 h-full w-full object-cover" muted playsInline autoPlay loop src={src} />;
});
