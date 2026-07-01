import { PageHeader } from "@/components/KPI";
import { listTimetable, listSchoolClassNames } from "@/lib/content-db";
import { TimetableManager } from "./TimetableManager";

export default async function SchoolTimetable() {
  const [slots, classNames] = await Promise.all([listTimetable(), listSchoolClassNames()]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Emploi du temps", en: "Timetable" }}
        sub={{
          fr: "Saisissez les créneaux par classe. Les parents les voient dans l'app.",
          en: "Enter slots per class. Parents see them in the app.",
        }}
      />
      <TimetableManager slots={slots} classNames={classNames} />
    </div>
  );
}
