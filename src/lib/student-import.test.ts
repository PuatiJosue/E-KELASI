import { describe, it, expect } from "vitest";
import { parseStudentRows, validStudentRows } from "./student-import";

describe("parseStudentRows", () => {
  it("gère le séparateur point-virgule", () => {
    const rows = parseStudentRows("Mamadou Ndoye; 5e année primaire\nAwa Sow; 1re année des humanités; Sciences");
    expect(rows).toEqual([
      { fullName: "Mamadou Ndoye", className: "5e année primaire", option: "", gradeLevel: "" },
      { fullName: "Awa Sow", className: "1re année des humanités", option: "Sciences", gradeLevel: "" },
    ]);
  });

  it("gère le collage Excel (tabulations)", () => {
    const rows = parseStudentRows("Jean Kabasele\t2e année des humanités\tCommercial et gestion\t2e");
    expect(rows[0]).toEqual({ fullName: "Jean Kabasele", className: "2e année des humanités", option: "Commercial et gestion", gradeLevel: "2e" });
  });

  it("gère les virgules", () => {
    const rows = parseStudentRows("Awa Sow,6e année primaire");
    expect(rows[0].className).toBe("6e année primaire");
  });

  it("saute une ligne d'en-tête", () => {
    const rows = parseStudentRows("Nom;Classe;Option\nMamadou;5e année primaire");
    expect(rows).toHaveLength(1);
    expect(rows[0].fullName).toBe("Mamadou");
  });

  it("ignore les lignes vides et sans nom", () => {
    const rows = parseStudentRows("Mamadou;5e\n\n;3e année primaire\n   \nAwa;4e");
    expect(rows.map((r) => r.fullName)).toEqual(["Mamadou", "Awa"]);
  });
});

describe("validStudentRows", () => {
  it("ne garde que les lignes avec nom ET classe", () => {
    const parsed = parseStudentRows("Mamadou;5e année primaire\nSansClasse\nAwa;4e année primaire");
    expect(validStudentRows(parsed).map((r) => r.fullName)).toEqual(["Mamadou", "Awa"]);
  });
});
