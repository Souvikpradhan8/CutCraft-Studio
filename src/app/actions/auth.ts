"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets, projects, users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/auth";
import { STARTER_STOCK_IDS, STOCK_POOL, starterTimeline } from "@/lib/stock";

export type AuthState = { error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: "Incorrect email or password." };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Tell us your name (2+ characters)." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return { error: "An account with that email already exists." };

  const colors = ["violet", "cyan", "amber", "rose", "emerald"];
  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    })
    .returning();

  // Give every new editor a stocked library + a first project so the app feels alive.
  const starterItems = STOCK_POOL.filter((s) => STARTER_STOCK_IDS.includes(s.stockId));
  const inserted = await db
    .insert(mediaAssets)
    .values(
      starterItems.map((s) => ({
        userId: user.id,
        name: s.name,
        src: s.src,
        poster: s.poster,
        durationSec: s.durationSec,
        sizeMb: Math.round(s.durationSec * 12.4),
        tag: s.tag,
        hue: s.hue,
      }))
    )
    .returning();

  await db.insert(projects).values({
    userId: user.id,
    name: "My First Cut",
    description: "Starter project — open it in the editor and make your first cut.",
    status: "editing",
    timeline: starterTimeline(starterItems),
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function signOut() {
  await destroySession();
  redirect("/login");
}
