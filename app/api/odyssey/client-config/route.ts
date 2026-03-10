import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { logServer } from "@/lib/server-log";

export async function GET() {
  await requireUser();

  const apiKey = process.env.ODYSSEY_API_KEY;

  logServer("info", "odyssey client config requested", {
    enabled: Boolean(apiKey),
    mode: apiKey ? "odyssey" : "mock",
  });

  return NextResponse.json({
    enabled: Boolean(apiKey),
    mode: apiKey ? "odyssey" : "mock",
    apiKey: apiKey ?? undefined,
  });
}
