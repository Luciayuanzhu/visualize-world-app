import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      id: crypto.randomUUID(),
      name: "Opening",
      index: 0,
      status: "active",
    },
    { status: 201 },
  );
}
