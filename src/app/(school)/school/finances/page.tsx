import { getFinanceOverview, listFeeCategories, getSchoolAdvances, getSchoolInstallments } from "@/lib/finance-db";
import { getMySchool } from "@/lib/school-db";
import { schoolYearLabel } from "@/lib/trimester";
import { FinanceDashboard } from "./FinanceDashboard";

export default async function SchoolFinances() {
  const [overview, categories, advances, installments, school] = await Promise.all([
    getFinanceOverview(),
    listFeeCategories(),
    getSchoolAdvances(),
    getSchoolInstallments(),
    getMySchool(),
  ]);

  const classNames = [...new Set(overview.students.map((s) => s.className))].sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true })
  );
  const year = (school as any)?.currentYear || schoolYearLabel();

  return (
    <FinanceDashboard
      overview={overview}
      categories={categories}
      advances={advances}
      installments={installments}
      year={year}
      classNames={classNames}
    />
  );
}
