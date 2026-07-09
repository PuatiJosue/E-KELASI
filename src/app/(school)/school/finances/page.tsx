import { getFeesOverview } from "@/lib/finance/fees";
import { getTreasuryOverview, getCashState } from "@/lib/finance/treasury";
import { getFinanceAlerts } from "@/lib/finance/alerts";
import { getMySchool, listSchoolStudents } from "@/lib/school-db";
import { classLabel, normOption, classKey } from "@/lib/classes";
import { schoolYearLabel } from "@/lib/trimester";
import { FinanceModule } from "./FinanceModule";
import type { SchoolBranding } from "./finance-ui";
import type { ClassOption } from "./FraisScolairesTab";

export default async function SchoolFinances() {
  const [school, students, feesScolaire, feesAutre, treasury, cashState] = await Promise.all([
    getMySchool(),
    listSchoolStudents(),
    getFeesOverview("scolaire"),
    getFeesOverview("autre"),
    getTreasuryOverview(),
    getCashState(),
  ]);
  const alerts = await getFinanceAlerts(feesScolaire, feesAutre, treasury);

  const year = school?.currentYear || schoolYearLabel();

  // Classes distinctes (couple class_name + option) pour la création de frais.
  const seen = new Map<string, ClassOption>();
  for (const s of students) {
    if (!s.className || s.className === "—") continue;
    const key = classKey(s.className, s.option);
    if (!seen.has(key)) seen.set(key, { className: s.className, option: normOption(s.option), display: classLabel(s.className, s.option) });
  }
  // Repli (mode démo) : dériver les classes des frais existants.
  if (seen.size === 0) {
    for (const f of feesScolaire.fees) {
      if (!f.className) continue;
      const key = classKey(f.className, f.option);
      if (!seen.has(key)) seen.set(key, { className: f.className, option: normOption(f.option), display: f.classDisplay ?? f.className });
    }
  }
  const classes = [...seen.values()].sort((a, b) => a.display.localeCompare(b.display, "fr", { numeric: true }));

  const branding: SchoolBranding = {
    name: school?.name ?? "École",
    city: school?.city ?? null,
    commune: school?.commune ?? null,
    address: school?.address ?? null,
    phone: school?.phone ?? null,
    email: school?.email ?? null,
    logoUrl: school?.logoUrl ?? null,
    signatureUrl: school?.signatureUrl ?? null,
    directorName: school?.directorName ?? null,
  };

  return (
    <FinanceModule
      feesScolaire={feesScolaire}
      feesAutre={feesAutre}
      treasury={treasury}
      cashState={cashState}
      alerts={alerts}
      year={year}
      school={branding}
      classes={classes}
      years={[year]}
    />
  );
}
