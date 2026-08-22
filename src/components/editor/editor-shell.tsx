"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Undo2,
  Redo2,
  Zap,
  Check,
  Loader2,
  Repeat,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import type { MediaAsset } from "@/db/schema";
import {
  clipEnd,
  deleteClips,
  duplicateClip,
  makeClip,
  mergeClips,
  splitClip,
  totalDuration,
  updateClip,
  type Clip,
  type TimelineDoc,
} from "@/lib/timeline";
import { saveTimeline, updateProjectMeta } from "@/app/actions/projects";
import { cx, formatTimecode } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { Preview } from "./preview";
import { Timeline } from "./timeline";
import { Inspector, type InspectorTab } from "./inspector";
import { MediaBin } from "./media-bin";
import { RenderDialog } from "./render-dialog";

export interface ShellProject {
  id: string;
  name: string;
  status: string;
  resolution: string;
  fps: number;
}

type SaveState = "saved" | "dirty" | "saving";

export function EditorShell({
  project,
  initialDoc,
  assets,
}: {
  project: ShellProject;
  initialDoc: TimelineDoc;
  assets: MediaAsset[];
}) {
  const { toast } = useToast();
  const [doc, setDoc] = useState<TimelineDoc>(initialDoc);
  const [selected, setSelected] = useState<string[]>([]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pps, setPps] = useState(40);
  const [tab, setTab] = useState<InspectorTab>("filters");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [renderOpen, setRenderOpen] = useState(false);
  const [loop, setLoop] = useState(false);
  const [name, setName] = useState(project.name);
  const [binOpen, setBinOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const [past, setPast] = useState<TimelineDoc[]>([]);
  const [future, setFuture] = useState<TimelineDoc[]>([]);

  const docRef = useRef(doc);
  docRef.current = doc;
  const timeRef = useRef(time);
  timeRef.current = time;
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const total = useMemo(() => totalDuration(doc), [doc]);
  const totalRef = useRef(total);
  totalRef.current = total;

  const getTime = useCallback(() => timeRef.current, []);

  /* ------------------------------ doc mutations ----------------------------- */

  const snapshot = useCallback(() => {
    setPast((p) => [...p.slice(-39), docRef.current]);
    setFuture([]);
  }, []);

  const commitDoc = useCallback(
    (next: TimelineDoc) => {
      snapshot();
      setDoc(next);
    },
    [snapshot]
  );

  const setLiveDoc = useCallback((next: TimelineDoc) => {
    setDoc(next);
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [docRef.current, ...f.slice(0, 19)]);
      setDoc(prev);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const [next, ...rest] = f;
      setPast((p) => [...p.slice(-39), docRef.current]);
      setDoc(next);
      return rest;
    });
  }, []);

  /* -------------------------------- selection ------------------------------- */

  const select = useCallback((ids: string[], additive = false) => {
    setSelected((sel) => {
      if (!additive) return ids;
      const set = new Set(sel);
      for (const id of ids) {
        if (set.has(id)) set.delete(id);
        else set.add(id);
      }
      return Array.from(set);
    });
  }, []);

  const primaryClip = useMemo(
    () => doc.clips.find((c) => c.id === selected[selected.length - 1]),
    [doc, selected]
  );

  /* ------------------------------- operations ------------------------------- */

  const splitAtPlayhead = useCallback(() => {
    const t = timeRef.current;
    const d = docRef.current;
    const under = d.clips
      .filter((c) => t > c.start + 0.05 && t < clipEnd(c) - 0.05)
      .sort((a, b) => b.track - a.track);
    if (under.length === 0) {
      toast("Move the playhead over a clip to split", "info");
      return;
    }
    const selectedUnder = under.filter((c) => selected.includes(c.id));
    const target = selectedUnder[0] ?? under[0];
    snapshot();
    const res = splitClip(d, target.id, t);
    if (!res) return;
    setDoc(res.doc);
    setSelected([res.rightId]);
  }, [selected, snapshot, toast]);

  const mergeSelected = useCallback(() => {
    const res = mergeClips(docRef.current, selected);
    if (!res) {
      toast("Select 2+ clips on the same track to merge", "info");
      return;
    }
    snapshot();
    setDoc(res.doc);
    setSelected([res.mergedId]);
    toast("Clips merged into one segment block");
  }, [selected, snapshot, toast]);

  const duplicateSelected = useCallback(() => {
    if (selected.length === 0) return;
    let d = docRef.current;
    const newIds: string[] = [];
    snapshot();
    for (const id of selected) {
      const res = duplicateClip(d, id);
      if (res) {
        d = res.doc;
        newIds.push(res.newId);
      }
    }
    setDoc(d);
    setSelected(newIds);
  }, [selected, snapshot]);

  const deleteSelected = useCallback(() => {
    if (selected.length === 0) return;
    snapshot();
    setDoc(deleteClips(docRef.current, selected));
    setSelected([]);
  }, [selected, snapshot]);

  const patchClipCb = useCallback(
    (id: string, patch: Partial<Clip>) => {
      commitDoc(updateClip(docRef.current, id, patch));
    },
    [commitDoc]
  );

  const addAsset = useCallback(
    (asset: MediaAsset, at?: number) => {
      const d = docRef.current;
      const trackEnd = d.clips.filter((c) => c.track === 0).reduce((m, c) => Math.max(m, clipEnd(c)), 0);
      const duration = Math.min(asset.durationSec, 8);
      const clip = makeClip({
        name: asset.name,
        src: asset.src,
        poster: aPoster(asset),
        duration,
        start: at !== undefined ? at : trackEnd,
        track: 0,
        assetId: asset.id,
        hue: asset.hue,
      });
      commitDoc({ ...d, clips: [...d.clips, clip] });
      setSelected([clip.id]);
      return clip;
    },
    [commitDoc]
  );

  /* -------------------------------- playback -------------------------------- */

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      acc += dt;
      if (acc >= 1 / 30) {
        let t = timeRef.current + acc;
        acc = 0;
        if (t >= totalRef.current) {
          if (loopRef.current) {
            t = 0;
          } else {
            setTime(totalRef.current);
            setPlaying(false);
            return;
          }
        }
        setTime(t);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const seek = useCallback((t: number) => {
    setTime(Math.max(0, Math.min(t, totalRef.current || t)));
  }, []);

  /* -------------------------------- autosave -------------------------------- */

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setSaveState("dirty");
    const t = setTimeout(async () => {
      setSaveState("saving");
      try {
        await saveTimeline(project.id, docRef.current);
        setSaveState("saved");
      } catch {
        setSaveState("dirty");
      }
    }, 900);
    return () => clearTimeout(t);
  }, [doc, project.id]);

  /* -------------------------------- shortcuts ------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod) return;
      if (e.key === " ") {
        e.preventDefault();
        if (!playingRef.current && timeRef.current >= totalRef.current - 0.01) setTime(0);
        setPlaying((p) => !p);
      } else if (e.key.toLowerCase() === "s") {
        splitAtPlayhead();
      } else if (e.key.toLowerCase() === "m") {
        mergeSelected();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      } else if (e.key === "Escape") {
        setSelected([]);
      } else if (e.key === "ArrowLeft") {
        seek(timeRef.current - (e.shiftKey ? 1 : 1 / project.fps));
      } else if (e.key === "ArrowRight") {
        seek(timeRef.current + (e.shiftKey ? 1 : 1 / project.fps));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, splitAtPlayhead, mergeSelected, deleteSelected, seek, project.fps]);

  /* --------------------------------- render --------------------------------- */

  const saveChip =
    saveState === "saving" ? (
      <span className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
      </span>
    ) : saveState === "dirty" ? (
      <span className="flex items-center gap-1.5 text-xs text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" style={{ animation: "pulse-dot 1.2s infinite" }} /> Unsaved
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-xs text-emerald-300">
        <Check className="h-3.5 w-3.5" /> Saved
      </span>
    );

  const canMerge = useMemo(() => {
    if (selected.length < 2) return false;
    const targets = doc.clips.filter((c) => selected.includes(c.id));
    return targets.length >= 2 && targets.every((c) => c.track === targets[0].track);
  }, [doc, selected]);

  const canSplit = useMemo(
    () => doc.clips.some((c) => time > c.start + 0.05 && time < clipEnd(c) - 0.05),
    [doc, time]
  );

  return (
    <div className="flex h-screen flex-col bg-ink-950">
      {/* top bar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-ink-900/80 px-4 py-2.5 backdrop-blur">
        <Link href="/projects" className="btn btn-ghost btn-icon" title="Back to projects">
          <ChevronLeft className="h-4.5 w-4.5" />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim().length >= 2 && name.trim() !== project.name) {
                void updateProjectMeta(project.id, { name: name.trim() });
                toast("Project renamed");
              } else setName(project.name);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-full max-w-[280px] truncate rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-sm font-semibold text-white transition-colors hover:border-white/10 focus:border-accent-500/50 focus:outline-none"
          />
          <span className="chip hidden font-mono sm:inline-flex">
            {project.resolution.split(" ")[0]} · {project.fps}fps
          </span>
          {saveChip}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={past.length === 0} className="btn btn-ghost btn-icon" title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={redo} disabled={future.length === 0} className="btn btn-ghost btn-icon" title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <button
            onClick={() => setLoop((v) => !v)}
            className={cx("btn btn-icon", loop ? "text-accent-300" : "btn-ghost")}
            title="Loop playback"
          >
            <Repeat className="h-4 w-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <button onClick={() => setBinOpen((v) => !v)} className="btn btn-ghost btn-icon hidden md:inline-flex" title="Toggle media bin">
            {binOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
          <button onClick={() => setInspectorOpen((v) => !v)} className="btn btn-ghost btn-icon hidden md:inline-flex" title="Toggle inspector">
            {inspectorOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>
          <button onClick={() => setRenderOpen(true)} className="btn btn-primary ml-1.5">
            <Zap className="h-4 w-4" /> Render
          </button>
        </div>
      </header>

      {/* work area */}
      <div className="flex min-h-0 flex-1">
        {binOpen && (
          <aside className="hidden w-[230px] shrink-0 border-r border-white/[0.06] bg-ink-900/50 md:block">
            <MediaBin assets={assets} onAppend={(a) => addAsset(a)} onInsert={(a) => addAsset(a, timeRef.current)} />
          </aside>
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          <Preview
            doc={doc}
            time={time}
            playing={playing}
            fps={project.fps}
            onTogglePlay={() => {
              if (!playing && time >= total - 0.01) setTime(0);
              setPlaying((p) => !p);
            }}
            onSeek={seek}
          />

          <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] bg-ink-900/60 px-4 py-1.5">
            <span className="font-mono text-[11px] text-zinc-500">
              {doc.clips.length} clip{doc.clips.length === 1 ? "" : "s"} · {selected.length} selected
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              {formatTimecode(time, project.fps)} <span className="text-zinc-700">/</span> {formatTimecode(total, project.fps)}
            </span>
          </div>

          <Timeline
            doc={doc}
            time={time}
            total={total}
            pps={pps}
            selectedIds={selected}
            fps={project.fps}
            canSplit={canSplit}
            canMerge={canMerge}
            hasSelection={selected.length > 0}
            onSeek={seek}
            onSelect={select}
            onSnapshot={snapshot}
            onLiveDoc={setLiveDoc}
            onSplit={splitAtPlayhead}
            onMerge={mergeSelected}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
            onZoom={setPps}
          />
        </section>

        {inspectorOpen && (
          <aside className="hidden w-[300px] shrink-0 border-l border-white/[0.06] bg-ink-900/50 md:block">
            <Inspector
              clip={primaryClip}
              tab={tab}
              setTab={setTab}
              getTime={getTime}
              fps={project.fps}
              onPatch={(patch) => primaryClip && patchClipCb(primaryClip.id, patch)}
            />
          </aside>
        )}
      </div>

      <RenderDialog
        open={renderOpen}
        onClose={() => setRenderOpen(false)}
        projectId={project.id}
        projectName={project.name}
        durationSec={Math.max(4, total)}
      />
    </div>
  );
}

function aPoster(a: MediaAsset): string | undefined {
  return a.poster ?? undefined;
}
