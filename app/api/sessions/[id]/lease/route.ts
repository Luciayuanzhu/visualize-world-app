import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST() {
  await requireUser();

  return NextResponse.json({
    leaseToken: crypto.randomUUID(),
    expiresAt: new Date(Date.now() + 90_000).toISOString(),
  });
}

export async function DELETE() {
  await requireUser();

  return NextResponse.json({ ok: true });
}
