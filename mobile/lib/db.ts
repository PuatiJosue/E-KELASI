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

// ── Child (the student linked to the current parent) ─────────────────
export async function getChild(): Promise<Child | null> {
  if (!isLiveMode || !supabase) return DEMO_CHILD;
  try {
    const { data: links } = await supabase
      .from("parent_links")
      .select("students(id, full_name, class_name, grade_level, avatar_url, schools(name))")
      .limit(1)
      .single();
    if (!links || !(links as any).students) return null;
    const s = (links as any).students;
    const studentId = s.id;

    // Compute average across all grades
    const { data: grades } = await supabase
      .from("grades")
      .select("score, max_score, coefficient")
      .eq("student_id", studentId)
      .is("archived_at", null);
    let avg = 0;
    if (grades && grades.length > 0) {
      const weighted = grades.reduce((acc: number, g: any) => acc + (g.score / g.max_score) * 20 * g.coefficient, 0);
      const totalCoef = grades.reduce((acc: number, g: any) => acc + g.coefficient, 0);
      avg = totalCoef > 0 ? +(weighted / totalCoef).toFixed(1) : 0;
    }

    return {
      id: studentId,
      name: s.full_name,
      grade: s.class_name ?? s.grade_level,
      school: s.schools?.name ?? "",
      avg,
      avatarUrl: s.avatar_url ?? null,
    };
  } catch {
    return null;
  }
}

// ── Subjects with current average (for Grades screen) ────────────────
export async function listSubjects(): Promise<Subject[]> {
  if (!isLiveMode || !supabase) return MOCK.subjects;
  try {
    const child = await getChild();
    if (!child) return [];
    const { data: subjects } = await supabase.from("subjects").select("*");
    if (!subjects) return [];
    const { data: grades } = await supabase
      .from("grades")
      .select("subject_id, score, max_score, coefficient")
      .eq("student_id", child.id)
      .is("archived_at", null);
    return subjects.map((s: any) => {
      const gs = (grades ?? []).filter((g: any) => g.subject_id === s.id);
      let avg = 0;
      if (gs.length > 0) {
        const w = gs.reduce((a: number, g: any) => a + (g.score / g.max_score) * 20 * g.coefficient, 0);
        const c = gs.reduce((a: number, g: any) => a + g.coefficient, 0);
        avg = c > 0 ? +(w / c).toFixed(1) : 0;
      }
      return { name: s.name, short: s.short_name, grade: avg || 0, trend: 0, color: s.color };
    });
  } catch {
    return [];
  }
}

// ── Recent grades ────────────────────────────────────────────────────
export async function listGrades(limit = 20): Promise<Grade[]> {
  if (!isLiveMode || !supabase) return MOCK.grades;
  try {
    const child = await getChild();
    if (!child) return [];
    const { data } = await supabase
      .from("grades")
      .select("kind, score, max_score, coefficient, graded_at, subjects(name), profiles(full_name)")
      .eq("student_id", child.id)
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
export async function listHomework(): Promise<Homework[]> {
  if (!isLiveMode || !supabase) return MOCK.homework;
  try {
    const child = await getChild();
    if (!child) return [];
    const { data } = await supabase
      .from("homework")
      .select("title, due_at, status, subjects(name), profiles(full_name)")
      .eq("class_name", child.grade)
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
  },
];

export async function listLibrary(): Promise<LibraryBook[]> {
  if (!isLiveMode || !supabase) return DEMO_BOOKS;
  try {
    const { data } = await supabase
      .from("library_books")
      .select(
        "id, title, author, description, cover_url, grade_level, published_year, subjects(name, color), profiles(full_name)"
      )
      .order("created_at", { ascending: false });
    if (!data) return [];
    return data.map((b: any) => ({
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
    }));
  } catch {
    return [];
  }
}

export async function getBook(id: string): Promise<LibraryBook | null> {
  const all = await listLibrary();
  return all.find((b) => b.id === id) ?? null;
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
