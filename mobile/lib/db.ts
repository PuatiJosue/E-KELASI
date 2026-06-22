// Data layer for the mobile app.
// Each function returns mock data when Supabase isn't configured (demo mode)
// or queries Supabase live when env vars are present and a session exists.

import { supabase, isLiveMode } from "./supabase";
import { MOCK, type Grade, type Homework, type Message, type Notification, type Subject } from "./mock";

// ── Types ─────────────────────────────────────────────────────────────
export type Child = {
  id: string;
  name: string;
  grade: string;
  school: string;
  avg: number;
  rank?: number | null;
  total?: number | null;
  avatarUrl?: string | null;
  schoolPhone?: string | null;
  schoolLogoUrl?: string | null;
  sex?: string | null;
  age?: number | null;
  option?: string | null;
};

export type Thread = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
};

export type ThreadMessage = {
  id: string;
  body: string;
  fromMe: boolean;
  createdAt: string;
};

const DEMO_CHILD: Child = {
  id: "demo-amina",
  name: MOCK.child.name,
  grade: MOCK.child.grade,
  school: MOCK.child.school,
  avg: MOCK.child.avg,
  rank: MOCK.child.rank,
  total: MOCK.child.total,
};

function fmtTime(d: Date): string {
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 2) return "Hier";
  if (diff < 7) return ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()];
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtDue(due: Date): string {
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < -1) return `Il y a ${Math.abs(days)}j`;
  if (days === -1 || (days === 0 && diffMs < 0)) return "Hier";
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return `Demain · ${due.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  return `${["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][due.getDay()]} ${fmtDate(due)}`;
}

function fmtAgo(d: Date): string {
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const days = Math.round(h / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days}j`;
}

// ── Access status (école peut bloquer un parent impayé) ──────────────
// "active" : au moins un lien actif → app libre.
// "blocked" : des liens existent mais tous bloqués → app suspendue.
// "none" : aucun enfant lié encore → on ne bloque pas.
export async function getAccessStatus(): Promise<"active" | "blocked" | "none"> {
  if (!isLiveMode || !supabase) return "active";
  try {
    const { data } = await supabase.from("parent_links").select("access_status");
    if (!data || data.length === 0) return "none";
    const anyActive = data.some((l: any) => l.access_status !== "blocked");
    return anyActive ? "active" : "blocked";
  } catch {
    return "active"; // en cas d'erreur réseau, ne pas bloquer abusivement
  }
}

// ── Child (the students linked to the current parent) ────────────────

// Âge à partir d'une date de naissance ISO.
function ageFromBirth(birth: string | null | undefined): number | null {
  if (!birth) return null;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

// Moyenne générale d'un élève à partir de ses notes.
async function avgForStudent(studentId: string): Promise<number> {
  if (!supabase) return 0;
  const { data: grades } = await supabase
    .from("grades")
    .select("score, max_score, coefficient")
    .eq("student_id", studentId)
    .is("archived_at", null);
  if (!grades || grades.length === 0) return 0;
  const weighted = grades.reduce((acc: number, g: any) => acc + (g.score / g.max_score) * 20 * g.coefficient, 0);
  const totalCoef = grades.reduce((acc: number, g: any) => acc + g.coefficient, 0);
  return totalCoef > 0 ? +(weighted / totalCoef).toFixed(1) : 0;
}

// Tous les enfants actifs liés au parent connecté.
export async function listChildren(): Promise<Child[]> {
  if (!isLiveMode || !supabase) return [DEMO_CHILD];
  try {
    const { data: links } = await supabase
      .from("parent_links")
      .select("students!inner(id, full_name, class_name, grade_level, avatar_url, birth_date, sex, status, option, schools(name, phone, logo_url))")
      .eq("students.status", "active");
    if (!links) return [];
    const children: Child[] = [];
    for (const link of links as any[]) {
      const s = link.students;
      if (!s) continue;
      children.push({
        id: s.id,
        name: s.full_name,
        grade: s.class_name ?? s.grade_level,
        school: s.schools?.name ?? "",
        avg: await avgForStudent(s.id),
        avatarUrl: s.avatar_url ?? null,
        schoolPhone: s.schools?.phone ?? null,
        schoolLogoUrl: s.schools?.logo_url ?? null,
        sex: s.sex ?? null,
        age: ageFromBirth(s.birth_date),
        option: s.option ?? null,
      });
    }
    // Ordre stable (par prénom) pour un sélecteur cohérent.
    children.sort((a, b) => a.name.localeCompare(b.name));
    return children;
  } catch {
    return [];
  }
}

// Un enfant précis (par id), ou le premier enfant actif si aucun id fourni.
export async function getChild(childId?: string): Promise<Child | null> {
  if (!isLiveMode || !supabase) return DEMO_CHILD;
  const children = await listChildren();
  if (children.length === 0) return null;
  if (childId) return children.find((c) => c.id === childId) ?? null;
  return children[0];
}

// Le parent a-t-il un enfant en attente de validation par l'école ?
export async function hasPendingChild(): Promise<boolean> {
  if (!isLiveMode || !supabase) return false;
  try {
    const { data } = await supabase
      .from("parent_links")
      .select("students!inner(id)")
      .eq("students.status", "pending");
    return (data ?? []).length > 0;
  } catch {
    return false;
  }
}

// ── Annonces de l'école (Lot C) ──────────────────────────────────────
export type Announcement = {
  id: string;
  title: string;
  body: string;
  eventDate: string | null;
  createdAt: string;
};

export async function listAnnouncements(): Promise<Announcement[]> {
  if (!isLiveMode || !supabase) return [];
  try {
    const { data } = await supabase
      .from("announcements")
      .select("id, title, body, event_date, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []).map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      eventDate: a.event_date,
      createdAt: a.created_at,
    }));
  } catch {
    return [];
  }
}

// ── Documents officiels signés (Lot E2) ──────────────────────────────
export type ParentDocument = {
  id: string;
  title: string;
  period: string | null;
  signedBy: string | null;
  signatureUrl: string | null;
  verifyCode: string;
  issuedAt: string;
  studentName: string | null;
  data: any;
};

export async function listDocuments(): Promise<ParentDocument[]> {
  if (!isLiveMode || !supabase) return [];
  try {
    const { data } = await supabase
      .from("student_documents")
      .select("id, title, period, signed_by, signature_url, verify_code, issued_at, data, students(full_name)")
      .order("issued_at", { ascending: false })
      .limit(50);
    return (data ?? []).map((d: any) => ({
      id: d.id,
      title: d.title,
      period: d.period,
      signedBy: d.signed_by,
      signatureUrl: d.signature_url,
      verifyCode: d.verify_code,
      issuedAt: d.issued_at,
      studentName: d.students?.full_name ?? null,
      data: d.data,
    }));
  } catch {
    return [];
  }
}

// ── Notes regroupées par trimestre (Bulletin) ───────────────────────
import { trimesterOf } from "./trimester";

export type TrimesterReport = {
  subjects: Subject[];
  overallAvg: number;
  count: number; // nombre de cotations sur le trimestre
};

// Moyennes par matière + moyenne générale pour un trimestre donné (1-4).
export async function listTrimester(childId: string, trimester: number): Promise<TrimesterReport> {
  if (!isLiveMode || !supabase) {
    // Démo : on renvoie les matières fictives quel que soit le trimestre.
    return { subjects: MOCK.subjects, overallAvg: MOCK.child.avg, count: MOCK.subjects.length };
  }
  try {
    const { data: subjects } = await supabase.from("subjects").select("*");
    const { data: grades } = await supabase
      .from("grades")
      .select("subject_id, score, max_score, coefficient, graded_at")
      .eq("student_id", childId)
      .is("archived_at", null);
    const gradesT = (grades ?? []).filter((g: any) => trimesterOf(g.graded_at) === trimester);

    const subjectRows: Subject[] = (subjects ?? []).map((s: any) => {
      const gs = gradesT.filter((g: any) => g.subject_id === s.id);
      let avg = 0;
      if (gs.length > 0) {
        const w = gs.reduce((a: number, g: any) => a + (g.score / g.max_score) * 20 * g.coefficient, 0);
        const c = gs.reduce((a: number, g: any) => a + g.coefficient, 0);
        avg = c > 0 ? +(w / c).toFixed(1) : 0;
      }
      return { name: s.name, short: s.short_name, grade: avg || 0, trend: 0, color: s.color };
    });

    // Moyenne générale du trimestre (pondérée par coefficient sur toutes les cotes).
    let overallAvg = 0;
    if (gradesT.length > 0) {
      const w = gradesT.reduce((a: number, g: any) => a + (g.score / g.max_score) * 20 * g.coefficient, 0);
      const c = gradesT.reduce((a: number, g: any) => a + g.coefficient, 0);
      overallAvg = c > 0 ? +(w / c).toFixed(1) : 0;
    }

    // On ne garde que les matières ayant au moins une cote sur ce trimestre.
    const withGrades = subjectRows.filter((s) => s.grade > 0);
    return { subjects: withGrades, overallAvg, count: gradesT.length };
  } catch {
    return { subjects: [], overallAvg: 0, count: 0 };
  }
}

// ── Recent grades ────────────────────────────────────────────────────
export async function listGrades(limit = 20, childId?: string): Promise<Grade[]> {
  if (!isLiveMode || !supabase) return MOCK.grades;
  try {
    const id = childId ?? (await getChild())?.id;
    if (!id) return [];
    const { data } = await supabase
      .from("grades")
      .select("kind, score, max_score, coefficient, graded_at, subjects(name), profiles(full_name)")
      .eq("student_id", id)
      .is("archived_at", null)
      .order("graded_at", { ascending: false })
      .limit(limit);
    if (!data) return [];
    return data.map((g: any) => ({
      subject: g.subjects?.name ?? "",
      kind: g.kind,
      score: g.score,
      max: g.max_score,
      coef: g.coefficient,
      date: fmtDate(new Date(g.graded_at)),
      teacher: g.profiles?.full_name ?? "",
    }));
  } catch {
    return [];
  }
}

// ── Homework ─────────────────────────────────────────────────────────
export async function listHomework(className?: string): Promise<Homework[]> {
  if (!isLiveMode || !supabase) return MOCK.homework;
  try {
    const cls = className ?? (await getChild())?.grade;
    if (!cls) return [];
    const { data } = await supabase
      .from("homework")
      .select("title, due_at, status, subjects(name), profiles(full_name)")
      .eq("class_name", cls)
      .is("archived_at", null)
      .order("due_at", { ascending: true });
    if (!data) return [];
    return data.map((h: any) => ({
      subject: h.subjects?.name ?? "",
      title: h.title,
      due: fmtDue(new Date(h.due_at)),
      status: h.status as Homework["status"],
      teacher: h.profiles?.full_name ?? "",
    }));
  } catch {
    return [];
  }
}

// ── Messages list (one preview per conversation) ─────────────────────
export async function listThreads(): Promise<Thread[]> {
  if (!isLiveMode || !supabase) {
    return MOCK.messages.map((m, i) => ({
      id: String(i),
      from: m.from,
      subject: m.subject,
      preview: m.preview,
      time: m.time,
      unread: m.unread,
    }));
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: convs } = await supabase
      .from("conversations")
      .select("id, subject, last_message_at, conversation_participants!inner(user_id)")
      .eq("conversation_participants.user_id", user.id)
      .order("last_message_at", { ascending: false });
    if (!convs) return [];

    const threads: Thread[] = [];
    for (const c of convs) {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("body, read_at, sender_id, profiles(full_name)")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!lastMsg) continue;
      const senderId = (lastMsg as any).sender_id;
      threads.push({
        id: c.id,
        from: (lastMsg as any).profiles?.full_name ?? "?",
        subject: c.subject,
        preview: (lastMsg as any).body.length > 80 ? (lastMsg as any).body.slice(0, 77) + "…" : (lastMsg as any).body,
        time: fmtTime(new Date(c.last_message_at)),
        unread: senderId !== user.id && !(lastMsg as any).read_at,
      });
    }
    return threads;
  } catch {
    return [];
  }
}

// ── Conversation thread (all messages) ───────────────────────────────
export async function getThread(conversationId: string): Promise<{
  title: string;
  subtitle: string;
  messages: ThreadMessage[];
}> {
  if (!isLiveMode || !supabase) {
    return {
      title: MOCK.messages[0].from,
      subtitle: "Prof. de Français · En ligne",
      messages: [
        { id: "1", body: "Bonjour, j'ai voulu vous faire un retour sur Amina. Elle progresse vraiment bien en compréhension écrite cette semaine.", fromMe: false, createdAt: "10:24" },
        { id: "2", body: "Continuez la lecture du soir, ça porte ses fruits 🙂", fromMe: false, createdAt: "10:24" },
        { id: "3", body: "Merci beaucoup pour ce retour ! On va continuer. Le chapitre 6 est prévu pour ce soir.", fromMe: true, createdAt: "10:31" },
      ],
    };
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("not signed in");

    const { data: msgs } = await supabase
      .from("messages")
      .select("id, body, sender_id, created_at, profiles(full_name)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const { data: conv } = await supabase
      .from("conversations")
      .select("subject")
      .eq("id", conversationId)
      .single();

    // Find the "other" participant (not me)
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("user_id, profiles(full_name, role)")
      .eq("conversation_id", conversationId);
    const other = (parts ?? []).find((p: any) => p.user_id !== user.id) as any;

    return {
      title: other?.profiles?.full_name ?? "Conversation",
      subtitle: conv?.subject ?? "",
      messages: (msgs ?? []).map((m: any) => ({
        id: m.id,
        body: m.body,
        fromMe: m.sender_id === user.id,
        createdAt: fmtTime(new Date(m.created_at)),
      })),
    };
  } catch {
    return { title: "Conversation", subtitle: "", messages: [] };
  }
}

// ── Send a message in a conversation ─────────────────────────────────
export async function sendMessage(conversationId: string, body: string): Promise<ThreadMessage | null> {
  if (!isLiveMode || !supabase) {
    // Mode démo : on simule juste un message ajouté côté UI
    return {
      id: `demo-${Date.now()}`,
      body,
      fromMe: true,
      createdAt: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: user.id, body })
      .select("id, body, sender_id, created_at")
      .single();
    if (error || !data) return null;

    // Met à jour last_message_at de la conversation
    await supabase
      .from("conversations")
      .update({ last_message_at: data.created_at })
      .eq("id", conversationId);

    return {
      id: data.id,
      body: data.body,
      fromMe: data.sender_id === user.id,
      createdAt: fmtTime(new Date(data.created_at)),
    };
  } catch {
    return null;
  }
}

// ── Library ──────────────────────────────────────────────────────────
export type LibraryBook = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  subjectName: string | null;
  subjectColor: string | null;
  gradeLevel: string | null;
  addedBy: string;
  publishedYear: number | null;
  priceCents: number;          // 0 = gratuit
  currency: string;
  fileFormat: string | null;   // 'pdf' | 'epub'
  owned: boolean;              // true si gratuit ou acheté
};

const DEMO_BOOKS: LibraryBook[] = [
  {
    id: "demo-1",
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    description: "Un classique intemporel sur l'amitié et l'imagination.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/I/71OZY035QKL.jpg",
    subjectName: "Français",
    subjectColor: "#9747BB",
    gradeLevel: "5e",
    addedBy: "Mme Camara",
    publishedYear: 1943,
    priceCents: 250,
    currency: "USD",
    fileFormat: "pdf",
    owned: false,
  },
  {
    id: "demo-2",
    title: "Le théorème du perroquet",
    author: "Denis Guedj",
    description: "Un roman policier qui raconte l'histoire des mathématiques.",
    coverUrl: null,
    subjectName: "Mathématiques",
    subjectColor: "#3A6DBC",
    gradeLevel: "5e",
    addedBy: "M. Ousmane Bâ",
    publishedYear: 1998,
    priceCents: 0,
    currency: "USD",
    fileFormat: "epub",
    owned: true,
  },
];

export async function listLibrary(): Promise<LibraryBook[]> {
  if (!isLiveMode || !supabase) return DEMO_BOOKS;
  try {
    const { data } = await supabase
      .from("library_books")
      .select(
        "id, title, author, description, cover_url, grade_level, published_year, price_cents, currency, file_format, subjects(name, color), profiles(full_name)"
      )
      .order("created_at", { ascending: false });
    if (!data) return [];

    // Livres déjà achetés par le parent connecté (pour débloquer la lecture).
    const ownedIds = new Set<string>();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: purchases } = await supabase
          .from("library_purchases")
          .select("book_id")
          .eq("parent_id", user.id)
          .eq("status", "paid");
        (purchases ?? []).forEach((p: any) => ownedIds.add(p.book_id));
      }
    } catch { /* ignore */ }

    return data.map((b: any) => {
      const priceCents = b.price_cents ?? 0;
      return {
        id: b.id,
        title: b.title,
        author: b.author,
        description: b.description,
        coverUrl: b.cover_url,
        subjectName: b.subjects?.name ?? null,
        subjectColor: b.subjects?.color ?? null,
        gradeLevel: b.grade_level,
        addedBy: b.profiles?.full_name ?? "?",
        publishedYear: b.published_year,
        priceCents,
        currency: b.currency ?? "USD",
        fileFormat: b.file_format ?? null,
        owned: priceCents <= 0 || ownedIds.has(b.id),
      };
    });
  } catch {
    return [];
  }
}

export async function getBook(id: string): Promise<LibraryBook | null> {
  const all = await listLibrary();
  return all.find((b) => b.id === id) ?? null;
}

// ── Achat & lecture de livres ────────────────────────────────────────
const WEB_API = process.env.EXPO_PUBLIC_WEB_API_URL ?? "";

// Démarre un paiement Stripe (paiement unique) → renvoie l'URL Checkout à ouvrir.
export async function startBookCheckout(bookId: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isLiveMode || !supabase) return { ok: false, error: "Indisponible en démo." };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, error: "Non connecté." };
    const r = await fetch(`${WEB_API}/api/stripe/book-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ bookId }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.url) return { ok: false, error: data.error ?? "Paiement indisponible." };
    return { ok: true, url: data.url };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erreur réseau." };
  }
}

// Récupère l'URL signée du fichier (PDF/EPUB) — seulement si acheté/gratuit.
export async function getBookFileUrl(bookId: string): Promise<{ ok: true; url: string; format: string | null } | { ok: false; error: string }> {
  if (!isLiveMode || !supabase) return { ok: false, error: "Indisponible en démo." };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, error: "Non connecté." };
    const r = await fetch(`${WEB_API}/api/library/file?bookId=${encodeURIComponent(bookId)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.url) return { ok: false, error: data.error ?? "Fichier indisponible." };
    return { ok: true, url: data.url, format: data.format ?? null };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erreur réseau." };
  }
}

// Soumet un achat par Mobile Money (validation manuelle par un admin).
export async function createBookMobileMoneyPurchase(args: {
  bookId: string;
  amountCents: number;
  currency: string;
  provider: string;
  senderPhone: string;
  reference: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isLiveMode || !supabase) return { ok: true };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Non connecté." };
    const { error } = await supabase.from("library_purchases").insert({
      book_id: args.bookId,
      parent_id: user.id,
      amount_cents: args.amountCents,
      currency: args.currency,
      method: "mobile_money",
      status: "pending",
      provider: args.provider as any,
      sender_phone: args.senderPhone,
      reference: args.reference,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erreur réseau." };
  }
}

// ── Notifications ────────────────────────────────────────────────────
export async function listNotifications(): Promise<Notification[]> {
  if (!isLiveMode || !supabase) return MOCK.notifs;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("notifications")
      .select("kind, body, payload, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (!data) return [];
    return data.map((n: any) => ({
      kind: n.kind as Notification["kind"],
      text: n.body,
      time: fmtAgo(new Date(n.created_at)),
      fileUrl: n.payload?.file_url,
    }));
  } catch {
    return [];
  }
}
