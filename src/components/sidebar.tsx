"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  LibraryBig,
  MonitorPlay,
  Settings,
  LogOut,
  ChevronsUpDown,
  Menu,
  X,
  HardDrive,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { cx, formatSize, initials, AVATAR_COLORS } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/media", label: "Media Library", icon: LibraryBig },
  { href: "/renders", label: "Renders", icon: MonitorPlay },
  { href: "/settings", label: "Settings", icon: Settings },
];

const QUOTA_MB = 10 * 1024;

export function Sidebar({
  user,
  storageMb,
}: {
  user: { name: string; email: string; avatarColor: string };
  storageMb: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pct = Math.min(100, (storageMb / QUOTA_MB) * 100);

  const panel = (
    <div className="flex h-full flex-col bg-ink-900/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <button className="btn btn-ghost btn-icon lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active ? "text-white" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
              )}
            >
              {active && (
                <>
                  <span className="absolute inset-0 rounded-xl border border-accent-500/25 bg-gradient-to-r from-accent-500/15 to-transparent" />
                  <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent-400 shadow-[0_0_12px_#7c5cff]" />
                </>
              )}
              <item.icon
                className={cx("relative h-4.5 w-4.5", active ? "text-accent-300" : "text-zinc-600 group-hover:text-zinc-400")}
              />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 px-4 pb-5">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-zinc-400">
              <HardDrive className="h-3.5 w-3.5 text-accent-400" /> Storage
            </span>
            <span className="font-mono text-[11px] text-zinc-500">
              {formatSize(storageMb)} / 10 GB
            </span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink-600">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-cyan-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 text-left transition-colors hover:border-white/15"
          >
            <span
              className={cx(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white",
                AVATAR_COLORS[user.avatarColor] ?? AVATAR_COLORS.violet
              )}
            >
              {initials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{user.name}</span>
              <span className="block truncate text-[11px] text-zinc-600">{user.email}</span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
          </button>

          {menuOpen && (
            <div className="anim-scale-in absolute right-0 bottom-[calc(100%+8px)] left-0 overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-2xl">
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <Settings className="h-4 w-4 text-zinc-500" /> Settings
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <LogOut className="h-4 w-4 text-zinc-500" /> Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* mobile topbar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-ink-950/85 px-4 py-3 backdrop-blur-lg lg:hidden">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <button className="btn btn-outline btn-icon" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/[0.06] lg:block">
        {panel}
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="anim-fade-up absolute inset-y-0 left-0 w-[280px] border-r border-white/10 bg-ink-950">
            {panel}
          </aside>
        </div>
      )}
    </>
  );
}
