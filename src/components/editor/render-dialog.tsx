"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MonitorPlay, Sparkles, Zap, ArrowRight } from "lucide-react";
import { createRender } from "@/app/actions/renders";
import { Modal, Segmented, Toggle } from "@/components/ui";
import { useToast } from "@/components/toast";
import { formatDuration } from "@/lib/utils";

const RATE: Record<string, number> = { "1080p FHD": 6.2, "1440p QHD": 9.4, "2160p 4K UHD": 16.8 };

export function RenderDialog({
  open,
  onClose,
  projectId,
  projectName,
  durationSec,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  durationSec: number;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(`${projectName} — Master`);
  const [format, setFormat] = useState<"MP4" | "MOV" | "WebM">("MP4");
  const [resolution, setResolution] = useState<"1080p FHD" | "1440p QHD" | "2160p 4K UHD">("2160p 4K UHD");
  const [enhance, setEnhance] = useState(true);
  const [pending, startTransition] = useTransition();

  const estMb = Math.round(durationSec * RATE[resolution] * (enhance ? 1.28 : 1));
  const estSec = Math.round(Math.min(50, Math.max(14, 12 + durationSec * 0.6)));

  return (
    <Modal open={open} onClose={onClose} title="Render master" subtitle="Your timeline is encoded in the cloud with the settings below.">
      <div className="space-y-5">
        <div>
          <label className="label">File name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>

        <div>
          <label className="label">Container</label>
          <Segmented
            options={[
              { value: "MP4", label: "MP4", hint: "universal" },
              { value: "MOV", label: "MOV", hint: "prores" },
              { value: "WebM", label: "WebM", hint: "open" },
            ]}
            value={format}
            onChange={setFormat}
          />
        </div>

        <div>
          <label className="label">Resolution</label>
          <Segmented
            options={[
              { value: "1080p FHD", label: "1080p", hint: "FHD" },
              { value: "1440p QHD", label: "1440p", hint: "QHD" },
              { value: "2160p 4K UHD", label: "2160p", hint: "4K UHD" },
            ]}
            value={resolution}
            onChange={setResolution}
          />
        </div>

        <div className="rounded-xl border border-accent-500/25 bg-gradient-to-br from-accent-500/10 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/20 text-accent-300">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">AI Enhance to 4K</p>
                <p className="text-[11px] text-zinc-500">Upscale, denoise &amp; detail recovery</p>
              </div>
            </div>
            <Toggle checked={enhance} onChange={setEnhance} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          {[
            { label: "Duration", value: formatDuration(durationSec) },
            { label: "Est. size", value: estMb >= 1024 ? `${(estMb / 1024).toFixed(1)} GB` : `${estMb} MB` },
            { label: "Queue time", value: `~${estSec}s` },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-2 py-2.5">
              <p className="font-mono text-sm font-semibold text-white">{s.value}</p>
              <p className="mt-0.5 text-[10px] tracking-wide text-zinc-600 uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2.5">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await createRender({ projectId, name, format, resolution, enhance });
                if (res.error) {
                  toast(res.error, "err");
                  return;
                }
                toast("Render queued — watch it finish on the Renders page");
                onClose();
              })
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {pending ? "Queueing…" : "Start render"}
          </button>
          <button className="btn btn-ghost hidden sm:inline-flex" onClick={() => router.push("/renders")}>
            <MonitorPlay className="h-4 w-4" /> Renders <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
