"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Clapperboard } from "lucide-react";
import {
  clipEnd,
  filterCss,
  keyframeValue,
  previousClip,
  resolveSegment,
  type Clip,
  type Segment,
  type TimelineDoc,
} from "@/lib/timeline";
import { clamp, formatTimecode } from "@/lib/utils";

interface Layer {
  clip: Clip;
  localT: number;
  sourceTime: number;
  seg: Segment;
  opacity: number;
  transform: string;
  filter: string;
  clipPath?: string;
  z: number;
  under?: boolean;
}

function styleFor(clip: Clip, localT: number): Pick<Layer, "opacity" | "transform" | "filter"> {
  const o = clamp(keyframeValue(clip.keyframes, "opacity", localT), 0, 1);
  const s = keyframeValue(clip.keyframes, "scale", localT);
  const x = keyframeValue(clip.keyframes, "x", localT);
  const y = keyframeValue(clip.keyframes, "y", localT);
  let filter = filterCss(clip.filter);
  if (clip.effect.type === "glow") {
    filter += ` drop-shadow(0 0 ${Math.round(clip.effect.intensity * 46)}px hsl(${clip.hue} 90% 68% / ${(clip.effect.intensity * 0.85).toFixed(2)}))`;
  }
  return {
    opacity: o,
    transform: `translate(${x}%, ${y}%) scale(${s})`,
    filter,
  };
}

function computeLayers(doc: TimelineDoc, time: number): Layer[] {
  const layers: Layer[] = [];
  const sorted = doc.clips.slice().sort((a, b) => a.track - b.track || a.start - b.start);

  for (const clip of sorted) {
    const localT = time - clip.start;
    const inRange = localT >= 0 && localT < clip.duration;
    const prev = previousClip(doc, clip);
    const tDur = clip.transition.type !== "none" && prev ? Math.max(0.05, clip.transition.duration) : 0;
    const inTransition = inRange && tDur > 0 && localT <= tDur;

    if (prev && inTransition) {
      const pl = Math.max(0, prev.duration - 1 / 30);
      const rs = resolveSegment(prev, pl);
      layers.push({
        clip: prev,
        localT: pl,
        sourceTime: rs.sourceTime,
        seg: rs.seg,
        z: prev.track * 10 + 1,
        under: true,
        ...styleFor(prev, pl),
      });
    }

    if (!inRange) continue;
    const rs = resolveSegment(clip, localT);
    const base = styleFor(clip, localT);
    const layer: Layer = {
      clip,
      localT,
      sourceTime: rs.sourceTime,
      seg: rs.seg,
      z: clip.track * 10 + 5,
      ...base,
    };

    if (inTransition) {
      const p = clamp(localT / tDur, 0, 1);
      switch (clip.transition.type) {
        case "fade":
        case "dissolve":
          layer.opacity *= p;
          if (clip.transition.type === "dissolve") layer.filter += ` blur(${((1 - p) * 12).toFixed(1)}px)`;
          break;
        case "wipe":
          layer.clipPath = `inset(0 ${((1 - p) * 100).toFixed(1)}% 0 0)`;
          break;
        case "slide":
          layer.transform = `translateX(${((1 - p) * 100).toFixed(1)}%) ` + layer.transform;
          break;
      }
    }
    layers.push(layer);
  }
  return layers;
}

export function Preview({
  doc,
  time,
  playing,
  fps,
  onTogglePlay,
  onSeek,
}: {
  doc: TimelineDoc;
  time: number;
  playing: boolean;
  fps: number;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
}) {
  const total = useMemo(() => doc.clips.reduce((m, c) => Math.max(m, clipEnd(c)), 0), [doc]);
  const layers = useMemo(() => computeLayers(doc, time), [doc, time]);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 960, h: 540 });

  /* measure stage area, keep 16:9 */
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const availW = Math.max(120, r.width - 8);
      const availH = Math.max(80, r.height - 8);
      let w = availW;
      let h = (w * 9) / 16;
      if (h > availH) {
        h = availH;
        w = (h * 16) / 9;
      }
      setSize({ w: Math.floor(w), h: Math.floor(h) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* sync video elements to the playhead */
  useEffect(() => {
    for (const [id, el] of videoRefs.current) {
      const layer = layers.find((l) => l.clip.id === id);
      if (!layer) {
        if (!el.paused) el.pause();
        continue;
      }
      const desired = layer.sourceTime;
      if (playing) {
        if (el.paused) {
          el.currentTime = desired;
          void el.play().catch(() => {});
        } else if (Math.abs(el.currentTime - desired) > 0.35) {
          el.currentTime = desired;
        }
      } else {
        if (!el.paused) el.pause();
        if (Math.abs(el.currentTime - desired) > 0.04) el.currentTime = desired;
      }
    }
  }, [layers, playing]);

  const topClip = layers.filter((l) => !l.under).sort((a, b) => b.z - a.z)[0]?.clip;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ink-950">
      <div ref={boxRef} className="noise-bg relative flex min-h-0 flex-1 items-center justify-center p-2">
        <div
          className="relative overflow-hidden rounded-lg bg-black shadow-[0_0_0_1px_#ffffff14,0_30px_80px_-30px_#000]"
          style={{ width: size.w, height: size.h }}
        >
          {layers.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-700">
              <Clapperboard className="h-9 w-9" />
              <p className="text-xs font-medium tracking-wide">
                {doc.clips.length === 0
                  ? "Timeline is empty — add clips from the media bin"
                  : "Move the playhead over your clips to preview"}
              </p>
            </div>
          ) : (
            layers.map((l) => (
              <div
                key={`${l.clip.id}-${l.under ? "u" : "m"}`}
                className="absolute inset-0"
                style={{
                  zIndex: l.z,
                  opacity: l.opacity,
                  transform: l.transform,
                  filter: l.filter,
                  clipPath: l.clipPath,
                }}
              >
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(l.clip.id, el);
                    else videoRefs.current.delete(l.clip.id);
                  }}
                  src={l.seg.src}
                  poster={l.seg.poster}
                  muted
                  playsInline
                  preload="auto"
                  className="h-full w-full object-cover"
                />
                {l.clip.effect.type === "vignette" && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: "radial-gradient(ellipse at center, transparent 46%, rgba(0,0,0,0.9) 130%)",
                      opacity: l.clip.effect.intensity,
                    }}
                  />
                )}
                {l.clip.effect.type === "grain" && (
                  <div className="effect-grain pointer-events-none absolute -inset-[10%]" style={{ opacity: l.clip.effect.intensity * 0.7 }} />
                )}
              </div>
            ))
          )}

          {/* letter box sheen + active clip badge */}
          {topClip && (
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-40 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-3 py-2">
              <span className="truncate text-[11px] font-medium text-white/70">{topClip.name}</span>
              {topClip.filter.preset !== "none" && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white/80 uppercase backdrop-blur">
                  {topClip.filter.preset}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* transport */}
      <div className="flex shrink-0 items-center justify-center gap-2 bg-ink-950/60 px-4 py-2">
        <button onClick={() => onSeek(0)} className="btn btn-ghost btn-icon" title="Go to start">
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          onClick={onTogglePlay}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-950 shadow-[0_0_24px_-4px_#ffffff66] transition-transform hover:scale-105"
          title="Play / Pause (Space)"
        >
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
        </button>
        <button onClick={() => onSeek(total)} className="btn btn-ghost btn-icon" title="Go to end">
          <SkipForward className="h-4 w-4" />
        </button>
        <span className="ml-3 w-40 font-mono text-xs text-zinc-400 tabular-nums">
          {formatTimecode(time, fps)}
          <span className="text-zinc-700"> / {formatTimecode(total, fps)}</span>
        </span>
      </div>
    </div>
  );
}
