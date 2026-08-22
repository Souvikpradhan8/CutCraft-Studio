"use client";

import { useActionState } from "react";
import { Check, Loader2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { changePassword, updateProfile, type SettingsState } from "@/app/actions/settings";
import { signOut } from "@/app/actions/auth";
import { cx, initials, AVATAR_COLORS } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { useEffect } from "react";

export function SettingsView({
  user,
}: {
  user: { name: string; email: string; avatarColor: string; createdAt: string };
}) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="anim-fade-up">
        <p className="text-xs font-semibold tracking-[0.22em] text-accent-400 uppercase">Account</p>
        <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      <ProfileCard user={user} />
      <PasswordCard />

      <div className="card anim-fade-up flex items-center justify-between p-6">
        <div>
          <h3 className="text-sm font-semibold text-white">Sign out</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Ends your session on this device.</p>
        </div>
        <form action={signOut}>
          <button className="btn btn-outline">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileCard({ user }: { user: { name: string; email: string; avatarColor: string } }) {
  const { toast } = useToast();
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateProfile, undefined);
  useEffect(() => {
    if (state?.ok) toast("Profile updated");
  }, [state, toast]);

  return (
    <div className="card anim-fade-up p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
          <UserRound className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">Profile</h3>
          <p className="text-xs text-zinc-500">How you appear across the studio.</p>
        </div>
      </div>

      <form action={action} className="space-y-4">
        <div className="flex items-center gap-4">
          <span
            className={cx(
              "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white",
              AVATAR_COLORS[user.avatarColor] ?? AVATAR_COLORS.violet
            )}
          >
            {initials(user.name)}
          </span>
          <div>
            <label className="label">Avatar color</label>
            <div className="flex gap-2">
              {Object.entries(AVATAR_COLORS).map(([key, grad]) => (
                <label key={key} className="cursor-pointer">
                  <input type="radio" name="avatarColor" value={key} defaultChecked={user.avatarColor === key} className="peer sr-only" />
                  <span className={cx("block h-7 w-7 rounded-full bg-gradient-to-br ring-2 ring-transparent transition-all peer-checked:ring-white peer-checked:ring-offset-2 peer-checked:ring-offset-ink-900", grad)} />
                </label>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="label">Display name</label>
          <input name="name" defaultValue={user.name} className="input" required minLength={2} />
        </div>
        <div>
          <label className="label">Email</label>
          <input value={user.email} disabled className="input opacity-50" />
        </div>
        {state?.error ? <p className="text-[13px] text-rose-300">{state.error}</p> : null}
        <div className="flex justify-end">
          <button disabled={pending} className="btn btn-primary">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordCard() {
  const { toast } = useToast();
  const [state, action, pending] = useActionState<SettingsState, FormData>(changePassword, undefined);
  useEffect(() => {
    if (state?.ok) toast("Password changed");
  }, [state, toast]);

  return (
    <div className="card anim-fade-up p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
          <ShieldCheck className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">Password</h3>
          <p className="text-xs text-zinc-500">Keep it long, keep it secret.</p>
        </div>
      </div>
      <form action={action} className="space-y-4">
        <div>
          <label className="label">Current password</label>
          <input name="current" type="password" required className="input" autoComplete="current-password" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">New password</label>
            <input name="next" type="password" required minLength={8} className="input" autoComplete="new-password" />
          </div>
          <div>
            <label className="label">Confirm new</label>
            <input name="confirm" type="password" required minLength={8} className="input" autoComplete="new-password" />
          </div>
        </div>
        {state?.error ? <p className="text-[13px] text-rose-300">{state.error}</p> : null}
        <div className="flex justify-end">
          <button disabled={pending} className="btn btn-primary">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Change password
          </button>
        </div>
      </form>
    </div>
  );
}
