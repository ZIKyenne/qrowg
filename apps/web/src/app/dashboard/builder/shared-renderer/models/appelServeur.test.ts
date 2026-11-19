import { describe, it, expect } from "vitest"
import { demandesActives, normaliserTable, tableDepuisAdresse, contenuDeLAppel, secondesRestantes, DEMANDES, PAUSE_ENTRE_APPELS_S } from "./appelServeur"

describe("l'appel en salle", () => {
  it("seules les demandes activées ; un bloc vide n'en propose aucune", () => {
    const tout = { show_serveur: "Oui", show_addition: "Oui", show_commande: "Oui" }
    expect(demandesActives(tout).map(d => d.cle)).toEqual(["serveur", "addition", "commande"])
    expect(demandesActives({ ...tout, show_commande: "Non" }).map(d => d.cle)).toEqual(["serveur", "addition"])
    expect(demandesActives({})).toEqual([])
  })

  it("un numéro de table propre, court, en majuscules", () => {
    expect(normaliserTable(" t-4 ")).toBe("T4")
    expect(normaliserTable("12")).toBe("12")
    expect(normaliserTable("<script>")).toBe("SCRIPT")
    expect(normaliserTable("1234567890")).toBe("123456")
    expect(normaliserTable(undefined)).toBe("")
  })

  it("le QR de la table préremplit son numéro (?table=12)", () => {
    expect(tableDepuisAdresse("?table=12&s=abc")).toBe("12")
    expect(tableDepuisAdresse("?s=abc")).toBe("")
  })

  it("Messages lit la table en nom et la demande en message", () => {
    const addition = DEMANDES.find(d => d.cle === "addition")!
    expect(contenuDeLAppel(addition, "b12")).toEqual({ name: "Table B12", message: "L'addition, s'il vous plaît", data: { demande: "addition", table: "B12" } })
    expect(contenuDeLAppel(addition, "").name).toBe("Table non précisée")
  })

  it("une pause entre deux envois du même téléphone", () => {
    expect(secondesRestantes(null, 1000)).toBe(0)
    expect(secondesRestantes(0, 1000)).toBe(PAUSE_ENTRE_APPELS_S - 1)
    expect(secondesRestantes(0, PAUSE_ENTRE_APPELS_S * 1000 + 1)).toBe(0)
  })
})
