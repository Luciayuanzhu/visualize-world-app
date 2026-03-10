import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const session = await db.worldSession.findFirst({
    where: { id, userId: user.uid },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const leaseToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 90_000);

  await db.worldSession.update({
    where: { id },
    data: {
      leaseOwner: user.uid,
      leaseToken,
      leaseExpiresAt: expiresAt,
    },
  });

  return NextResponse.json({
    leaseToken,
    expiresAt: expiresAt.toISOString(),
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const session = await db.worldSession.findFirst({
    where: { id, userId: user.uid },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await db.worldSession.update({
    where: { id },
    data: {
      leaseOwner: null,
      leaseToken: null,
      leaseExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
