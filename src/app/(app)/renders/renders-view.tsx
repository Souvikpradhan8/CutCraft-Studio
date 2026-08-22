"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MonitorPlay,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Download,
  Sparkles,
  Film,
} from "lucide-react";
import type { RenderWithProgress } from "@/lib/queries";
import { deleteRender, retryRender } from "@/app/actions/renders";
import { cx, formatSize, timeAgo } from "@/lib/utils";
import { EmptyState, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";

export function RendersView({ initialRenders }: { initialRenders: RenderWithProgress[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [renders, setRenders] = useState(initialRenders);
  const [confirmDelete, setConfirmDelete] = useState<RenderWithProgress | null>(null);
  const [, startTransition] = useTransition();

  // live-poll while anything is processing
  const hasProcessing = renders.some((r) => r.status === "processing");
  useEffect(() => {
    if (!hasProcessing) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/renders", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { renders: RenderWithProgress[] };
        setRenders(
          data.renders.map((r) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            completedAt: r.completedAt ? new Date(r.completedAt) : null,
          }))
        );
      } catch {
        /* keep polling next tick */
      }
    }, 1800);
    return () => clearInterval(t);
  }, [hasProcessing]);

  const done = renders.filter((r) => r.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-accent-400 uppercase">Export pipeline</p>
          <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-white">Renders</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {renders.length} render{renders.length === 1 ? "" : "s"} · {done} completed
            {hasProcessing ? " · processing live" : ""}
          </p>
        </div>
        <Link href="/projects" className="btn btn-outline">
          <Film className="h-4 w-4" /> Open a project to render
        </Link>
      </div>

      {renders.length === 0 ? (
        <EmptyState
          icon={<MonitorPlay className="h-6 w-6" />}
          title="Render queue is empty"
          body="Open any project in the editor and press Render to produce a polished master — up to 4K with AI enhancement."
          action={
            <Link href="/projects" className="btn btn-primary">
              <Film className="h-4 w-4" /> Go to projects
            </Link>
          }
        />
      ) : (
        <div className="stagger space-y-3">
          {renders.map((r) => (
            <div key={r.id} className="card anim-fade-up flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <span
                className={cx(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  r.status === "completed" && "bg-emerald-400/10 text-emerald-300",
                  r.status === "processing" && "bg-accent-500/15 text-accent-300",
                  r.status === "failed" && "bg-rose-400/10 text-rose-300"
                )}
              >
                {r.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : r.status === "failed" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-white">{r.name}</h3>
                  {r.enhance && (
                    <span className="chip border-accent-500/30 bg-accent-500/10 text-accent-300">
                      <Sparkles className="h-3 w-3" /> 4K Enhanced
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {r.projectName} · {r.format} · {r.resolution} ·{" "}
                  {r.status === "completed"
                    ? `${r.sizeMb ? formatSize(r.sizeMb) : ""} · finished ${r.completedAt ? timeAgo(r.completedAt) : ""}`
                    : r.status === "failed"
                      ? "encode failed — retry available"
                      : `queued ${timeAgo(r.createdAt)}`}
                </p>
                {r.status === "processing" && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-600">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-500 to-cyan-400 transition-all duration-700"
                        style={{ width: `${Math.round(r.progress * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-zinc-400">{Math.round(r.progress * 100)}%</span>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {r.status === "completed" && (
                  <button
                    className="btn btn-outline !py-2 text-xs"
                    onClick={() => toast("Demo build — playback happens in the editor, files are simulated", "info")}
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                )}
                {r.status === "failed" && (
                  <button
                    className="btn btn-outline !py-2 text-xs"
                    onClick={() => {
                      setRenders((xs) => xs.map((x) => (x.id === r.id ? { ...x, status: "processing", progress: 0 } : x)));
                      startTransition(async () => {
                        await retryRender(r.id);
                      });
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </button>
                )}
                <button className="btn btn-ghost btn-icon" onClick={() => setConfirmDelete(r)} aria-label="Delete render">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete render?">
        <p className="text-sm leading-relaxed text-zinc-400">
          Remove <span className="font-semibold text-white">“{confirmDelete?.name}”</span> from the queue history?
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button
            className="btn btn-danger"
            onClick={() => {
              const r = confirmDelete!;
              setConfirmDelete(null);
              setRenders((xs) => xs.filter((x) => x.id !== r.id));
              startTransition(async () => {
                await deleteRender(r.id);
                router.refresh();
              });
              toast("Render deleted");
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
