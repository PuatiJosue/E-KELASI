import { PageHeader } from "@/components/KPI";
import { listCourseVideos, listSchoolClassNames, listSchoolParents } from "@/lib/content-db";
import { VideosManager } from "./VideosManager";

export default async function SchoolVideos() {
  const [videos, classNames, parents] = await Promise.all([
    listCourseVideos(),
    listSchoolClassNames(),
    listSchoolParents(),
  ]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Vidéos des cours", en: "Course videos" }}
        sub={{
          fr: "Partagez un lien ou un fichier vidéo. Ciblez toute la classe ou des parents précis.",
          en: "Share a link or a video file. Target the whole class or specific parents.",
        }}
      />
      <VideosManager videos={videos} classNames={classNames} parents={parents} />
    </div>
  );
}
