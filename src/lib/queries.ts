import { desc, eq, sum } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets, projects, renders, type Render } from "@/db/schema";
import { clamp } from "@/lib/utils";

export type RenderWithProgress = Render & { progress: number };

const BITRATE_MB_PER_SEC: Record<string, number> = {
  "1080p": 6.2,
  "1440p": 9.4,
  "2160p": 16.8,
};

function bitrateFor(resolution: string, enhance: boolean) {
  const key = Object.keys(BITRATE_MB_PER_SEC).find((k) => resolution.startsWith(k)) ?? "2160p";
  return BITRATE_MB_PER_SEC[key] * (enhance ? 1.28 : 1);
}

/** Reads renders and advances any in-flight jobs based on elapsed wall-clock time. */
export async function readRenders(userId: string): Promise<RenderWithProgress[]> {
  const rows = await db
    .select()
    .from(renders)
    .where(eq(renders.userId, userId))
    .orderBy(desc(renders.createdAt));

  const out: RenderWithProgress[] = [];
  for (const r of rows) {
    if (r.status === "processing") {
      const elapsed = (Date.now() - r.createdAt.getTime()) / 1000;
      const p = clamp(elapsed / r.durationSec, 0, 1);
      if (p >= 1) {
        const sizeMb = Math.round(r.sourceDurationSec * bitrateFor(r.resolution, r.enhance) * 10) / 10;
        const completedAt = new Date();
        await db
          .update(renders)
          .set({ status: "completed", completedAt, sizeMb })
          .where(eq(renders.id, r.id));
        out.push({ ...r, status: "completed", progress: 1, sizeMb, completedAt });
        continue;
      }
      out.push({ ...r, progress: p });
      continue;
    }
    out.push({ ...r, progress: r.status === "completed" ? 1 : 0 });
  }
  return out;
}

export async function getStorageUsedMb(userId: string) {
  const rows = await db
    .select({ total: sum(mediaAssets.sizeMb) })
    .from(mediaAssets)
    .where(eq(mediaAssets.userId, userId));
  return Number(rows[0]?.total ?? 0);
}

export async function getRecentProjects(userId: string, limit = 4) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt))
    .limit(limit);
}

export async function getProjects(userId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export async function getMedia(userId: string) {
  return db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.userId, userId))
    .orderBy(desc(mediaAssets.createdAt));
}
