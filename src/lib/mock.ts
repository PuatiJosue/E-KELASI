// Mock data used while Supabase is not provisioned.
// Numbers and labels match the E-KELASI design prototype.

export const MOCK_MRR_12M = [18, 19.2, 21, 22.5, 24, 26.5, 28, 30.2, 32.5, 34, 37, 39.4].map(
  (v) => v * 1000
);

export const MOCK_TOP_SCHOOLS = [
  { name: "Lycée Albert-Camus",   city: "Dakar, SN",    parents: 312, mrr: "€3 120", growth: "+8%" },
  { name: "École Sainte-Thérèse", city: "Montréal, CA", parents: 286, mrr: "€2 860", growth: "+12%" },
  { name: "Institut Lumière",     city: "Abidjan, CI",  parents: 224, mrr: "€2 240", growth: "+5%" },
  { name: "Collège Saint-Joseph", city: "Lyon, FR",     parents: 198, mrr: "€1 980", growth: "+3%" },
  { name: "École les Acacias",    city: "Yaoundé, CM",  parents: 156, mrr: "€1 560", growth: "+18%" },
];

export const MOCK_SCHOOLS = [
  { name: "Lycée Albert-Camus",   city: "Dakar, SN",    plan: "Pro",      parents: 312, teachers: 48, mrr: "€3 120", status: "active",     since: "Sept 2024" },
  { name: "École Sainte-Thérèse", city: "Montréal, CA", plan: "Pro",      parents: 286, teachers: 36, mrr: "€2 860", status: "active",     since: "Janv 2025" },
  { name: "Institut Lumière",     city: "Abidjan, CI",  plan: "Standard", parents: 224, teachers: 31, mrr: "€2 240", status: "active",     since: "Mars 2025" },
  { name: "Collège Saint-Joseph", city: "Lyon, FR",     plan: "Standard", parents: 198, teachers: 28, mrr: "€1 980", status: "active",     since: "Sept 2025" },
  { name: "École les Acacias",    city: "Yaoundé, CM",  plan: "Standard", parents: 156, teachers: 22, mrr: "€1 560", status: "trial",      since: "Mai 2026" },
  { name: "Lycée Lumière",        city: "Casablanca, MA", plan: "Pro",    parents: 0,   teachers: 0,  mrr: "—",      status: "onboarding", since: "Mai 2026" },
  { name: "École Tunis-Centre",   city: "Tunis, TN",    plan: "Standard", parents: 89,  teachers: 14, mrr: "€890",   status: "active",     since: "Nov 2025" },
  { name: "Collège Mermoz",       city: "Nouakchott, MR", plan: "Standard", parents: 132, teachers: 19, mrr: "€1 320", status: "active",   since: "Avr 2025" },
];

export type PaymentRow = {
  parent: string;
  plan: "Essentiel" | "Famille" | "Premium";
  amount: string;
  status: "paid" | "failed" | "refunded";
  date: string;
};

export const MOCK_PAYMENTS: PaymentRow[] = [
  { parent: "Fatou Diallo",  plan: "Famille",   amount: "€19.00", status: "paid",     date: "24 mai 14:12" },
  { parent: "Karim Benali",  plan: "Essentiel", amount: "€9.00",  status: "paid",     date: "24 mai 12:40" },
  { parent: "Sophie Roux",   plan: "Premium",   amount: "€29.00", status: "paid",     date: "24 mai 11:08" },
  { parent: "Antoine Mboma", plan: "Essentiel", amount: "€9.00",  status: "failed",   date: "24 mai 09:32" },
  { parent: "Aïcha Traoré",  plan: "Famille",   amount: "€19.00", status: "paid",     date: "24 mai 08:15" },
  { parent: "Marc Dupont",   plan: "Essentiel", amount: "€9.00",  status: "refunded", date: "23 mai 18:48" },
  { parent: "Léa Robert",    plan: "Famille",   amount: "€19.00", status: "paid",     date: "23 mai 16:20" },
];

export type Ticket = {
  id: string;
  title: { fr: string; en: string };
  who: string;
  tag: string;
  pri: "P0" | "P1" | "P2" | "P3";
};

export const MOCK_TICKETS: Record<string, Ticket[]> = {
  new: [
    { id: "#1503", title: { fr: "Notification absente après nouvelle note", en: "No notification after new grade" }, who: "Aïcha Traoré", tag: "Bug", pri: "P2" },
    { id: "#1502", title: { fr: "Comment ajouter un 2e enfant ?",            en: "How to add a 2nd child?" },         who: "Karim Benali", tag: "Question", pri: "P3" },
    { id: "#1501", title: { fr: "Bulletin PDF illisible",                    en: "PDF report card unreadable" },      who: "École Lumière", tag: "Bug", pri: "P1" },
  ],
  pending: [
    { id: "#1498", title: { fr: "Mode hors-ligne sur Android",  en: "Offline mode on Android" },     who: "Sophie Roux",         tag: "Feature", pri: "P3" },
    { id: "#1495", title: { fr: "SSO Microsoft pour profs",     en: "Microsoft SSO for teachers" },  who: "Lycée Albert-Camus",  tag: "Demande", pri: "P2" },
  ],
  waiting: [
    { id: "#1490", title: { fr: "Devis abonnement annuel", en: "Annual plan quote" }, who: "Sainte-Thérèse", tag: "Sales", pri: "P3" },
  ],
  resolved: [
    { id: "#1487", title: { fr: "Erreur paiement renouvellement", en: "Renewal payment error" }, who: "Marc Dupont", tag: "Billing", pri: "P2" },
    { id: "#1486", title: { fr: "Reset mot de passe parent",      en: "Parent password reset" },  who: "Léa Robert",  tag: "Account", pri: "P3" },
  ],
};

export type LogEvent = {
  sev: "info" | "warn" | "critical";
  actor: string;
  msg: { fr: string; en: string };
  ts: string;
  src: string;
};

export const MOCK_LOGS: LogEvent[] = [
  { sev: "info",     actor: "system",         src: "cron",    msg: { fr: "Sauvegarde quotidienne terminée · 8.4 GB",                 en: "Daily backup completed · 8.4 GB" },                       ts: "14:30:12" },
  { sev: "info",     actor: "fatou.diallo",   src: "auth",    msg: { fr: "Connexion réussie · iOS",                                  en: "Login success · iOS" },                                   ts: "14:28:54" },
  { sev: "warn",     actor: "system",         src: "metrics", msg: { fr: "Latence DB élevée détectée (p95 = 412ms)",                 en: "Elevated DB latency (p95 = 412ms)" },                     ts: "14:25:11" },
  { sev: "info",     actor: "yann.mbaye",     src: "admin",   msg: { fr: "Modification plan tarifaire · École Lumière",              en: "Pricing plan change · École Lumière" },                   ts: "14:18:03" },
  { sev: "critical", actor: "security-bot",   src: "auth",    msg: { fr: "5 tentatives login échouées · IP 41.83.x.x · bloquée 24h", en: "5 failed login attempts · IP 41.83.x.x · blocked 24h" }, ts: "14:11:47" },
  { sev: "info",     actor: "stripe-webhook", src: "webhook", msg: { fr: "invoice.payment_succeeded · cust_4QzN…",                   en: "invoice.payment_succeeded · cust_4QzN…" },                ts: "14:08:21" },
  { sev: "warn",     actor: "system",         src: "storage", msg: { fr: "Quota S3 à 78% · bucket ekelasi-uploads-prod",             en: "S3 quota at 78% · bucket ekelasi-uploads-prod" },         ts: "13:55:09" },
  { sev: "info",     actor: "aicha.traore",   src: "auth",    msg: { fr: "Mot de passe changé",                                      en: "Password changed" },                                      ts: "13:42:38" },
  { sev: "info",     actor: "system",         src: "deploy",  msg: { fr: "Déploiement v2.4.1 · 0 erreur",                            en: "Deploy v2.4.1 · 0 errors" },                              ts: "13:30:00" },
  { sev: "info",     actor: "lycee-camus.adm",src: "reports", msg: { fr: "Export bulletin PDF · 312 élèves",                         en: "Report card PDF export · 312 students" },                 ts: "13:21:14" },
];
