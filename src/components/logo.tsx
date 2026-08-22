import { Clapperboard } from "lucide-react";
import { cx } from "@/lib/utils";

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 shadow-[0_6px_24px_-6px_#7c5cffaa]">
        <Clapperboard className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
        <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-mint-400 ring-2 ring-ink-950" />
      </div>
      {!compact && (
        <div className="leading-none">
          <span className="font-display text-[17px] font-bold tracking-tight text-white">
            CutCraft
          </span>
          <span className="mt-1 block text-[9px] font-semibold tracking-[0.28em] text-accent-400 uppercase">
            Studio
          </span>
        </div>
      )}
    </div>
  );
}
