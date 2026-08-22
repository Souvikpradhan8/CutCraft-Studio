"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cx } from "@/lib/utils";

type ToastKind = "ok" | "err" | "info";
interface ToastItem {
  id: number;
  msg: string;
  kind: ToastKind;
}

const ToastCtx = createContext<{ toast: (msg: string, kind?: ToastKind) => void }>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastCtx);
}

const ICONS: Record<ToastKind, React.ReactNode> = {
  ok: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  err: <AlertTriangle className="h-4 w-4 text-rose-400" />,
  info: <Info className="h-4 w-4 text-accent-400" />,
};

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const toast = useCallback((msg: string, kind: ToastKind = "ok") => {
    const id = idRef.current++;
    setItems((xs) => [...xs, { id, msg, kind }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-5 bottom-5 z-[200] flex w-[min(92vw,360px)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              "anim-toast-in pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl",
              t.kind === "err"
                ? "border-rose-500/30 bg-rose-950/80 text-rose-100"
                : "border-white/10 bg-ink-800/90 text-zinc-100"
            )}
          >
            {ICONS[t.kind]}
            <span className="leading-snug">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
