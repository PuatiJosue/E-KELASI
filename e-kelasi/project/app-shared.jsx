// E-KELASI — Shared icons, mock data, helpers
// All visible strings carry FR + EN keys; <T> reads `lang` from context.

const LangCtx = React.createContext('fr');
const useLang = () => React.useContext(LangCtx);
const T = ({ fr, en }) => {
  const lang = useLang();
  return <>{lang === 'en' ? en : fr}</>;
};

// ── Icon set ─────────────────────────────────────────────
// Single-line stroke icons, currentColor. Crisp at 18-24px.
const Icon = ({ name, size = 20, stroke = 1.7, style }) => {
  const paths = {
    home:      'M3 11l9-8 9 8M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
    chart:     'M3 21h18M6 17v-6m5 6V8m5 9v-9m5 9V5',
    book:      'M4 4h6a3 3 0 0 1 3 3v14a2.5 2.5 0 0 0-2.5-2.5H4zM20 4h-6a3 3 0 0 0-3 3v14a2.5 2.5 0 0 1 2.5-2.5H20z',
    chat:      'M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5A8 8 0 1 1 21 12z',
    bell:      'M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 0 0 4 0',
    user:      'M5.5 21a6.5 6.5 0 0 1 13 0M12 14a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z',
    settings:  'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    search:    'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    plus:      'M12 5v14M5 12h14',
    check:     'M5 12.5l5 5L20 7',
    chevR:     'M9 6l6 6-6 6',
    chevD:     'M6 9l6 6 6-6',
    chevL:     'M15 6l-6 6 6 6',
    chevU:     'M6 15l6-6 6 6',
    arrowR:    'M5 12h14M13 5l7 7-7 7',
    arrowUp:   'M12 19V5M5 12l7-7 7 7',
    arrowDn:   'M12 5v14M5 12l7 7 7-7',
    close:     'M6 6l12 12M18 6L6 18',
    calendar:  'M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 3v4M16 3v4',
    clock:     'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    file:      'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6',
    download:  'M12 3v12M6 11l6 6 6-6M4 21h16',
    upload:    'M12 21V9M18 13l-6-6-6 6M4 3h16',
    star:      'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2-4.5-4.4 6.2-.9z',
    bookmark:  'M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
    school:    'M3 10l9-5 9 5-9 5-9-5zM5 12v6c0 1 3 3 7 3s7-2 7-3v-6M21 10v8',
    users:     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    dollar:    'M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    creditcard:'M3 10h18M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
    shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    activity:  'M22 12h-4l-3 9L9 3l-3 9H2',
    pieChart:  'M21 12A9 9 0 1 1 12 3v9z',
    flag:      'M4 21V4a1 1 0 0 1 1-1h12l-2 5 2 5H5M4 21v-7',
    paperclip: 'M21 11l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8',
    send:      'M22 2L11 13M22 2l-7 20-4-9-9-4z',
    edit:      'M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z',
    trash:     'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    filter:    'M3 4h18l-7 9v7l-4-2v-5z',
    moon:      'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z',
    sun:       'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    heart:     'M21 8.5a5.5 5.5 0 0 0-9-4 5.5 5.5 0 0 0-9 4c0 5.5 9 11 9 11s9-5.5 9-11z',
    layers:    'M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    grid:      'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    lock:      'M5 11h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
    mail:      'M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 7l9 7 9-7',
    eye:       'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    refresh:   'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
    award:     'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
    flame:     'M12 22a7 7 0 0 0 7-7c0-2-1-4-3-7l-1 1a3 3 0 0 1-5-2c0-2 1-3 1-4 0-1-1-2-2-2-4 3-7 7-7 12a7 7 0 0 0 7 7',
    target:    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0',
    log:       'M21 11H7m14 4H7m14 4H7M3 5h18M3 9h2M3 13h2M3 17h2',
    sparkle:   'M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6zM19 3l.6 1.8L21 5l-1.4.6L19 7l-.6-1.8L17 5l1.8-.6zM5 17l.6 1.8L7 19l-1.4.6L5 21l-.6-1.8L3 19l1.8-.6z',
    zap:       'M13 2L3 14h7v8l10-12h-7z',
    play:      'M5 3l14 9-14 9z',
  };
  const d = paths[name] || paths.home;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
};

// ── Avatar — initials on a deterministic warm tint ───────
const AVA_TINTS = [
  ['#E0701E','#FDF3E7'], ['#1D6650','#ECF6F1'], ['#3A6DBC','#E8F0FB'],
  ['#9747BB','#F3E8FA'], ['#C28728','#FBF1D9'], ['#B8475B','#FBE6EC'],
];
function Avatar({ name = '?', size = 36, style }) {
  const initials = String(name).split(' ').map(s => s[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
  const code = [...String(name)].reduce((a,c) => a + c.charCodeAt(0), 0);
  const [fg, bg] = AVA_TINTS[code % AVA_TINTS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, fontFamily: 'var(--font-display)',
      flexShrink: 0, ...style,
    }}>{initials}</div>
  );
}

// ── E-KELASI logo — a soft "K" mark in brand color ──────
function Logo({ size = 28, withWord = false, style }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}>
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="9" fill="var(--brand)"/>
        <path d="M10 8v16M10 16l7-8M10 16l8 8" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      {withWord && (
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: size * 0.7, fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.03em',
        }}>E-KELASI</span>
      )}
    </div>
  );
}

// ── Mock data ─────────────────────────────────────────────
const MOCK = {
  child: { name: 'Amina Diallo', grade: '5ème B', school: 'Lycée Albert-Camus', avg: 14.8, rank: 4, total: 28 },
  parent: { name: 'Fatou Diallo', plan: 'Famille', renews: '12 juin 2026' },
  subjects: [
    { name: 'Mathématiques', short: 'Math', grade: 16.2, trend: +0.8, color: '#3A6DBC' },
    { name: 'Français',      short: 'Fr',   grade: 14.5, trend: +0.4, color: '#9747BB' },
    { name: 'Histoire-Géo',  short: 'H-G',  grade: 13.8, trend: -0.2, color: '#C28728' },
    { name: 'Sciences',      short: 'SVT',  grade: 15.6, trend: +1.1, color: '#1D6650' },
    { name: 'Anglais',       short: 'En',   grade: 12.0, trend: -0.5, color: '#B8475B' },
    { name: 'EPS',           short: 'EPS',  grade: 17.0, trend: +0.0, color: '#E0701E' },
  ],
  grades: [
    { subject: 'Mathématiques', kind: 'Contrôle · Géométrie', score: 17, max: 20, coef: 3, date: '21 mai', teacher: 'M. Ousmane Bâ' },
    { subject: 'Français',      kind: 'Dictée préparée',       score: 14, max: 20, coef: 1, date: '20 mai', teacher: 'Mme Camara' },
    { subject: 'Sciences',      kind: 'Compte-rendu TP',       score: 16, max: 20, coef: 2, date: '18 mai', teacher: 'Mme Ndiaye' },
    { subject: 'Anglais',       kind: 'Oral · Présentation',   score: 11, max: 20, coef: 2, date: '15 mai', teacher: 'Mr. Adeyemi' },
    { subject: 'Histoire-Géo',  kind: 'Quiz chapitre 4',       score: 13, max: 20, coef: 1, date: '14 mai', teacher: 'M. Traoré' },
  ],
  homework: [
    { subject: 'Mathématiques', title: 'Exercices p.142 · 1 à 7', due: 'Demain · 8h00', status: 'todo',     teacher: 'M. Ousmane Bâ' },
    { subject: 'Français',      title: 'Lire chapitre 6 — Le Petit Prince', due: 'Jeudi 27 mai', status: 'inprogress', teacher: 'Mme Camara' },
    { subject: 'Sciences',      title: 'Schéma de la cellule à compléter',  due: 'Vendredi 28 mai', status: 'todo',  teacher: 'Mme Ndiaye' },
    { subject: 'Anglais',       title: 'Revoir vocabulaire unit 5',         due: 'Lundi 31 mai', status: 'todo',  teacher: 'Mr. Adeyemi' },
    { subject: 'Histoire-Géo',  title: 'Frise chronologique Moyen-Âge',     due: 'Hier',         status: 'done',  teacher: 'M. Traoré' },
  ],
  messages: [
    { from: 'Mme Camara',     subject: 'Français',      preview: 'Amina a fait beaucoup de progrès cette semaine…', time: '10:24', unread: true,  avatar: 'M C' },
    { from: 'M. Ousmane Bâ',  subject: 'Mathématiques', preview: 'Merci pour le retour, voici le corrigé du dern…', time: 'Hier',  unread: false, avatar: 'O B' },
    { from: 'Direction',      subject: 'École',         preview: 'Réunion parents-profs vendredi prochain à 17h.',  time: 'Lun',   unread: false, avatar: 'D' },
    { from: 'Mme Ndiaye',     subject: 'Sciences',      preview: 'Le TP de demain nécessitera une blouse blanche.', time: 'Lun',   unread: true,  avatar: 'F N' },
  ],
  notifs: [
    { kind: 'grade',   text: 'Nouvelle note en Mathématiques : 17/20', time: 'Il y a 12 min' },
    { kind: 'message', text: 'Mme Camara vous a envoyé un message',     time: 'Il y a 1 h' },
    { kind: 'hw',      text: 'Nouveau devoir : Exercices p.142',         time: 'Il y a 3 h' },
    { kind: 'school',  text: 'Bulletin du 2e trimestre disponible',      time: 'Hier' },
    { kind: 'reminder',text: 'Rappel : signer le bulletin avant lundi',  time: 'Hier' },
  ],
  weekly: [13, 14, 13.5, 15, 14.2, 15.8, 14.8], // last 7 graded items, avg of period
};

// Sparkline helper
function Sparkline({ values, w = 80, h = 28, color = 'var(--brand)' }) {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) / (values.length - 1) * w} cy={h - ((values[values.length-1] - min) / range) * (h - 4) - 2} r="2.5" fill={color}/>
    </svg>
  );
}

// Grade ring (0..20)
function GradeRing({ value, max = 20, size = 64, stroke = 6, color = 'var(--brand)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / max));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .6s ease' }}/>
    </svg>
  );
}

Object.assign(window, { LangCtx, useLang, T, Icon, Avatar, Logo, MOCK, Sparkline, GradeRing });
