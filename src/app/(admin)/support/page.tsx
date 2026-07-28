import { PageHeader } from "@/components/KPI";
import { listTicketsByStatus } from "@/lib/admin/support";
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
      />

      <TicketBoard tickets={tickets} />
    </div>
  );
}
