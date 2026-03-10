"use client";

import { useCallback, useEffect, useRef } from "react";

export function useFrameCapture() {
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const captureFrame = useCallback(async (videoElement: HTMLVideoElement | null) => {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.88);
    });

    if (!blob) return null;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = URL.createObjectURL(blob);

    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });

    return {
      blob,
      dataUrl,
      objectUrl: objectUrlRef.current,
    };
  }, []);

  return {
    captureFrame,
  };
}
