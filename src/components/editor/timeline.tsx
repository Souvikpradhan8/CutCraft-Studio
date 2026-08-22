"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Scissors,
  Merge,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Blend,
  Diamond,
  MousePointer2,
} from "lucide-react";
import { clipEnd, type Clip, type TimelineDoc } from "@/lib/timeline";
import { clamp, cx, formatDuration } from "@/lib/utils";

const TRACK_ORDER = [2, 1, 0]; // V3 top … V1 bottom
const TRACK_H = 58;
const MIN_CLIP = 0.4;

interface DragState {
  kind: "move" | "trim-l" | "trim-r";
  clipId: string;
  basis: TimelineDoc;
  startX: number;
  startTrack: number;
}

export function Timeline({
  doc,
  time,
  total,
  pps,
  selectedIds,
  fps,
  canSplit,
  canMerge,
  hasSelection,
  onSeek,
  onSelect,
  onSnapshot,
  onLiveDoc,
  onSplit,
  onMerge,
  onDuplicate,
  onDelete,
  onZoom,
}: {
  doc: TimelineDoc;
  time: number;
  total: number;
  pps: number;
  selectedIds: string[];
  fps: number;
  canSplit: boolean;
  canMerge: boolean;
  hasSelection: boolean;
  onSeek: (t: number) => void;
  onSelect: (ids: string[], additive?: boolean) => void;
  onSnapshot: () => void;
  onLiveDoc: (d: TimelineDoc) => void;
  onSplit: () => void;
  onMerge: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onZoom: (v: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const contentW = Math.max((total + 8) * pps, scrollRef.current?.clientWidth ?? 800);

  const tickStep = useMemo(() => {
    const steps = [0.5, 1, 2, 5, 10, 15, 30, 60];
    return steps.find((s) => s * pps >= 52) ?? 60;
  }, [pps]);

  /* ------------------------------ clip dragging ----------------------------- */

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dt = (e.clientX - drag.startX) / pps;
      const basis = drag.basis;
      const next: TimelineDoc = {
        ...basis,
        clips: basis.clips.map((c) => {
          if (c.id !== drag.clipId) return c;
          if (drag.kind === "move") {
            return { ...c, start: Math.max(0, Math.round((c.start + dt) * 20) / 20) };
          }
          if (drag.kind === "trim-r") {
            const duration = clamp(Math.round((c.duration + dt) * 20) / 20, MIN_CLIP, c.duration + dt + 60);
            const segs = c.segments.slice();
            const li = segs.length - 1;
            const delta = duration - c.duration;
            segs[li] = { ...segs[li], duration: Math.max(MIN_CLIP, segs[li].duration + delta) };
            return { ...c, duration, segments: segs };
          }
          // trim-l
          const d = clamp(dt, -c.start, c.duration - MIN_CLIP);
          const rounded = Math.round(d * 20) / 20;
          const segs = c.segments.slice();
          segs[0] = { ...segs[0], in: Math.max(0, segs[0].in + rounded), duration: segs[0].duration - rounded };
          if (segs[0].duration < 0.01) segs.splice(0, 1);
          return { ...c, start: c.start + rounded, duration: c.duration - rounded, segments: segs };
        }),
      };
      onLiveDoc(next);
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pps, onLiveDoc]);

  const beginDrag = (e: React.PointerEvent, clip: Clip, kind: DragState["kind"]) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect([clip.id], e.metaKey || e.ctrlKey || e.shiftKey);
    onSnapshot();
    dragRef.current = { kind, clipId: clip.id, basis: doc, startX: e.clientX, startTrack: clip.track };
    document.body.style.cursor = kind === "move" ? "grabbing" : "col-resize";
  };

  /* --------------------------------- ruler ---------------------------------- */

  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const toTime = (clientX: number) => clamp((clientX - rect.left) / pps, 0, Math.max(total, 1));
    onSeek(toTime(e.clientX));
    const move = (ev: PointerEvent) => onSeek(toTime(ev.clientX));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let t = 0; t <= total + 8; t += tickStep) out.push(t);
    return out;
  }, [total, tickStep]);

  const fit = () => {
    const w = scrollRef.current?.clientWidth ?? 800;
    onZoom(clamp((w - 32) / Math.max(total, 5), 6, 120));
  };

  /* --------------------------------- render --------------------------------- */

  return (
    <div className="flex h-[248px] shrink-0 flex-col border-t border-white/[0.06] bg-ink-900/40">
      {/* toolbar */}
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-white/[0.06] px-3">
        <MousePointer2 className="mr-1 h-3.5 w-3.5 text-zinc-600" />
        <ToolButton icon={Scissors} label="Split" hint="S" onClick={onSplit} disabled={!canSplit} />
        <ToolButton icon={Merge} label="Merge" hint="M" onClick={onMerge} disabled={!canMerge} />
        <ToolButton icon={Copy} label="Duplicate" onClick={onDuplicate} disabled={!hasSelection} />
        <ToolButton icon={Trash2} label="Delete" hint="Del" onClick={onDelete} disabled={!hasSelection} danger />
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => onZoom(clamp(pps - 10, 6, 140))} className="btn btn-ghost btn-icon" title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min={6}
            max={140}
            value={pps}
            onChange={(e) => onZoom(Number(e.target.value))}
            className="range w-28"
            style={{ ["--fill" as string]: `${((pps - 6) / 134) * 100}%` }}
            aria-label="Timeline zoom"
          />
          <button onClick={() => onZoom(clamp(pps + 10, 6, 140))} className="btn btn-ghost btn-icon" title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button onClick={fit} className="btn btn-ghost btn-icon" title="Fit timeline">
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* scroll area */}
      <div ref={scrollRef} className="relative flex-1 overflow-x-auto overflow-y-hidden">
        <div className="relative h-full" style={{ width: contentW }}>
          {/* ruler */}
          <div className="relative h-6 cursor-text border-b border-white/[0.06] bg-ink-900/70 select-none" onPointerDown={scrub}>
            {ticks.map((t) => (
              <div key={t} className="absolute top-0 bottom-0" style={{ left: t * pps }}>
                <span className="absolute bottom-0 h-2 w-px bg-white/20" />
                <span className="absolute bottom-2 left-1 font-mono text-[9px] text-zinc-500">
                  {formatRuler(t)}
                </span>
              </div>
            ))}
          </div>

          {/* tracks */}
          <div className="relative">
            {doc.clips.length === 0 && (
              <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-8 text-center">
                <Scissors className="h-5 w-5 text-zinc-700" />
                <p className="mt-2 text-xs text-zinc-600">
                  Your timeline awaits — click a clip in the media bin to drop it here.
                </p>
              </div>
            )}
            {TRACK_ORDER.map((track) => (
              <div
                key={track}
                className="relative border-b border-white/[0.04]"
                style={{ height: TRACK_H }}
              >
                <span className="absolute top-1 left-1 z-0 font-mono text-[9px] font-semibold tracking-wider text-zinc-700">
                  V{track + 1}
                </span>
              </div>
            ))}

            {/* clips (rendered above lanes, positioned absolutely across tracks) */}
            {doc.clips.map((clip) => {
              const selected = selectedIds.includes(clip.id);
              const top = TRACK_ORDER.indexOf(clip.track) * TRACK_H + 4;
              return (
                <div
                  key={clip.id}
                  onPointerDown={(e) => beginDrag(e, clip, "move")}
                  onDoubleClick={() => {
                    const t = time;
                    if (t > clip.start + 0.05 && t < clipEnd(clip) - 0.05) onSplit();
                  }}
                  className={cx(
                    "group absolute z-10 cursor-grab overflow-hidden rounded-md border transition-shadow active:cursor-grabbing",
                    selected
                      ? "border-accent-300 shadow-[0_0_0_1.5px_#a98fff,0_6px_20px_-6px_#7c5cff99]"
                      : "border-white/15 hover:border-white/30"
                  )}
                  style={{
                    left: clip.start * pps,
                    width: Math.max(14, clip.duration * pps),
                    top,
                    height: TRACK_H - 8,
                    background: `linear-gradient(120deg, hsl(${clip.hue} 72% 36% / 0.92), hsl(${clip.hue + 32} 68% 20% / 0.95))`,
                  }}
                >
                  {clip.segments[0]?.poster && (
                    <img
                      src={clip.segments[0].poster}
                      alt=""
                      draggable={false}
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
                    />
                  )}
                  {/* merged segment seams */}
                  {clip.segments.length > 1 &&
                    clip.segments.slice(0, -1).map((s, i) => {
                      const off = clip.segments.slice(0, i + 1).reduce((a, x) => a + x.duration, 0);
                      return (
                        <span key={i} className="absolute top-0 bottom-0 w-px bg-white/40" style={{ left: off * pps }} />
                      );
                    })}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
                  <div className="pointer-events-none absolute inset-x-1.5 top-1 flex items-center gap-1">
                    <span className="truncate text-[10px] font-medium text-white/95 drop-shadow">
                      {clip.name}
                    </span>
                  </div>
                  <div className="pointer-events-none absolute bottom-1 left-1.5 flex items-center gap-1.5 text-white/80">
                    <span className="font-mono text-[9px]">{formatDuration(clip.duration)}</span>
                    {clip.transition.type !== "none" && <Blend className="h-2.5 w-2.5" />}
                    {clip.keyframes.length > 0 && <Diamond className="h-2.5 w-2.5 fill-current" />}
                    {clip.filter.preset !== "none" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#67e8f9]" />
                    )}
                  </div>
                  {/* trim handles */}
                  <div
                    onPointerDown={(e) => beginDrag(e, clip, "trim-l")}
                    className="absolute top-0 bottom-0 left-0 w-2.5 cursor-col-resize border-white/50 opacity-0 transition-opacity group-hover:border-l-2 group-hover:opacity-100"
                  />
                  <div
                    onPointerDown={(e) => beginDrag(e, clip, "trim-r")}
                    className="absolute top-0 right-0 bottom-0 w-2.5 cursor-col-resize border-white/50 opacity-0 transition-opacity group-hover:border-r-2 group-hover:opacity-100"
                  />
                </div>
              );
            })}

            {/* playhead */}
            <div
              className="pointer-events-none absolute top-0 z-20"
              style={{ left: time * pps, height: TRACK_H * 3, transform: "translateX(-0.5px)" }}
            >
              <div className="absolute top-0 bottom-0 w-px bg-accent-400 shadow-[0_0_8px_#7c5cff]" />
              <div className="absolute -top-0.5 -left-[5px] h-2.5 w-2.5 rotate-45 rounded-[2px] bg-accent-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  hint,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={hint ? `${label} (${hint})` : label}
      className={cx(
        "btn !px-2 !py-1.5 text-xs",
        danger ? "btn-ghost hover:!bg-rose-500/10 hover:!text-rose-300" : "btn-ghost"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function formatRuler(t: number) {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(Math.round(s)).padStart(2, "0")}`;
}
