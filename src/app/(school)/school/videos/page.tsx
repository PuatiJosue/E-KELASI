import { PageHeader } from "@/components/KPI";
import { listCourseVideos, listSchoolClassNames } from "@/lib/content-db";
import { VideosManager } from "./VideosManager";

export default async function SchoolVideos() {
  const [videos, classNames] = await Promise.all([listCourseVideos(), listSchoolClassNames()]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Vidéos des cours", en: "Course videos" }}
        sub={{
          fr: "Partagez des liens de vidéos. Les parents y accèdent dans l'Espace numérique de l'app.",
          en: "Share video links. Parents access them in the app's Digital space.",
        }}
      />
      <VideosManager videos={videos} classNames={classNames} />
    </div>
  );
}
