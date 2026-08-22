import { requireUser } from "@/lib/auth";
import { SettingsView } from "./settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <SettingsView
      user={{ name: user.name, email: user.email, avatarColor: user.avatarColor, createdAt: user.createdAt.toISOString() }}
    />
  );
}
