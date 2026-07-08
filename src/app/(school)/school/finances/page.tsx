import { getFinanceOverview, listFeeCategories } from "@/lib/finance-db";
import { getMySchool } from "@/lib/school-db";
import { schoolYearLabel } from "@/lib/trimester";
import { FinanceDashboard } from "./FinanceDashboard";

export default async function SchoolFinances() {
  const [overview, categories, school] = await Promise.all([
    getFinanceOverview(),
    listFeeCategories(),
    getMySchool(),
  ]);

  const classNames = [...new Set(overview.students.map((s) => s.className))].sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true })
  );
  const year = (school as any)?.currentYear || schoolYearLabel();

  return <FinanceDashboard overview={overview} categories={categories} year={year} classNames={classNames} />;
}
