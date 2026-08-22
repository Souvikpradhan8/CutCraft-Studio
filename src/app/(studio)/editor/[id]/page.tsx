import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getMedia } from "@/lib/queries";
import { safeDoc } from "@/lib/timeline";
import { EditorShell } from "@/components/editor/editor-shell";

export const dynamic = "force-dynamic";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });
  if (!project) notFound();
  const assets = await getMedia(user.id);

  return (
    <EditorShell
      project={{
        id: project.id,
        name: project.name,
        status: project.status,
        resolution: project.resolution,
        fps: project.fps,
      }}
      initialDoc={safeDoc(project.timeline)}
      assets={assets}
    />
  );
}
