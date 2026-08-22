"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, renders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { totalDuration, safeDoc } from "@/lib/timeline";

export async function createRender(input: {
  projectId: string;
  name: string;
  format: "MP4" | "MOV" | "WebM";
  resolution: "1080p FHD" | "1440p QHD" | "2160p 4K UHD";
  enhance: boolean;
}): Promise<{ id?: string; error?: string }> {
  const user = await requireUser();
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, input.projectId), eq(projects.userId, user.id)),
  });
  if (!project) return { error: "Project not found." };

  const srcDur = Math.max(4, totalDuration(safeDoc(project.timeline)));
  const name = input.name.trim() || `${project.name} — Master`;
  const durationSec = Math.min(50, Math.max(14, 12 + srcDur * 0.6));

  const [row] = await db
    .insert(renders)
    .values({
      userId: user.id,
      projectId: project.id,
      projectName: project.name,
      name,
      format: input.format,
      resolution: input.resolution,
      enhance: input.enhance,
      status: "processing",
      durationSec,
      sourceDurationSec: Math.round(srcDur * 10) / 10,
    })
    .returning({ id: renders.id });

  revalidatePath("/renders");
  revalidatePath("/dashboard");
  return { id: row.id };
}

export async function deleteRender(id: string) {
  const user = await requireUser();
  await db.delete(renders).where(and(eq(renders.id, id), eq(renders.userId, user.id)));
  revalidatePath("/renders");
  revalidatePath("/dashboard");
  return {};
}

export async function retryRender(id: string) {
  const user = await requireUser();
  await db
    .update(renders)
    .set({ status: "processing", createdAt: new Date(), completedAt: null, sizeMb: null })
    .where(and(eq(renders.id, id), eq(renders.userId, user.id)));
  revalidatePath("/renders");
  return {};
}
