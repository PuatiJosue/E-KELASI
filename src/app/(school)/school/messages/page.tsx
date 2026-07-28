import { PageHeader } from "@/components/KPI";
import { listSchoolConversations } from "@/lib/messages-db";
import { getReminderRecipients } from "@/lib/finance/reminders";
import { MessagesManager } from "./MessagesManager";

export default async function SchoolMessages({
  searchParams,
}: {
  searchParams?: { compose?: string };
}) {
  const composeReminder = searchParams?.compose === "reminder";
  const [conversations, reminderRecipients] = await Promise.all([
    listSchoolConversations(),
    getReminderRecipients(),
  ]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Messagerie", en: "Inbox" }}
        sub={{
          fr: "Messages des parents. Cliquez sur une conversation pour lire et répondre.",
          en: "Parent messages. Click a conversation to read and reply.",
        }}
      />
      <MessagesManager
        conversations={conversations}
        reminderRecipients={reminderRecipients}
        startInReminder={composeReminder}
      />
    </div>
  );
}
