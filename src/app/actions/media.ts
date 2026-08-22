"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { STOCK_POOL } from "@/lib/stock";

export async function addMediaByUrl(input: {
  name: string;
  src: string;
  tag?: string;
  durationSec?: number;
}): Promise<{ error?: string }> {
  const user = await requireUser();
  const name = input.name.trim();
  if (name.length < 2) return { error: "Give the clip a name (2+ characters)." };
  try {
    const u = new URL(input.src);
    if (!/^https?:$/.test(u.protocol)) throw new Error();
  } catch {
    return { error: "Enter a valid http(s) URL to a video file." };
  }
  await db.insert(mediaAssets).values({
    userId: user.id,
    name,
    src: input.src.trim(),
    durationSec: input.durationSec ?? 10,
    sizeMb: Math.round((input.durationSec ?? 10) * 12.4),
    tag: input.tag?.trim() || "Footage",
    resolution: "External source",
    hue: Math.floor(Math.random() * 360),
  });
  revalidatePath("/media");
  return {};
}

export async function addStockMedia(stockIds: string[]): Promise<{ added: number }> {
  const user = await requireUser();
  const existing = await db
    .select({ src: mediaAssets.src })
    .from(mediaAssets)
    .where(eq(mediaAssets.userId, user.id));
  const have = new Set(existing.map((e) => e.src));
  const toAdd = STOCK_POOL.filter((s) => stockIds.includes(s.stockId) && !have.has(s.src));
  if (toAdd.length) {
    await db.insert(mediaAssets).values(
      toAdd.map((s) => ({
        userId: user.id,
        name: s.name,
        src: s.src,
        poster: s.poster,
        durationSec: s.durationSec,
        sizeMb: Math.round(s.durationSec * 12.4),
        tag: s.tag,
        hue: s.hue,
      }))
    );
  }
  revalidatePath("/media");
  return { added: toAdd.length };
}

export async function updateMedia(
  id: string,
  patch: Partial<{ name: string; tag: string }>
): Promise<{ error?: string }> {
  const user = await requireUser();
  const clean: Record<string, string> = {};
  if (patch.name !== undefined) {
    if (patch.name.trim().length < 2) return { error: "Name needs 2+ characters." };
    clean.name = patch.name.trim();
  }
  if (patch.tag !== undefined) clean.tag = patch.tag.trim() || "Footage";
  await db
    .update(mediaAssets)
    .set(clean)
    .where(and(eq(mediaAssets.id, id), eq(mediaAssets.userId, user.id)));
  revalidatePath("/media");
  return {};
}

export async function deleteMedia(id: string): Promise<{ error?: string }> {
  const user = await requireUser();
  await db.delete(mediaAssets).where(and(eq(mediaAssets.id, id), eq(mediaAssets.userId, user.id)));
  revalidatePath("/media");
  return {};
}
