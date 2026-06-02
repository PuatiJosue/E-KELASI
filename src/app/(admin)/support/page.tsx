import { PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listTicketsByStatus } from "@/lib/db";
import { TicketBoard } from "@/components/admin/TicketBoard";

export default async function SupportPage() {
  const tickets = await listTicketsByStatus();
  const total = Object.values(tickets).reduce((a, arr) => a + arr.length, 0);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <PageHeader
        title={{ fr: "Support & tickets", en: "Support & tickets" }}
        sub={{
          fr: `${total} ticket(s) actif(s)`,
          en: `${total} active ticket(s)`,
        }}
        right={
          <>
            <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
              <T fr="Macros" en="Macros" />
            </button>
            <button className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
              <Icon name="plus" size={14} stroke={2.5} /> <T fr="Nouveau ticket" en="New ticket" />
            </button>
          </>
        }
      />

      <TicketBoard tickets={tickets} />
    </div>
  );
}
