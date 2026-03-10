import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET() {
  await requireUser();

  return NextResponse.json({
    enabled: false,
    mode: "mock",
  });
}
