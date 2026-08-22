import { clamp, lerp } from "@/lib/utils";

/* ---------------------------------- types ---------------------------------- */

export type KeyProp = "opacity" | "scale" | "x" | "y";
export interface Keyframe {
  id: string;
  time: number; // seconds, relative to clip start
  prop: KeyProp;
  value: number;
}

export interface Segment {
  src: string;
  poster?: string;
  in: number; // source in-point (seconds)
  duration: number;
  label: string;
}

export type EffectType = "none" | "vignette" | "grain" | "glow";
export interface EffectState {
  type: EffectType;
  intensity: number; // 0..1
}

export type TransitionType = "none" | "fade" | "dissolve" | "wipe" | "slide";
export interface TransitionState {
  type: TransitionType;
  duration: number; // seconds
}

export interface FilterState {
  preset: string; // id of FILTER_PRESETS
  brightness: number; // 0.5..1.5
  contrast: number;
  saturate: number;
  hue: number; // -60..60
}

export interface Clip {
  id: string;
  name: string;
  assetId?: string;
  hue: number; // timeline chip color
  track: number; // 0 = V1 (bottom)
  start: number; // timeline position, seconds
  duration: number; // sum of segment durations
  segments: Segment[];
  filter: FilterState;
  effect: EffectState;
  transition: TransitionState;
  keyframes: Keyframe[];
}

export interface TimelineDoc {
  version: 1;
  clips: Clip[];
}

/* --------------------------------- catalog --------------------------------- */

export const FILTER_PRESETS: {
  id: string;
  label: string;
  b: number;
  c: number;
  s: number;
  h: number;
  sepia?: number;
  gray?: number;
}[] = [
  { id: "none", label: "None", b: 1, c: 1, s: 1, h: 0 },
  { id: "cinematic", label: "Cinematic", b: 0.97, c: 1.14, s: 1.18, h: -6 },
  { id: "vintage", label: "Vintage", b: 1.06, c: 0.95, s: 0.85, h: 0, sepia: 0.42 },
  { id: "noir", label: "Noir", b: 0.95, c: 1.24, s: 1, h: 0, gray: 1 },
  { id: "amber", label: "Amber", b: 1.02, c: 1.05, s: 1.26, h: 8, sepia: 0.26 },
  { id: "frost", label: "Frost", b: 1.09, c: 0.98, s: 0.86, h: 12 },
  { id: "faded", label: "Faded", b: 1.13, c: 0.82, s: 0.72, h: 0 },
];

export const EFFECTS: { id: EffectType; label: string; hint: string }[] = [
  { id: "none", label: "None", hint: "Clean image" },
  { id: "vignette", label: "Vignette", hint: "Darkened edges" },
  { id: "grain", label: "Film grain", hint: "Analog texture" },
  { id: "glow", label: "Glow", hint: "Halation bloom" },
];

export const TRANSITIONS: { id: TransitionType; label: string }[] = [
  { id: "none", label: "Cut" },
  { id: "fade", label: "Fade" },
  { id: "dissolve", label: "Dissolve" },
  { id: "wipe", label: "Wipe" },
  { id: "slide", label: "Slide" },
];

export const KEY_PROPS: {
  id: KeyProp;
  label: string;
  min: number;
  max: number;
  step: number;
  def: number;
  format: (v: number) => string;
}[] = [
  { id: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01, def: 1, format: (v) => `${Math.round(v * 100)}%` },
  { id: "scale", label: "Scale", min: 0.5, max: 2, step: 0.01, def: 1, format: (v) => `${Math.round(v * 100)}%` },
  { id: "x", label: "Position X", min: -50, max: 50, step: 0.5, def: 0, format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%` },
  { id: "y", label: "Position Y", min: -50, max: 50, step: 0.5, def: 0, format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%` },
];

/* ---------------------------------- utils ---------------------------------- */

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function emptyDoc(): TimelineDoc {
  return { version: 1, clips: [] };
}

export function clipEnd(c: Clip) {
  return c.start + c.duration;
}

export function totalDuration(doc: TimelineDoc) {
  return doc.clips.reduce((m, c) => Math.max(m, clipEnd(c)), 0);
}

export function clipAt(doc: TimelineDoc, id: string) {
  return doc.clips.find((c) => c.id === id);
}

export function makeClip(input: {
  name: string;
  src: string;
  poster?: string;
  inPoint?: number;
  duration: number;
  start: number;
  track?: number;
  assetId?: string;
  hue?: number;
}): Clip {
  return {
    id: uid(),
    name: input.name,
    assetId: input.assetId,
    hue: input.hue ?? 245,
    track: input.track ?? 0,
    start: input.start,
    duration: input.duration,
    segments: [
      {
        src: input.src,
        poster: input.poster,
        in: input.inPoint ?? 0,
        duration: input.duration,
        label: input.name,
      },
    ],
    filter: { preset: "none", brightness: 1, contrast: 1, saturate: 1, hue: 0 },
    effect: { type: "none", intensity: 0.6 },
    transition: { type: "none", duration: 0.8 },
    keyframes: [],
  };
}

export function resolveSegment(clip: Clip, localT: number): { seg: Segment; sourceTime: number } {
  let acc = 0;
  for (const seg of clip.segments) {
    if (localT < acc + seg.duration || seg === clip.segments[clip.segments.length - 1]) {
      const offset = clamp(localT - acc, 0, seg.duration);
      return { seg, sourceTime: seg.in + offset };
    }
    acc += seg.duration;
  }
  const last = clip.segments[0];
  return { seg: last, sourceTime: last.in };
}

/* ------------------------------- doc mutations ------------------------------ */

export function splitClip(doc: TimelineDoc, clipId: string, atTime: number): { doc: TimelineDoc; rightId: string } | null {
  const clip = clipAt(doc, clipId);
  if (!clip) return null;
  const lt = atTime - clip.start;
  if (lt <= 0.05 || lt >= clip.duration - 0.05) return null;

  // walk segments to find split point
  let acc = 0;
  let idx = 0;
  let splitIn = 0;
  for (let i = 0; i < clip.segments.length; i++) {
    const seg = clip.segments[i];
    if (lt < acc + seg.duration) {
      idx = i;
      splitIn = lt - acc;
      break;
    }
    acc += seg.duration;
  }
  const seg = clip.segments[idx];
  const leftSegs: Segment[] = [
    ...clip.segments.slice(0, idx),
    { ...seg, duration: splitIn },
  ];
  const rightSegs: Segment[] = [
    { ...seg, in: seg.in + splitIn, duration: seg.duration - splitIn },
    ...clip.segments.slice(idx + 1),
  ];

  const left: Clip = {
    ...clip,
    duration: lt,
    segments: leftSegs.filter((s) => s.duration > 0.01),
    keyframes: clip.keyframes.filter((k) => k.time <= lt),
  };
  const right: Clip = {
    ...clip,
    id: uid(),
    name: `${clip.name} (2)`,
    start: atTime,
    duration: clip.duration - lt,
    segments: rightSegs.filter((s) => s.duration > 0.01),
    transition: { type: "none", duration: 0.8 },
    keyframes: clip.keyframes
      .filter((k) => k.time > lt)
      .map((k) => ({ ...k, id: uid(), time: k.time - lt })),
  };

  const clips = doc.clips.map((c) => (c.id === clipId ? left : c)).concat(right);
  return { doc: { ...doc, clips }, rightId: right.id };
}

export function mergeClips(doc: TimelineDoc, ids: string[]): { doc: TimelineDoc; mergedId: string } | null {
  if (ids.length < 2) return null;
  const targets = doc.clips.filter((c) => ids.includes(c.id)).sort((a, b) => a.start - b.start);
  if (targets.length < 2) return null;
  const track = targets[0].track;
  if (targets.some((c) => c.track !== track)) return null;

  const first = targets[0];
  let offset = 0;
  const keyframes: Keyframe[] = [];
  const segments: Segment[] = [];
  for (const c of targets) {
    for (const k of c.keyframes) keyframes.push({ ...k, id: uid(), time: k.time + offset });
    for (const s of c.segments) segments.push({ ...s });
    offset += c.duration;
  }
  const merged: Clip = {
    ...first,
    id: uid(),
    name: `${first.name} +${targets.length - 1}`,
    start: first.start,
    duration: offset,
    segments,
    keyframes,
  };
  return { doc: { ...doc, clips: doc.clips.filter((c) => !ids.includes(c.id)).concat(merged) }, mergedId: merged.id };
}

export function duplicateClip(doc: TimelineDoc, id: string): { doc: TimelineDoc; newId: string } | null {
  const clip = clipAt(doc, id);
  if (!clip) return null;
  const copy: Clip = {
    ...clip,
    id: uid(),
    name: `${clip.name} copy`,
    start: clipEnd(clip) + 0.001,
    keyframes: clip.keyframes.map((k) => ({ ...k, id: uid() })),
  };
  return { doc: { ...doc, clips: [...doc.clips, copy] }, newId: copy.id };
}

export function deleteClips(doc: TimelineDoc, ids: string[]): TimelineDoc {
  return { ...doc, clips: doc.clips.filter((c) => !ids.includes(c.id)) };
}

export function updateClip(doc: TimelineDoc, id: string, patch: Partial<Clip>): TimelineDoc {
  return { ...doc, clips: doc.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

/** clip that ends exactly where `clip` begins on the same track */
export function previousClip(doc: TimelineDoc, clip: Clip): Clip | undefined {
  let best: Clip | undefined;
  for (const c of doc.clips) {
    if (c.track !== clip.track || c.id === clip.id) continue;
    const end = clipEnd(c);
    if (Math.abs(end - clip.start) < 0.05) {
      if (!best || clipEnd(best) < end) best = c;
    }
  }
  return best;
}

/* --------------------------------- keyframes -------------------------------- */

export function keyframeValue(kfs: Keyframe[], prop: KeyProp, t: number): number {
  const meta = KEY_PROPS.find((p) => p.id === prop)!;
  const list = kfs.filter((k) => k.prop === prop).sort((a, b) => a.time - b.time);
  if (list.length === 0) return meta.def;
  if (t <= list[0].time) return list[0].value;
  if (t >= list[list.length - 1].time) return list[list.length - 1].value;
  for (let i = 0; i < list.length - 1; i++) {
    const a = list[i];
    const b = list[i + 1];
    if (t >= a.time && t <= b.time) {
      const span = b.time - a.time || 1;
      return lerp(a.value, b.value, (t - a.time) / span);
    }
  }
  return meta.def;
}

export function setKeyframe(kfs: Keyframe[], prop: KeyProp, time: number, value: number): Keyframe[] {
  const EPS = 0.03;
  const existing = kfs.find((k) => k.prop === prop && Math.abs(k.time - time) < EPS);
  if (existing) return kfs.map((k) => (k.id === existing.id ? { ...k, value, time } : k));
  return [...kfs, { id: uid(), prop, time, value }];
}

/* --------------------------------- rendering -------------------------------- */

export function filterCss(f: FilterState): string {
  const p = FILTER_PRESETS.find((x) => x.id === f.preset) ?? FILTER_PRESETS[0];
  const parts = [
    `brightness(${(p.b * f.brightness).toFixed(3)})`,
    `contrast(${(p.c * f.contrast).toFixed(3)})`,
    `saturate(${(p.s * f.saturate).toFixed(3)})`,
    `hue-rotate(${(p.h + f.hue).toFixed(1)}deg)`,
  ];
  if (p.sepia) parts.push(`sepia(${p.sepia})`);
  if (p.gray) parts.push(`grayscale(${p.gray})`);
  return parts.join(" ");
}

export function isValidDoc(d: unknown): d is TimelineDoc {
  return (
    typeof d === "object" &&
    d !== null &&
    (d as TimelineDoc).version === 1 &&
    Array.isArray((d as TimelineDoc).clips)
  );
}

export function safeDoc(d: unknown): TimelineDoc {
  return isValidDoc(d) ? d : emptyDoc();
}
