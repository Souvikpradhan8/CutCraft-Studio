"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} />;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  compact,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cx(
        "anim-fade-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] text-center",
        compact ? "px-6 py-10" : "px-6 py-16"
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-accent-500/25 to-cyan-500/15 text-accent-300 shadow-[0_0_40px_-8px_#7c5cff66]">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cx(
          "anim-scale-in relative max-h-[88vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-ink-850 shadow-2xl",
          wide ? "max-w-2xl" : "max-w-md"
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/[0.06] bg-ink-850/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon -mr-2" aria-label="Close">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-white/10 bg-ink-900 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            "flex flex-1 flex-col items-center rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
            value === o.value
              ? "bg-accent-500/20 text-white shadow-[0_0_0_1px_#7c5cff55_inset]"
              : "text-zinc-500 hover:text-zinc-200"
          )}
        >
          {o.label}
          {o.hint ? <span className="mt-0.5 text-[10px] font-normal text-zinc-600">{o.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-2.5"
    >
      <span
        className={cx(
          "relative h-5.5 w-10 rounded-full transition-colors",
          checked ? "bg-accent-500" : "bg-ink-600"
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-all",
            checked ? "left-[calc(100%-1.25rem)]" : "left-0.5"
          )}
        />
      </span>
      {label ? <span className="text-sm text-zinc-300">{label}</span> : null}
    </button>
  );
}
