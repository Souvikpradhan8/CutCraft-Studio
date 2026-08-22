import { requireUser } from "@/lib/auth";
import { getMedia } from "@/lib/queries";
import { MediaView } from "./media-view";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const user = await requireUser();
  const media = await getMedia(user.id);
  return <MediaView initialMedia={media} />;
}
