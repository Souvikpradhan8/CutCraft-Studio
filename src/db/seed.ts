/**
 * Seeds the demo studio: demo@cutcraft.app / demo1234
 * Run: npx tsx src/db/seed.ts
 */
import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { mediaAssets, projects, renders, users } from "./schema";
import { STOCK_POOL, type StockItem } from "../lib/stock";
import type { Clip, TimelineDoc } from "../lib/timeline";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
});
const db = drizzle(pool, { schema });

const S = (id: string) => STOCK_POOL.find((s) => s.stockId === id)!;

function seg(item: StockItem, inPoint: number, duration: number) {
  return { src: item.src, poster: item.poster, in: inPoint, duration, label: item.name };
}

function clip(
  item: StockItem,
  start: number,
  inPoint: number,
  duration: number,
  extra?: Partial<Clip>
): Clip {
  return {
    id: `seed-${Math.random().toString(36).slice(2, 9)}`,
    name: item.name,
    hue: item.hue,
    track: 0,
    start,
    duration,
    segments: [seg(item, inPoint, duration)],
    filter: { preset: "none", brightness: 1, contrast: 1, saturate: 1, hue: 0 },
    effect: { type: "none", intensity: 0.6 },
    transition: { type: "none", duration: 0.8 },
    keyframes: [],
    ...extra,
  };
}

const kf = (time: number, prop: Clip["keyframes"][number]["prop"], value: number) => ({
  id: `kf-${Math.random().toString(36).slice(2, 9)}`,
  time,
  prop,
  value,
});

function surfFilm(): TimelineDoc {
  const azores = S("cliffs-azores");
  const northSea = S("north-sea");
  const atlantic = S("atlantic-coast");
  const fog = S("fog-coast");
  const isle = S("isle-dusk");
  const bay = S("beach-hills");
  const ridge = S("sunset-ridge");
  const mist = S("mist-peaks");

  return {
    version: 1,
    clips: [
      clip(azores, 0, 1.5, 7, {
        filter: { preset: "cinematic", brightness: 1, contrast: 1, saturate: 1, hue: 0 },
        keyframes: [kf(0, "scale", 1), kf(7, "scale", 1.14)],
      }),
      clip(northSea, 7, 0, 6, {
        transition: { type: "fade", duration: 0.8 },
        filter: { preset: "cinematic", brightness: 1, contrast: 1.05, saturate: 1, hue: 0 },
      }),
      clip(atlantic, 13, 2, 6.5, {
        transition: { type: "dissolve", duration: 1.2 },
        filter: { preset: "vintage", brightness: 1, contrast: 1, saturate: 1.1, hue: 0 },
      }),
      clip(mist, 15.5, 0, 4, {
        track: 1,
        filter: { preset: "frost", brightness: 1, contrast: 1, saturate: 0.9, hue: 0 },
        keyframes: [kf(0, "opacity", 0), kf(0.6, "opacity", 0.85), kf(3.4, "opacity", 0), kf(0, "scale", 1.06), kf(4, "scale", 1.16)],
      }),
      clip(fog, 19.5, 8, 7, {
        transition: { type: "wipe", duration: 0.9 },
        filter: { preset: "cinematic", brightness: 0.95, contrast: 1.1, saturate: 0.92, hue: 0 },
      }),
      clip(isle, 26.5, 0, 5, {
        transition: { type: "slide", duration: 0.7 },
        filter: { preset: "amber", brightness: 1, contrast: 1, saturate: 1.05, hue: 0 },
        effect: { type: "vignette", intensity: 0.5 },
        keyframes: [kf(0, "scale", 1.08), kf(5, "scale", 1)],
      }),
      clip(bay, 31.5, 2, 6, {
        transition: { type: "fade", duration: 0.8 },
        filter: { preset: "cinematic", brightness: 1, contrast: 1, saturate: 1.12, hue: -4 },
      }),
      clip(ridge, 37.5, 3, 6.5, {
        transition: { type: "dissolve", duration: 1.1 },
        filter: { preset: "amber", brightness: 1, contrast: 1.06, saturate: 1.15, hue: 0 },
        effect: { type: "grain", intensity: 0.35 },
        keyframes: [kf(0, "opacity", 0), kf(0.7, "opacity", 1), kf(5.6, "opacity", 1), kf(6.5, "opacity", 0.2)],
      }),
    ],
  };
}

function cityPromo(): TimelineDoc {
  const neon = S("dubai-neon");
  const storm = S("storm-city");
  const lapse = S("traffic-lapse");
  const marina = S("dubai-traffic");
  const arterial = S("city-timelapse");
  const manhattan = S("manhattan-night");

  return {
    version: 1,
    clips: [
      clip(neon, 0, 0, 3.5, {
        filter: { preset: "noir", brightness: 1, contrast: 1.1, saturate: 1, hue: 0 },
        effect: { type: "glow", intensity: 0.35 },
        keyframes: [kf(0, "scale", 1), kf(3.5, "scale", 1.1)],
      }),
      clip(storm, 3.5, 6, 4, {
        transition: { type: "slide", duration: 0.5 },
        filter: { preset: "cinematic", brightness: 0.96, contrast: 1.18, saturate: 0.85, hue: 0 },
      }),
      clip(lapse, 7.5, 0, 3.5, {
        transition: { type: "wipe", duration: 0.6 },
        filter: { preset: "cinematic", brightness: 1, contrast: 1, saturate: 1.2, hue: 0 },
        effect: { type: "glow", intensity: 0.5 },
      }),
      clip(marina, 11, 2, 4, {
        transition: { type: "fade", duration: 0.5 },
        filter: { preset: "frost", brightness: 1, contrast: 1.08, saturate: 1.1, hue: -8 },
        keyframes: [kf(0, "opacity", 0), kf(0.4, "opacity", 1)],
      }),
      clip(arterial, 15, 1, 4, {
        transition: { type: "dissolve", duration: 0.8 },
        filter: { preset: "amber", brightness: 1, contrast: 1, saturate: 1.2, hue: 0 },
      }),
      clip(manhattan, 19, 4, 4.5, {
        transition: { type: "wipe", duration: 0.7 },
        filter: { preset: "noir", brightness: 1.02, contrast: 1.15, saturate: 1, hue: 0 },
        effect: { type: "vignette", intensity: 0.4 },
        keyframes: [kf(0, "scale", 1.05), kf(4.5, "scale", 1.18)],
      }),
    ],
  };
}

function travelVlog(): TimelineDoc {
  const mist = S("mist-peaks");
  const ridge = S("sunset-ridge");
  const fog = S("fog-coast");
  const bay = S("beach-hills");

  return {
    version: 1,
    clips: [
      clip(mist, 0, 0, 5, {
        filter: { preset: "frost", brightness: 1, contrast: 1, saturate: 1, hue: 0 },
      }),
      clip(ridge, 5, 1, 5, {
        filter: { preset: "amber", brightness: 1, contrast: 1, saturate: 1.05, hue: 0 },
      }),
      clip(fog, 10, 6, 6),
      clip(bay, 20, 2, 5, {
        track: 1,
        keyframes: [kf(0, "opacity", 0), kf(0.8, "opacity", 0.9)],
      }),
    ],
  };
}

async function main() {
  console.log("Seeding CutCraft studio…");

  const existing = await db.query.users.findFirst({
    where: eq(users.email, "demo@cutcraft.app"),
  });
  if (existing) {
    console.log("Demo account already present — skipping seed.");
    await pool.end();
    return;
  }

  const [demo] = await db
    .insert(users)
    .values({
      email: "demo@cutcraft.app",
      name: "Maya Reyes",
      passwordHash: bcrypt.hashSync("demo1234", 10),
      avatarColor: "violet",
    })
    .returning();

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  await db.insert(mediaAssets).values(
    STOCK_POOL.map((s, i) => ({
      userId: demo.id,
      name: s.name,
      src: s.src,
      poster: s.poster,
      durationSec: s.durationSec,
      sizeMb: Math.round(s.durationSec * 12.4),
      tag: s.tag,
      hue: s.hue,
      createdAt: new Date(now - 4 * day - i * 47 * 60000),
    }))
  );

  const [p1, p2, p3] = await db
    .insert(projects)
    .values([
      {
        userId: demo.id,
        name: "North Atlantic — Surf Film",
        description: "Festival cut. Cold-water drone odyssey with a mist overlay pass and filmic grade.",
        status: "editing",
        resolution: "2160p 4K UHD",
        fps: 24,
        timeline: surfFilm(),
        createdAt: new Date(now - 6 * day),
        updatedAt: new Date(now - 2 * 3600000),
      },
      {
        userId: demo.id,
        name: "Neon District — City Promo",
        description: "30-second launch teaser for the nightlife campaign. Hard cuts, glow passes.",
        status: "review",
        resolution: "2160p 4K UHD",
        fps: 30,
        timeline: cityPromo(),
        createdAt: new Date(now - 3 * day),
        updatedAt: new Date(now - 26 * 3600000),
      },
      {
        userId: demo.id,
        name: "Peaks & Mist — Travel Vlog",
        description: "Assembly pass — waiting on narration before the grade.",
        status: "draft",
        resolution: "1440p QHD",
        fps: 24,
        timeline: travelVlog(),
        createdAt: new Date(now - 9 * day),
        updatedAt: new Date(now - 5 * day),
      },
    ])
    .returning();

  await db.insert(renders).values([
    {
      userId: demo.id,
      projectId: p1.id,
      projectName: p1.name,
      name: "North Atlantic — Festival Master",
      format: "MP4",
      resolution: "2160p 4K UHD",
      enhance: true,
      status: "completed",
      durationSec: 40,
      sourceDurationSec: 44,
      sizeMb: Math.round(44 * 16.8 * 1.28 * 10) / 10,
      createdAt: new Date(now - 2 * day),
      completedAt: new Date(now - 2 * day + 41 * 1000),
    },
    {
      userId: demo.id,
      projectId: p2.id,
      projectName: p2.name,
      name: "Neon District — Social Teaser v3",
      format: "MP4",
      resolution: "1080p FHD",
      enhance: false,
      status: "completed",
      durationSec: 22,
      sourceDurationSec: 23.5,
      sizeMb: Math.round(23.5 * 6.2 * 10) / 10,
      createdAt: new Date(now - day),
      completedAt: new Date(now - day + 24 * 1000),
    },
    {
      userId: demo.id,
      projectId: p3.id,
      projectName: p3.name,
      name: "Peaks & Mist — Assembly Cut v2",
      format: "MP4",
      resolution: "2160p 4K UHD",
      enhance: true,
      status: "processing",
      durationSec: 46,
      sourceDurationSec: 21,
      createdAt: new Date(now - 4000),
    },
    {
      userId: demo.id,
      projectId: p1.id,
      projectName: p1.name,
      name: "North Atlantic — Director's Preview",
      format: "WebM",
      resolution: "1440p QHD",
      enhance: false,
      status: "failed",
      durationSec: 30,
      sourceDurationSec: 44,
      createdAt: new Date(now - 3 * day),
    },
  ]);

  console.log("Seeded: 1 demo user, 14 media assets, 3 projects, 4 renders.");
  console.log("Login: demo@cutcraft.app / demo1234");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
