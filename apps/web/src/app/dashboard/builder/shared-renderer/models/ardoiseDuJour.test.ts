import { describe, it, expect } from "vitest"
import { ardoiseDeLaPage, ardoiseEcrite, ardoiseNeuve, phraseArdoise, placeDeLArdoise, PLATS_MAX } from "./ardoiseDuJour"
import { etatArdoise, platsDuJour, jourDuCommerce } from "./platDuJour"

// Vague 1 (revue du 23 nov.) : l'ardoise du jour écrite depuis Ma carte.

const MIDI = new Date("2026-11-23T11:00:00Z")          // lundi 23 novembre, midi à Paris
const HIER = "2026-11-22"
const p = (nom: string, prix = "", desc = "") => ({ nom, prix, desc })
const bloc = (content: Record<string, any>, extra: Record<string, any> = {}) => ({ id: "a1", type: "plat_du_jour", position: 2, visible: true, content, ...extra })

describe("lire l'ardoise de la page", () => {
  it("pas de bloc : pas d'ardoise", () => {
    expect(ardoiseDeLaPage([{ id: "m", type: "menu_section", content: {} }], MIDI)).toBeNull()
    expect(phraseArdoise(null)).toBe("Pas d'ardoise en ligne aujourd'hui.")
  })
  it("une ardoise d'hier est dite invisible, avec son jour", () => {
    const a = ardoiseDeLaPage([bloc({ d1_name: "Blanquette", d1_price: "14 €", date: HIER })], MIDI)!
    expect(a.etat).toBe("perimee")
    expect(a.ecriteLe).toBe("dimanche 22 novembre")
    expect(phraseArdoise(a)).toBe("Invisible en ligne : c'est l'ardoise du dimanche 22 novembre.")
  })
  it("celle d'aujourd'hui est en ligne, avec son nombre de plats", () => {
    const a = ardoiseDeLaPage([bloc({ d1_name: "Blanquette", d2_name: "Tarte", date: "2026-11-23" })], MIDI)!
    expect(phraseArdoise(a)).toBe("En ligne aujourd'hui · 2 plats")
  })
  it("un bloc masqué ne compte pas ; le premier en ligne l'emporte", () => {
    expect(ardoiseDeLaPage([bloc({ d1_name: "X" }, { visible: false })], MIDI)).toBeNull()
    const a = ardoiseDeLaPage([bloc({ d1_name: "B" }, { id: "b", position: 5 }), bloc({ d1_name: "A" }, { id: "a", position: 1 })], MIDI)!
    expect(a.blocId).toBe("a")
  })
})

describe("écrire l'ardoise", () => {
  it("les plats remplacent les anciens, datés du jour du commerce, et l'ardoise s'affiche", () => {
    const avant = { title: "Suggestions", validite: "Aujourd'hui seulement", note: "Midi seulement", d1_name: "Vieux", d2_name: "Vieux 2", d2_desc: "x", date: HIER }
    const r = ardoiseEcrite(avant, [p("Blanquette", "14 €", "Riz"), p("", "", ""), p("Tarte", "6 €")], MIDI)
    if (!r.ok) throw new Error(r.phrase)
    expect(r.content.date).toBe(jourDuCommerce(MIDI, r.content))
    expect(platsDuJour(r.content).map(x => [x.nom, x.prix, x.description])).toEqual([["Blanquette", "14 €", "Riz"], ["Tarte", "6 €", ""]])
    expect(r.content.d2_desc).toBeUndefined()
    expect(r.content).toMatchObject({ title: "Suggestions", note: "Midi seulement" })
    expect(etatArdoise(r.content, MIDI)).toBe("a_jour")
  })
  it("le lendemain, la même ardoise n'est plus affichée (rien ne ment)", () => {
    const r = ardoiseEcrite({}, [p("Blanquette")], MIDI)
    if (!r.ok) throw new Error()
    expect(etatArdoise(r.content, new Date("2026-11-24T11:00:00Z"))).toBe("perimee")
  })
  it("à 0 h 30 à Paris, c'est déjà le lendemain (et pas la veille UTC)", () => {
    const r = ardoiseEcrite({}, [p("Soupe")], new Date("2026-11-23T23:30:00Z"))
    if (!r.ok) throw new Error()
    expect(r.content.date).toBe("2026-11-24")
  })
  it("refuse ce qui ne se publie pas, avec une phrase", () => {
    const refus = (s: any[]) => { const r = ardoiseEcrite({}, s, MIDI); return r.ok ? null : r.phrase }
    expect(refus([])).toBe("Écrivez au moins un plat.")
    expect(refus([p("  ", "", "")])).toBe("Écrivez au moins un plat.")
    expect(refus([p("", "12 €")])).toBe("Chaque plat a besoin d'un nom.")
    expect(refus([p("Blanquette", "pas cher")])).toMatch(/chiffres/)
    expect(refus([p("x".repeat(121))])).toMatch(/120 caractères/)
    expect(refus(Array.from({ length: PLATS_MAX + 1 }, (_, i) => p(`Plat ${i}`)))).toBe(`L'ardoise affiche ${PLATS_MAX} plats au plus.`)
    expect(refus([{ nom: 1 } as any])).toBe("Ce plat n'a pas pu être lu.")
  })
  it("une ardoise neuve : titre neutre, validité du jour, fuseau des horaires", () => {
    const r = ardoiseNeuve([p("Blanquette", "14 €")], MIDI, "America/Martinique")
    if (!r.ok) throw new Error()
    expect(r.content).toMatchObject({ title: "L'ardoise du jour", validite: "Aujourd'hui seulement", fuseau: "America/Martinique", d1_name: "Blanquette" })
    // 11 h UTC = 7 h en Martinique : toujours le 23.
    expect(r.content.date).toBe("2026-11-23")
  })
})

describe("où poser une ardoise neuve", () => {
  const b = (id: string, type: string, position: number) => ({ id, type, position })
  it("juste avant la première carte ; ce qui suit descend d'un cran", () => {
    const r = placeDeLArdoise([b("p", "profile", 0), b("h", "opening_hours", 1), b("m", "menu_tabs", 2), b("s", "social_links", 3)])
    expect(r.position).toBe(2)
    expect(r.decaler).toEqual([{ id: "m", position: 3 }, { id: "s", position: 4 }])
  })
  it("sans carte : après le profil ; sans rien : en tête", () => {
    expect(placeDeLArdoise([b("p", "profile", 0), b("s", "social_links", 1)])).toEqual({ position: 1, decaler: [{ id: "s", position: 2 }] })
    expect(placeDeLArdoise([])).toEqual({ position: 0, decaler: [] })
  })
})
