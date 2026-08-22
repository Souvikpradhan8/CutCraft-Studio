"use client";

import { useMemo, useState, useTransition } from "react";
import {
  LibraryBig,
  Plus,
  Search,
  Link2,
  Trash2,
  Pencil,
  MoreVertical,
  Loader2,
  Check,
  Clock,
  Download,
  Clapperboard,
} from "lucide-react";
import type { MediaAsset } from "@/db/schema";
import { addMediaByUrl, addStockMedia, deleteMedia, updateMedia } from "@/app/actions/media";
import { STOCK_POOL } from "@/lib/stock";
import { cx, formatDuration, formatSize, timeAgo } from "@/lib/utils";
import { EmptyState, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useRouter } from "next/navigation";

export function MediaView({ initialMedia }: { initialMedia: MediaAsset[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [media, setMedia] = useState(initialMedia);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [urlOpen, setUrlOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MediaAsset | null>(null);
  const [, startTransition] = useTransition();

  const tags = useMemo(() => ["all", ...Array.from(new Set(media.map((m) => m.tag)))], [media]);
  const filtered = useMemo(
    () =>
      media.filter(
        (m) =>
          (tag === "all" || m.tag === tag) &&
          (!query || m.name.toLowerCase().includes(query.toLowerCase()))
      ),
    [media, query, tag]
  );
  const totalMb = media.reduce((a, m) => a + m.sizeMb, 0);

  const handleDelete = (m: MediaAsset) => {
    setConfirmDelete(null);
    setMenuFor(null);
    setMedia((xs) => xs.filter((x) => x.id !== m.id)); // optimistic
    startTransition(async () => {
      const res = await deleteMedia(m.id);
      if (res.error) {
        toast(res.error, "err");
        router.refresh();
      } else toast(`Removed “${m.name}”`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-accent-400 uppercase">Footage</p>
          <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-white">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {media.length} clips · {formatSize(totalMb)} of source media
          </p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => setUrlOpen(true)} className="btn btn-outline">
            <Link2 className="h-4 w-4" /> Add by URL
          </button>
          <button onClick={() => setStockOpen(true)} className="btn btn-primary">
            <Download className="h-4 w-4" /> Browse stock 4K
          </button>
        </div>
      </div>

      <div className="anim-fade-up flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clips…" className="input pl-9" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={cx(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all",
                tag === t ? "bg-accent-500/20 text-white shadow-[0_0_0_1px_#7c5cff55_inset]" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        media.length === 0 ? (
          <EmptyState
            icon={<LibraryBig className="h-6 w-6" />}
            title="Your library is empty"
            body="Pull in broadcast-quality 4K stock footage or link your own hosted clips to start editing."
            action={
              <button onClick={() => setStockOpen(true)} className="btn btn-primary">
                <Download className="h-4 w-4" /> Browse stock 4K
              </button>
            }
          />
        ) : (
          <EmptyState compact icon={<Search className="h-6 w-6" />} title="Nothing matches" body="Try a different search or tag filter." />
        )
      ) : (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <div key={m.id} className="card anim-fade-up group overflow-hidden transition-all hover:-translate-y-0.5 hover:border-accent-500/30">
              <div className="relative aspect-video overflow-hidden bg-ink-800">
                {m.poster ? (
                  <img src={m.poster} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-700">
                    <Clapperboard className="h-8 w-8" />
                  </div>
                )}
                <video
                  src={m.src}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                <span className="chip absolute top-2.5 left-2.5 border-white/10 bg-black/50 backdrop-blur">{m.tag}</span>
                <span className="chip absolute right-2.5 bottom-2.5 border-white/10 bg-black/50 font-mono backdrop-blur">
                  <Clock className="h-3 w-3" /> {formatDuration(m.durationSec)}
                </span>
              </div>
              <div className="flex items-start gap-2 p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">{m.name}</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {m.resolution} · {formatSize(m.sizeMb)} · added {timeAgo(m.createdAt)}
                  </p>
                </div>
                <div className="relative">
                  <button onClick={() => setMenuFor(menuFor === m.id ? null : m.id)} className="btn btn-ghost btn-icon" aria-label="Clip menu">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuFor === m.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                      <div className="anim-scale-in absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-2xl">
                        <button
                          onClick={() => { setMenuFor(null); setEditing(m); }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                        >
                          <Pencil className="h-4 w-4 opacity-70" /> Edit details
                        </button>
                        <div className="my-1 border-t border-white/[0.06]" />
                        <button
                          onClick={() => { setMenuFor(null); setConfirmDelete(m); }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4 opacity-70" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddUrlModal open={urlOpen} onClose={() => setUrlOpen(false)} />
      <StockBrowser open={stockOpen} onClose={() => setStockOpen(false)} ownedSrcs={media.map((m) => m.src)} onAdded={() => router.refresh()} />
      <EditMediaModal
        asset={editing}
        onClose={() => setEditing(null)}
        onSave={(id, patch) => {
          setEditing(null);
          setMedia((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
          startTransition(async () => {
            const res = await updateMedia(id, patch);
            if (res.error) {
              toast(res.error, "err");
              router.refresh();
            } else toast("Clip updated");
          });
        }}
      />
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete clip?">
        <p className="text-sm leading-relaxed text-zinc-400">
          <span className="font-semibold text-white">“{confirmDelete?.name}”</span> will be removed from your library. Clips already on timelines keep working.
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
            <Trash2 className="h-4 w-4" /> Delete clip
          </button>
        </div>
      </Modal>
    </div>
  );
}

function AddUrlModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [src, setSrc] = useState("");
  const [tag, setTag] = useState("Footage");
  const [pending, startTransition] = useTransition();

  return (
    <Modal open={open} onClose={onClose} title="Add media by URL" subtitle="Link any hosted .mp4 / .webm file — it stays where it lives.">
      <div className="space-y-4">
        <div>
          <label className="label">Clip name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Drone pass — fjord" className="input" />
        </div>
        <div>
          <label className="label">Video URL</label>
          <input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="https://…/clip.mp4" className="input font-mono text-xs" />
        </div>
        <div>
          <label className="label">Tag</label>
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Footage" className="input" />
        </div>
        <div className="flex justify-end gap-2.5 pt-1">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await addMediaByUrl({ name, src, tag });
                if (res.error) toast(res.error, "err");
                else {
                  toast("Added to library");
                  onClose();
                  setName("");
                  setSrc("");
                  router.refresh();
                }
              })
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add clip
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StockBrowser({
  open,
  onClose,
  ownedSrcs,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  ownedSrcs: string[];
  onAdded: () => void;
}) {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const owned = new Set(ownedSrcs);

  return (
    <Modal open={open} onClose={onClose} title="Stock 4K library" subtitle="Broadcast-quality footage, free to cut. Click to import." wide>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STOCK_POOL.map((s) => {
          const isOwned = owned.has(s.src) || addedIds.has(s.stockId);
          return (
            <button
              key={s.stockId}
              disabled={isOwned || pendingId !== null}
              onClick={() => {
                setPendingId(s.stockId);
                void addStockMedia([s.stockId]).then(() => {
                  setAddedIds((prev) => new Set(prev).add(s.stockId));
                  setPendingId(null);
                  toast(`“${s.name}” added to your library`);
                  onAdded();
                });
              }}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] text-left transition-all hover:border-accent-500/40 disabled:opacity-70"
            >
              <div className="relative aspect-video bg-ink-800">
                <img src={s.poster} alt="" className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="chip absolute top-2 left-2 border-white/10 bg-black/50 backdrop-blur">{s.tag}</span>
                <span className="chip absolute top-2 right-2 border-white/10 bg-black/50 font-mono backdrop-blur">
                  {formatDuration(s.durationSec)}
                </span>
                <div className="absolute right-3 bottom-2.5 left-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">{s.name}</p>
                    <p className="text-[11px] text-zinc-400">4K UHD · {s.creator}</p>
                  </div>
                  <span
                    className={cx(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all",
                      isOwned ? "bg-emerald-500 text-white" : "bg-accent-500 text-white group-hover:scale-110"
                    )}
                  >
                    {pendingId === s.stockId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isOwned ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function EditMediaModal({
  asset,
  onClose,
  onSave,
}: {
  asset: MediaAsset | null;
  onClose: () => void;
  onSave: (id: string, patch: { name: string; tag: string }) => void;
}) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [lastId, setLastId] = useState<string | null>(null);
  if (asset && asset.id !== lastId) {
    setLastId(asset.id);
    setName(asset.name);
    setTag(asset.tag);
  }

  return (
    <Modal open={!!asset} onClose={onClose} title="Edit clip details">
      <div className="space-y-4">
        <div>
          <label className="label">Clip name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Tag</label>
          <input value={tag} onChange={(e) => setTag(e.target.value)} className="input" />
        </div>
        <div className="flex justify-end gap-2.5 pt-1">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => asset && name.trim().length >= 2 && onSave(asset.id, { name: name.trim(), tag: tag.trim() })}
          >
            <Check className="h-4 w-4" /> Save changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
