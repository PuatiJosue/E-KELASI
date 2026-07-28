// Dossier scolaire complet d'un élève (identité, parents, cotes).

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { TRIMESTERS, trimesterOf, currentTrimester } from "@/lib/trimester";
import { getMySchool } from "./profile";

// Agrège une liste de cotes en moyennes par matière + moyenne générale.
function aggregateGrades(grades: any[]): { subjects: DossierSubject[]; overallAvg: number } {
  const bySubject: Record<string, { name: string; short: string; sum: number; coef: number; items: any[] }> = {};
  for (const g of grades) {
    const name = g.subjects?.name ?? "?";
    if (!bySubject[name]) bySubject[name] = { name, short: g.subjects?.short_name ?? "", sum: 0, coef: 0, items: [] };
    bySubject[name].sum += (g.score / g.max_score) * 20 * g.coefficient;
    bySubject[name].coef += g.coefficient;
    bySubject[name].items.push(g);
  }
  const subjects = Object.values(bySubject).map((su) => ({
    name: su.name,
    short: su.short,
    avg: su.coef > 0 ? +(su.sum / su.coef).toFixed(2) : 0,
    items: su.items,
  }));
  const overallAvg = subjects.length ? +(subjects.reduce((a, su) => a + su.avg, 0) / subjects.length).toFixed(2) : 0;
  return { subjects, overallAvg };
}

export type DossierSubject = { name: string; short: string; avg: number; items: any[] };

export type DossierTrimester = {
  index: number;
  short: string;
  fr: string;
  en: string;
  subjects: DossierSubject[];
  overallAvg: number;
  count: number;
};

export type StudentDossier = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  sex: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  className: string;
  option: string | null;
  schoolName: string | null;
  status: string;
  address: string | null;
  enrolledAt: string | null;
  provinceOrigin: string | null;
  fatherName: string | null;
  motherName: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianPhone: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  medicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  previousSchool: string | null;
  previousClass: string | null;
  observation: string | null;
  documents: { name: string; url: string }[];
  extraFields: { label: string; value: string }[];
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  parents: { name: string; email: string; phone: string | null; address: string | null; access: string }[];
  subjects: DossierSubject[];
  overallAvg: number;
  trimesters: DossierTrimester[];
};

export async function getStudentDossier(studentId: string): Promise<StudentDossier | null> {
  if (!isLiveMode()) return null;
  try {
    const supabase = createClient();
    const school = await getMySchool();
    if (!school) return null;

    const { data: s } = await supabase
      .from("students")
      .select("id, full_name, first_name, middle_name, last_name, avatar_url, sex, birth_date, birth_place, class_name, option, status, address, enrolled_at, province_origin, father_name, mother_name, guardian_name, guardian_relation, guardian_phone, blood_group, allergies, medical_notes, emergency_contact_name, emergency_contact_phone, previous_school, previous_class, observation, documents, extra_fields, school_id, schools(name)")
      .eq("id", studentId)
      .eq("school_id", school.id)
      .maybeSingle();
    if (!s) return null;

    const { data: links } = await supabase
      .from("parent_links")
      .select("access_status, profiles!parent_links_parent_id_fkey(full_name, email, phone, address)")
      .eq("student_id", studentId);
    const parents = (links ?? []).map((l: any) => ({
      name: l.profiles?.full_name ?? "—",
      email: l.profiles?.email ?? "",
      phone: l.profiles?.phone ?? null,
      address: l.profiles?.address ?? null,
      access: l.access_status ?? "active",
    }));

    const { data: grades } = await supabase
      .from("grades")
      .select("kind, score, max_score, coefficient, graded_at, comment, subjects(name, short_name)")
      .eq("student_id", studentId)
      .is("archived_at", null)
      .order("graded_at", { ascending: false });

    const { subjects, overallAvg } = aggregateGrades(grades ?? []);

    // Regroupement des cotations par trimestre (dossiers).
    const trimesters: DossierTrimester[] = TRIMESTERS.map((meta) => {
      const gradesT = (grades ?? []).filter((g: any) => trimesterOf(g.graded_at) === meta.index);
      const agg = aggregateGrades(gradesT);
      return {
        index: meta.index,
        short: meta.short,
        fr: meta.fr,
        en: meta.en,
        subjects: agg.subjects,
        overallAvg: agg.overallAvg,
        count: gradesT.length,
      };
    }).filter((tr) => tr.count > 0);

    return {
      id: (s as any).id,
      fullName: (s as any).full_name,
      avatarUrl: (s as any).avatar_url ?? null,
      sex: (s as any).sex ?? null,
      birthDate: (s as any).birth_date ?? null,
      birthPlace: (s as any).birth_place ?? null,
      className: (s as any).class_name ?? "—",
      option: (s as any).option ?? null,
      schoolName: (s as any).schools?.name ?? null,
      status: (s as any).status,
      address: (s as any).address ?? null,
      enrolledAt: (s as any).enrolled_at ?? null,
      provinceOrigin: (s as any).province_origin ?? null,
      fatherName: (s as any).father_name ?? null,
      motherName: (s as any).mother_name ?? null,
      guardianName: (s as any).guardian_name ?? null,
      guardianRelation: (s as any).guardian_relation ?? null,
      guardianPhone: (s as any).guardian_phone ?? null,
      bloodGroup: (s as any).blood_group ?? null,
      allergies: (s as any).allergies ?? null,
      medicalNotes: (s as any).medical_notes ?? null,
      emergencyContactName: (s as any).emergency_contact_name ?? null,
      emergencyContactPhone: (s as any).emergency_contact_phone ?? null,
      previousSchool: (s as any).previous_school ?? null,
      previousClass: (s as any).previous_class ?? null,
      observation: (s as any).observation ?? null,
      documents: Array.isArray((s as any).documents) ? (s as any).documents : [],
      extraFields: Array.isArray((s as any).extra_fields) ? (s as any).extra_fields : [],
      firstName: (s as any).first_name ?? null,
      middleName: (s as any).middle_name ?? null,
      lastName: (s as any).last_name ?? null,
      parents,
      subjects,
      overallAvg,
      trimesters,
    };
  } catch {
    return null;
  }
}

export async function getStudentReportData(studentId: string, trimester?: number) {
  if (!isLiveMode()) return null;
  try {
    const supabase = createClient();
    const tri = trimester ?? currentTrimester();
    const { data: student } = await supabase
      .from("students")
      .select("id, full_name, class_name, grade_level, schools(name, city)")
      .eq("id", studentId)
      .maybeSingle();
    if (!student) return null;

    const { data: grades } = await supabase
      .from("grades")
      .select("kind, score, max_score, coefficient, graded_at, comment, subjects(name, short_name)")
      .eq("student_id", studentId)
      .is("archived_at", null)
      .order("graded_at", { ascending: false });

    // On ne garde que les cotes du trimestre demandé.
    const gradesT = (grades ?? []).filter((g: any) => trimesterOf(g.graded_at) === tri);
    const { subjects, overallAvg } = aggregateGrades(gradesT);
    const meta = TRIMESTERS.find((m) => m.index === tri) ?? TRIMESTERS[0];

    return {
      student: {
        id: student.id,
        fullName: student.full_name,
        className: student.class_name,
        schoolName: (student as any).schools?.name,
        schoolCity: (student as any).schools?.city,
      },
      subjects,
      overallAvg,
      trimester: { index: meta.index, short: meta.short, fr: meta.fr, en: meta.en },
    };
  } catch {
    return null;
  }
}
