"use client";

export interface OdysseyClientConfig {
  enabled: boolean;
  mode: "mock" | "odyssey";
  apiKey?: string;
}

export interface OdysseyClientHandlers {
  onConnected?: (stream: MediaStream) => void;
  onDisconnected?: () => void;
  onStreamStarted?: (streamId: string) => void;
  onStreamEnded?: () => void;
  onError?: (error: Error) => void;
}

export interface OdysseyClientHandle {
  connect: () => Promise<void>;
  startStream: (prompt: string, image?: Blob | null) => Promise<string>;
  interact: (prompt: string) => Promise<void>;
  endStream: () => Promise<void>;
  disconnect: () => void;
  getCurrentStreamId: () => string | null;
}

type OdysseySdkClient = {
  connect: (handlers?: {
    onConnected?: (stream: MediaStream) => void;
    onDisconnected?: () => void;
    onStreamStarted?: (streamId: string) => void;
    onStreamEnded?: () => void;
    onError?: (error: Error, fatal: boolean) => void;
  }) => Promise<MediaStream>;
  startStream: (options?: {
    prompt?: string;
    image?: File | Blob;
  }) => Promise<string>;
  interact: (options: { prompt: string }) => Promise<string>;
  endStream: () => Promise<void>;
  disconnect: () => void;
};

export function createOdysseyClient(
  config: OdysseyClientConfig = { enabled: false, mode: "mock" },
  handlers: OdysseyClientHandlers = {},
): OdysseyClientHandle {
  let connected = false;
  let currentStreamId: string | null = null;
  let clientPromise: Promise<OdysseySdkClient | null> | null = null;

  const getClient = async () => {
    if (!config.enabled || config.mode === "mock" || !config.apiKey) {
      return null;
    }

    if (!clientPromise) {
      clientPromise = import("@odysseyml/odyssey").then(({ Odyssey }) => {
        return new Odyssey({ apiKey: config.apiKey! }) as OdysseySdkClient;
      });
    }

    return clientPromise;
  };

  const connect = async () => {
    if (connected) {
      return;
    }

    const client = await getClient();
    if (!client) {
      connected = true;
      return;
    }

    await client.connect({
      onConnected(stream) {
        connected = true;
        handlers.onConnected?.(stream);
      },
      onDisconnected() {
        connected = false;
        currentStreamId = null;
        handlers.onDisconnected?.();
      },
      onStreamStarted(streamId) {
        currentStreamId = streamId;
        handlers.onStreamStarted?.(streamId);
      },
      onStreamEnded() {
        currentStreamId = null;
        handlers.onStreamEnded?.();
      },
      onError(error) {
        handlers.onError?.(error);
      },
    });

    connected = true;
  };

  return {
    connect,
    async startStream(prompt: string, image?: Blob | null) {
      if (!connected) {
        await connect();
      }

      const client = await getClient();
      if (!client) {
        currentStreamId = `mock-stream-${crypto.randomUUID()}`;
        handlers.onStreamStarted?.(currentStreamId);
        return currentStreamId;
      }

      const streamId = await client.startStream({
        prompt,
        image: image ?? undefined,
      });
      currentStreamId = streamId;
      return streamId;
    },
    async interact(prompt: string) {
      if (!currentStreamId) {
        throw new Error("No active stream to interact with.");
      }

      const client = await getClient();
      if (!client) {
        return;
      }

      await client.interact({ prompt });
    },
    async endStream() {
      const client = await getClient();
      if (!client) {
        currentStreamId = null;
        handlers.onStreamEnded?.();
        return;
      }

      await client.endStream();
      currentStreamId = null;
    },
    disconnect() {
      currentStreamId = null;
      connected = false;
      void getClient().then((client) => {
        client?.disconnect();
      });
    },
    getCurrentStreamId() {
      return currentStreamId;
    },
  };
}
