import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { TimelineDoc } from "@/lib/timeline";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  avatarColor: text("avatar_color").notNull().default("violet"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("editing"), // draft | editing | review | published
    resolution: text("resolution").notNull().default("2160p 4K UHD"),
    fps: integer("fps").notNull().default(24),
    timeline: jsonb("timeline").$type<TimelineDoc>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("projects_user_idx").on(t.userId)]
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    src: text("src").notNull(),
    poster: text("poster"),
    durationSec: real("duration_sec").notNull().default(10),
    resolution: text("resolution").notNull().default("3840×2160"),
    sizeMb: real("size_mb").notNull().default(120),
    tag: text("tag").notNull().default("Footage"),
    hue: integer("hue").notNull().default(245),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("media_user_idx").on(t.userId)]
);

export const renders = pgTable(
  "renders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    projectName: text("project_name").notNull(),
    name: text("name").notNull(),
    format: text("format").notNull().default("MP4"),
    resolution: text("resolution").notNull().default("2160p 4K UHD"),
    enhance: boolean("enhance").notNull().default(true),
    status: text("status").notNull().default("processing"), // processing | completed | failed
    // simulated job duration (seconds) — progress is computed from createdAt
    durationSec: real("duration_sec").notNull().default(30),
    sourceDurationSec: real("source_duration_sec").notNull().default(30),
    sizeMb: real("size_mb"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("renders_user_idx").on(t.userId)]
);

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type Render = typeof renders.$inferSelect;
