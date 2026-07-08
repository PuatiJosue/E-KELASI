import { getFinanceOverview, listFeeCategories, getSchoolAdvances, getSchoolInstallments, getCashEntries, getCashSummary } from "@/lib/finance-db";
import { getMySchool } from "@/lib/school-db";
import { schoolYearLabel } from "@/lib/trimester";
import { FinanceDashboard, type SchoolBranding } from "./FinanceDashboard";

export default async function SchoolFinances() {
  const [overview, categories, advances, installments, cashEntries, cashSummary, school] = await Promise.all([
    getFinanceOverview(),
    listFeeCategories(),
    getSchoolAdvances(),
    getSchoolInstallments(),
    getCashEntries(),
    getCashSummary(),
    getMySchool(),
  ]);

  const classNames = [...new Set(overview.students.map((s) => s.className))].sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true })
  );
  const year = (school as any)?.currentYear || schoolYearLabel();

  const branding: SchoolBranding = {
    name: school?.name ?? "École",
    city: school?.city ?? null,
    commune: (school as any)?.commune ?? null,
    logoUrl: school?.logoUrl ?? null,
    signatureUrl: school?.signatureUrl ?? null,
    directorName: school?.directorName ?? null,
  };

  return (
    <FinanceDashboard
      overview={overview}
      categories={categories}
      advances={advances}
      installments={installments}
      year={year}
      classNames={classNames}
      cashEntries={cashEntries}
      cashSummary={cashSummary}
      school={branding}
    />
  );
}
