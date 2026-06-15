import { PageHeader } from "@/components/KPI";
import { listSchoolAnnouncements } from "@/lib/announce-db";
import { AnnouncementManager } from "./AnnouncementManager";

export default async function SchoolAnnouncements() {
  const announcements = await listSchoolAnnouncements();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Annonces", en: "Announcements" }}
        sub={{
          fr: `${announcements.length} annonce(s) publiée(s)`,
          en: `${announcements.length} published`,
        }}
      />
      <AnnouncementManager announcements={announcements} />
    </div>
  );
}
