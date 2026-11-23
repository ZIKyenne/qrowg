import { describe, it, expect } from "vitest"
import { statutHappy, offresHappy, happyHourRempli } from "./happyHour"

// Fuseau UTC déclaré : on mesure la LOGIQUE. 2026-07-07 est un mardi.
const a = (j: number, h: number, mn = 0) => new Date(Date.UTC(2026, 6, j, h, mn))
const bar = { creneau: "17h - 20h", jours: "Du lundi au vendredi", fuseau: "UTC" }

describe("le happy hour", () => {
  it("lit les offres ; une ligne sans nom n'en est pas une", () => {
    const c = { h1_name: "Pinte", h1_normal: "7 €", h1_happy: "5 €", h2_name: " " }
    expect(offresHappy(c)).toEqual([{ rang: 1, nom: "Pinte", prixNormal: "7 €", prixHappy: "5 €", epuise: false, allergenes: "" }])
    expect(happyHourRempli({ offre: "Cocktails à -30 %" })).toBe(true)
    expect(happyHourRempli({})).toBe(false)
  })

  it("en cours, à venir, ou plus tard dans la semaine", () => {
    expect(statutHappy(bar, a(7, 18))?.libelle).toBe("En cours · jusqu'à 20h")
    expect(statutHappy(bar, a(7, 16, 20))?.libelle).toBe("Dans 40 min")
    expect(statutHappy(bar, a(7, 11))?.libelle).toBe("Aujourd'hui à 17h")
    expect(statutHappy(bar, a(7, 21))?.libelle).toBe("Demain à 17h")
    // Vendredi soir après 20 h : lundi.
    expect(statutHappy(bar, a(10, 21))?.libelle).toBe("Lundi à 17h")
    // Samedi midi : pas de happy hour le samedi → lundi.
    expect(statutHappy(bar, a(11, 12))?.libelle).toBe("Lundi à 17h")
  })

  it("un créneau qui passe minuit, compté au titre de la veille", () => {
    const nuit = { creneau: "22h - 01h", jours: "Du jeudi au samedi", fuseau: "UTC" }
    expect(statutHappy(nuit, a(9, 23))?.libelle).toBe("En cours · jusqu'à 1h")       // jeudi 23 h
    expect(statutHappy(nuit, a(10, 0, 30))?.libelle).toBe("En cours · jusqu'à 1h")   // vendredi 0 h 30, nuit de jeudi
    expect(statutHappy(nuit, a(12, 0, 30))?.libelle).toBe("En cours · jusqu'à 1h")   // dimanche 0 h 30, nuit de samedi
    expect(statutHappy(nuit, a(13, 0, 30))?.libelle).toBe("Jeudi à 22h")             // lundi 0 h 30 : la nuit de dimanche ne compte pas
  })

  it("pas de badge si le créneau est illisible", () => {
    expect(statutHappy({ creneau: "le soir" }, a(7, 18))).toBeNull()
  })
})
