import { PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { AdminBookForm } from "@/components/admin/AdminBookForm";
import { DeletePlatformBook } from "@/components/admin/DeletePlatformBook";

export const dynamic = "force-dynamic";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_url: string | null;
  grade_level: string | null;
  file_format: string | null;
  price_cents: number;
  currency: string;
  sales: number;
};

async function fetchBooks(): Promise<Book[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("library_books")
      .select("id, title, author, description, cover_url, grade_level, file_format, price_cents, currency")
      .is("school_id", null)
      .order("created_at", { ascending: false });
    if (!data) return [];

    // Nombre de ventes (achats payés) par livre.
    const ids = data.map((b: any) => b.id);
    const counts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: purchases } = await supabase
        .from("library_purchases")
        .select("book_id")
        .eq("status", "paid")
        .in("book_id", ids);
      (purchases ?? []).forEach((p: any) => counts.set(p.book_id, (counts.get(p.book_id) ?? 0) + 1));
    }
    return data.map((b: any) => ({ ...b, sales: counts.get(b.id) ?? 0 }));
  } catch {
    return [];
  }
}

export default async function AdminLibraryPage() {
  const books = await fetchBooks();
  const fmtPrice = (b: Book) => (b.price_cents > 0 ? `${(b.price_cents / 100).toFixed(2)} ${b.currency}` : "Gratuit");

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Bibliothèque", en: "Library" }}
        sub={{
          fr: `${books.length} livres · visibles par tous les parents · achat Stripe ou Mobile Money`,
          en: `${books.length} books · visible to all parents · pay by Stripe or Mobile Money`,
        }}
        right={<AdminBookForm />}
      />

      {books.length === 0 ? (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
          <Icon name="book" size={32} />
          <div style={{ marginTop: 12, fontSize: 13 }}>
            <T fr="Aucun livre. Ajoute-en un (PDF/EPUB + prix) pour démarrer la bibliothèque." en="No books yet. Add one (PDF/EPUB + price) to start the library." />
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {books.map((b) => (
            <div key={b.id} className="ek-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  height: 140, borderRadius: 10,
                  background: b.cover_url ? `center / cover no-repeat url("${b.cover_url}")` : "var(--brand-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden",
                }}
              >
                {!b.cover_url && <Icon name="book" size={40} color="var(--brand-600)" />}
                <span style={{ position: "absolute", top: 8, left: 8, padding: "3px 8px", borderRadius: 999, background: "rgba(0,0,0,0.65)", color: "white", fontSize: 10.5, fontWeight: 700 }}>
                  {fmtPrice(b)}
                </span>
                {b.file_format && (
                  <span style={{ position: "absolute", top: 8, right: 8, padding: "3px 8px", borderRadius: 999, background: "rgba(255,255,255,0.9)", color: "var(--ink)", fontSize: 10.5, fontWeight: 700 }}>
                    {b.file_format.toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)", lineHeight: 1.25 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{b.author}</div>
                {b.grade_level && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>{b.grade_level}</div>}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--divider)" }}>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  <T fr="Ventes" en="Sales" /> : <span style={{ color: "var(--ink-2)", fontWeight: 700 }}>{b.sales}</span>
                </div>
                <DeletePlatformBook id={b.id} title={b.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
