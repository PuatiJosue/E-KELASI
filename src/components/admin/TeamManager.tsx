"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { T } from "@/lib/i18n";
import {
  inviteAdminAction,
  updateMemberAction,
  uploadMemberDocAction,
  deleteMemberDocAction,
} from "@/app/(admin)/team/actions";

export type MemberDoc = { id: string; name: string; url: string };
export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  since: string;
  documents: MemberDoc[];
};

export function TeamManager({ team }: { team: Member[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="ek-btn ek-btn-primary" style={{ height: 36, fontSize: 12.5 }} onClick={() => setAdding(true)}>
          <Icon name="plus" size={14} stroke={2.5} />
          <T fr="Ajouter un membre" en="Add a member" />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {team.length === 0 ? (
          <div className="ek-card" style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            <T fr="Aucun membre." en="No member." />
          </div>
        ) : (
          team.map((m) => <MemberCard key={m.id} member={m} />)
        )}
      </div>

      {adding && <AddMemberModal onClose={() => setAdding(false)} />}
    </>
  );
}

function MemberCard({ member }: { member: Member }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone);
  const [address, setAddress] = useState(member.address);
  const [msg, setMsg] = useState<string | null>(null);

  const save = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await updateMemberAction({ userId: member.id, fullName: name, phone, address });
      if (r.ok) { setEditing(false); router.refresh(); }
      else setMsg(r.message);
    });
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    const fd = new FormData();
    fd.set("userId", member.id);
    fd.set("file", file);
    startTransition(async () => {
      const r = await uploadMemberDocAction(fd);
      if (!r.ok) setMsg(r.message);
      else router.refresh();
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const removeDoc = (id: string) => {
    startTransition(async () => {
      const r = await deleteMemberDocAction(id);
      if (r.ok) router.refresh();
      else setMsg(r.message);
    });
  };

  return (
    <div className="ek-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={member.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{member.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{member.email} · <T fr="depuis" en="since" /> {member.since}</div>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="ek-btn ek-btn-outline"
          style={{ height: 32, fontSize: 12 }}
        >
          <Icon name={editing ? "close" : "settings"} size={13} />
          {editing ? <T fr="Fermer" en="Close" /> : <T fr="Modifier" en="Edit" />}
        </button>
      </div>

      {editing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--divider)", paddingTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label={<T fr="Nom complet" en="Full name" />}>
              <input value={name} onChange={(e) => setName(e.target.value)} style={inp} />
            </Field>
            <Field label={<T fr="Téléphone" en="Phone" />}>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+243 …" style={inp} />
            </Field>
          </div>
          <Field label={<T fr="Adresse" en="Address" />}>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Avenue, n°…" style={inp} />
          </Field>
          <div>
            <button onClick={save} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12.5, opacity: pending ? 0.6 : 1 }}>
              {pending ? <T fr="Enregistrement…" en="Saving…" /> : <T fr="Enregistrer" en="Save" />}
            </button>
          </div>
        </div>
      )}

      {/* Documents */}
      <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <T fr="Documents" en="Documents" /> ({member.documents.length})
          </span>
          <button onClick={() => fileRef.current?.click()} disabled={pending} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 11.5 }}>
            <Icon name="upload" size={12} /> <T fr="Ajouter" en="Add" />
          </button>
          <input ref={fileRef} type="file" accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={onPickFile} style={{ display: "none" }} />
        </div>
        {member.documents.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
            <T fr="Aucun document." en="No document." />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {member.documents.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                <Icon name="file" size={14} />
                <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-600)", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.name}
                </a>
                <button onClick={() => removeDoc(d.id)} disabled={pending} title="Supprimer" style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 600 }}>{msg}</div>}
    </div>
  );
}

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const r = await inviteAdminAction({ fullName: name });
      if (r.ok) { setCode(r.code); router.refresh(); }
      else setError(r.message);
    });
  };

  const copyMessage = () => {
    if (!code) return;
    const msg =
      `Bonjour ${name}, voici votre accès admin E-KLASS :\n` +
      `1. Allez sur https://e-kelasi.vercel.app/admin-signup\n` +
      `2. Saisissez votre code d'accès : ${code}\n` +
      `3. Créez votre email et votre mot de passe.`;
    navigator.clipboard?.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="ek-card" style={{ width: "100%", maxWidth: 440, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Ajouter un membre" en="Add a member" />
          </h2>
          <button onClick={onClose} style={{ padding: 4, color: "var(--ink-3)" }}><Icon name="close" size={18} /></button>
        </div>

        {code ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: "10px 12px", borderRadius: 9, background: "var(--accent-100)", color: "var(--accent)", fontSize: 12, fontWeight: 600 }}>
              <T fr="Code d'accès généré ✅" en="Access code generated ✅" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 14, borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-2)" }}>
              <Row label={<T fr="Membre" en="Member" />} value={name} />
              <Row label={<T fr="Page" en="Page" />} value="e-kelasi.vercel.app/admin-signup" />
              <Row label={<T fr="Code d'accès" en="Access code" />} value={code} mono />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.4 }}>
              <T
                fr="Transmettez ce code au nouveau membre. Il crée lui-même son email et son mot de passe. Le code ne sera plus réaffiché."
                en="Share this code with the new member. They create their own email and password. The code won't be shown again."
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyMessage} className="ek-btn ek-btn-primary" style={{ flex: 1 }}>
                {copied ? <T fr="Copié !" en="Copied!" /> : <T fr="Copier le message" en="Copy message" />}
              </button>
              <button onClick={onClose} className="ek-btn ek-btn-outline" style={{ flex: 1 }}><T fr="Terminé" en="Done" /></button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label={<T fr="Nom complet du membre" en="Member full name" />}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mme Mbuyi" style={inp} autoFocus />
            </Field>
            {error && (
              <div style={{ padding: "10px 12px", borderRadius: 9, background: "rgba(192,58,43,0.1)", color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>{error}</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={onClose} className="ek-btn ek-btn-outline" style={{ flex: 1 }}><T fr="Annuler" en="Cancel" /></button>
              <button onClick={submit} disabled={pending || !name.trim()} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: pending || !name.trim() ? 0.6 : 1 }}>
                {pending ? <T fr="Génération…" en="Generating…" /> : <T fr="Générer le code" en="Generate code" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, mono }: { label: React.ReactNode; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 12.5 }}>
      <span style={{ color: "var(--ink-3)", minWidth: 92 }}>{label}</span>
      <span style={{ color: "var(--ink)", fontWeight: 600, fontFamily: mono ? "ui-monospace, monospace" : "inherit", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 13,
  fontFamily: "inherit",
  width: "100%",
};
