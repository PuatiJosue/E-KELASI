import { describe, it, expect } from "vitest";
import { nextClassFor, proposeDecision, levelKeyOf, cycleOf, PROMOTION_LEVELS } from "./promotion";

describe("levelKeyOf", () => {
  it("reconnaît les niveaux de la maternelle", () => {
    expect(levelKeyOf("1re maternelle")).toBe("m1");
    expect(levelKeyOf("1ère maternelle")).toBe("m1");
    expect(levelKeyOf("3e maternelle")).toBe("m3");
    // Une section de maternelle sans niveau chiffré reste indéterminée.
    expect(levelKeyOf("Maternelle Étoile")).toBeNull();
  });

  it("reconnaît les niveaux du primaire", () => {
    expect(levelKeyOf("1re année primaire")).toBe("p1");
    expect(levelKeyOf("6e année primaire")).toBe("p6");
    expect(levelKeyOf("7e année du primaire")).toBe("b7");
    expect(levelKeyOf("8e année du primaire")).toBe("b8");
  });

  it("reconnaît les niveaux des humanités", () => {
    expect(levelKeyOf("1re année des humanités")).toBe("h1");
    expect(levelKeyOf("2e année des humanités")).toBe("h2");
    expect(levelKeyOf("4e année des humanités")).toBe("h4");
  });

  it("est insensible à la casse et aux accents", () => {
    expect(levelKeyOf("2E ANNEE DES HUMANITES")).toBe("h2");
    expect(levelKeyOf("3e Année Primaire")).toBe("p3");
  });

  it("retourne null pour un nom non reconnu", () => {
    expect(levelKeyOf("Section Lune")).toBeNull();
    expect(levelKeyOf("")).toBeNull();
  });
});

describe("nextClassFor", () => {
  it("progresse dans la maternelle puis entre au primaire", () => {
    expect(nextClassFor("1re maternelle")).toEqual({ kind: "promote", nextClass: "2e maternelle", enteringHumanities: false });
    expect(nextClassFor("3e maternelle")).toEqual({ kind: "promote", nextClass: "1re année primaire", enteringHumanities: false });
  });

  it("passe au niveau supérieur dans le primaire", () => {
    expect(nextClassFor("1re année primaire")).toEqual({ kind: "promote", nextClass: "2e année primaire", enteringHumanities: false });
    expect(nextClassFor("6e année primaire")).toEqual({ kind: "promote", nextClass: "7e année du primaire", enteringHumanities: false });
  });

  it("marque l'entrée en humanités (8e → 1re humanités)", () => {
    const p = nextClassFor("8e année du primaire");
    expect(p).toEqual({ kind: "promote", nextClass: "1re année des humanités", enteringHumanities: true });
  });

  it("progresse dans les humanités", () => {
    expect(nextClassFor("2e année des humanités")).toEqual({ kind: "promote", nextClass: "3e année des humanités", enteringHumanities: false });
  });

  it("diplôme en fin de cycle (4e humanités)", () => {
    expect(nextClassFor("4e année des humanités")).toEqual({ kind: "graduate" });
  });

  it("renvoie unknown pour une classe non reconnue", () => {
    expect(nextClassFor("Maternelle Étoile")).toEqual({ kind: "unknown" });
  });

  it("ne propose jamais une classe hors de la séquence officielle", () => {
    for (const lvl of PROMOTION_LEVELS) {
      const p = nextClassFor(lvl.label);
      if (p.kind === "promote") {
        expect(PROMOTION_LEVELS.some((l) => l.label === p.nextClass)).toBe(true);
      }
    }
  });
});

describe("proposeDecision", () => {
  it("propose le passage vers la classe supérieure", () => {
    expect(proposeDecision("2e année des humanités")).toEqual({ action: "promote", targetClass: "3e année des humanités", needsOption: false });
  });
  it("signale le besoin d'option à l'entrée en humanités", () => {
    expect(proposeDecision("8e année du primaire")).toEqual({ action: "promote", targetClass: "1re année des humanités", needsOption: true });
  });
  it("propose « diplômé » en fin de cycle", () => {
    expect(proposeDecision("4e année des humanités")).toEqual({ action: "graduate", targetClass: "", needsOption: false });
  });
  it("propose « exclure » pour une classe non reconnue", () => {
    expect(proposeDecision("Club théâtre")).toEqual({ action: "skip", targetClass: "", needsOption: false });
  });
});

describe("cycleOf", () => {
  it("classe par cycle", () => {
    expect(cycleOf("2e année des humanités")).toBe("secondaire");
    expect(cycleOf("3e année primaire")).toBe("primaire");
    expect(cycleOf("8e année du primaire")).toBe("primaire");
    expect(cycleOf("1ère maternelle")).toBe("maternelle");
    expect(cycleOf("Atelier libre")).toBe("autre");
  });
});
