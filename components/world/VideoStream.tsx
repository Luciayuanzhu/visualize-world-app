"use client";

import { forwardRef } from "react";

export const VideoStream = forwardRef<HTMLVideoElement>(function VideoStream(_, ref) {
  return <video ref={ref} className="absolute inset-0 h-full w-full object-cover" muted playsInline />;
});
