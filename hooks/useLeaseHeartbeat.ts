"use client";

import { useEffect } from "react";

export function useLeaseHeartbeat(sessionId?: string, token?: string | null, intervalMs = 45_000) {
  useEffect(() => {
    if (!sessionId || !token) {
      return () => undefined;
    }

    const heartbeat = window.setInterval(() => {
      void fetch(`/api/sessions/${sessionId}/lease`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    }, intervalMs);

    return () => {
      window.clearInterval(heartbeat);
    };
  }, [intervalMs, sessionId, token]);
}
