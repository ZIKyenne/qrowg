import { describe, it, expect } from "vitest"
import { gestesDuMenu, confirmationDe, phraseApres, libelleDeDestination, TYPES_DE_DESTINATION } from "./gestesQr"
import { canTransition } from "@/app/api/qr-status/qrStatus"

const cles = (s: string | null) => gestesDuMenu(s).map(g => g.cle)

describe("le menu « ⋯ » ne propose que ce que le serveur accepte", () => {
  it("un QR actif : pause et archive, pas de suppression", () => {
    expect(cles("active")).toEqual(["pause", "archive"])
  })
  it("un statut absent vaut « actif »", () => {
    expect(cles(null)).toEqual(["pause", "archive"])
  })
  it("en pause ou brouillon : activer, archiver", () => {
    expect(cles("paused")).toEqual(["activate", "archive"])
    expect(cles("draft")).toEqual(["activate", "archive"])
  })
  it("archivé : restaurer, et seulement là, supprimer", () => {
    expect(cles("archived")).toEqual(["restore", "supprimer"])
  })
  it("chaque geste de statut est une transition permise par la route", () => {
    for (const s of ["active", "paused", "draft", "archived", "expired"])
      for (const g of gestesDuMenu(s)) if (g.cle !== "supprimer") expect(canTransition(s, g.cle)).toBe(true)
  })
  it("ce qui arrête les scans se confirme ; le reste non", () => {
    const parCle = Object.fromEntries(["active", "paused", "archived"].flatMap(s => gestesDuMenu(s)).map(g => [g.cle, g.confirmer]))
    expect(parCle).toEqual({ pause: true, archive: true, activate: false, restore: false, supprimer: true })
  })
})

describe("les phrases", () => {
  it("la confirmation cite le QR et dit ce qui arrive au code imprimé", () => {
    expect(confirmationDe("pause", "Carte du midi").texte).toContain("« Carte du midi »")
    expect(confirmationDe("pause", "x").texte).toContain("reste valable")
    expect(confirmationDe("supprimer", "x")).toMatchObject({ destructif: true, verbe: "Supprimer définitivement" })
    expect(confirmationDe("archive", "x").destructif).toBe(false)
  })
  it("chaque geste a sa phrase de succès", () => {
    for (const g of ["activate", "pause", "archive", "restore", "supprimer"] as const) expect(phraseApres(g)).toMatch(/\.$/)
  })
  it("une destination se nomme en français, la note de l'utilisateur d'abord", () => {
    expect(libelleDeDestination({ type: "url", value: "https://a.fr" })).toBe("Site web")
    expect(libelleDeDestination({ type: "url", value: "https://a.fr", label: "Promo été" })).toBe("Promo été")
    expect(libelleDeDestination({ type: "page", value: "id" })).toBe("Page QRowg")
  })
  it("on ne demande plus l'identifiant interne d'une page", () => {
    expect(TYPES_DE_DESTINATION.map(t => t.id)).not.toContain("page")
  })
})
