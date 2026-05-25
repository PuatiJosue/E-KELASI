// Mock data — mirrors src/lib/mock.ts (web) for parents.
// Used until Supabase queries are wired up.

export const MOCK = {
  child: { name: "Amina Diallo", grade: "5ème B", school: "Lycée Albert-Camus", avg: 14.8, rank: 4, total: 28 },
  parent: { name: "Fatou Diallo", email: "fatou.diallo@exemple.com", plan: "Famille", renews: "12 juin 2026" },
  subjects: [
    { name: "Mathématiques", short: "Math", grade: 16.2, trend: +0.8, color: "#3A6DBC" },
    { name: "Français",      short: "Fr",   grade: 14.5, trend: +0.4, color: "#9747BB" },
    { name: "Histoire-Géo",  short: "H-G",  grade: 13.8, trend: -0.2, color: "#C28728" },
    { name: "Sciences",      short: "SVT",  grade: 15.6, trend: +1.1, color: "#1D6650" },
    { name: "Anglais",       short: "En",   grade: 12.0, trend: -0.5, color: "#B8475B" },
    { name: "EPS",           short: "EPS",  grade: 17.0, trend: +0.0, color: "#E0701E" },
  ],
  grades: [
    { subject: "Mathématiques", kind: "Contrôle · Géométrie", score: 17, max: 20, coef: 3, date: "21 mai", teacher: "M. Ousmane Bâ" },
    { subject: "Français",      kind: "Dictée préparée",      score: 14, max: 20, coef: 1, date: "20 mai", teacher: "Mme Camara" },
    { subject: "Sciences",      kind: "Compte-rendu TP",      score: 16, max: 20, coef: 2, date: "18 mai", teacher: "Mme Ndiaye" },
    { subject: "Anglais",       kind: "Oral · Présentation",  score: 11, max: 20, coef: 2, date: "15 mai", teacher: "Mr. Adeyemi" },
    { subject: "Histoire-Géo",  kind: "Quiz chapitre 4",      score: 13, max: 20, coef: 1, date: "14 mai", teacher: "M. Traoré" },
  ],
  homework: [
    { subject: "Mathématiques", title: "Exercices p.142 · 1 à 7",                  due: "Demain · 8h00",  status: "todo" as const,       teacher: "M. Ousmane Bâ" },
    { subject: "Français",      title: "Lire chapitre 6 — Le Petit Prince",        due: "Jeudi 27 mai",   status: "inprogress" as const, teacher: "Mme Camara" },
    { subject: "Sciences",      title: "Schéma de la cellule à compléter",         due: "Vendredi 28 mai", status: "todo" as const,      teacher: "Mme Ndiaye" },
    { subject: "Anglais",       title: "Revoir vocabulaire unit 5",                due: "Lundi 31 mai",   status: "todo" as const,       teacher: "Mr. Adeyemi" },
    { subject: "Histoire-Géo",  title: "Frise chronologique Moyen-Âge",            due: "Hier",           status: "done" as const,       teacher: "M. Traoré" },
  ],
  messages: [
    { from: "Mme Camara",    subject: "Français",      preview: "Amina a fait beaucoup de progrès cette semaine…", time: "10:24", unread: true },
    { from: "M. Ousmane Bâ", subject: "Mathématiques", preview: "Merci pour le retour, voici le corrigé du dern…",  time: "Hier",  unread: false },
    { from: "Direction",     subject: "École",         preview: "Réunion parents-profs vendredi prochain à 17h.",   time: "Lun",   unread: false },
    { from: "Mme Ndiaye",    subject: "Sciences",      preview: "Le TP de demain nécessitera une blouse blanche.",  time: "Lun",   unread: true },
  ],
  notifs: [
    { kind: "grade" as const,    text: "Nouvelle note en Mathématiques : 17/20", time: "Il y a 12 min" },
    { kind: "message" as const,  text: "Mme Camara vous a envoyé un message",    time: "Il y a 1 h" },
    { kind: "hw" as const,       text: "Nouveau devoir : Exercices p.142",       time: "Il y a 3 h" },
    { kind: "school" as const,   text: "Bulletin du 2e trimestre disponible",    time: "Hier" },
    { kind: "reminder" as const, text: "Rappel : signer le bulletin avant lundi", time: "Hier" },
  ],
  weekly: [13, 14, 13.5, 15, 14.2, 15.8, 14.8],
};

export type Homework = (typeof MOCK.homework)[number];
export type Grade = (typeof MOCK.grades)[number];
export type Message = (typeof MOCK.messages)[number];
export type Notification = (typeof MOCK.notifs)[number];
export type Subject = (typeof MOCK.subjects)[number];
