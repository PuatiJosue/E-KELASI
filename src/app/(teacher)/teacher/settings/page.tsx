import { PageHeader } from "@/components/KPI";
import { PreferencesCard } from "@/components/settings/PreferencesCard";

export default function TeacherSettings() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <PageHeader title={{ fr: "Paramètres", en: "Settings" }} />
      <PreferencesCard />
    </div>
  );
}
