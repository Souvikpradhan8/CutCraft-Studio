"use client";

import { memo } from "react";
import {
  SlidersHorizontal,
  Sparkles,
  Blend,
  Diamond,
  Info,
  RotateCcw,
  Trash2,
  MousePointerClick,
} from "lucide-react";
import {
  EFFECTS,
  FILTER_PRESETS,
  KEY_PROPS,
  TRANSITIONS,
  keyframeValue,
  setKeyframe,
  type Clip,
  type KeyProp,
} from "@/lib/timeline";
import { cx, formatTimecode } from "@/lib/utils";

export type InspectorTab = "filters" | "effects" | "transitions" | "keyframes" | "details";

const TABS: { id: InspectorTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "filters", label: "Filters", icon: SlidersHorizontal },
  { id: "effects", label: "Effects", icon: Sparkles },
  { id: "transitions", label: "Transitions", icon: Blend },
  { id: "keyframes", label: "Keyframes", icon: Diamond },
  { id: "details", label: "Details", icon: Info },
];

const HUES = [210, 245, 275, 320, 350, 20, 45, 90, 150, 190];

export const Inspector = memo(function Inspector({
  clip,
  tab,
  setTab,
  getTime,
  fps,
  onPatch,
}: {
  clip: Clip | undefined;
  tab: InspectorTab;
  setTab: (t: InspectorTab) => void;
  getTime: () => number;
  fps: number;
  onPatch: (patch: Partial<Clip>) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* tab bar */}
      <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-white/[0.06] px-2 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            title={t.label}
            className={cx(
              "flex flex-col items-center gap-1 rounded-lg px-2.5 py-1.5 text-[9px] font-semibold tracking-wide uppercase transition-all",
              tab === t.id ? "bg-accent-500/15 text-accent-300" : "text-zinc-600 hover:text-zinc-300"
            )}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden xl:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!clip ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MousePointerClick className="h-7 w-7 text-zinc-700" />
            <p className="mt-3 max-w-[190px] text-xs leading-relaxed text-zinc-500">
              Select a clip on the timeline to grade, animate and shape it here.
            </p>
          </div>
        ) : (
          <>
            {tab === "filters" && <FiltersPanel clip={clip} onPatch={onPatch} />}
            {tab === "effects" && <EffectsPanel clip={clip} onPatch={onPatch} />}
            {tab === "transitions" && <TransitionsPanel clip={clip} onPatch={onPatch} />}
            {tab === "keyframes" && <KeyframesPanel clip={clip} getTime={getTime} fps={fps} onPatch={onPatch} />}
            {tab === "details" && <DetailsPanel clip={clip} onPatch={onPatch} />}
          </>
        )}
      </div>

      {clip && (
        <div className="shrink-0 border-t border-white/[0.06] px-4 py-2.5">
          <p className="truncate text-[11px] font-medium text-zinc-400">{clip.name}</p>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
            {clip.duration.toFixed(2)}s · V{clip.track + 1} · {clip.segments.length} segment
            {clip.segments.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
});

/* --------------------------------- filters --------------------------------- */

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="font-mono text-[11px] text-zinc-500">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range"
        style={{ ["--fill" as string]: `${((value - min) / (max - min)) * 100}%` }}
      />
    </div>
  );
}

function FiltersPanel({ clip, onPatch }: { clip: Clip; onPatch: (p: Partial<Clip>) => void }) {
  const f = clip.filter;
  return (
    <div className="space-y-5">
      <div>
        <p className="label">Look presets</p>
        <div className="grid grid-cols-4 gap-1.5">
          {FILTER_PRESETS.map((p) => {
            const active = f.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onPatch({ filter: { ...f, preset: p.id } })}
                className={cx(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-1.5 transition-all",
                  active ? "border-accent-400/60 bg-accent-500/10" : "border-white/[0.07] hover:border-white/20"
                )}
              >
                <span
                  className="h-7 w-full rounded"
                  style={{
                    background: `linear-gradient(135deg, hsl(${(p.h + 210 + 360) % 360} ${Math.round(p.s * 60)}% 48%), hsl(${(p.h + 250 + 360) % 360} ${Math.round(p.s * 55)}% ${Math.round(30 * p.b)}%))`,
                    filter: p.gray ? "grayscale(1)" : p.sepia ? "sepia(.5)" : undefined,
                  }}
                />
                <span className={cx("text-[9px] font-medium", active ? "text-white" : "text-zinc-500")}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="label !mb-0">Adjustments</p>
          <button
            onClick={() => onPatch({ filter: { ...f, brightness: 1, contrast: 1, saturate: 1, hue: 0 } })}
            className="btn btn-ghost !px-1.5 !py-1 text-[10px]"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
        <SliderRow label="Brightness" value={f.brightness} min={0.5} max={1.5} step={0.01} display={`${Math.round(f.brightness * 100)}%`} onChange={(v) => onPatch({ filter: { ...f, brightness: v } })} />
        <SliderRow label="Contrast" value={f.contrast} min={0.5} max={1.5} step={0.01} display={`${Math.round(f.contrast * 100)}%`} onChange={(v) => onPatch({ filter: { ...f, contrast: v } })} />
        <SliderRow label="Saturation" value={f.saturate} min={0} max={2} step={0.01} display={`${Math.round(f.saturate * 100)}%`} onChange={(v) => onPatch({ filter: { ...f, saturate: v } })} />
        <SliderRow label="Hue shift" value={f.hue} min={-60} max={60} step={1} display={`${f.hue > 0 ? "+" : ""}${Math.round(f.hue)}°`} onChange={(v) => onPatch({ filter: { ...f, hue: v } })} />
      </div>
    </div>
  );
}

/* --------------------------------- effects --------------------------------- */

function EffectsPanel({ clip, onPatch }: { clip: Clip; onPatch: (p: Partial<Clip>) => void }) {
  const e = clip.effect;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {EFFECTS.map((fx) => {
          const active = e.type === fx.id;
          return (
            <button
              key={fx.id}
              onClick={() => onPatch({ effect: { ...e, type: fx.id } })}
              className={cx(
                "rounded-xl border p-3 text-left transition-all",
                active ? "border-accent-400/60 bg-accent-500/10" : "border-white/[0.07] hover:border-white/20"
              )}
            >
              <p className={cx("text-[13px] font-semibold", active ? "text-white" : "text-zinc-300")}>{fx.label}</p>
              <p className="mt-0.5 text-[10px] text-zinc-600">{fx.hint}</p>
            </button>
          );
        })}
      </div>
      {e.type !== "none" && (
        <SliderRow
          label="Intensity"
          value={e.intensity}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(e.intensity * 100)}%`}
          onChange={(v) => onPatch({ effect: { ...e, intensity: v } })}
        />
      )}
      <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-zinc-600">
        Effects render live on the preview stage and bake into your master at export.
      </p>
    </div>
  );
}

/* ------------------------------- transitions -------------------------------- */

function TransitionsPanel({ clip, onPatch }: { clip: Clip; onPatch: (p: Partial<Clip>) => void }) {
  const t = clip.transition;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TRANSITIONS.map((tr) => {
          const active = t.type === tr.id;
          return (
            <button
              key={tr.id}
              onClick={() => onPatch({ transition: { ...t, type: tr.id } })}
              className={cx(
                "rounded-xl border px-2 py-2.5 text-center text-[12px] font-semibold transition-all",
                active ? "border-accent-400/60 bg-accent-500/10 text-white" : "border-white/[0.07] text-zinc-400 hover:border-white/20"
              )}
            >
              {tr.label}
            </button>
          );
        })}
      </div>
      {t.type !== "none" && (
        <SliderRow
          label="Duration"
          value={t.duration}
          min={0.2}
          max={2.5}
          step={0.05}
          display={`${t.duration.toFixed(2)}s`}
          onChange={(v) => onPatch({ transition: { ...t, duration: v } })}
        />
      )}
      <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-zinc-600">
        Transitions blend this clip in from the clip directly before it on the same track. A plain cut is used otherwise.
      </p>
    </div>
  );
}

/* -------------------------------- keyframes -------------------------------- */

function KeyframesPanel({
  clip,
  getTime,
  fps,
  onPatch,
}: {
  clip: Clip;
  getTime: () => number;
  fps: number;
  onPatch: (p: Partial<Clip>) => void;
}) {
  const localT = Math.min(Math.max(0, getTime() - clip.start), clip.duration);

  return (
    <div className="space-y-5">
      <p className="flex items-center justify-between text-[11px] text-zinc-500">
        <span>Playhead</span>
        <span className="font-mono text-zinc-400">{formatTimecode(localT, fps)}</span>
      </p>

      <div className="space-y-3">
        {KEY_PROPS.map((prop) => {
          const current = keyframeValue(clip.keyframes, prop.id, localT);
          const existing = clip.keyframes.find((k) => k.prop === prop.id && Math.abs(k.time - localT) < 0.03);
          const propKfs = clip.keyframes.filter((k) => k.prop === prop.id).sort((a, b) => a.time - b.time);
          return (
            <div key={prop.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">{prop.label}</span>
                <button
                  onClick={() => {
                    if (existing) {
                      onPatch({ keyframes: clip.keyframes.filter((k) => k.id !== existing.id) });
                    } else {
                      onPatch({ keyframes: setKeyframe(clip.keyframes, prop.id, localT, current) });
                    }
                  }}
                  title={existing ? "Remove keyframe at playhead" : "Add keyframe at playhead"}
                  className={cx(
                    "flex h-6 w-6 items-center justify-center rounded-md border transition-all",
                    existing
                      ? "border-accent-400 bg-accent-500/20 text-accent-300"
                      : "border-white/10 text-zinc-500 hover:border-accent-400/50 hover:text-accent-300"
                  )}
                >
                  <Diamond className={cx("h-3 w-3", existing && "fill-current")} />
                </button>
              </div>

              {/* marker strip */}
              <div className="relative mt-2.5 h-4 rounded bg-ink-800">
                {propKfs.map((k) => (
                  <span
                    key={k.id}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-accent-400 shadow-[0_0_6px_#7c5cff]"
                    style={{ left: `${(k.time / clip.duration) * 100}%` }}
                  />
                ))}
                <span
                  className="absolute top-0 bottom-0 w-px bg-white/40"
                  style={{ left: `${(localT / clip.duration) * 100}%` }}
                />
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="range"
                  min={prop.min}
                  max={prop.max}
                  step={prop.step}
                  value={current}
                  onChange={(e) => onPatch({ keyframes: setKeyframe(clip.keyframes, prop.id, localT, Number(e.target.value)) })}
                  className="range flex-1"
                  style={{ ["--fill" as string]: `${((current - prop.min) / (prop.max - prop.min)) * 100}%` }}
                />
                <span className="w-14 text-right font-mono text-[11px] text-zinc-400">{prop.format(current)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {clip.keyframes.length > 0 && (
        <div>
          <p className="label">All keyframes ({clip.keyframes.length})</p>
          <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
            {clip.keyframes
              .slice()
              .sort((a, b) => a.time - b.time)
              .map((k) => {
                const meta = KEY_PROPS.find((p) => p.id === k.prop)!;
                return (
                  <div key={k.id} className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-ink-800/60 px-2.5 py-1.5">
                    <Diamond className="h-2.5 w-2.5 fill-accent-400 text-accent-400" />
                    <span className="text-[11px] font-medium text-zinc-300">{meta.label}</span>
                    <span className="font-mono text-[10px] text-zinc-600">{k.time.toFixed(2)}s</span>
                    <span className="ml-auto font-mono text-[10px] text-zinc-400">{meta.format(k.value)}</span>
                    <button
                      onClick={() => onPatch({ keyframes: clip.keyframes.filter((x) => x.id !== k.id) })}
                      className="text-zinc-600 transition-colors hover:text-rose-300"
                      title="Delete keyframe"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {clip.keyframes.length === 0 && (
        <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-zinc-600">
          Move the playhead inside this clip, adjust a value, then hit the diamond to pin a keyframe. Values interpolate smoothly between pins.
        </p>
      )}
    </div>
  );
}

/* --------------------------------- details --------------------------------- */

function DetailsPanel({ clip, onPatch }: { clip: Clip; onPatch: (p: Partial<Clip>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Clip name</label>
        <input
          key={clip.id}
          defaultValue={clip.name}
          onBlur={(e) => e.target.value.trim().length >= 1 && onPatch({ name: e.target.value.trim() })}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="input !py-1.5 text-xs"
        />
      </div>

      <div>
        <label className="label">Track</label>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((tr) => (
            <button
              key={tr}
              onClick={() => onPatch({ track: tr })}
              className={cx(
                "flex-1 rounded-lg border py-1.5 font-mono text-xs transition-all",
                clip.track === tr ? "border-accent-400/60 bg-accent-500/10 text-white" : "border-white/[0.08] text-zinc-500 hover:border-white/20"
              )}
            >
              V{tr + 1}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SliderRow
          label="Start position"
          value={clip.start}
          min={0}
          max={120}
          step={0.05}
          display={`${clip.start.toFixed(2)}s`}
          onChange={(v) => onPatch({ start: Math.round(v * 20) / 20 })}
        />
      </div>

      <div>
        <label className="label">Lane color</label>
        <div className="flex flex-wrap gap-1.5">
          {HUES.map((h) => (
            <button
              key={h}
              onClick={() => onPatch({ hue: h })}
              className={cx(
                "h-6 w-6 rounded-full transition-transform hover:scale-110",
                clip.hue === h && "ring-2 ring-white ring-offset-2 ring-offset-ink-900"
              )}
              style={{ background: `linear-gradient(135deg, hsl(${h} 75% 45%), hsl(${h + 30} 70% 28%))` }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Segment map</p>
        <div className="mt-2 space-y-1">
          {clip.segments.map((s, i) => (
            <p key={i} className="truncate font-mono text-[10px] text-zinc-600">
              [{i + 1}] in {s.in.toFixed(1)}s · {s.duration.toFixed(2)}s — {s.label}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
