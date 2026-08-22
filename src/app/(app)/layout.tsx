import { requireUser } from "@/lib/auth";
import { getStorageUsedMb } from "@/lib/queries";
import { Sidebar } from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const storageMb = await getStorageUsedMb(user.id);

  return (
    <div className="min-h-screen">
      <Sidebar
        user={{ name: user.name, email: user.email, avatarColor: user.avatarColor }}
        storageMb={storageMb}
      />
      <main className="pt-14 lg:pt-0 lg:pl-[248px]">
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
