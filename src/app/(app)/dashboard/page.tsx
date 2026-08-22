import Link from "next/link";
import {
  FolderKanban,
  LibraryBig,
  MonitorPlay,
  HardDrive,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Clock,
  Film,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProjects, getMedia, readRenders } from "@/lib/queries";
import { safeDoc, totalDuration } from "@/lib/timeline";
import { formatDuration, formatSize, timeAgo, cx } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import { HoverVideo } from "@/components/hover-video";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
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

export default async function DashboardPage() {
  const user = await requireUser();
  const [projects, media, renderList] = await Promise.all([
    getProjects(user.id),
    getMedia(user.id),
    readRenders(user.id),
  ]);

  const mediaMinutes = media.reduce((a, m) => a + m.durationSec, 0) / 60;
  const storageMb = media.reduce((a, m) => a + m.sizeMb, 0);
  const doneRenders = renderList.filter((r) => r.status === "completed").length;
  const activeRender = renderList.find((r) => r.status === "processing");

  const stats = [
    { icon: FolderKanban, label: "Projects", value: String(projects.length), sub: `${projects.filter((p) => p.status === "published").length} published`, tint: "text-accent-300 bg-accent-500/15" },
    { icon: LibraryBig, label: "Media minutes", value: mediaMinutes.toFixed(0), sub: `${media.length} source clips`, tint: "text-cyan-300 bg-cyan-400/10" },
    { icon: MonitorPlay, label: "Renders done", value: String(doneRenders), sub: activeRender ? "1 processing now" : "queue idle", tint: "text-emerald-300 bg-emerald-400/10" },
    { icon: HardDrive, label: "Storage", value: formatSize(storageMb), sub: "of 10 GB workspace", tint: "text-amber-300 bg-amber-400/10" },
  ];

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-accent-400 uppercase">Studio overview</p>
          <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-white">
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {activeRender
              ? `Your render “${activeRender.name}” is at ${Math.round(activeRender.progress * 100)}%.`
              : "Everything is synced and ready to cut."}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link href="/media" className="btn btn-outline">
            <ArrowUpRight className="h-4 w-4" /> Import media
          </Link>
          <Link href="/projects?new=1" className="btn btn-primary">
            <Plus className="h-4 w-4" /> New project
          </Link>
        </div>
      </div>

      {/* stats */}
      <div className="stagger grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card anim-fade-up p-5">
            <div className={cx("mb-3 flex h-9 w-9 items-center justify-center rounded-lg", s.tint)}>
              <s.icon className="h-4.5 w-4.5" />
            </div>
            <p className="font-display text-2xl font-bold text-white">{s.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              <span className="font-medium text-zinc-400">{s.label}</span> · {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* recent projects */}
      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Continue editing</h2>
          <Link href="/projects" className="flex items-center gap-1 text-sm text-accent-300 hover:text-accent-400">
            All projects <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {projects.length === 0 ? (
          <EmptyState
            icon={<Film className="h-6 w-6" />}
            title="No projects yet"
            body="Create your first project and start cutting real 4K footage on a frame-accurate timeline."
            action={
              <Link href="/projects?new=1" className="btn btn-primary">
                <Plus className="h-4 w-4" /> New project
              </Link>
            }
          />
        ) : (
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {projects.slice(0, 4).map((p) => {
              const doc = safeDoc(p.timeline);
              const first = doc.clips.slice().sort((a, b) => a.start - b.start)[0];
              const poster = first?.segments[0]?.poster;
              const src = first?.segments[0]?.src;
              return (
                <Link
                  key={p.id}
                  href={`/editor/${p.id}`}
                  className="card anim-fade-up group overflow-hidden transition-all hover:-translate-y-0.5 hover:border-accent-500/30"
                >
                  <div className="relative aspect-video overflow-hidden bg-ink-800">
                    {poster ? (
                      <img src={poster} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-700">
                        <Film className="h-8 w-8" />
                      </div>
                    )}
                    {src ? <HoverVideo src={src} /> : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                    <span className={cx("chip absolute top-2.5 left-2.5 border-white/10 bg-black/50 backdrop-blur", STATUS_STYLE[p.status])}>
                      <span className={cx("h-1.5 w-1.5 rounded-full", STATUS_DOT[p.status])} />
                      {p.status}
                    </span>
                    <span className="chip absolute right-2.5 bottom-2.5 border-white/10 bg-black/50 font-mono backdrop-blur">
                      <Clock className="h-3 w-3" /> {formatDuration(totalDuration(doc))}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate text-sm font-semibold text-white">{p.name}</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {doc.clips.length} clips · {p.resolution.split(" ")[0]} · edited {timeAgo(p.updatedAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* render activity */}
      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Render activity</h2>
          <Link href="/renders" className="flex items-center gap-1 text-sm text-accent-300 hover:text-accent-400">
            Render queue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {renderList.length === 0 ? (
          <EmptyState
            compact
            icon={<Sparkles className="h-6 w-6" />}
            title="Nothing rendered yet"
            body="Open a project and hit Render to produce a 4K-enhanced master."
          />
        ) : (
          <div className="card anim-fade-up divide-y divide-white/[0.05] overflow-hidden">
            {renderList.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className={cx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  r.status === "completed" && "bg-emerald-400/10 text-emerald-300",
                  r.status === "processing" && "bg-accent-500/15 text-accent-300",
                  r.status === "failed" && "bg-rose-400/10 text-rose-300"
                )}>
                  {r.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : r.status === "failed" ? <AlertTriangle className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{r.name}</p>
                  <p className="text-xs text-zinc-600">
                    {r.format} · {r.resolution}{r.enhance ? " · AI Enhanced" : ""} · {timeAgo(r.createdAt)}
                  </p>
                </div>
                {r.status === "processing" ? (
                  <div className="hidden w-40 items-center gap-2 sm:flex">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-600">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-cyan-400" style={{ width: `${Math.round(r.progress * 100)}%` }} />
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400">{Math.round(r.progress * 100)}%</span>
                  </div>
                ) : (
                  <span className="font-mono text-xs text-zinc-500">{r.sizeMb ? formatSize(r.sizeMb) : "—"}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
