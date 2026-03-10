"use client";

export interface OdysseyClientConfig {
  enabled: boolean;
  mode: "mock" | "odyssey";
}

export interface OdysseyClientHandle {
  connect: () => Promise<void>;
  startStream: (prompt: string, image?: Blob) => Promise<string>;
  interact: (prompt: string) => Promise<void>;
  endStream: () => Promise<void>;
  getCurrentStreamId: () => string | null;
}

export function createOdysseyClient(config: OdysseyClientConfig = { enabled: false, mode: "mock" }): OdysseyClientHandle {
  let connected = false;
  let currentStreamId: string | null = null;

  const connect = async () => {
    connected = true;
  };

  return {
    connect,
    async startStream(_prompt: string, _image?: Blob) {
      if (!connected) {
        await connect();
      }

      if (!config.enabled || config.mode === "mock") {
        currentStreamId = `mock-stream-${crypto.randomUUID()}`;
        return currentStreamId;
      }

      throw new Error("Real Odyssey browser integration is not wired yet.");
    },
    async interact(_prompt: string) {
      if (!currentStreamId) {
        throw new Error("No active stream to interact with.");
      }
    },
    async endStream() {
      currentStreamId = null;
    },
    getCurrentStreamId() {
      return currentStreamId;
    },
  };
}
