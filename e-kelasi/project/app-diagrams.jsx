// E-KELASI — Business & technical diagrams
// All sized for the design canvas (1280×~). Self-contained, no extra deps.

function DiagramFrame({ title, sub, badge, children, dark = false, lang = 'fr', height = 720 }) {
  return (
    <LangCtx.Provider value={lang}>
      <div data-theme={dark ? 'dark' : 'light'} className="ek-app" style={{
        width: '100%', height: '100%', background: 'var(--bg)',
        padding: 28, display: 'flex', flexDirection: 'column', gap: 18,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {badge && (
              <span style={{
                display: 'inline-block', fontSize: 10.5, fontWeight: 700,
                color: 'var(--brand-600)', background: 'var(--brand-soft)',
                padding: '4px 10px', borderRadius: 999,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}><T fr={badge.fr} en={badge.en} /></span>
            )}
            <div style={{ marginTop: badge ? 10 : 0, fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
              <T fr={title.fr} en={title.en} />
            </div>
            {sub && (
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-3)', maxWidth: 720, lineHeight: 1.5 }}>
                <T fr={sub.fr} en={sub.en} />
              </div>
            )}
          </div>
          <Logo size={32} withWord />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
      </div>
    </LangCtx.Provider>
  );
}

// ─── Architecture Diagram ────────────────────────────────
function ArchitectureDiagram({ dark, lang }) {
  return (
    <DiagramFrame
      dark={dark} lang={lang}
      badge={{ fr: 'Architecture technique', en: 'Technical architecture' }}
      title={{ fr: 'Plateforme E-KELASI · vue système', en: 'E-KELASI platform · system view' }}
      sub={{
        fr: "Architecture serverless-first. Supabase pour l'auth + Postgres + temps réel, Stripe pour la facturation, AWS S3 pour le stockage des fichiers.",
        en: 'Serverless-first architecture. Supabase for auth + Postgres + realtime, Stripe for billing, AWS S3 for file storage.'
      }}
    >
      <ArchitectureCanvas />
    </DiagramFrame>
  );
}

function ArchCol({ title, tint = 'var(--ink-3)', children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div style={{
        textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: tint,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '6px 12px', borderRadius: 6, background: 'var(--surface-2)',
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function ArchNode({ icon, label, sub, tint = 'var(--brand)', big = false }) {
  return (
    <div className="ek-card" style={{
      padding: big ? 14 : 11, display: 'flex', alignItems: 'center', gap: 10,
      borderLeft: `3px solid ${tint}`,
    }}>
      <div style={{
        width: big ? 36 : 30, height: big ? 36 : 30, borderRadius: 8,
        background: tint + '22', color: tint,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={icon} size={big ? 18 : 16} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: big ? 13 : 12, fontWeight: 700, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ArchArrow({ label }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, padding: '0 8px', alignSelf: 'stretch',
    }}>
      <div style={{ fontSize: 9.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 4, textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ width: 90, height: 1, background: 'var(--border-strong)', position: 'relative' }}>
        <svg width="90" height="8" style={{ position: 'absolute', top: -4, left: 0 }}>
          <path d="M0 4 L90 4 M84 1 L90 4 L84 7" stroke="var(--border-strong)" strokeWidth="1.2" fill="none"/>
        </svg>
      </div>
    </div>
  );
}

function ArchitectureCanvas() {
  return (
    <div className="ek-card" style={{
      padding: 24, height: '100%', display: 'flex', alignItems: 'stretch', gap: 0,
      background: 'var(--surface)', overflow: 'hidden',
    }}>
      {/* Clients */}
      <ArchCol title="Clients · UI" tint="var(--info)">
        <ArchNode icon="user" label="App mobile parents" sub="React Native · iOS + Android" tint="var(--info)" big />
        <ArchNode icon="users" label="App mobile profs" sub="React Native · iOS + Android" tint="var(--info)" />
        <ArchNode icon="school" label="Dashboard école" sub="Next.js · navigateur" tint="var(--info)" />
        <ArchNode icon="shield" label="Console super admin" sub="Next.js · navigateur" tint="var(--info)" />
      </ArchCol>

      <ArchArrow label="HTTPS · WSS" />

      {/* Edge / API gateway */}
      <ArchCol title="Edge layer" tint="var(--warning)">
        <ArchNode icon="zap" label="Vercel Edge" sub="SSR Next.js · cache CDN" tint="var(--warning)" />
        <ArchNode icon="lock" label="Auth gateway" sub="JWT · refresh tokens" tint="var(--warning)" />
        <ArchNode icon="bell" label="Push notifications" sub="APNs · FCM" tint="var(--warning)" />
        <ArchNode icon="activity" label="Rate limit · WAF" sub="Cloudflare" tint="var(--warning)" />
      </ArchCol>

      <ArchArrow label="RPC · REST" />

      {/* Backend */}
      <ArchCol title="Backend services" tint="var(--brand)">
        <ArchNode icon="layers" label="Supabase Edge Fn" sub="Logique métier · TypeScript" tint="var(--brand)" big />
        <ArchNode icon="refresh" label="Realtime channels" sub="Notes, messages, notifs" tint="var(--brand)" />
        <ArchNode icon="zap" label="Background jobs" sub="Bulletins, exports PDF" tint="var(--brand)" />
        <ArchNode icon="mail" label="Notifications service" sub="Email · SMS · Push" tint="var(--brand)" />
      </ArchCol>

      <ArchArrow label="SQL · S3 SDK" />

      {/* Data & infra */}
      <ArchCol title="Data & infra" tint="var(--accent)">
        <ArchNode icon="layers" label="PostgreSQL 16" sub="Supabase · RLS · multi-tenant" tint="var(--accent)" big />
        <ArchNode icon="file" label="AWS S3" sub="Fichiers, photos, bulletins PDF" tint="var(--accent)" />
        <ArchNode icon="creditcard" label="Stripe Billing" sub="Abonnements · webhooks" tint="var(--accent)" />
        <ArchNode icon="pieChart" label="PostHog + Sentry" sub="Analytics · monitoring" tint="var(--accent)" />
      </ArchCol>
    </div>
  );
}

// ─── DB Schema Diagram ──────────────────────────────────
function DBSchemaDiagram({ dark, lang }) {
  return (
    <DiagramFrame
      dark={dark} lang={lang}
      badge={{ fr: 'Base de données', en: 'Database schema' }}
      title={{ fr: 'Schéma PostgreSQL · principales tables', en: 'PostgreSQL schema · core tables' }}
      sub={{
        fr: 'Modèle multi-tenant par école (school_id) avec Row-Level Security. Toutes les tables horodatées created_at / updated_at.',
        en: 'Multi-tenant model by school (school_id) with Row-Level Security. All tables have created_at / updated_at.'
      }}
    >
      <DBSchemaCanvas />
    </DiagramFrame>
  );
}

function DBTable({ name, fields, accent = 'var(--brand)', tag, style }) {
  return (
    <div className="ek-card" style={{
      padding: 0, overflow: 'hidden', fontFamily: 'var(--font-mono)', fontSize: 11.5,
      borderTop: `3px solid ${accent}`, ...style,
    }}>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--divider)', background: 'var(--surface-2)' }}>
        <Icon name="layers" size={13} style={{ color: accent }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{name}</span>
        {tag && (
          <span style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, color: 'var(--ink-3)', background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{tag}</span>
        )}
      </div>
      <div>
        {fields.map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 12px',
            borderBottom: i < fields.length - 1 ? '1px solid var(--divider)' : 'none',
          }}>
            {f.key === 'pk' && <span style={{ fontSize: 9, color: 'var(--brand-600)', fontWeight: 700, width: 18, fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>PK</span>}
            {f.key === 'fk' && <span style={{ fontSize: 9, color: 'var(--info)', fontWeight: 700, width: 18, fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>FK</span>}
            {f.key === 'idx' && <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, width: 18, fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>IDX</span>}
            {!f.key && <span style={{ width: 18 }}/>}
            <span style={{ flex: 1, color: 'var(--ink-2)' }}>{f.name}</span>
            <span style={{ color: 'var(--ink-3)', fontSize: 10.5 }}>{f.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DBSchemaCanvas() {
  return (
    <div className="ek-card" style={{ padding: 20, height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* relationships — drawn behind tables */}
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} viewBox="0 0 1200 620" preserveAspectRatio="none">
        {/* school -> users */}
        <path d="M 260 110 C 320 110, 320 230, 380 230" stroke="var(--border-strong)" strokeWidth="1.2" fill="none" strokeDasharray="3 3"/>
        {/* school -> classes */}
        <path d="M 260 140 C 320 140, 320 420, 380 420" stroke="var(--border-strong)" strokeWidth="1.2" fill="none" strokeDasharray="3 3"/>
        {/* users -> children */}
        <path d="M 560 280 C 620 280, 620 220, 720 220" stroke="var(--border-strong)" strokeWidth="1.2" fill="none" strokeDasharray="3 3"/>
        {/* children -> grades */}
        <path d="M 900 240 C 960 240, 960 130, 1000 130" stroke="var(--border-strong)" strokeWidth="1.2" fill="none" strokeDasharray="3 3"/>
        {/* children -> homework */}
        <path d="M 900 280 C 960 280, 960 330, 1000 330" stroke="var(--border-strong)" strokeWidth="1.2" fill="none" strokeDasharray="3 3"/>
        {/* classes -> grades */}
        <path d="M 560 450 C 760 450, 850 130, 1000 130" stroke="var(--border-strong)" strokeWidth="1.2" fill="none" strokeDasharray="3 3"/>
        {/* subscriptions -> users */}
        <path d="M 460 575 C 460 460, 460 380, 460 320" stroke="var(--border-strong)" strokeWidth="1.2" fill="none" strokeDasharray="3 3"/>
      </svg>

      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, height: '100%', alignContent: 'start' }}>
        {/* Column 1: tenancy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DBTable
            name="schools"
            tag="tenant"
            accent="var(--brand)"
            fields={[
              { key: 'pk', name: 'id', type: 'uuid' },
              { name: 'name', type: 'text' },
              { name: 'country', type: 'text' },
              { name: 'plan', type: 'enum' },
              { name: 'branding', type: 'jsonb' },
              { name: 'stripe_account', type: 'text' },
            ]}
          />
          <DBTable
            name="subscriptions"
            accent="var(--warning)"
            fields={[
              { key: 'pk', name: 'id', type: 'uuid' },
              { key: 'fk', name: 'user_id', type: 'uuid' },
              { name: 'plan', type: 'enum' },
              { name: 'status', type: 'enum' },
              { name: 'stripe_sub_id', type: 'text' },
              { name: 'current_period_end', type: 'ts' },
            ]}
          />
        </div>

        {/* Column 2: users + auth */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DBTable
            name="users"
            accent="var(--info)"
            tag="auth"
            fields={[
              { key: 'pk', name: 'id', type: 'uuid' },
              { key: 'fk', name: 'school_id', type: 'uuid' },
              { name: 'email', type: 'text' },
              { name: 'role', type: 'enum' },
              { name: 'display_name', type: 'text' },
              { name: 'locale', type: 'text' },
              { key: 'idx', name: '(school_id, role)', type: 'btree' },
            ]}
          />
          <DBTable
            name="classes"
            accent="var(--info)"
            fields={[
              { key: 'pk', name: 'id', type: 'uuid' },
              { key: 'fk', name: 'school_id', type: 'uuid' },
              { name: 'name', type: 'text' },
              { name: 'level', type: 'text' },
              { name: 'year', type: 'text' },
            ]}
          />
        </div>

        {/* Column 3: domain — children */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DBTable
            name="children"
            accent="var(--accent)"
            fields={[
              { key: 'pk', name: 'id', type: 'uuid' },
              { key: 'fk', name: 'parent_id', type: 'uuid' },
              { key: 'fk', name: 'class_id', type: 'uuid' },
              { name: 'first_name', type: 'text' },
              { name: 'last_name', type: 'text' },
              { name: 'birthdate', type: 'date' },
            ]}
          />
          <DBTable
            name="enrollments"
            accent="var(--accent)"
            fields={[
              { key: 'pk', name: 'id', type: 'uuid' },
              { key: 'fk', name: 'child_id', type: 'uuid' },
              { key: 'fk', name: 'subject_id', type: 'uuid' },
              { key: 'fk', name: 'teacher_id', type: 'uuid' },
            ]}
          />
        </div>

        {/* Column 4: activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DBTable
            name="grades"
            accent="var(--brand)"
            tag="indexed"
            fields={[
              { key: 'pk', name: 'id', type: 'uuid' },
              { key: 'fk', name: 'child_id', type: 'uuid' },
              { key: 'fk', name: 'subject_id', type: 'uuid' },
              { name: 'score', type: 'numeric' },
              { name: 'max', type: 'numeric' },
              { name: 'coef', type: 'numeric' },
              { name: 'comment', type: 'text' },
            ]}
          />
          <DBTable
            name="homework"
            accent="var(--brand)"
            fields={[
              { key: 'pk', name: 'id', type: 'uuid' },
              { key: 'fk', name: 'class_id', type: 'uuid' },
              { name: 'title', type: 'text' },
              { name: 'due_at', type: 'ts' },
              { name: 'attachments', type: 'jsonb' },
            ]}
          />
          <DBTable
            name="messages"
            accent="var(--info)"
            fields={[
              { key: 'pk', name: 'id', type: 'uuid' },
              { key: 'fk', name: 'thread_id', type: 'uuid' },
              { key: 'fk', name: 'sender_id', type: 'uuid' },
              { name: 'body', type: 'text' },
              { name: 'read_at', type: 'ts' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ─── User Flows ─────────────────────────────────────────
function UserFlowsDiagram({ dark, lang }) {
  return (
    <DiagramFrame
      dark={dark} lang={lang}
      badge={{ fr: 'User flows', en: 'User flows' }}
      title={{ fr: 'Parcours par persona', en: 'Flows by persona' }}
      sub={{
        fr: '4 utilisateurs, 4 missions. Chaque flow vise la valeur principale du persona en moins de 5 étapes critiques.',
        en: '4 personas, 4 missions. Each flow targets the core value in fewer than 5 critical steps.'
      }}
    >
      <FlowsCanvas />
    </DiagramFrame>
  );
}

function FlowLane({ persona, color, icon, steps, value }) {
  return (
    <div className="ek-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, background: color + '22', color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={18}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{persona.title}</div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{persona.subtitle}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11, background: color, color: 'white',
                fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 2,
              }}>{i + 1}</div>
              {i < steps.length - 1 && <div style={{ flex: 1, width: 2, background: color + '44', minHeight: 14 }}/>}
            </div>
            <div style={{ paddingBottom: i < steps.length - 1 ? 14 : 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{s.t}</div>
              {s.d && <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1, lineHeight: 1.4 }}>{s.d}</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 'auto', padding: '8px 10px', borderRadius: 8,
        background: color + '12', color: color,
        fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Icon name="target" size={12} stroke={2.2}/>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{value}</span>
      </div>
    </div>
  );
}

function FlowsCanvas() {
  const lang = useLang();
  const flows = [
    {
      persona: lang === 'en'
        ? { title: 'Parent', subtitle: 'Mobile · paying subscriber' }
        : { title: 'Parent', subtitle: 'Mobile · abonné payant' },
      color: 'var(--brand)',
      icon: 'user',
      value: lang === 'en' ? 'Daily reassurance, in 2 min' : 'Tranquillité quotidienne en 2 min',
      steps: lang === 'en' ? [
        { t: 'Receives push notification', d: '"Amina · 17/20 in Math · 12 min"' },
        { t: 'Opens app · sees grade in detail' },
        { t: 'Reads teacher comment, taps "Reply"' },
        { t: 'Sends a thank-you message' },
        { t: 'Closes app — 90s elapsed' },
      ] : [
        { t: 'Reçoit une notification push', d: '"Amina · 17/20 en Maths · 12 min"' },
        { t: 'Ouvre l\'app · voit la note en détail' },
        { t: 'Lit le commentaire du prof, clique "Répondre"' },
        { t: 'Envoie un message de remerciement' },
        { t: 'Ferme l\'app — 90s écoulées' },
      ],
    },
    {
      persona: lang === 'en'
        ? { title: 'Teacher', subtitle: 'Mobile + web · in-class' }
        : { title: 'Professeur', subtitle: 'Mobile + web · en classe' },
      color: 'var(--info)',
      icon: 'edit',
      value: lang === 'en' ? 'Push a grade in <30 s' : 'Publier une note en <30 s',
      steps: lang === 'en' ? [
        { t: 'Picks class & assignment', d: 'From last opened drafts' },
        { t: 'Enters grades · grid view' },
        { t: 'Adds a comment per student (optional)' },
        { t: 'Reviews · 1 tap to publish' },
        { t: 'Parents get notification automatically' },
      ] : [
        { t: 'Choisit classe + évaluation', d: 'Depuis les brouillons récents' },
        { t: 'Saisit les notes · vue grille' },
        { t: 'Ajoute un commentaire par élève (option)' },
        { t: 'Vérifie · 1 clic pour publier' },
        { t: 'Parents notifiés automatiquement' },
      ],
    },
    {
      persona: lang === 'en'
        ? { title: 'School admin', subtitle: 'Web · monthly review' }
        : { title: 'Direction école', subtitle: 'Web · revue mensuelle' },
      color: 'var(--accent)',
      icon: 'school',
      value: lang === 'en' ? 'Make month-end decisions' : 'Décisions de fin de mois',
      steps: lang === 'en' ? [
        { t: 'Opens monthly dashboard' },
        { t: 'Reviews class averages & rankings' },
        { t: 'Spots a class trending down' },
        { t: 'Exports report card PDF batch' },
        { t: 'Schedules parent-teacher meetings' },
      ] : [
        { t: 'Ouvre le tableau de bord mensuel' },
        { t: 'Consulte moyennes & rangs par classe' },
        { t: 'Identifie une classe en baisse' },
        { t: 'Exporte les bulletins PDF en lot' },
        { t: 'Programme la réunion parents-profs' },
      ],
    },
    {
      persona: lang === 'en'
        ? { title: 'Super admin', subtitle: 'Web · E-KELASI ops' }
        : { title: 'Super admin', subtitle: 'Web · ops E-KELASI' },
      color: 'var(--warning)',
      icon: 'shield',
      value: lang === 'en' ? 'Protect MRR & ship support' : 'Protéger le MRR & support',
      steps: lang === 'en' ? [
        { t: 'Sees MRR + churn on overview' },
        { t: 'Drills into failed-payment list' },
        { t: 'Triggers Stripe smart-retries' },
        { t: 'Replies to two P1 support tickets' },
        { t: 'Approves a new partner school' },
      ] : [
        { t: 'Vue MRR + churn sur la home' },
        { t: 'Drill-down liste paiements échoués' },
        { t: 'Déclenche les smart-retries Stripe' },
        { t: 'Répond à 2 tickets support P1' },
        { t: 'Valide une nouvelle école partenaire' },
      ],
    },
  ];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, height: '100%', alignItems: 'stretch',
    }}>
      {flows.map((f, i) => <FlowLane key={i} {...f} />)}
    </div>
  );
}

// ─── MVP Roadmap ────────────────────────────────────────
function RoadmapDiagram({ dark, lang }) {
  return (
    <DiagramFrame
      dark={dark} lang={lang}
      badge={{ fr: 'Roadmap produit', en: 'Product roadmap' }}
      title={{ fr: 'MVP → v2 scalable · 12 mois', en: 'MVP → scalable v2 · 12 months' }}
      sub={{
        fr: "Quatre phases. Chacune se publie indépendamment et augmente le MRR sans rupture pour les écoles existantes.",
        en: 'Four phases. Each ships independently and grows MRR without disruption for existing schools.'
      }}
    >
      <RoadmapCanvas />
    </DiagramFrame>
  );
}

function RoadmapCanvas() {
  const lang = useLang();
  const phases = [
    {
      tag: 'MVP', when: lang === 'en' ? 'Jul → Sept 2026' : 'Juil → sept 2026',
      title: lang === 'en' ? 'Closed beta with 3 schools' : 'Beta fermée · 3 écoles',
      color: 'var(--brand)',
      bullets: lang === 'en' ? [
        'Parent iOS + Android apps (read-only)',
        'Teacher grade entry · web',
        'Auth + multi-tenant Postgres + RLS',
        'Stripe Billing · 1 plan',
        'Push notifications · grades & messages',
      ] : [
        'Apps parents iOS + Android (lecture seule)',
        'Saisie notes prof · web',
        'Auth + Postgres multi-tenant + RLS',
        'Stripe Billing · 1 plan',
        'Push notifications · notes & messages',
      ],
      kpi: lang === 'en' ? '500 paying parents · €4.5k MRR' : '500 parents abonnés · €4,5k MRR',
    },
    {
      tag: 'v1', when: lang === 'en' ? 'Oct → Dec 2026' : 'Oct → déc 2026',
      title: lang === 'en' ? 'Public launch · West Africa + Canada' : 'Lancement public · Afrique de l\'Ouest + Canada',
      color: 'var(--info)',
      bullets: lang === 'en' ? [
        'Teacher mobile app · grade entry on the go',
        'Two-way messaging parents ↔ teachers',
        'Homework with attachments (S3)',
        '3 plans · Essential / Family / Premium',
        'PDF report card export',
      ] : [
        'App mobile prof · saisie en mobilité',
        'Messagerie bidirectionnelle parents ↔ profs',
        'Devoirs avec pièces jointes (S3)',
        '3 plans · Essentiel / Famille / Premium',
        'Export bulletin PDF',
      ],
      kpi: lang === 'en' ? '3 000 paying parents · €25k MRR' : '3 000 parents abonnés · €25k MRR',
    },
    {
      tag: 'v1.5', when: lang === 'en' ? 'Jan → Mar 2027' : 'Janv → mars 2027',
      title: lang === 'en' ? 'School-side power tools' : 'Outils côté école',
      color: 'var(--accent)',
      bullets: lang === 'en' ? [
        'School dashboard · stats & rankings',
        'White-label branding (logo, colors)',
        'Class & teacher bulk import (CSV)',
        'Annual subscriptions · enterprise quotes',
        'Multilingual UI (FR + EN, AR + PT next)',
      ] : [
        'Dashboard école · stats & classements',
        'Branding white-label (logo, couleurs)',
        'Import en lot classes & profs (CSV)',
        'Abonnements annuels · devis entreprise',
        'UI multilingue (FR + EN, AR + PT à venir)',
      ],
      kpi: lang === 'en' ? '6 000 parents · 30 schools' : '6 000 parents · 30 écoles',
    },
    {
      tag: 'v2', when: lang === 'en' ? 'Apr → Jun 2027' : 'Avr → juin 2027',
      title: lang === 'en' ? 'Intelligence layer & scale' : 'Intelligence & passage à l\'échelle',
      color: 'var(--warning)',
      bullets: lang === 'en' ? [
        'AI tutor digest · weekly progression analysis',
        'Predictive churn alerts for school admins',
        'Native offline mode (low-bandwidth schools)',
        'Public API + Zapier integration',
        'SOC 2 Type I · audit GDPR + Quebec Law 25',
      ] : [
        'Tuteur IA · synthèse progression hebdo',
        'Alertes churn prédictives pour direction',
        'Mode hors-ligne natif (écoles bas débit)',
        'API publique + intégration Zapier',
        'SOC 2 Type I · audit RGPD + Loi 25 Québec',
      ],
      kpi: lang === 'en' ? '12 000 parents · €100k MRR · 60 schools' : '12 000 parents · €100k MRR · 60 écoles',
    },
  ];

  return (
    <div className="ek-card" style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* timeline rail */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ position: 'absolute', left: 24, right: 24, top: 14, height: 2, background: 'var(--surface-3)', borderRadius: 1 }}/>
        <div style={{ position: 'absolute', left: 24, top: 14, height: 2, background: 'linear-gradient(90deg, var(--brand), var(--info), var(--accent), var(--warning))', width: 'calc(100% - 48px)', borderRadius: 1 }}/>
        {phases.map((p, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ width: 30, height: 30, borderRadius: 15, background: p.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, boxShadow: `0 0 0 4px var(--surface)`, fontFamily: 'var(--font-display)' }}>
              {i + 1}
            </div>
            <div style={{ marginTop: 6, fontSize: 10.5, fontWeight: 700, color: p.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{p.tag}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>{p.when}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, flex: 1, alignItems: 'stretch' }}>
        {phases.map((p, i) => (
          <div key={i} style={{
            background: 'var(--surface-2)', borderRadius: 12, padding: 14,
            display: 'flex', flexDirection: 'column', borderTop: `3px solid ${p.color}`,
          }}>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.015em' }}>{p.title}</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {p.bullets.map((b, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Icon name="check" size={12} stroke={3} style={{ color: p.color, marginTop: 3 }}/>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>{b}</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 'auto', padding: '8px 10px', borderRadius: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              fontSize: 11, fontWeight: 700, color: 'var(--ink)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="target" size={12} style={{ color: p.color }}/>
              {p.kpi}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pricing ─────────────────────────────────────────────
function PricingDiagram({ dark, lang }) {
  return (
    <DiagramFrame
      dark={dark} lang={lang}
      badge={{ fr: 'Modèle économique', en: 'Pricing' }}
      title={{ fr: 'Abonnement parent · paiement mensuel Stripe', en: 'Parent subscription · monthly via Stripe' }}
      sub={{
        fr: 'Modèle simple, 3 paliers. Les écoles sont gratuites — leur ROI est leur propre engagement parental. Le revenu vient des parents.',
        en: 'Simple model, 3 tiers. Schools are free — their ROI is parental engagement. Revenue comes from parents.'
      }}
    >
      <PricingCanvas />
    </DiagramFrame>
  );
}

function PricingCanvas() {
  const lang = useLang();
  const tiers = [
    {
      name: 'Essentiel',
      tagline: lang === 'en' ? 'Get the essentials' : "L'essentiel pour suivre",
      price: '€9',
      period: lang === 'en' ? '/month/parent' : '/mois/parent',
      featured: false,
      features: lang === 'en' ? [
        '1 child',
        'Grades & teacher comments',
        'Homework + reminders',
        'Push & email notifications',
        '1-to-1 messaging with teachers',
      ] : [
        '1 enfant',
        'Notes & commentaires profs',
        'Devoirs + rappels',
        'Notifications push & email',
        'Messagerie 1-à-1 avec les profs',
      ],
    },
    {
      name: 'Famille',
      tagline: lang === 'en' ? 'For multi-child families' : 'Pour les familles plusieurs enfants',
      price: '€19',
      period: lang === 'en' ? '/month/family' : '/mois/famille',
      featured: true,
      features: lang === 'en' ? [
        'Up to 3 children',
        'Everything in Essential',
        'Trimester report card PDF',
        'Class-wide ranking & trends',
        'Priority email support',
        'Shared between two parents',
      ] : [
        'Jusqu\'à 3 enfants',
        'Tout l\'Essentiel +',
        'Bulletin trimestriel PDF',
        'Classement & tendances de classe',
        'Support email prioritaire',
        'Partagé entre 2 parents',
      ],
    },
    {
      name: 'Premium',
      tagline: lang === 'en' ? 'Coaching included' : 'Coaching inclus',
      price: '€29',
      period: lang === 'en' ? '/month/family' : '/mois/famille',
      featured: false,
      features: lang === 'en' ? [
        'Up to 5 children',
        'Everything in Family +',
        'AI weekly progression digest',
        'Monthly tutor consultation',
        'Advanced offline mode',
        'Phone support · same-day',
      ] : [
        'Jusqu\'à 5 enfants',
        'Tout Famille +',
        'Synthèse IA progression hebdo',
        'Consultation tuteur mensuelle',
        'Mode hors-ligne avancé',
        'Support téléphone · jour même',
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'stretch' }}>
        {tiers.map((t, i) => (
          <div key={i} className="ek-card" style={{
            padding: 24, position: 'relative', overflow: 'hidden',
            ...(t.featured ? {
              background: 'linear-gradient(180deg, var(--brand-50), var(--surface))',
              border: '2px solid var(--brand)',
              transform: 'translateY(-6px)',
              boxShadow: '0 14px 40px rgba(224,112,30,0.18)',
            } : {}),
          }}>
            {t.featured && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: 'var(--brand)', color: 'white',
                padding: '4px 10px', borderRadius: 999,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>{lang === 'en' ? 'Most chosen' : 'Le plus choisi'}</div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: t.featured ? 'var(--brand-600)' : 'var(--ink-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{t.tagline}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 16 }}>
              <span style={{ fontSize: 44, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>{t.price}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t.period}</span>
            </div>
            <div style={{ marginTop: 18, height: 1, background: 'var(--divider)' }}/>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {t.features.map((f, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 9,
                    background: t.featured ? 'var(--brand)' : 'var(--accent-100)',
                    color: t.featured ? 'white' : 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <Icon name="check" size={11} stroke={3.5}/>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            <button style={{
              marginTop: 18, width: '100%', height: 42, borderRadius: 10,
              background: t.featured ? 'var(--brand)' : 'transparent',
              color: t.featured ? 'white' : 'var(--ink)',
              border: t.featured ? 'none' : '1.5px solid var(--border-strong)',
              fontSize: 13, fontWeight: 600,
            }}>
              {lang === 'en' ? 'Start 14-day trial' : "Démarrer l'essai 14 jours"}
            </button>
          </div>
        ))}
      </div>

      {/* notes */}
      <div className="ek-card" style={{ padding: 16, marginTop: 'auto', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--brand-soft)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="sparkle" size={18}/>
        </div>
        <div style={{ flex: 1, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          <T
            fr={<><strong style={{ color: 'var(--ink)' }}>Modèle B2C2B :</strong> les écoles ne paient rien — elles bénéficient gratuitement de la communication structurée et du branding. Les parents paient l'abonnement mensuel, prélevé via Stripe. Essai gratuit 14 jours, sans CB requise.</>}
            en={<><strong style={{ color: 'var(--ink)' }}>B2C2B model:</strong> schools pay nothing — they get structured communication and branding for free. Parents pay the monthly subscription via Stripe. 14-day free trial, no credit card required.</>}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}>€9.12</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>ARPU</div>
          </div>
          <div style={{ width: 1, background: 'var(--divider)' }}/>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)' }}>94%</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{lang === 'en' ? '6m retention' : 'rétention 6m'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ArchitectureDiagram, DBSchemaDiagram, UserFlowsDiagram, RoadmapDiagram, PricingDiagram,
});
