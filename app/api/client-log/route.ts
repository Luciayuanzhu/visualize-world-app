import { NextResponse } from "next/server";
import { logServer } from "@/lib/server-log";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const level = body?.level === "error" || body?.level === "warn" ? body.level : "info";
  const message = typeof body?.message === "string" ? body.message : "client event";
  const meta = body && typeof body === "object" ? body.meta : undefined;

  logServer(level, `client:${message}`, meta as Record<string, unknown> | undefined);
  return NextResponse.json({ ok: true });
}
