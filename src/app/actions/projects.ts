"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { emptyDoc, isValidDoc, type TimelineDoc } from "@/lib/timeline";
import { STOCK_POOL } from "@/lib/stock";
import type { Clip } from "@/lib/timeline";

function travelTemplate(): TimelineDoc {
  const a = STOCK_POOL.find((s) => s.stockId === "cliffs-azores")!;
  const b = STOCK_POOL.find((s) => s.stockId === "fog-coast")!;
  const c = STOCK_POOL.find((s) => s.stockId === "sunset-ridge")!;
  const clip = (p: Partial<Clip> & Pick<Clip, "id" | "name" | "start" | "duration" | "segments">): Clip =>
    ({
      hue: 210,
      track: 0,
      filter: { preset: "cinematic", brightness: 1, contrast: 1, saturate: 1, hue: 0 },
      effect: { type: "none", intensity: 0.6 },
      transition: { type: "none", duration: 0.8 },
      keyframes: [],
      ...p,
    }) as Clip;
  return {
    version: 1,
    clips: [
      clip({
        id: "t1",
        name: a.name,
        start: 0,
        duration: 6,
        hue: a.hue,
        segments: [{ src: a.src, poster: a.poster, in: 1, duration: 6, label: a.name }],
      }),
      clip({
        id: "t2",
        name: b.name,
        start: 6,
        duration: 5,
        hue: b.hue,
        segments: [{ src: b.src, poster: b.poster, in: 4, duration: 5, label: b.name }],
        transition: { type: "dissolve", duration: 1.2 },
      }),
      clip({
        id: "t3",
        name: c.name,
        start: 11,
        duration: 5,
        hue: c.hue,
        segments: [{ src: c.src, poster: c.poster, in: 2, duration: 5, label: c.name }],
        transition: { type: "fade", duration: 0.9 },
        filter: { preset: "amber", brightness: 1, contrast: 1, saturate: 1, hue: 0 },
      }),
    ],
  };
}

function promoTemplate(): TimelineDoc {
  const a = STOCK_POOL.find((s) => s.stockId === "dubai-neon")!;
  const b = STOCK_POOL.find((s) => s.stockId === "manhattan-night")!;
  const c = STOCK_POOL.find((s) => s.stockId === "traffic-lapse")!;
  const clip = (p: Partial<Clip> & Pick<Clip, "id" | "name" | "start" | "duration" | "segments">): Clip =>
    ({
      hue: 300,
      track: 0,
      filter: { preset: "none", brightness: 1, contrast: 1, saturate: 1, hue: 0 },
      effect: { type: "none", intensity: 0.6 },
      transition: { type: "none", duration: 0.6 },
      keyframes: [],
      ...p,
    }) as Clip;
  return {
    version: 1,
    clips: [
      clip({
        id: "p1",
        name: a.name,
        start: 0,
        duration: 3.5,
        hue: a.hue,
        segments: [{ src: a.src, poster: a.poster, in: 0, duration: 3.5, label: a.name }],
        filter: { preset: "noir", brightness: 1, contrast: 1, saturate: 1, hue: 0 },
      }),
      clip({
        id: "p2",
        name: b.name,
        start: 3.5,
        duration: 4,
        hue: b.hue,
        segments: [{ src: b.src, poster: b.poster, in: 6, duration: 4, label: b.name }],
        transition: { type: "slide", duration: 0.6 },
      }),
      clip({
        id: "p3",
        name: c.name,
        start: 7.5,
        duration: 3.5,
        hue: c.hue,
        segments: [{ src: c.src, poster: c.poster, in: 0, duration: 3.5, label: c.name }],
        transition: { type: "wipe", duration: 0.7 },
        effect: { type: "glow", intensity: 0.5 },
      }),
    ],
  };
}

export async function createProject(input: {
  name: string;
  template: "blank" | "travel" | "promo";
  resolution: string;
  fps: number;
}): Promise<{ id?: string; error?: string }> {
  const user = await requireUser();
  const name = input.name.trim();
  if (name.length < 2) return { error: "Give your project a name (2+ characters)." };

  const timeline =
    input.template === "travel" ? travelTemplate() : input.template === "promo" ? promoTemplate() : emptyDoc();

  const [row] = await db
    .insert(projects)
    .values({
      userId: user.id,
      name,
      resolution: input.resolution,
      fps: input.fps,
      status: "editing",
      timeline,
    })
    .returning({ id: projects.id });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { id: row.id };
}

export async function updateProjectMeta(
  id: string,
  patch: Partial<{ name: string; description: string; status: string; resolution: string; fps: number }>
) {
  const user = await requireUser();
  const clean: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined && patch.name.trim().length >= 2) clean.name = patch.name.trim();
  if (patch.description !== undefined) clean.description = patch.description;
  if (patch.status !== undefined) clean.status = patch.status;
  if (patch.resolution !== undefined) clean.resolution = patch.resolution;
  if (patch.fps !== undefined) clean.fps = patch.fps;
  await db
    .update(projects)
    .set(clean)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)));
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function duplicateProject(id: string): Promise<{ id?: string; error?: string }> {
  const user = await requireUser();
  const src = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!src) return { error: "Project not found." };
  const [row] = await db
    .insert(projects)
    .values({
      userId: user.id,
      name: `${src.name} (copy)`,
      description: src.description,
      status: "draft",
      resolution: src.resolution,
      fps: src.fps,
      timeline: src.timeline,
    })
    .returning({ id: projects.id });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { id: row.id };
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const user = await requireUser();
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, user.id)));
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return {};
}

export async function saveTimeline(id: string, timeline: TimelineDoc) {
  const user = await requireUser();
  if (!isValidDoc(timeline)) return { error: "Invalid timeline document." };
  await db
    .update(projects)
    .set({ timeline, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)));
  return { ok: true };
}
