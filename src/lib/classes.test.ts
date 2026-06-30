import { describe, it, expect } from "vitest";
import { normOption, classLabel, classKey } from "./classes";

describe("normOption", () => {
  it("réduit le vide / espaces à null", () => {
    expect(normOption("")).toBeNull();
    expect(normOption("   ")).toBeNull();
    expect(normOption(null)).toBeNull();
    expect(normOption(undefined)).toBeNull();
  });
  it("conserve et nettoie une option réelle", () => {
    expect(normOption("Sciences")).toBe("Sciences");
    expect(normOption("  Pédagogie ")).toBe("Pédagogie");
  });
});

describe("classLabel", () => {
  it("combine niveau et option avec un tiret cadratin", () => {
    expect(classLabel("2e année des humanités", "Sciences")).toBe("2e année des humanités — Sciences");
  });
  it("affiche le niveau seul sans option", () => {
    expect(classLabel("6e année primaire", null)).toBe("6e année primaire");
    expect(classLabel("6e année primaire", "  ")).toBe("6e année primaire");
  });
  it("retombe sur un tiret si pas de niveau", () => {
    expect(classLabel(null, null)).toBe("—");
  });
});

describe("classKey", () => {
  it("distingue deux options du même niveau", () => {
    expect(classKey("2e", "Sciences")).not.toBe(classKey("2e", "Littéraire"));
  });
  it("est stable pour le même couple", () => {
    expect(classKey("2e", "Sciences")).toBe(classKey("2e", "Sciences"));
  });
  it("sans option = le niveau seul", () => {
    expect(classKey("2e", null)).toBe("2e");
  });
  it("la clé avec option diffère de la clé sans option", () => {
    expect(classKey("2e", "Sciences")).not.toBe(classKey("2e", null));
  });
});
