import { PageHeader } from "@/components/KPI";
import { listPlatformAnnouncements } from "@/lib/platform-db";
import { BroadcastManager } from "./BroadcastManager";

export default async function Broadcast() {
  const announcements = await listPlatformAnnouncements();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <PageHeader
        title={{ fr: "Diffusion", en: "Broadcast" }}
        sub={{ fr: "Annoncez aux parents et/ou aux écoles (ex. mise à jour de l'app)", en: "Announce to parents and/or schools" }}
      />
      <BroadcastManager announcements={announcements} />
    </div>
  );
}
