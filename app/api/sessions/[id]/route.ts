import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getMockSessionDetail } from "@/lib/mocks/session";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  return NextResponse.json(getMockSessionDetail(id));
}

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  return NextResponse.json({
    id,
    ok: true,
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  return NextResponse.json({
    id,
    ok: true,
  });
}
