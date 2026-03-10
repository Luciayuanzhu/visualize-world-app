"use client";

import { useCallback, useRef, useState } from "react";

export function useInteractQueue(handler?: (prompt: string) => Promise<void>) {
  const queueRef = useRef<string[]>([]);
  const runningRef = useRef(false);
  const [queueLength, setQueueLength] = useState(0);

  const processQueue = useCallback(async () => {
    if (runningRef.current || !handler) {
      return;
    }

    runningRef.current = true;

    try {
      while (queueRef.current.length > 0) {
        const nextPrompt = queueRef.current[0];
        await handler(nextPrompt);
        queueRef.current.shift();
        setQueueLength(queueRef.current.length);
      }
    } finally {
      runningRef.current = false;
    }
  }, [handler]);

  const enqueue = useCallback(
    (prompt: string) => {
      queueRef.current.push(prompt);
      setQueueLength(queueRef.current.length);
      void processQueue();
    },
    [processQueue],
  );

  return {
    enqueue,
    processQueue,
    queueLength,
  };
}
