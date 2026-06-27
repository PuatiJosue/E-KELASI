import { PageHeader } from "@/components/KPI";
import { listActiveStaff, getAttendanceForDate, getAttendanceReport } from "@/lib/attendance-db";
import { AttendanceManager } from "./AttendanceManager";

export default async function SchoolAttendance({
  searchParams,
}: {
  searchParams: { date?: string; from?: string; to?: string };
}) {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";
  const date = searchParams.date || today;
  const from = searchParams.from || monthStart;
  const to = searchParams.to || today;

  const [staff, attendance, report] = await Promise.all([
    listActiveStaff(),
    getAttendanceForDate(date),
    getAttendanceReport(from, to),
  ]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Présence du personnel", en: "Staff attendance" }}
        sub={{
          fr: "Pointez les présences du jour ; le rapport calcule la régularité (primes).",
          en: "Mark today's attendance; the report computes regularity (bonuses).",
        }}
      />
      <AttendanceManager staff={staff} date={date} attendance={attendance} report={report} from={from} to={to} />
    </div>
  );
}
