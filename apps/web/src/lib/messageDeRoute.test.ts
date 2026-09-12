import { describe, it, expect } from "vitest"
import { messageDeRoute, estUnePhrase, phrasePourStatut } from "./messageDeRoute"
import { USER_MESSAGES } from "@/app/dashboard/builder/builderErrors"

// Les chaînes que les routes renvoient réellement, comptées le 11 septembre sur
// l'ensemble de app/api : « Non authentifié » 48 fois, « id requis » 10,
// « QR introuvable » 10, « Erreur serveur » 6, « limit » 3.
const CODES = ["Non authentifié", "Non authentifie", "id requis", "QR introuvable", "limit", "domain requis", "Erreur serveur", "Introuvable", "Non autorisé"]

describe("un code déguisé en français n'est pas une phrase", () => {
  for (const c of CODES) {
    it(`« ${c} » n'atteint pas l'écran`, () => {
      expect(estUnePhrase(c)).toBe(false)
      expect(messageDeRoute(401, { error: c })).not.toBe(c)
      expect(messageDeRoute(500, { error: c })).not.toBe(c)
    })
  }
  it("une vraie phrase écrite pour être lue passe telle quelle", () => {
    const p = "Réservé au propriétaire / admin."
    expect(estUnePhrase(p)).toBe(true)
    expect(messageDeRoute(403, { error: p })).toBe(p)
    expect(messageDeRoute(400, { message: "Ce domaine est déjà utilisé par une autre page." }))
      .toBe("Ce domaine est déjà utilisé par une autre page.")
  })
  it("ni un mot seul, ni une phrase sans ponctuation", () => {
    expect(estUnePhrase("limit")).toBe(false)
    expect(estUnePhrase("Le domaine est introuvable")).toBe(false)  // pas de point : c'est un log
    expect(estUnePhrase(null)).toBe(false)
    expect(estUnePhrase(42)).toBe(false)
  })
})

describe("le cas relevé : la création guidée affichait « Non authentifie »", () => {
  it("elle dit maintenant quoi faire", () => {
    const m = messageDeRoute(401, { error: "Non authentifie" }, "Création impossible pour le moment.")
    expect(m).toBe(USER_MESSAGES.UNAUTHORIZED)
    expect(m).toContain("Reconnectez-vous")
  })
  it("401 et 403 passent devant le repli de l'écran : c'est la cause qui compte", () => {
    expect(messageDeRoute(403, { error: "Non autorisé" }, "Import impossible")).toBe(USER_MESSAGES.FORBIDDEN)
  })
  it("un repli d'écran est préféré à la phrase générique quand la cause est banale", () => {
    expect(messageDeRoute(400, { error: "id requis" }, "La redirection n'a pas pu être enregistrée."))
      .toBe("La redirection n'a pas pu être enregistrée.")
  })
  it("une panne serveur le dit, quel que soit le repli de l'écran", () => {
    expect(messageDeRoute(500, { error: "Erreur serveur" }, "Import impossible")).toBe(USER_MESSAGES.SERVER)
  })
  it("le réseau muet a sa phrase à lui", () => {
    expect(messageDeRoute(0, null, "Import impossible")).toBe(USER_MESSAGES.NETWORK)
  })
})

describe("chaque statut a une phrase du vocabulaire du produit", () => {
  it("aucune n'est vide, aucune n'est technique", () => {
    for (const s of [400, 401, 403, 404, 422, 429, 500, 503]) {
      const p = phrasePourStatut(s)
      expect(p.length, String(s)).toBeGreaterThan(20)
      expect(p, String(s)).toMatch(/[.!?]$/)
      expect(p, String(s)).not.toMatch(/\b(error|null|undefined|JWT|SQL|RLS)\b/i)
    }
  })
})
