import { describe, it, expect } from "vitest"
import { platsDuJour, etatArdoise, jourDuCommerce, jourLisible, VALIDITE_PERMANENTE } from "./platDuJour"

// 19 nov. 2026, 10 h à Paris (9 h UTC).
const MAINTENANT = new Date(Date.UTC(2026, 10, 19, 9, 0))

describe("l'ardoise du jour", () => {
  const ardoise = { d1_name: "Blanquette de veau", d1_price: "14 €", d2_name: "  ", d3_name: "Tarte du jour", date: "2026-11-19" }

  it("lit les plats ; une ligne sans nom n'en est pas un", () => {
    expect(platsDuJour(ardoise).map(p => p.nom)).toEqual(["Blanquette de veau", "Tarte du jour"])
  })

  it("à jour le jour même, au jour du COMMERCE", () => {
    expect(jourDuCommerce(MAINTENANT, {})).toBe("2026-11-19")
    expect(etatArdoise(ardoise, MAINTENANT)).toBe("a_jour")
    // 23 h 30 UTC le 18 = 0 h 30 le 19 à Paris : déjà l'ardoise du 19.
    expect(jourDuCommerce(new Date(Date.UTC(2026, 10, 18, 23, 30)), {})).toBe("2026-11-19")
  })

  it("périmée le lendemain — sauf « jusqu'à nouvel ordre »", () => {
    const demain = new Date(Date.UTC(2026, 10, 20, 9, 0))
    expect(etatArdoise(ardoise, demain)).toBe("perimee")
    expect(etatArdoise({ ...ardoise, validite: VALIDITE_PERMANENTE }, demain)).toBe("permanente")
    expect(etatArdoise({ ...ardoise, date: "" }, MAINTENANT)).toBe("perimee")
  })

  it("vide sans plat", () => {
    expect(etatArdoise({ date: "2026-11-19" }, MAINTENANT)).toBe("vide")
  })

  it("dit de quel jour date l'ardoise", () => {
    expect(jourLisible("2026-11-18")).toBe("mercredi 18 novembre")
    expect(jourLisible("n'importe quoi")).toBe("une date inconnue")
  })
})
