import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET() {
  await requireUser();

  const apiKey = process.env.ODYSSEY_API_KEY;

  return NextResponse.json({
    enabled: Boolean(apiKey),
    mode: apiKey ? "odyssey" : "mock",
    apiKey: apiKey ?? undefined,
  });
}
