"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { Logo } from "@/components/logo";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, undefined);

  return (
    <div className="anim-fade-up">
      <div className="mb-8 lg:hidden">
        <Logo />
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight text-white">Welcome back</h2>
      <p className="mt-1.5 text-sm text-zinc-500">Sign in to open your studio.</p>

      <form action={action} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="you@studio.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" placeholder="••••••••" />
        </div>

        {state?.error ? (
          <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5 text-[13px] text-rose-300">
            {state.error}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-accent-300">
          <Sparkles className="h-3.5 w-3.5" /> Demo account
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          Explore a pre-seeded studio with projects, 4K media and live renders.
        </p>
        <DemoFill />
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        New to CutCraft?{" "}
        <Link href="/signup" className="font-medium text-accent-300 hover:text-accent-400">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function DemoFill() {
  return (
    <button
      type="button"
      onClick={() => {
        const email = document.getElementById("email") as HTMLInputElement | null;
        const pass = document.getElementById("password") as HTMLInputElement | null;
        if (email) email.value = "demo@cutcraft.app";
        if (pass) pass.value = "demo1234";
      }}
      className="btn btn-outline mt-3 w-full py-1.5 text-xs"
    >
      Fill demo credentials
    </button>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);

  return (
    <div className="anim-fade-up">
      <div className="mb-8 lg:hidden">
        <Logo />
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight text-white">Create your studio</h2>
      <p className="mt-1.5 text-sm text-zinc-500">
        Free forever. We preload your library with 4K stock so you can cut immediately.
      </p>

      <form action={action} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" required className="input" placeholder="Maya Reyes" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="you@studio.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" placeholder="8+ characters" />
        </div>

        {state?.error ? (
          <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5 text-[13px] text-rose-300">
            {state.error}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {pending ? "Creating studio…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent-300 hover:text-accent-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
