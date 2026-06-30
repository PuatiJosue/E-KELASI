import { describe, it, expect } from "vitest";
import { trimesterOf, trimesterMeta, schoolYearLabel, TRIMESTERS } from "./trimester";

describe("trimesterOf", () => {
  it("range chaque mois dans le bon trimestre (année scolaire sept→août)", () => {
    expect(trimesterOf("2025-09-15")).toBe(1); // septembre
    expect(trimesterOf("2025-11-30")).toBe(1);
    expect(trimesterOf("2025-12-01")).toBe(2); // décembre
    expect(trimesterOf("2026-01-10")).toBe(2);
    expect(trimesterOf("2026-02-28")).toBe(2);
    expect(trimesterOf("2026-03-01")).toBe(3); // mars
    expect(trimesterOf("2026-05-31")).toBe(3);
    expect(trimesterOf("2026-06-01")).toBe(4); // juin
    expect(trimesterOf("2026-08-31")).toBe(4);
  });

  it("couvre les 12 mois sans trou ni chevauchement", () => {
    const seen = new Set<number>();
    for (let m = 1; m <= 12; m++) {
      const t = trimesterOf(new Date(2025, m - 1, 15));
      expect([1, 2, 3, 4]).toContain(t);
      seen.add(m);
    }
    const allMonths = TRIMESTERS.flatMap((t) => t.months).sort((a, b) => a - b);
    expect(allMonths).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe("trimesterMeta", () => {
  it("retourne le bon libellé", () => {
    expect(trimesterMeta(1).short).toBe("T1");
    expect(trimesterMeta(4).short).toBe("T4");
  });
  it("retombe sur T1 pour un index invalide", () => {
    expect(trimesterMeta(99).index).toBe(1);
  });
});

describe("schoolYearLabel", () => {
  it("bascule l'année en septembre", () => {
    expect(schoolYearLabel("2025-09-01")).toBe("2025–2026");
    expect(schoolYearLabel("2025-08-31")).toBe("2024–2025");
    expect(schoolYearLabel("2026-01-15")).toBe("2025–2026");
  });
});
