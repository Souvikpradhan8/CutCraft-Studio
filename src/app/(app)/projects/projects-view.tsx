"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Film,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  BadgeCheck,
  Clock,
  Loader2,
  Layers,
  Sparkles,
  Mountain,
  Building2,
} from "lucide-react";
import type { Project } from "@/db/schema";
import {
  createProject,
  deleteProject,
  duplicateProject,
  updateProjectMeta,
} from "@/app/actions/projects";
import { safeDoc, totalDuration } from "@/lib/timeline";
import { cx, formatDuration, timeAgo } from "@/lib/utils";
import { EmptyState, Modal, Segmented } from "@/components/ui";
import { useToast } from "@/components/toast";

const STATUS_FILTERS = ["all", "editing", "draft", "review", "published"] as const;

const STATUS_CHIP: Record<string, string> = {
  draft: "text-zinc-400",
  editing: "text-accent-300",
  review: "text-amber-300",
  published: "text-emerald-300",
};
const STATUS_DOT: Record<string, string> = {
  draft: "bg-zinc-500",
  editing: "bg-accent-400",
  review: "bg-amber-400",
  published: "bg-emerald-400",
};

const TEMPLATES = [
  { id: "blank", label: "Blank timeline", icon: Layers, hint: "Start from an empty canvas" },
  { id: "travel", label: "Travel film", icon: Mountain, hint: "3 graded aerial clips, 16s" },
  { id: "promo", label: "City promo", icon: Building2, hint: "3 punchy cuts with transitions" },
] as const;

export function ProjectsView({
  initialProjects,
  openNew,
}: {
  initialProjects: Project[];
  openNew: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [newOpen, setNewOpen] = useState(openNew);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const q = query.toLowerCase();
      const matchesQ = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesS = status === "all" || p.status === status;
      return matchesQ && matchesS;
    });
  }, [projects, query, status]);

  function run(id: string, fn: () => Promise<{ error?: string } | { ok?: boolean }>) {
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if ("error" in res && res.error) {
        toast(res.error, "err");
        router.refresh();
      }
    });
  }

  const handleDelete = (p: Project) => {
    setConfirmDelete(null);
    setProjects((xs) => xs.filter((x) => x.id !== p.id)); // optimistic
    startTransition(async () => {
      const res = await deleteProject(p.id);
      if (res.error) {
        toast(res.error, "err");
        router.refresh();
      } else {
        toast(`Deleted “${p.name}”`);
      }
    });
  };

  const handleDuplicate = (p: Project) => {
    setMenuFor(null);
    setBusyId(p.id);
    startTransition(async () => {
      const res = await duplicateProject(p.id);
      setBusyId(null);
      if (res.error) toast(res.error, "err");
      else {
        toast("Project duplicated");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-accent-400 uppercase">Workspace</p>
          <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-white">Projects</h1>
          <p className="mt-1 text-sm text-zinc-500">{projects.length} project{projects.length === 1 ? "" : "s"} in your studio</p>
        </div>
        <button onClick={() => setNewOpen(true)} className="btn btn-primary">
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      {/* toolbar */}
      <div className="anim-fade-up flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cx(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all",
                status === s ? "bg-accent-500/20 text-white shadow-[0_0_0_1px_#7c5cff55_inset]" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        projects.length === 0 ? (
          <EmptyState
            icon={<Film className="h-6 w-6" />}
            title="No projects yet"
            body="Spin up a project from a template or a blank timeline — your edits save automatically."
            action={
              <button onClick={() => setNewOpen(true)} className="btn btn-primary">
                <Plus className="h-4 w-4" /> New project
              </button>
            }
          />
        ) : (
          <EmptyState
            compact
            icon={<Search className="h-6 w-6" />}
            title="Nothing matches"
            body="Try a different search term or clear the status filter."
          />
        )
      ) : (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const doc = safeDoc(p.timeline);
            const first = doc.clips.slice().sort((a, b) => a.start - b.start)[0];
            const poster = first?.segments[0]?.poster;
            const src = first?.segments[0]?.src;
            return (
              <div
                key={p.id}
                className="card anim-fade-up group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:border-accent-500/30"
              >
                <Link href={`/editor/${p.id}`} className="block">
                  <div className="relative aspect-video overflow-hidden bg-ink-800">
                    {poster ? (
                      <img src={poster} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-700">
                        <Film className="h-8 w-8" />
                      </div>
                    )}
                    {src ? (
                      <video
                        src={src}
                        muted
                        playsInline
                        preload="none"
                        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                    <span className={cx("chip absolute top-2.5 left-2.5 border-white/10 bg-black/50 capitalize backdrop-blur", STATUS_CHIP[p.status])}>
                      <span className={cx("h-1.5 w-1.5 rounded-full", STATUS_DOT[p.status])} />
                      {p.status}
                    </span>
                    <span className="chip absolute right-2.5 bottom-2.5 border-white/10 bg-black/50 font-mono backdrop-blur">
                      <Clock className="h-3 w-3" /> {formatDuration(totalDuration(doc))}
                    </span>
                  </div>
                </Link>
                <div className="flex items-start gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    {renaming === p.id ? (
                      <RenameInput
                        initial={p.name}
                        busy={busyId === p.id}
                        onCancel={() => setRenaming(null)}
                        onSave={(name) => {
                          setRenaming(null);
                          setProjects((xs) => xs.map((x) => (x.id === p.id ? { ...x, name } : x)));
                          run(p.id, () => updateProjectMeta(p.id, { name }));
                        }}
                      />
                    ) : (
                      <Link href={`/editor/${p.id}`}>
                        <h3 className="truncate text-sm font-semibold text-white hover:text-accent-200">{p.name}</h3>
                      </Link>
                    )}
                    <p className="mt-1 text-xs text-zinc-500">
                      {doc.clips.length} clips · {p.resolution.split(" ")[0]} · {p.fps}fps · {timeAgo(p.updatedAt)}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                      className="btn btn-ghost btn-icon"
                      aria-label="Project menu"
                    >
                      {busyId === p.id && pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </button>
                    {menuFor === p.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                        <div className="anim-scale-in absolute right-0 z-40 mt-1 w-48 overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-2xl">
                          <MenuItem icon={Pencil} label="Rename" onClick={() => { setMenuFor(null); setRenaming(p.id); }} />
                          <MenuItem icon={Copy} label="Duplicate" onClick={() => handleDuplicate(p)} />
                          <MenuItem
                            icon={BadgeCheck}
                            label={p.status === "published" ? "Mark as editing" : "Mark published"}
                            onClick={() => {
                              setMenuFor(null);
                              const next = p.status === "published" ? "editing" : "published";
                              setProjects((xs) => xs.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
                              run(p.id, () => updateProjectMeta(p.id, { status: next }));
                            }}
                          />
                          <div className="my-1 border-t border-white/[0.06]" />
                          <MenuItem danger icon={Trash2} label="Delete" onClick={() => { setMenuFor(null); setConfirmDelete(p); }} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewProjectModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => router.push(`/editor/${id}`)}
      />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete project?">
        <p className="text-sm leading-relaxed text-zinc-400">
          <span className="font-semibold text-white">“{confirmDelete?.name}”</span> and its timeline will be permanently removed. This can&apos;t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
            <Trash2 className="h-4 w-4" /> Delete project
          </button>
        </div>
      </Modal>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors",
        danger ? "text-rose-300 hover:bg-rose-500/10" : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 opacity-70" /> {label}
    </button>
  );
}

function RenameInput({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: string;
  busy: boolean;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") value.trim().length >= 2 && onSave(value.trim());
          if (e.key === "Escape") onCancel();
        }}
        className="input !px-2 !py-1 text-sm"
      />
      <button
        onClick={() => value.trim().length >= 2 && onSave(value.trim())}
        disabled={busy}
        className="btn btn-primary !px-2.5 !py-1 text-xs"
      >
        Save
      </button>
    </div>
  );
}

function NewProjectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<"blank" | "travel" | "promo">("blank");
  const [resolution, setResolution] = useState<"1080p FHD" | "1440p QHD" | "2160p 4K UHD">("2160p 4K UHD");
  const [fps, setFps] = useState<"24" | "30" | "60">("24");
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast("Give your project a name first", "err");
      nameRef.current?.focus();
      return;
    }
    startTransition(async () => {
      const res = await createProject({ name: trimmed, template, resolution, fps: Number(fps) });
      if (res.error || !res.id) {
        toast(res.error ?? "Could not create project", "err");
        return;
      }
      toast("Project created — opening editor");
      onCreated(res.id);
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="New project" subtitle="Pick a starting point — you can change everything later." wide>
      <div className="space-y-5">
        <div>
          <label className="label" htmlFor="np-name">Project name</label>
          <input
            id="np-name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Iceland — Director's Cut"
            className="input"
            autoFocus
          />
        </div>

        <div>
          <label className="label">Template</label>
          <div className="grid grid-cols-3 gap-2.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={cx(
                  "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all",
                  template === t.id
                    ? "border-accent-500/50 bg-accent-500/10 shadow-[0_0_24px_-8px_#7c5cff88]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                )}
              >
                <t.icon className={cx("h-4.5 w-4.5", template === t.id ? "text-accent-300" : "text-zinc-500")} />
                <div>
                  <p className="text-[13px] font-semibold text-white">{t.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{t.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Resolution</label>
            <Segmented
              options={[
                { value: "1080p FHD", label: "1080p" },
                { value: "1440p QHD", label: "1440p" },
                { value: "2160p 4K UHD", label: "4K" },
              ]}
              value={resolution}
              onChange={setResolution}
            />
          </div>
          <div>
            <label className="label">Frame rate</label>
            <Segmented
              options={[
                { value: "24", label: "24", hint: "film" },
                { value: "30", label: "30", hint: "web" },
                { value: "60", label: "60", hint: "sport" },
              ]}
              value={fps}
              onChange={setFps}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Sparkles className="h-3.5 w-3.5 text-accent-400" />
            4K AI enhancement can be applied at render time.
          </div>
          <button onClick={submit} disabled={pending} className="btn btn-primary">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {pending ? "Creating…" : "Create project"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
