"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, LibraryBig, ArrowUpRight, Clock } from "lucide-react";
import type { MediaAsset } from "@/db/schema";
import { cx, formatDuration } from "@/lib/utils";

export function MediaBin({
  assets,
  onAppend,
  onInsert,
}: {
  assets: MediaAsset[];
  onAppend: (a: MediaAsset) => void;
  onInsert: (a: MediaAsset) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = assets.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] px-3.5 pt-3.5 pb-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search library…"
            className="input !py-1.5 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <LibraryBig className="h-7 w-7 text-zinc-700" />
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              {assets.length === 0 ? "Your library is empty." : "No clips match your search."}
            </p>
            <Link href="/media" className="btn btn-outline mt-4 !py-1.5 text-xs">
              Open Media Library <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          filtered.map((a) => (
            <div
              key={a.id}
              className="group relative cursor-pointer overflow-hidden rounded-lg border border-white/[0.07] bg-ink-800 transition-all hover:border-accent-500/40"
              onClick={() => onInsert(a)}
              title="Click to insert at playhead"
            >
              <div className="relative h-16 bg-ink-900">
                {a.poster ? (
                  <img src={a.poster} alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
                ) : (
                  <div className="h-full w-full" style={{ background: `linear-gradient(135deg, hsl(${a.hue} 60% 22%), hsl(${a.hue + 40} 60% 12%))` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute right-1.5 bottom-1.5 flex items-center gap-1 font-mono text-[10px] text-zinc-300">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDuration(a.durationSec)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAppend(a);
                  }}
                  className={cx(
                    "absolute top-1.5 right-1.5 flex h-6 items-center gap-1 rounded-md bg-black/60 px-1.5 text-[10px] font-medium text-white opacity-0 backdrop-blur transition-all group-hover:opacity-100 hover:bg-accent-500"
                  )}
                  title="Append to end of timeline"
                >
                  <Plus className="h-3 w-3" /> End
                </button>
              </div>
              <p className="truncate px-2.5 py-2 text-[11px] font-medium text-zinc-300">{a.name}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-white/[0.06] px-3.5 py-2.5 text-[10px] leading-relaxed text-zinc-600">
        Click a clip to insert at the playhead. Manage sources in the{" "}
        <Link href="/media" className="text-accent-300 hover:underline">
          Media Library
        </Link>
        .
      </div>
    </div>
  );
}
