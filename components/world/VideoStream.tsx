"use client";

import { forwardRef, useEffect } from "react";

export const VideoStream = forwardRef<HTMLVideoElement, { src?: string | null; mediaStream?: MediaStream | null }>(function VideoStream(
  { src, mediaStream },
  ref,
) {
  useEffect(() => {
    if (!ref || typeof ref === "function" || !ref.current) {
      return;
    }

    const element = ref.current;
    if (mediaStream) {
      element.srcObject = mediaStream;
      return;
    }

    element.srcObject = null;
  }, [mediaStream, ref]);

  if (!src && !mediaStream) {
    return null;
  }

  return <video ref={ref} className="absolute inset-0 h-full w-full object-cover" muted playsInline autoPlay loop={Boolean(src)} src={src ?? undefined} />;
});
