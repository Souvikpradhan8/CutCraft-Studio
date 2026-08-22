"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export type SettingsState = { error?: string; ok?: boolean } | undefined;

export async function updateProfile(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const avatarColor = String(formData.get("avatarColor") ?? "violet");
  if (name.length < 2) return { error: "Name needs at least 2 characters." };
  await db.update(users).set({ name, avatarColor }).where(eq(users.id, user.id));
  revalidatePath("/settings");
  return { ok: true };
}

export async function changePassword(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!bcrypt.compareSync(current, user.passwordHash)) {
    return { error: "Your current password is incorrect." };
  }
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New passwords do not match." };
  await db
    .update(users)
    .set({ passwordHash: bcrypt.hashSync(next, 10) })
    .where(eq(users.id, user.id));
  return { ok: true };
}
