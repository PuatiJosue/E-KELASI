import { PageHeader } from "@/components/KPI";
import { listPlatformVideos, listAllParents } from "@/lib/platform-db";
import { VideosManager } from "./VideosManager";

export default async function AdminVideos() {
  const [videos, parents] = await Promise.all([listPlatformVideos(), listAllParents()]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Vidéos E-KLASS", en: "E-KLASS videos" }}
        sub={{
          fr: "Vidéos publiées par l'équipe et visibles par tous les parents dans l'app.",
          en: "Videos published by the team, visible to all parents in the app.",
        }}
      />
      <VideosManager videos={videos} parents={parents} />
    </div>
  );
}
