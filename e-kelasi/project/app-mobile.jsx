// E-KELASI — Parent mobile prototype (iOS, 402×874)
// Self-contained navigator; initial screen is configurable so each canvas
// artboard can show a different starting point.

// ── Shell ──────────────────────────────────────────────
function MobileShell({ children, dark }) {
  return (
    <div data-theme={dark ? 'dark' : 'light'} className="ek-app" style={{
      width: '100%', height: '100%', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', position: 'relative',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

// Status bar (compact). The IOSDevice already paints time + signals; this is
// just spacer so our content doesn't sit under the dynamic island.
function StatusSpacer() {
  return <div style={{ height: 56, flexShrink: 0 }} />;
}

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'home',     icon: 'home',  fr: 'Accueil',  en: 'Home' },
    { id: 'grades',   icon: 'chart', fr: 'Notes',    en: 'Grades' },
    { id: 'homework', icon: 'book',  fr: 'Devoirs',  en: 'Homework' },
    { id: 'messages', icon: 'chat',  fr: 'Messages', en: 'Messages' },
    { id: 'profile',  icon: 'user',  fr: 'Profil',   en: 'Profile' },
  ];
  return (
    <div style={{
      flexShrink: 0,
      padding: '6px 8px 26px',
      background: 'var(--surface)',
      borderTop: '1px solid var(--divider)',
      display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 10px', borderRadius: 12,
            color: on ? 'var(--brand)' : 'var(--ink-3)',
          }}>
            <Icon name={t.icon} size={22} stroke={on ? 2 : 1.7} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500, letterSpacing: '-0.005em' }}>
              <T fr={t.fr} en={t.en} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── 1. Welcome / Login ─────────────────────────────────
function ScreenWelcome({ go }) {
  return (
    <MobileShellNoTabs>
      <StatusSpacer />
      <div style={{ flex: 1, padding: '24px 24px 0', display: 'flex', flexDirection: 'column' }}>
        <Logo size={44} withWord />

        <div style={{ marginTop: 56 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 38, lineHeight: 1.05, color: 'var(--ink)', letterSpacing: '-0.035em',
            textWrap: 'pretty',
          }}>
            <T fr="Suivez la réussite de votre enfant," en="Follow your child's school journey," />
            <span style={{ color: 'var(--brand)' }}> <T fr="au quotidien." en="every day." /></span>
          </div>
          <div style={{ marginTop: 18, fontSize: 16, lineHeight: 1.5, color: 'var(--ink-2)' }}>
            <T
              fr="Notes, devoirs, messages des professeurs — toute la vie scolaire dans une app pensée pour les parents."
              en="Grades, homework, teacher messages — your child's school life in one app, built for parents."
            />
          </div>
        </div>

        {/* preview card */}
        <div className="ek-card" style={{
          marginTop: 'auto', marginBottom: 18,
          padding: 16, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ position: 'relative' }}>
            <Avatar name="Amina Diallo" size={46} />
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--accent)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--surface)',
            }}>
              <Icon name="check" size={11} stroke={3} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
              <T fr="Nouvelle note en Mathématiques" en="New grade in Mathematics" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              <T fr="Amina a obtenu 17/20" en="Amina scored 17/20" /> · 12 min
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="ek-btn ek-btn-primary" style={{ height: 52, fontSize: 15.5, borderRadius: 14 }} onClick={() => go('home')}>
          <T fr="Commencer l'essai gratuit · 14 jours" en="Start free trial · 14 days" />
        </button>
        <button className="ek-btn ek-btn-ghost" style={{ height: 44, fontSize: 14 }} onClick={() => go('home')}>
          <T fr="J'ai déjà un compte" en="I already have an account" />
        </button>
      </div>
    </MobileShellNoTabs>
  );
}

function MobileShellNoTabs({ children }) {
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</div>;
}

// ── 2. Dashboard ───────────────────────────────────────
function ScreenHome({ go }) {
  return (
    <ScrollScreen>
      <HeaderGreeting onBell={() => go('notifications')} />
      <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <ChildHero onMore={() => go('grades')} />

        {/* Today's grades — sleek timeline */}
        <SectionTitle title={{ fr: "Nouvelles notes", en: "New grades" }} action={{ fr: "Tout voir", en: "See all", onClick: () => go('grades') }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOCK.grades.slice(0, 2).map((g, i) => <GradeRow key={i} g={g} />)}
        </div>

        {/* Devoirs aperçu */}
        <SectionTitle title={{ fr: "À faire pour demain", en: "Due tomorrow" }} action={{ fr: "Tout voir", en: "See all", onClick: () => go('homework') }} />
        <HomeworkCard hw={MOCK.homework[0]} />

        {/* Messages preview */}
        <SectionTitle title={{ fr: "Messagerie", en: "Inbox" }} action={{ fr: "Ouvrir", en: "Open", onClick: () => go('messages') }} />
        <div className="ek-card" style={{ padding: 4 }}>
          {MOCK.messages.slice(0, 2).map((m, i) => (
            <MessageRow key={i} m={m} divider={i < 1} onClick={() => go('thread')} />
          ))}
        </div>
      </div>
    </ScrollScreen>
  );
}

function HeaderGreeting({ onBell }) {
  return (
    <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Logo size={26} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>
          <T fr="Bonjour" en="Hello" />,
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{MOCK.parent.name}</div>
      </div>
      <button onClick={onBell} style={{
        width: 40, height: 40, borderRadius: 12, background: 'var(--surface)',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-2)', position: 'relative',
      }}>
        <Icon name="bell" size={20} />
        <span style={{
          position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%',
          background: 'var(--brand)', border: '2px solid var(--surface)',
        }} />
      </button>
    </div>
  );
}

function ChildHero({ onMore }) {
  const c = MOCK.child;
  return (
    <div className="ek-card" style={{
      padding: 18, background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-600) 100%)',
      color: 'white', border: 'none',
      boxShadow: '0 8px 28px rgba(224,112,30,0.25)',
      position: 'relative', overflow: 'hidden',
    }}>
      <svg style={{ position: 'absolute', top: -20, right: -20, opacity: 0.18 }} width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
        <path d="M3 10l9-5 9 5-9 5-9-5zM5 12v6c0 1 3 3 7 3s7-2 7-3v-6"/>
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={c.name} size={52} style={{ border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <T fr="Mon enfant" en="My child" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{c.name}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 1 }}>{c.grade} · {c.school}</div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>
            <T fr="Moyenne générale" en="Overall average" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1 }}>{c.avg}</span>
            <span style={{ fontSize: 14, opacity: 0.85 }}>/20</span>
            <span style={{
              fontSize: 11, fontWeight: 700, marginLeft: 4,
              padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.2)',
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              <Icon name="arrowUp" size={10} stroke={3} /> +0.4
            </span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6 }}>
            <T fr={`Rang ${c.rank} sur ${c.total}`} en={`Rank ${c.rank} of ${c.total}`} />
          </div>
        </div>
        <Sparkline values={MOCK.weekly} w={92} h={36} color="white" />
      </div>
    </div>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
        <T fr={title.fr} en={title.en} />
      </div>
      {action && (
        <button onClick={action.onClick} style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-600)' }}>
          <T fr={action.fr} en={action.en} />
        </button>
      )}
    </div>
  );
}

function GradeRow({ g }) {
  const subj = MOCK.subjects.find(s => s.name === g.subject) || MOCK.subjects[0];
  const pct = g.score / g.max;
  const tone = pct >= 0.75 ? 'success' : pct >= 0.5 ? 'warn' : 'danger';
  return (
    <div className="ek-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, background: subj.color + '22',
        color: subj.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 11, fontFamily: 'var(--font-display)',
      }}>{subj.short}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.kind}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{g.subject} · {g.date}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
          color: tone === 'success' ? 'var(--accent)' : tone === 'warn' ? 'var(--warning)' : 'var(--danger)',
        }}>{g.score}<span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>/{g.max}</span></div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>coef. {g.coef}</div>
      </div>
    </div>
  );
}

function HomeworkCard({ hw }) {
  const subj = MOCK.subjects.find(s => s.name === hw.subject) || MOCK.subjects[0];
  return (
    <div className="ek-card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, background: subj.color + '22',
          color: subj.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="file" size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{hw.title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{hw.subject} · {hw.teacher}</div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ek-chip warn"><Icon name="clock" size={11} stroke={2.4}/> {hw.due}</span>
            <button style={{
              marginLeft: 'auto', fontSize: 12, fontWeight: 600,
              padding: '6px 10px', borderRadius: 8, color: 'var(--brand-600)',
              background: 'var(--brand-soft)',
            }}>
              <T fr="Voir" en="Open" /> →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ m, divider, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
      borderBottom: divider ? '1px solid var(--divider)' : 'none',
      width: '100%', textAlign: 'left',
    }}>
      <Avatar name={m.from} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{m.from}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>· {m.subject}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>{m.time}</span>
        </div>
        <div style={{
          fontSize: 12.5, color: m.unread ? 'var(--ink)' : 'var(--ink-3)',
          fontWeight: m.unread ? 600 : 400,
          marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{m.preview}</div>
      </div>
      {m.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
    </button>
  );
}

// ── 3. Grades / Notes ────────────────────────────────
function ScreenGrades() {
  const [period, setPeriod] = React.useState('t2');
  const periods = [
    { id: 't1', fr: 'T1', en: 'T1' },
    { id: 't2', fr: 'T2', en: 'T2' },
    { id: 't3', fr: 'T3', en: 'T3' },
    { id: 'all',fr: 'Année', en: 'Year' },
  ];
  return (
    <ScrollScreen>
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          <T fr="Bulletin" en="Report card" />
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ink)' }}>
          <T fr="Notes & moyennes" en="Grades & averages" />
        </div>
      </div>

      {/* period switcher */}
      <div style={{ padding: '8px 20px 12px' }}>
        <div style={{
          display: 'flex', background: 'var(--surface-2)', borderRadius: 12, padding: 4,
        }}>
          {periods.map(p => {
            const on = period === p.id;
            return (
              <button key={p.id} onClick={() => setPeriod(p.id)} style={{
                flex: 1, padding: '8px 10px', borderRadius: 9,
                background: on ? 'var(--surface)' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-3)',
                fontSize: 12.5, fontWeight: 600,
                boxShadow: on ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}><T fr={p.fr} en={p.en} /></button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* big avg */}
        <div className="ek-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
          <GradeRing value={MOCK.child.avg} size={72} stroke={7} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <T fr="Moyenne T2" en="Term 2 average" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ink)' }}>{MOCK.child.avg}</span>
              <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>/20</span>
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ek-chip success"><Icon name="arrowUp" size={11} stroke={3} /> +0.4 <T fr="vs T1" en="vs T1" /></span>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}><T fr="Classement" en="Rank" /> {MOCK.child.rank}/{MOCK.child.total}</span>
            </div>
          </div>
        </div>

        {/* by subject */}
        <div className="ek-card" style={{ padding: 4 }}>
          {MOCK.subjects.map((s, i) => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderBottom: i < MOCK.subjects.length - 1 ? '1px solid var(--divider)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11, background: s.color + '22',
                color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
              }}>{s.short}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{s.name}</div>
                <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(s.grade/20)*100}%`, background: s.color, borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                  {s.grade.toFixed(1)}<span style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>/20</span>
                </div>
                <div style={{ fontSize: 10.5, color: s.trend >= 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                  <Icon name={s.trend >= 0 ? 'arrowUp' : 'arrowDn'} size={10} stroke={3}/>
                  {s.trend >= 0 ? '+' : ''}{s.trend.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollScreen>
  );
}

// ── 4. Homework / Devoirs ────────────────────────────
function ScreenHomework() {
  const [filter, setFilter] = React.useState('all');
  const filters = [
    { id: 'all',     fr: 'Tous',       en: 'All',       count: MOCK.homework.length },
    { id: 'todo',    fr: 'À faire',    en: 'To do',     count: MOCK.homework.filter(h=>h.status==='todo').length },
    { id: 'done',    fr: 'Terminés',   en: 'Done',      count: MOCK.homework.filter(h=>h.status==='done').length },
  ];
  const items = filter === 'all' ? MOCK.homework : MOCK.homework.filter(h => h.status === filter);

  return (
    <ScrollScreen>
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <T fr="Devoirs & exercices" en="Homework & exercises" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            <T fr="Cette semaine" en="This week" />
          </div>
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-2)',
        }}>
          <Icon name="filter" size={18} />
        </button>
      </div>

      {/* filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 20px 14px', overflowX: 'auto' }}>
        {filters.map(f => {
          const on = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 12px', borderRadius: 999,
              background: on ? 'var(--ink)' : 'var(--surface)',
              color: on ? 'var(--surface)' : 'var(--ink-2)',
              border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
              fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <T fr={f.fr} en={f.en} />
              <span style={{ opacity: 0.6 }}>{f.count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((h, i) => <HomeworkCard key={i} hw={h} />)}
      </div>
    </ScrollScreen>
  );
}

// ── 5. Messages list ─────────────────────────────────
function ScreenMessages({ go }) {
  return (
    <ScrollScreen>
      <div style={{ padding: '16px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <T fr="Conversations" en="Conversations" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            <T fr="Messagerie" en="Inbox" /></div>
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'var(--brand)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(224,112,30,0.3)',
        }}>
          <Icon name="edit" size={17} stroke={2} />
        </button>
      </div>

      {/* search */}
      <div style={{ padding: '12px 20px 14px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 12,
          background: 'var(--surface-2)',
          color: 'var(--ink-3)', fontSize: 13.5,
        }}>
          <Icon name="search" size={16} />
          <T fr="Rechercher un professeur, un sujet…" en="Search a teacher, a subject…" />
        </div>
      </div>

      <div className="ek-card" style={{ margin: '0 20px 20px', padding: 4 }}>
        {MOCK.messages.map((m, i) => (
          <MessageRow key={i} m={m} divider={i < MOCK.messages.length - 1} onClick={() => go('thread')} />
        ))}
      </div>
    </ScrollScreen>
  );
}

// ── 6. Conversation / Thread ─────────────────────────
function ScreenThread({ go }) {
  const m = MOCK.messages[0];
  return (
    <MobileShellNoTabs>
      <StatusSpacer />
      <div style={{
        padding: '8px 12px 12px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--divider)', background: 'var(--surface)', flexShrink: 0,
      }}>
        <button onClick={() => go('messages')} style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-2)',
        }}>
          <Icon name="chevL" size={20} />
        </button>
        <Avatar name={m.from} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{m.from}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}><T fr="Prof. de Français · En ligne" en="French teacher · Online" /></div>
        </div>
      </div>

      <div className="ek-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DayDivider label={{ fr: "Aujourd'hui", en: "Today" }} />
        <Bubble who="them">
          <T
            fr="Bonjour, j'ai voulu vous faire un retour sur Amina. Elle progresse vraiment bien en compréhension écrite cette semaine."
            en="Hello, I wanted to share an update on Amina. Her reading comprehension is improving a lot this week."
          />
        </Bubble>
        <Bubble who="them">
          <T
            fr="Continuez la lecture du soir, ça porte ses fruits 🙂"
            en="Keep up the bedtime reading — it's paying off 🙂"
          />
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>10:24</div>
        </Bubble>
        <Bubble who="me">
          <T
            fr="Merci beaucoup pour ce retour ! On va continuer. Le chapitre 6 est prévu pour ce soir."
            en="Thank you so much for the update! We'll keep going. Chapter 6 is on tonight's reading list."
          />
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>10:31 · <T fr="Lu" en="Read" /></div>
        </Bubble>
        <Bubble who="them">
          <Icon name="paperclip" size={14} style={{ marginRight: 6, verticalAlign: -2 }}/>
          <span style={{ textDecoration: 'underline' }}>Plan_lecture_T2.pdf</span>
        </Bubble>
      </div>

      <div style={{
        padding: '10px 12px 14px', borderTop: '1px solid var(--divider)',
        display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', flexShrink: 0,
      }}>
        <button style={{ width: 36, height: 36, borderRadius: 10, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={20} />
        </button>
        <div style={{
          flex: 1, padding: '10px 14px', borderRadius: 20,
          background: 'var(--surface-2)', color: 'var(--ink-3)', fontSize: 13.5,
        }}>
          <T fr="Écrire un message…" en="Type a message…" />
        </div>
        <button style={{
          width: 36, height: 36, borderRadius: 18, background: 'var(--brand)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="send" size={16} stroke={2.4} />
        </button>
      </div>
    </MobileShellNoTabs>
  );
}

function DayDivider({ label }) {
  return (
    <div style={{ textAlign: 'center', margin: '4px 0' }}>
      <span style={{
        fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600,
        padding: '4px 10px', borderRadius: 999, background: 'var(--surface-2)',
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}><T fr={label.fr} en={label.en} /></span>
    </div>
  );
}

function Bubble({ who, children }) {
  const me = who === 'me';
  return (
    <div style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '78%',
        padding: '10px 13px',
        borderRadius: me ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: me ? 'var(--brand)' : 'var(--surface)',
        border: me ? 'none' : '1px solid var(--border)',
        color: me ? 'white' : 'var(--ink)',
        fontSize: 13.5, lineHeight: 1.4,
      }}>{children}</div>
    </div>
  );
}

// ── 7. Profile & Subscription ────────────────────────
function ScreenProfile() {
  return (
    <ScrollScreen>
      <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
        <Avatar name={MOCK.parent.name} size={72} style={{ margin: '0 auto' }} />
        <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{MOCK.parent.name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>fatou.diallo@exemple.com</div>
      </div>

      {/* subscription banner */}
      <div style={{ padding: '0 20px 14px' }}>
        <div className="ek-card" style={{
          padding: 16, border: 'none',
          background: 'linear-gradient(135deg, var(--accent) 0%, #145140 100%)',
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="star" size={16} style={{ color: '#FFD8A8' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.95 }}>
              <T fr="Abonnement actif" en="Active subscription" />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: 8 }}>
            E-KELASI <T fr="Famille" en="Family" />
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 4 }}>
            <T
              fr={`Jusqu'à 3 enfants · Renouvellement le ${MOCK.parent.renews}`}
              en={`Up to 3 children · Renews on ${MOCK.parent.renews}`}
            />
          </div>
          <button className="ek-btn" style={{
            marginTop: 14, background: 'rgba(255,255,255,0.18)', color: 'white',
            backdropFilter: 'blur(4px)', height: 36, padding: '0 14px', fontSize: 13,
          }}>
            <T fr="Gérer l'abonnement" en="Manage subscription" /> →
          </button>
        </div>
      </div>

      {/* settings list */}
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SettingsGroup
          title={{ fr: 'Compte', en: 'Account' }}
          items={[
            { icon: 'user',       fr: 'Informations personnelles', en: 'Personal info' },
            { icon: 'school',     fr: 'Enfants & écoles',          en: 'Children & schools', detail: '1' },
            { icon: 'creditcard', fr: 'Paiement & facturation',    en: 'Billing' },
          ]}
        />
        <SettingsGroup
          title={{ fr: 'Préférences', en: 'Preferences' }}
          items={[
            { icon: 'bell',     fr: 'Notifications',     en: 'Notifications', detail: 'Tout' },
            { icon: 'mail',     fr: 'Langue',            en: 'Language',      detail: 'FR' },
            { icon: 'moon',     fr: 'Apparence',         en: 'Appearance',    detail: 'Auto' },
          ]}
        />
        <SettingsGroup
          title={{ fr: 'Sécurité & aide', en: 'Security & help' }}
          items={[
            { icon: 'lock',     fr: 'Confidentialité',  en: 'Privacy' },
            { icon: 'shield',   fr: 'Sécurité du compte', en: 'Account security' },
            { icon: 'mail',     fr: 'Contacter le support', en: 'Contact support' },
          ]}
        />
      </div>
    </ScrollScreen>
  );
}

function SettingsGroup({ title, items }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0 4px 8px' }}>
        <T fr={title.fr} en={title.en} />
      </div>
      <div className="ek-card" style={{ padding: 4 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 12px',
            borderBottom: i < items.length - 1 ? '1px solid var(--divider)' : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--surface-2)', color: 'var(--ink-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon name={it.icon} size={16} /></div>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
              <T fr={it.fr} en={it.en} />
            </span>
            {it.detail && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{it.detail}</span>}
            <Icon name="chevR" size={16} style={{ color: 'var(--ink-4)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 8. Notifications (sheet) ─────────────────────────
function ScreenNotifications({ go }) {
  const kindIcon = { grade: 'award', message: 'chat', hw: 'book', school: 'school', reminder: 'flag' };
  const kindColor = { grade: 'var(--accent)', message: 'var(--info)', hw: 'var(--brand)', school: 'var(--ink-2)', reminder: 'var(--warning)' };
  return (
    <MobileShellNoTabs>
      <StatusSpacer />
      <div style={{ padding: '8px 12px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button onClick={() => go('home')} style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)',
        }}>
          <Icon name="chevL" size={20} />
        </button>
        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', flex: 1 }}>
          <T fr="Notifications" en="Notifications" />
        </div>
        <button style={{ fontSize: 12, color: 'var(--brand-600)', fontWeight: 600 }}>
          <T fr="Tout marquer lu" en="Mark all read" />
        </button>
      </div>
      <div className="ek-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MOCK.notifs.map((n, i) => (
          <div key={i} className="ek-card" style={{
            padding: 14, display: 'flex', alignItems: 'flex-start', gap: 12,
            borderLeft: i < 2 ? '3px solid var(--brand)' : 'var(--card-border)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: kindColor[n.kind] + '22', color: kindColor[n.kind],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={kindIcon[n.kind]} size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: i < 2 ? 600 : 500 }}>{n.text}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </MobileShellNoTabs>
  );
}

// ── Scroll wrapper that hides scrollbar inside artboards ──
function ScrollScreen({ children }) {
  return (
    <>
      <StatusSpacer />
      <div className="ek-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {children}
      </div>
    </>
  );
}

// ── Top-level prototype with router ──────────────────
function MobileParent({ initial = 'home', dark = false, lang = 'fr' }) {
  const [screen, setScreen] = React.useState(initial);
  // tab screens vs full-screen pages
  const isTab = ['home','grades','homework','messages','profile'].includes(screen);
  const activeTab = isTab ? screen : (screen === 'thread' ? 'messages' : 'home');

  const render = () => {
    switch (screen) {
      case 'welcome':       return <ScreenWelcome go={setScreen} />;
      case 'home':          return <ScreenHome go={setScreen} />;
      case 'grades':        return <ScreenGrades />;
      case 'homework':      return <ScreenHomework />;
      case 'messages':      return <ScreenMessages go={setScreen} />;
      case 'thread':        return <ScreenThread go={setScreen} />;
      case 'profile':       return <ScreenProfile />;
      case 'notifications': return <ScreenNotifications go={setScreen} />;
      default:              return <ScreenHome go={setScreen} />;
    }
  };

  const hideTabs = ['welcome', 'thread', 'notifications'].includes(screen);

  return (
    <LangCtx.Provider value={lang}>
      <MobileShell dark={dark}>
        {render()}
        {!hideTabs && <TabBar active={activeTab} onChange={setScreen} />}
      </MobileShell>
    </LangCtx.Provider>
  );
}

Object.assign(window, { MobileParent });
