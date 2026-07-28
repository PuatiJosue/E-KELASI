import { PageHeader } from "@/components/KPI";
import { listTimetable, listSchoolClassNames } from "@/lib/content-db";
import { getMySchool } from "@/lib/school/profile";
import { TimetableManager } from "./TimetableManager";

export default async function SchoolTimetable() {
  const [slots, classNames, school] = await Promise.all([listTimetable(), listSchoolClassNames(), getMySchool()]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Horaires", en: "Timetable" }}
        sub={{
          fr: "Créez l'emploi du temps par classe, puis publiez-le pour le rendre visible aux parents. Export PDF/Excel disponible.",
          en: "Create the timetable per class, then publish it to make it visible to parents. PDF/Excel export available.",
        }}
      />
      <TimetableManager slots={slots} classNames={classNames} schoolName={school?.name ?? ""} />
    </div>
  );
}
