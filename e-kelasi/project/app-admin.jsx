// E-KELASI — Super Admin web prototype
// Sidebar + topbar + screen content. initial toggles starting page.

function AdminShell({ children, dark = false, lang = 'fr', current, onNav }) {
  return (
    <LangCtx.Provider value={lang}>
      <div data-theme={dark ? 'dark' : 'light'} className="ek-app" style={{
        width: '100%', height: '100%', background: 'var(--bg)',
        display: 'grid', gridTemplateColumns: '232px 1fr', overflow: 'hidden',
        fontFamily: 'var(--font-body)',
      }}>
        <AdminSidebar current={current} onNav={onNav} />
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <AdminTopbar current={current} />
          <div className="ek-scroll" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
            {children}
          </div>
        </div>
      </div>
    </LangCtx.Provider>
  );
}

function AdminSidebar({ current, onNav }) {
  const nav = [
    { id: 'overview',  icon: 'pieChart', fr: "Vue d'ensemble", en: 'Overview' },
    { id: 'schools',   icon: 'school',   fr: 'Écoles',         en: 'Schools' },
    { id: 'billing',   icon: 'creditcard', fr: 'Abonnements',  en: 'Subscriptions' },
    { id: 'support',   icon: 'chat',     fr: 'Support',        en: 'Support' },
    { id: 'security',  icon: 'shield',   fr: 'Sécurité & logs', en: 'Security & logs' },
  ];
  const sec = [
    { id: 'team',      icon: 'users',    fr: 'Équipe E-KELASI', en: 'E-KELASI team' },
    { id: 'settings',  icon: 'settings', fr: 'Paramètres',     en: 'Settings' },
  ];

  return (
    <div style={{
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      padding: '16px 12px 12px',
      display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden',
    }}>
      <div style={{ padding: '4px 8px 0' }}>
        <Logo size={26} withWord />
        <div style={{ marginTop: 4, marginLeft: 36, fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <T fr="Console admin" en="Admin console" />
        </div>
      </div>

      <button style={{
        margin: '4px 4px 0', padding: '10px 12px', borderRadius: 10,
        background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 10,
        border: '1px solid var(--border)',
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: 'var(--ink)', color: 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 11,
        }}>EK</div>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>E-KELASI <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>·</span> Prod</div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>app.e-kelasi.com</div>
        </div>
        <Icon name="chevD" size={14} style={{ color: 'var(--ink-3)' }}/>
      </button>

      <NavGroup label={{ fr: 'Plateforme', en: 'Platform' }} items={nav} current={current} onNav={onNav} />
      <NavGroup label={{ fr: 'Organisation', en: 'Organization' }} items={sec} current={current} onNav={onNav} />

      <div style={{ marginTop: 'auto' }}>
        <div className="ek-card" style={{ padding: 12, background: 'var(--brand-soft)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="sparkle" size={14} style={{ color: 'var(--brand-600)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-600)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <T fr="Bêta" en="Beta" />
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.4 }}>
            <T fr="Modèle IA de prédiction de churn maintenant disponible." en="AI churn-prediction model is now live." />
          </div>
        </div>

        <div style={{
          marginTop: 10, padding: '10px 8px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Avatar name="Yann Mbaye" size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>Yann Mbaye</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>Super Admin</div>
          </div>
          <Icon name="settings" size={14} style={{ color: 'var(--ink-3)' }}/>
        </div>
      </div>
    </div>
  );
}

function NavGroup({ label, items, current, onNav }) {
  return (
    <div>
      <div style={{ padding: '0 12px 6px', fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <T fr={label.fr} en={label.en} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map(it => {
          const on = current === it.id;
          return (
            <button key={it.id} onClick={() => onNav && onNav(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              background: on ? 'var(--brand-soft)' : 'transparent',
              color: on ? 'var(--brand-600)' : 'var(--ink-2)',
              fontSize: 13, fontWeight: on ? 600 : 500,
            }}>
              <Icon name={it.icon} size={16} stroke={on ? 2 : 1.7} />
              <span><T fr={it.fr} en={it.en} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SCREEN_LABELS = {
  overview: { fr: "Vue d'ensemble", en: 'Overview' },
  schools:  { fr: 'Écoles partenaires', en: 'Partner schools' },
  billing:  { fr: 'Abonnements & paiements', en: 'Subscriptions & billing' },
  support:  { fr: 'Support & tickets', en: 'Support & tickets' },
  security: { fr: 'Sécurité & journaux', en: 'Security & logs' },
};

function AdminTopbar({ current }) {
  const label = SCREEN_LABELS[current] || SCREEN_LABELS.overview;
  return (
    <div style={{
      height: 56, padding: '0 24px',
      display: 'flex', alignItems: 'center', gap: 14,
      borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>
        <T fr="Plateforme" en="Platform" /> <span style={{ color: 'var(--ink-4)' }}>/</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
        <T fr={label.fr} en={label.en} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 12px', borderRadius: 9,
        background: 'var(--surface-2)', color: 'var(--ink-3)',
        fontSize: 12.5, minWidth: 240,
      }}>
        <Icon name="search" size={14} />
        <T fr="Rechercher école, parent, log…" en="Search school, parent, log…" />
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-3)' }}>⌘K</span>
      </div>
      <button style={{
        width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border)',
        background: 'var(--surface)', color: 'var(--ink-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <Icon name="bell" size={16} />
        <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)', border: '2px solid var(--surface)' }} />
      </button>
      <button className="ek-btn ek-btn-primary" style={{ height: 34, padding: '0 12px', fontSize: 12.5 }}>
        <Icon name="plus" size={14} stroke={2.5} />
        <T fr="Inviter une école" en="Invite a school" />
      </button>
    </div>
  );
}

function KPI({ label, value, delta, trend, sub, accent = 'var(--ink)' }) {
  const up = (delta || '').startsWith('+');
  return (
    <div className="ek-card" style={{ padding: 18, minWidth: 0 }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', color: accent }}>{value}</span>
        {delta && (
          <span style={{ fontSize: 12, fontWeight: 700, color: up ? 'var(--accent)' : 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <Icon name={up ? 'arrowUp' : 'arrowDn'} size={11} stroke={3} />{delta}
          </span>
        )}
      </div>
      {trend && <div style={{ marginTop: 8 }}>{trend}</div>}
      {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function MRRChart({ values, w = 520, h = 200 }) {
  const max = Math.max(...values) * 1.1;
  const pad = { l: 36, r: 16, t: 16, b: 28 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const pts = values.map((v, i) => {
    const x = pad.l + (i / (values.length - 1)) * cw;
    const y = pad.t + (1 - v / max) * ch;
    return [x, y];
  });
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${line} L${pts[pts.length-1][0]},${pad.t + ch} L${pad.l},${pad.t + ch} Z`;
  const yTicks = [0, max * 0.25, max * 0.5, max * 0.75, max];
  const labels = ['Juin','Juil','Août','Sept','Oct','Nov','Déc','Jan','Fév','Mar','Avr','Mai'];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', maxWidth: '100%' }}>
      <defs>
        <linearGradient id="mrr-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => {
        const y = pad.t + (1 - t / max) * ch;
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--border)" strokeDasharray={i === 0 ? '0' : '3 4'} />
            <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--ink-3)">€{Math.round(t/1000)}k</text>
          </g>
        );
      })}
      {pts.map((p, i) => i % 2 === 0 && (
        <text key={i} x={p[0]} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--ink-3)">{labels[i]}</text>
      ))}
      <path d={area} fill="url(#mrr-grad)" />
      <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p, i) => i === pts.length - 1 && (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="6" fill="var(--brand)" opacity="0.18"/>
          <circle cx={p[0]} cy={p[1]} r="3.5" fill="var(--brand)"/>
        </g>
      ))}
    </svg>
  );
}

function PageHeader({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', letterSpacing: '-0.025em' }}>
          <T fr={title.fr} en={title.en} />
        </div>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>
          <T fr={sub.fr} en={sub.en} />
        </div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
    </div>
  );
}

function Donut({ segments, size = 120, stroke = 18 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke}/>
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${len} ${c}`} strokeDashoffset={-off}
            strokeLinecap="butt"
          />
        );
        off += len;
        return el;
      })}
    </svg>
  );
}

function ScrOverview() {
  const mrr = [18,19.2,21,22.5,24,26.5,28,30.2,32.5,34,37,39.4].map(v => v * 1000);
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title={{ fr: "Bonjour Yann. Voici votre plateforme aujourd'hui.", en: "Hi Yann. Here's your platform today." }}
        sub={{ fr: '24 mai 2026 · 14:32 · 18 écoles actives · 4 320 parents abonnés', en: 'May 24, 2026 · 2:32pm · 18 active schools · 4,320 paying parents' }}
        right={<>
          <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
            <Icon name="download" size={14}/><T fr="Exporter rapport" en="Export report" />
          </button>
          <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
            <Icon name="calendar" size={14}/><T fr="Mai 2026" en="May 2026" /> <Icon name="chevD" size={12}/>
          </button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label={<T fr="MRR" en="MRR" />} value="€39 400" delta="+6.5%" sub={<T fr="vs avril · €37 000" en="vs April · €37,000" />}
          trend={<Sparkline values={[28,30.2,32.5,34,37,39.4]} w={140} h={26} color="var(--brand)" />}/>
        <KPI label={<T fr="Parents abonnés" en="Paying parents" />} value="4 320" delta="+218" sub={<T fr="ce mois-ci" en="this month" />}
          trend={<Sparkline values={[3500,3680,3820,3990,4102,4320]} w={140} h={26} color="var(--info)"/>}/>
        <KPI label={<T fr="Churn rate" en="Churn rate" />} value="2.4%" delta="-0.6pt" sub={<T fr="Moyenne 30j" en="Trailing 30d" />}
          accent="var(--accent)"
          trend={<Sparkline values={[3.5,3.2,3.0,2.8,2.6,2.4]} w={140} h={26} color="var(--accent)"/>}/>
        <KPI label={<T fr="Écoles partenaires" en="Partner schools" />} value="18" delta="+2" sub={<T fr="3 en onboarding" en="3 onboarding" />}
          trend={<Sparkline values={[10,12,13,14,16,18]} w={140} h={26} color="var(--warning)"/>}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <div className="ek-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                <T fr="Revenus récurrents mensuels" en="Monthly recurring revenue" />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                <T fr="12 derniers mois · paiements Stripe consolidés" en="Last 12 months · Stripe payouts" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['7j','30j','12m','Tout'].map((t, i) => (
                <button key={t} style={{
                  fontSize: 11.5, padding: '4px 8px', borderRadius: 6, fontWeight: 600,
                  background: i === 2 ? 'var(--surface-2)' : 'transparent',
                  color: i === 2 ? 'var(--ink)' : 'var(--ink-3)',
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <MRRChart values={mrr} w={520} h={200} />
          </div>
        </div>

        <div className="ek-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
              <T fr="Activité récente" en="Recent activity" />
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
              <T fr="Événements plateforme" en="Platform events" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { dot: 'var(--accent)', text: { fr: 'École Sainte-Thérèse · upgrade Pro', en: 'Sainte-Thérèse · upgraded to Pro' }, time: '12 min' },
              { dot: 'var(--info)',   text: { fr: '38 nouveaux abonnements parents', en: '38 new parent subscriptions' }, time: '1 h' },
              { dot: 'var(--brand)',  text: { fr: 'Onboarding · Lycée Lumière démarré', en: 'Onboarding · Lycée Lumière started' }, time: '3 h' },
              { dot: 'var(--warning)',text: { fr: '5 paiements échoués · relance auto', en: '5 failed payments · auto-retry' }, time: '5 h' },
              { dot: 'var(--danger)', text: { fr: 'Ticket P0 fermé · #1421', en: 'P0 ticket closed · #1421' }, time: 'Hier' },
            ].map((e, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', position: 'relative' }}>
                <div style={{ position: 'relative', width: 8, marginTop: 5, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: e.dot, boxShadow: `0 0 0 3px ${e.dot}22` }}/>
                  {i < arr.length - 1 && <div style={{ position: 'absolute', top: 12, left: 3.5, bottom: -12, width: 1, background: 'var(--border)' }}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500 }}><T fr={e.text.fr} en={e.text.en} /></div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>{e.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <div className="ek-card" style={{ padding: 0 }}>
          <div style={{ padding: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                <T fr="Top écoles · revenu mensuel" en="Top schools · monthly revenue" />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                <T fr="Triées par MRR · mai 2026" en="Sorted by MRR · May 2026" />
              </div>
            </div>
            <button style={{ fontSize: 12, color: 'var(--brand-600)', fontWeight: 600 }}>
              <T fr="Toutes les écoles" en="All schools" /> →
            </button>
          </div>
          <div>
            {[
              { name: 'Lycée Albert-Camus', city: 'Dakar, SN', parents: 312, mrr: '€3 120', growth: '+8%' },
              { name: 'École Sainte-Thérèse', city: 'Montréal, CA', parents: 286, mrr: '€2 860', growth: '+12%' },
              { name: 'Institut Lumière', city: 'Abidjan, CI', parents: 224, mrr: '€2 240', growth: '+5%' },
              { name: 'Collège Saint-Joseph', city: 'Lyon, FR', parents: 198, mrr: '€1 980', growth: '+3%' },
              { name: 'École les Acacias', city: 'Yaoundé, CM', parents: 156, mrr: '€1 560', growth: '+18%' },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                gap: 14, alignItems: 'center', padding: '12px 18px',
                borderTop: '1px solid var(--divider)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', fontFamily: 'var(--font-display)',
                  }}>{s.name.split(' ').map(w=>w[0]).filter(c=>c).slice(0,2).join('')}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.city}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{s.parents} <T fr="parents" en="parents" /></div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)' }}>{s.mrr}</div>
                <span className="ek-chip success">{s.growth}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ek-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
            <T fr="Répartition des plans" en="Plan distribution" />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
            <T fr="Parents abonnés par plan" en="Paying parents per plan" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
            <Donut segments={[
              { value: 2820, color: 'var(--brand)' },
              { value: 1120, color: 'var(--accent)' },
              { value: 380,  color: 'var(--info)' },
            ]} size={120} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Essentiel', value: '2 820', pct: '65%', color: 'var(--brand)' },
                { label: 'Famille',   value: '1 120', pct: '26%', color: 'var(--accent)' },
                { label: 'Premium',   value: '380',   pct: '9%',  color: 'var(--info)' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color }}/>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{p.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--ink-3)' }}>{p.value} · {p.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScrSchools() {
  const rows = [
    { name: 'Lycée Albert-Camus', city: 'Dakar, SN', plan: 'Pro', parents: 312, teachers: 48, mrr: '€3 120', status: 'active', since: 'Sept 2024' },
    { name: 'École Sainte-Thérèse', city: 'Montréal, CA', plan: 'Pro', parents: 286, teachers: 36, mrr: '€2 860', status: 'active', since: 'Janv 2025' },
    { name: 'Institut Lumière', city: 'Abidjan, CI', plan: 'Standard', parents: 224, teachers: 31, mrr: '€2 240', status: 'active', since: 'Mars 2025' },
    { name: 'Collège Saint-Joseph', city: 'Lyon, FR', plan: 'Standard', parents: 198, teachers: 28, mrr: '€1 980', status: 'active', since: 'Sept 2025' },
    { name: 'École les Acacias', city: 'Yaoundé, CM', plan: 'Standard', parents: 156, teachers: 22, mrr: '€1 560', status: 'trial', since: 'Mai 2026' },
    { name: 'Lycée Lumière', city: 'Casablanca, MA', plan: 'Pro', parents: 0, teachers: 0, mrr: '—', status: 'onboarding', since: 'Mai 2026' },
    { name: 'École Tunis-Centre', city: 'Tunis, TN', plan: 'Standard', parents: 89, teachers: 14, mrr: '€890', status: 'active', since: 'Nov 2025' },
    { name: 'Collège Mermoz', city: 'Nouakchott, MR', plan: 'Standard', parents: 132, teachers: 19, mrr: '€1 320', status: 'active', since: 'Avr 2025' },
  ];
  const statusChip = (s) => {
    if (s === 'active') return <span className="ek-chip success"><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--accent)' }}/> <T fr="Active" en="Active" /></span>;
    if (s === 'trial')  return <span className="ek-chip warn"><T fr="Essai" en="Trial" /></span>;
    if (s === 'onboarding') return <span className="ek-chip info"><T fr="Onboarding" en="Onboarding" /></span>;
    return <span className="ek-chip">{s}</span>;
  };
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title={{ fr: 'Écoles partenaires', en: 'Partner schools' }}
        sub={{ fr: '18 écoles actives · 3 en onboarding · 1 en essai', en: '18 active · 3 onboarding · 1 trial' }}
        right={<>
          <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}><Icon name="download" size={13}/> CSV</button>
          <button className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
            <Icon name="plus" size={14} stroke={2.5}/><T fr="Nouvelle école" en="New school" />
          </button>
        </>}
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {['Toutes (22)', 'Actives (18)', 'Onboarding (3)', 'Essai (1)', 'Suspendues (0)'].map((c, i) => (
          <button key={c} style={{
            padding: '6px 12px', borderRadius: 999,
            background: i === 0 ? 'var(--ink)' : 'var(--surface)',
            color: i === 0 ? 'var(--surface)' : 'var(--ink-2)',
            border: `1px solid ${i === 0 ? 'var(--ink)' : 'var(--border)'}`,
            fontSize: 12, fontWeight: 600,
          }}>{c}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}><Icon name="filter" size={13}/> <T fr="Filtres" en="Filters" /></button>
      </div>

      <div className="ek-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 0.9fr 1fr 1fr 0.5fr',
          padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--ink-3)',
          letterSpacing: '0.05em', textTransform: 'uppercase',
          background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
        }}>
          <div><T fr="École" en="School" /></div>
          <div><T fr="Plan" en="Plan" /></div>
          <div><T fr="Parents · profs" en="Parents · teachers" /></div>
          <div><T fr="MRR" en="MRR" /></div>
          <div><T fr="Statut" en="Status" /></div>
          <div><T fr="Depuis" en="Since" /></div>
          <div></div>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 0.9fr 1fr 1fr 0.5fr',
            padding: '12px 16px', alignItems: 'center', fontSize: 12.5,
            borderBottom: i < rows.length - 1 ? '1px solid var(--divider)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7, background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10.5, fontWeight: 700, color: 'var(--ink-2)', fontFamily: 'var(--font-display)',
              }}>{r.name.split(' ').map(w=>w[0]).filter(c=>c).slice(0,2).join('')}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.city}</div>
              </div>
            </div>
            <div>
              <span className={`ek-chip ${r.plan === 'Pro' ? 'brand' : ''}`}>{r.plan}</span>
            </div>
            <div style={{ color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{r.parents} · {r.teachers}</div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{r.mrr}</div>
            <div>{statusChip(r.status)}</div>
            <div style={{ color: 'var(--ink-3)' }}>{r.since}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{ color: 'var(--ink-3)', padding: 6, borderRadius: 6 }}><Icon name="chevR" size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrBilling() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title={{ fr: 'Abonnements & paiements', en: 'Subscriptions & billing' }}
        sub={{ fr: 'Synchronisé avec Stripe · dernière mise à jour il y a 2 min', en: 'Synced with Stripe · last update 2 min ago' }}
        right={<button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}><Icon name="refresh" size={13}/> <T fr="Synchroniser" en="Sync now" /></button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label={<T fr="MRR" en="MRR" />} value="€39 400" delta="+6.5%" sub="Stripe" />
        <KPI label={<T fr="ARR" en="ARR" />} value="€472 800" delta="+5.8%" sub={<T fr="annualisé" en="annualized" />}/>
        <KPI label={<T fr="ARPU" en="ARPU" />} value="€9.12" delta="+0.4" sub={<T fr="par parent" en="per parent" />}/>
        <KPI label={<T fr="Échecs paiement" en="Failed payments" />} value="14" delta="-3" accent="var(--warning)" sub={<T fr="à relancer" en="to retry" />}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <div className="ek-card" style={{ padding: 0 }}>
          <div style={{ padding: 18, borderBottom: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                <T fr="Paiements récents" en="Recent payments" />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                <T fr="Stripe Billing · 50 dernières transactions" en="Stripe Billing · last 50 transactions" />
              </div>
            </div>
            <button style={{ fontSize: 12, color: 'var(--brand-600)', fontWeight: 600 }}><T fr="Voir tout" en="View all" /> →</button>
          </div>
          {[
            { p: 'Fatou Diallo',      plan: 'Famille',  amt: '€19.00', status: 'paid',    date: '24 mai 14:12' },
            { p: 'Karim Benali',      plan: 'Essentiel',amt: '€9.00',  status: 'paid',    date: '24 mai 12:40' },
            { p: 'Sophie Roux',       plan: 'Premium',  amt: '€29.00', status: 'paid',    date: '24 mai 11:08' },
            { p: 'Antoine Mboma',     plan: 'Essentiel',amt: '€9.00',  status: 'failed',  date: '24 mai 09:32' },
            { p: 'Aïcha Traoré',      plan: 'Famille',  amt: '€19.00', status: 'paid',    date: '24 mai 08:15' },
            { p: 'Marc Dupont',       plan: 'Essentiel',amt: '€9.00',  status: 'refunded',date: '23 mai 18:48' },
            { p: 'Léa Robert',        plan: 'Famille',  amt: '€19.00', status: 'paid',    date: '23 mai 16:20' },
          ].map((tx, i, arr) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr 0.9fr 1fr',
              padding: '12px 18px', alignItems: 'center', fontSize: 12.5,
              borderBottom: i < arr.length - 1 ? '1px solid var(--divider)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={tx.p} size={28}/>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{tx.p}</span>
              </div>
              <div><span className={`ek-chip ${tx.plan === 'Premium' ? 'brand' : ''}`}>{tx.plan}</span></div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{tx.amt}</div>
              <div>
                {tx.status === 'paid' && <span className="ek-chip success"><Icon name="check" size={10} stroke={3}/> <T fr="Réussi" en="Paid" /></span>}
                {tx.status === 'failed' && <span className="ek-chip danger"><T fr="Échec" en="Failed" /></span>}
                {tx.status === 'refunded' && <span className="ek-chip">Remb.</span>}
              </div>
              <div style={{ color: 'var(--ink-3)', textAlign: 'right', fontSize: 11.5 }}>{tx.date}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ek-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                  <T fr="Churn par cohorte" en="Cohort churn" />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                  <T fr="Rétention après 6 mois" en="Retention after 6 months" />
                </div>
              </div>
              <span className="ek-chip success">94.2%</span>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { m: 'Janv 2026', v: 0.96 },
                { m: 'Févr 2026', v: 0.94 },
                { m: 'Mars 2026', v: 0.92 },
                { m: 'Avr 2026',  v: 0.95 },
                { m: 'Mai 2026',  v: 0.97 },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 64, fontSize: 11, color: 'var(--ink-3)' }}>{r.m}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.v*100}%`, background: 'var(--accent)', borderRadius: 4 }}/>
                  </div>
                  <span style={{ width: 38, fontSize: 11, color: 'var(--ink-2)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{(r.v*100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ek-card" style={{ padding: 18, borderLeft: '3px solid var(--warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="zap" size={16} style={{ color: 'var(--warning)' }}/>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                <T fr="14 paiements à relancer" en="14 payments to retry" />
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.5 }}>
              <T
                fr="3 cartes expirées, 8 fonds insuffisants, 3 erreurs réseau. La relance auto Stripe est en cours."
                en="3 expired cards, 8 insufficient funds, 3 network errors. Stripe smart retries are running."
              />
            </div>
            <button className="ek-btn ek-btn-outline" style={{ marginTop: 12, height: 32, fontSize: 12 }}>
              <T fr="Voir le détail" en="Open details" /> →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScrSupport() {
  const cols = [
    { id: 'new',      title: { fr: 'Nouveau',     en: 'New' },         tint: 'var(--info)',    cnt: 6 },
    { id: 'pending',  title: { fr: 'En cours',    en: 'In progress' }, tint: 'var(--warning)', cnt: 4 },
    { id: 'waiting',  title: { fr: 'Attente client', en: 'Waiting' },  tint: 'var(--ink-3)',   cnt: 3 },
    { id: 'resolved', title: { fr: 'Résolu',      en: 'Resolved' },    tint: 'var(--accent)',  cnt: 12 },
  ];
  const tickets = {
    new: [
      { id: '#1503', title: { fr: 'Notification absente après nouvelle note', en: 'No notification after new grade' }, who: 'Aïcha Traoré', tag: 'Bug', pri: 'P2' },
      { id: '#1502', title: { fr: 'Comment ajouter un 2e enfant ?', en: 'How to add a 2nd child?' }, who: 'Karim Benali', tag: 'Question', pri: 'P3' },
      { id: '#1501', title: { fr: 'Bulletin PDF illisible', en: 'PDF report card unreadable' }, who: 'École Lumière', tag: 'Bug', pri: 'P1' },
    ],
    pending: [
      { id: '#1498', title: { fr: 'Mode hors-ligne sur Android', en: 'Offline mode on Android' }, who: 'Sophie Roux', tag: 'Feature', pri: 'P3' },
      { id: '#1495', title: { fr: 'SSO Microsoft pour profs', en: 'Microsoft SSO for teachers' }, who: 'Lycée Albert-Camus', tag: 'Demande', pri: 'P2' },
    ],
    waiting: [
      { id: '#1490', title: { fr: 'Devis abonnement annuel', en: 'Annual plan quote' }, who: 'Sainte-Thérèse', tag: 'Sales', pri: 'P3' },
    ],
    resolved: [
      { id: '#1487', title: { fr: 'Erreur paiement renouvellement', en: 'Renewal payment error' }, who: 'Marc Dupont', tag: 'Billing', pri: 'P2' },
      { id: '#1486', title: { fr: 'Reset mot de passe parent', en: 'Parent password reset' }, who: 'Léa Robert', tag: 'Account', pri: 'P3' },
    ],
  };
  const priColor = { P0: 'var(--danger)', P1: 'var(--danger)', P2: 'var(--warning)', P3: 'var(--ink-3)' };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <PageHeader
        title={{ fr: 'Support & tickets', en: 'Support & tickets' }}
        sub={{ fr: '25 tickets actifs · temps de réponse moyen : 1h 12min', en: '25 active tickets · avg. response 1h 12m' }}
        right={<>
          <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}><T fr="Macros" en="Macros" /></button>
          <button className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}><Icon name="plus" size={14} stroke={2.5}/> <T fr="Nouveau ticket" en="New ticket" /></button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flex: 1, minHeight: 0 }}>
        {cols.map(col => (
          <div key={col.id} style={{
            background: 'var(--surface-2)', borderRadius: 12, padding: 10,
            display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 2px' }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: col.tint }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}><T fr={col.title.fr} en={col.title.en} /></span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{col.cnt}</span>
            </div>
            <div className="ek-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
              {(tickets[col.id] || []).map((t, i) => (
                <div key={i} className="ek-card" style={{ padding: 12, borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: priColor[t.pri], background: priColor[t.pri] + '22', padding: '1px 6px', borderRadius: 5 }}>{t.pri}</span>
                    <span style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>{t.id}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink-3)' }}>{t.tag}</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', marginTop: 6, lineHeight: 1.35 }}><T fr={t.title.fr} en={t.title.en} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <Avatar name={t.who} size={22}/>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.who}</span>
                    <Icon name="chat" size={11} style={{ marginLeft: 'auto', color: 'var(--ink-3)' }}/>
                    <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{((t.id.charCodeAt(1)*7) % 8) + 1}</span>
                  </div>
                </div>
              ))}
              {col.id !== 'resolved' && (
                <button style={{
                  padding: 10, border: '1px dashed var(--border-strong)', borderRadius: 10,
                  color: 'var(--ink-3)', fontSize: 12, fontWeight: 600, background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}><Icon name="plus" size={13}/> <T fr="Ajouter" en="Add" /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrSecurity() {
  const events = [
    { sev: 'info',    actor: 'system',          msg: { fr: 'Sauvegarde quotidienne terminée · 8.4 GB', en: 'Daily backup completed · 8.4 GB' }, ts: '14:30:12', src: 'cron' },
    { sev: 'info',    actor: 'fatou.diallo',    msg: { fr: 'Connexion réussie · iOS', en: 'Login success · iOS' }, ts: '14:28:54', src: 'auth' },
    { sev: 'warn',    actor: 'system',          msg: { fr: 'Latence DB élevée détectée (p95 = 412ms)', en: 'Elevated DB latency (p95 = 412ms)' }, ts: '14:25:11', src: 'metrics' },
    { sev: 'info',    actor: 'yann.mbaye',      msg: { fr: 'Modification plan tarifaire · École Lumière', en: 'Pricing plan change · École Lumière' }, ts: '14:18:03', src: 'admin' },
    { sev: 'critical',actor: 'security-bot',    msg: { fr: '5 tentatives login échouées · IP 41.83.x.x · bloquée 24h', en: '5 failed login attempts · IP 41.83.x.x · blocked 24h' }, ts: '14:11:47', src: 'auth' },
    { sev: 'info',    actor: 'stripe-webhook',  msg: { fr: 'invoice.payment_succeeded · cust_4QzN…', en: 'invoice.payment_succeeded · cust_4QzN…' }, ts: '14:08:21', src: 'webhook' },
    { sev: 'warn',    actor: 'system',          msg: { fr: 'Quota S3 à 78% · bucket ekelasi-uploads-prod', en: 'S3 quota at 78% · bucket ekelasi-uploads-prod' }, ts: '13:55:09', src: 'storage' },
    { sev: 'info',    actor: 'aicha.traore',    msg: { fr: 'Mot de passe changé', en: 'Password changed' }, ts: '13:42:38', src: 'auth' },
    { sev: 'info',    actor: 'system',          msg: { fr: 'Déploiement v2.4.1 · 0 erreur', en: 'Deploy v2.4.1 · 0 errors' }, ts: '13:30:00', src: 'deploy' },
    { sev: 'info',    actor: 'lycee-camus.adm', msg: { fr: 'Export bulletin PDF · 312 élèves', en: 'Report card PDF export · 312 students' }, ts: '13:21:14', src: 'reports' },
  ];
  const sevColor = { info: 'var(--info)', warn: 'var(--warning)', critical: 'var(--danger)' };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title={{ fr: 'Sécurité & journaux', en: 'Security & logs' }}
        sub={{ fr: "Journal d'audit · ressources & événements plateforme", en: 'Audit log · resources & platform events' }}
        right={<button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}><Icon name="download" size={13}/> <T fr="Exporter logs" en="Export logs" /></button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label={<T fr="Statut système" en="System status" />} value={<><span style={{ color: 'var(--accent)' }}>●</span> Healthy</>} sub={<T fr="Uptime 99.98% · 30j" en="Uptime 99.98% · 30d" />}/>
        <KPI label={<T fr="Sessions actives" en="Active sessions" />} value="4 312" sub={<T fr="parents · profs · admins" en="parents · teachers · admins" />}/>
        <KPI label={<T fr="Alertes ouvertes" en="Open alerts" />} value="3" accent="var(--warning)" sub={<T fr="1 critique · 2 warnings" en="1 critical · 2 warnings" />}/>
        <KPI label={<T fr="RGPD" en="GDPR" />} value={<><Icon name="check" size={20} stroke={3} style={{ verticalAlign: -3, color: 'var(--accent)' }}/> Compliant</>} sub={<T fr="Audit Q1 2026 passé" en="Q1 2026 audit passed" />}/>
      </div>

      <div className="ek-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--divider)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
            <T fr="Journal d'événements" en="Event log" />
          </div>
          <div style={{ flex: 1 }} />
          {['Tous', 'Info', 'Warn', 'Critical'].map((c, i) => (
            <button key={c} style={{
              padding: '4px 10px', borderRadius: 6,
              background: i === 0 ? 'var(--surface-2)' : 'transparent',
              color: i === 0 ? 'var(--ink)' : 'var(--ink-3)',
              fontSize: 11, fontWeight: 600,
            }}>{c}</button>
          ))}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
          {events.map((e, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '80px 80px 130px 80px 1fr',
              padding: '10px 18px', alignItems: 'center', gap: 12,
              borderBottom: i < events.length - 1 ? '1px solid var(--divider)' : 'none',
              color: 'var(--ink-2)',
            }}>
              <span style={{ color: 'var(--ink-3)' }}>{e.ts}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: sevColor[e.sev], background: sevColor[e.sev] + '18',
                padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', textAlign: 'center',
                fontFamily: 'var(--font-body)', letterSpacing: '0.04em',
              }}>{e.sev}</span>
              <span style={{ color: 'var(--brand-600)' }}>{e.actor}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{e.src}</span>
              <span style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 12.5 }}>
                <T fr={e.msg.fr} en={e.msg.en} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminWeb({ initial = 'overview', dark = false, lang = 'fr' }) {
  const [screen, setScreen] = React.useState(initial);
  const render = () => {
    switch (screen) {
      case 'overview': return <ScrOverview />;
      case 'schools':  return <ScrSchools />;
      case 'billing':  return <ScrBilling />;
      case 'support':  return <ScrSupport />;
      case 'security': return <ScrSecurity />;
      default:         return <ScrOverview />;
    }
  };
  return (
    <AdminShell dark={dark} lang={lang} current={screen} onNav={setScreen}>
      {render()}
    </AdminShell>
  );
}

Object.assign(window, { AdminWeb });
