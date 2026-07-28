// Helpers de présentation partagés par la couche données de la console admin.

import type { PaymentRow } from "@/lib/mock";

export function currencySymbol(cur: string): string {
  const c = (cur || "USD").toUpperCase();
  if (c === "USD") return "$";
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  return c + " ";
}

export function fmtMoney(cents: number, currency = "USD"): string {
  return `${currencySymbol(currency)}${(cents / 100).toFixed(2)}`;
}

export function fmtMoneyKpi(cents: number, currency = "USD"): string {
  return `${currencySymbol(currency)}${Math.round(cents / 100).toLocaleString("fr-FR")}`;
}

export function fmtDateTime(d: Date): string {
  return d.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function planLabel(p: string): PaymentRow["plan"] {
  if (p === "famille") return "Famille";
  if (p === "premium") return "Premium";
  return "Essentiel";
}

// "active" recurring revenue counts active + trialing subscriptions.
export function isActiveStatus(status: string): boolean {
  return status === "active" || status === "trialing";
}

// Date relative « Il y a 12 min » pour les flux Mobile Money.
export function fmtMMDate(d: Date): string {
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
