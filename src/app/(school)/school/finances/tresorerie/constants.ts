// Libellés et catégories du module Trésorerie.

import type { TreasuryKind } from "@/lib/finance/treasury";

export const KIND_LABEL: Record<TreasuryKind, string> = { depense: "Dépense", recette_exceptionnelle: "Recette exceptionnelle" };
export const EXC_CATEGORIES = ["Don", "Subvention", "Location d’infrastructure", "Intérêts bancaires", "Autre"];

