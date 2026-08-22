import { Scissors, Wand2, Gauge, MonitorPlay } from "lucide-react";
import { Logo } from "@/components/logo";

const FEATURES = [
  { icon: Scissors, title: "Cut & merge", body: "Frame-accurate splits, trims and multi-clip merges on a magnetic timeline." },
  { icon: Wand2, title: "Enhance to 4K", body: "One-click AI upscale, denoise and detail recovery on export." },
  { icon: Gauge, title: "Keyframes", body: "Animate opacity, scale and position with diamond-precise keyframes." },
  { icon: MonitorPlay, title: "Realtime grade", body: "Presets, filters, vignettes, grain and transitions — no render wait." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] overflow-hidden border-r border-white/[0.06] lg:flex lg:flex-col">
        <div className="noise-bg absolute inset-0" />
        <div
          className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-accent-500/25 blur-[120px]"
          style={{ animation: "drift 18s ease-in-out infinite" }}
        />
        <div
          className="absolute right-[-80px] bottom-[-60px] h-[380px] w-[380px] rounded-full bg-cyan-400/15 blur-[110px]"
          style={{ animation: "drift 22s ease-in-out infinite reverse" }}
        />
        <div className="relative flex h-full flex-col p-10 xl:p-14">
          <Logo />
          <div className="mt-auto">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-400 uppercase">
              The browser-native studio
            </p>
            <h1 className="font-display mt-4 text-4xl leading-[1.05] font-bold tracking-tight text-white xl:text-5xl">
              Every frame,
              <br />
              <span className="text-gradient">exactly as you</span>
              <br />
              imagined it.
            </h1>
            <div className="stagger mt-10 space-y-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="anim-fade-up flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-accent-300">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="mt-0.5 max-w-xs text-[13px] leading-relaxed text-zinc-500">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-12">
            <div className="flex items-center gap-6 border-t border-white/[0.06] pt-6 text-xs text-zinc-600">
              <span><span className="font-display text-sm font-bold text-white">4K</span> UHD pipeline</span>
              <span><span className="font-display text-sm font-bold text-white">60fps</span> playback</span>
              <span><span className="font-display text-sm font-bold text-white">0</span> installs required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center px-5 py-10">
        <div className="noise-bg absolute inset-0 lg:hidden" />
        <div className="relative w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
