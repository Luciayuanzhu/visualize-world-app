"use client";

import { useCallback, useEffect, useRef } from "react";

export function useInactivitySleep(timeoutMs: number, onSleep?: () => void, backgroundTimeoutMs = 60_000) {
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleSleep = useCallback(
    (nextTimeoutMs: number) => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        onSleep?.();
      }, nextTimeoutMs);
    },
    [clearTimer, onSleep],
  );

  const resetInactivityTimer = useCallback(() => {
    scheduleSleep(timeoutMs);
  }, [scheduleSleep, timeoutMs]);

  useEffect(() => {
    const activityEvents: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    const handleVisibilityChange = () => {
      scheduleSleep(document.hidden ? backgroundTimeoutMs : timeoutMs);
    };

    resetInactivityTimer();
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimer();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [backgroundTimeoutMs, clearTimer, resetInactivityTimer, scheduleSleep, timeoutMs]);

  return {
    resetInactivityTimer,
  };
}
