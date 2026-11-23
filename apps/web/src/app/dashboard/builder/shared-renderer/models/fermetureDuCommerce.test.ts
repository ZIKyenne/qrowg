import { describe, it, expect } from "vitest"
import { avecFermeture, sansFermeture, fermetureDeLaPage, phraseDeFermeture, jourIso, versIso } from "./fermetureDuCommerce"
import { periodeDeConges, etatDesConges } from "@/lib/congesDates"
import { openStatus } from "../../types"

// Vague 1 (revue du 23 nov.) : fermer exceptionnellement, annoncer ses congés,
// depuis Ma carte. La phrase écrite doit être LUE par congesDates exactement
// comme les dates choisies — sinon le badge « Fermé » mentirait.

const LUNDI_MIDI = new Date("2026-11-23T11:00:00Z")   // lundi 23 novembre 2026, Paris
const AUJ = jourIso("2026-11-23")!
const JOUR = 86400000

describe("la phrase écrite est relue à l'identique", () => {
  it("sur une année entière de débuts, et des durées de 1 à 120 jours", () => {
    for (let k = 0; k < 366; k += 3) for (const duree of [0, 1, 6, 14, 40, 119]) {
      const d = new Date(AUJ.getTime() + k * JOUR), f = new Date(d.getTime() + duree * JOUR)
      const lue = periodeDeConges(phraseDeFermeture(d, f, AUJ), AUJ)
      expect(lue && [versIso(lue.debut), versIso(lue.fin)], `${versIso(d)} → ${versIso(f)} : « ${phraseDeFermeture(d, f, AUJ)} »`).toEqual([versIso(d), versIso(f)])
    }
  })
  it("les formes courantes", () => {
    expect(phraseDeFermeture(AUJ, AUJ, AUJ)).toBe("Fermé exceptionnellement le 23 novembre")
    expect(phraseDeFermeture(jourIso("2026-12-24")!, jourIso("2027-01-02")!, AUJ)).toBe("Fermé du 24 décembre au 2 janvier")
    expect(phraseDeFermeture(jourIso("2027-07-01")!, jourIso("2027-07-15")!, AUJ)).toBe("Fermé du 1er juillet au 15 juillet 2027")
  })
})

describe("fermer, puis rouvrir", () => {
  const horaires = { title: "Horaires", mon_fri: "12h - 14h30, 19h - 22h30", saturday: "19h - 23h" }
  it("« Fermé aujourd'hui » : le badge dit fermé et donne la réouverture", () => {
    const r = avecFermeture(horaires, "2026-11-23", null, LUNDI_MIDI)
    if (!r.ok) throw new Error(r.phrase)
    expect(r.content.exception).toBe("Fermé exceptionnellement le 23 novembre")
    expect(openStatus(r.content, LUNDI_MIDI)).toMatchObject({ open: false, label: "Fermé · réouverture le 24 novembre" })
    expect(r.content).toMatchObject(horaires)
  })
  it("le lendemain, le message s'éteint seul et l'horaire reprend", () => {
    const r = avecFermeture(horaires, "2026-11-23", null, LUNDI_MIDI)
    if (!r.ok) throw new Error()
    const mardi = new Date("2026-11-24T11:00:00Z")
    expect(etatDesConges(r.content.exception, jourIso("2026-11-24")!).etat).toBe("terminee")
    expect(openStatus(r.content, mardi)?.open).toBe(true)
  })
  it("refuse une période passée, inversée, trop longue, ou une date invalide", () => {
    const refus = (d: string, f: string | null) => { const r = avecFermeture(horaires, d, f, LUNDI_MIDI); return r.ok ? null : r.phrase }
    expect(refus("2026-11-20", "2026-11-22")).toBe("Cette période est déjà passée.")
    expect(refus("2026-12-10", "2026-12-01")).toMatch(/après le début/)
    expect(refus("2026-12-01", "2027-06-01")).toMatch(/120 jours/)
    expect(refus("2026-02-30", null)).toBe("Choisissez une date valide.")
    expect(refus("demain", null)).toBe("Choisissez une date valide.")
  })
  it("une fermeture déjà commencée peut encore être prolongée", () => {
    expect(avecFermeture(horaires, "2026-11-20", "2026-11-25", LUNDI_MIDI).ok).toBe(true)
  })
  it("rouvrir efface le message, et seulement lui", () => {
    const c = sansFermeture({ ...horaires, exception: "Fermé du 1er au 15 août" })
    expect(c).toEqual({ ...horaires, exception: "" })
  })
})

describe("ce que dit Ma carte", () => {
  const bloc = (content: Record<string, any>) => [{ id: "h", type: "opening_hours", content, position: 3 }]
  it("pas d'horaires : rien à fermer", () => {
    expect(fermetureDeLaPage([{ id: "m", type: "menu_tabs", content: {} }], LUNDI_MIDI)).toBeNull()
  })
  it("pendant, avant, message libre, aucun", () => {
    expect(fermetureDeLaPage(bloc({ exception: "Fermé exceptionnellement le 23 novembre" }), LUNDI_MIDI)!.phrase)
      .toBe("Fermé en ce moment. Vos clients lisent « Fermé · réouverture le 24 novembre ».")
    expect(fermetureDeLaPage(bloc({ exception: "Fermé du 24 décembre au 2 janvier" }), LUNDI_MIDI)!.phrase)
      .toBe("Fermeture annoncée : « Fermé du 24 décembre au 2 janvier ».")
    expect(fermetureDeLaPage(bloc({ exception: "Fermé le lundi midi" }), LUNDI_MIDI)!.phrase).toBe("Message affiché : « Fermé le lundi midi ».")
    expect(fermetureDeLaPage(bloc({}), LUNDI_MIDI)!.phrase).toBe("Aucune fermeture annoncée.")
  })
  it("un message dont la période est passée n'est plus montré comme affiché", () => {
    const v = fermetureDeLaPage(bloc({ exception: "Fermé du 1er au 15 août" }), LUNDI_MIDI)!
    expect(v.etat).toBe("terminee")
    expect(v.message).toBe("")
    expect(v.phrase).toBe("Aucune fermeture annoncée.")
    expect(v.aujourdhui).toBe("2026-11-23")
  })
})
