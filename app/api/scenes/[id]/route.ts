import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSceneSchema } from "@/lib/validation/contracts";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateSceneSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scene = await db.scene.findFirst({
    where: {
      id,
      session: {
        userId: user.uid,
      },
    },
  });

  if (!scene) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  const updated = await db.scene.update({
    where: { id },
    data: {
      name: parsed.data.name,
      draftContent: parsed.data.draftContent,
      publishedFromOffset: parsed.data.publishedFromOffset,
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    index: updated.index,
    status: updated.status,
    hasStarted: false,
    draftContent: updated.draftContent,
    publishedFromOffset: updated.publishedFromOffset,
  });
}
