import { requireUser } from "@/lib/auth";
import { readRenders } from "@/lib/queries";
import { RendersView } from "./renders-view";

export const dynamic = "force-dynamic";

export default async function RendersPage() {
  const user = await requireUser();
  const renders = await readRenders(user.id);
  return <RendersView initialRenders={renders} />;
}
