"use client";

export function HoverVideo({ src, className }: { src: string; className?: string }) {
  return (
    <video
      src={src}
      muted
      playsInline
      preload="none"
      className={
        className ??
        "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      }
      onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
      onMouseLeave={(e) => {
        e.currentTarget.pause();
        e.currentTarget.currentTime = 0;
      }}
    />
  );
}
