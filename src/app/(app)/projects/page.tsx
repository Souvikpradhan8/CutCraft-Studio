import { requireUser } from "@/lib/auth";
import { getProjects } from "@/lib/queries";
import { ProjectsView } from "./projects-view";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await requireUser();
  const [projects, sp] = await Promise.all([getProjects(user.id), searchParams]);
  return <ProjectsView initialProjects={projects} openNew={sp.new === "1"} />;
}
