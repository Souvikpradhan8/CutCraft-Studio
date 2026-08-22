import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="h-screen overflow-hidden bg-ink-950">{children}</div>;
}
