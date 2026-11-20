import { describe, it, expect } from "vitest"
import { lirePlanning, parJour, etatPlanning, quandLisible, messageDeCours, lireProgramme, lireDate, etatProgramme, dateLisible } from "./planningEtProgramme"

// Jeudi 19 nov. 2026, 18 h 00 à Paris (UTC+1).
const JEUDI_18H = new Date("2026-11-19T17:00:00Z")

const PLANNING = "Lun 18h30 Yoga · 60 min · Léa\nJeu 19h Pilates · 45 min\nJeu 12h15 Renfo express\nSam 10h Yoga doux (complet)\nmardi 7h Cardio"

describe("planning des cours", () => {
  it("lit jour, heure, nom, détails et « complet »", () => {
    const p = lirePlanning(PLANNING + "\nFermé le dimanche\nLun 25h Rien")
    expect(p).toHaveLength(5)
    expect(p[0]).toMatchObject({ jour: 1, minutes: 1110, nom: "Yoga", details: "60 min · Léa", complet: false })
    expect(p[3]).toMatchObject({ jour: 6, nom: "Yoga doux", complet: true })
    expect(p[4]).toMatchObject({ jour: 2, minutes: 420, nom: "Cardio" })
  })
  it("range par jour, lundi d'abord, trié par heure", () => {
    expect(parJour(lirePlanning(PLANNING)).map(g => [g.jour, g.cours.map(c => c.nom)])).toEqual([
      [1, ["Yoga"]], [2, ["Cardio"]], [4, ["Renfo express", "Pilates"]], [6, ["Yoga doux"]],
    ])
  })
  it("le prochain cours : aujourd'hui s'il en reste, à l'heure du commerce", () => {
    const e = etatPlanning({ planning: PLANNING }, JEUDI_18H)
    expect(e.aujourdhui).toBe(4)
    expect(e.prochain?.cours.nom).toBe("Pilates")
    expect(quandLisible(e.prochain!)).toBe("aujourd'hui à 19h (dans 1 h)")
  })
  it("un cours complet n'est jamais « le prochain » ; la semaine boucle", () => {
    const e = etatPlanning({ planning: "Sam 10h Yoga doux (complet)\nLun 18h30 Yoga" }, JEUDI_18H)
    expect(e.prochain?.cours.nom).toBe("Yoga")
    expect(quandLisible(e.prochain!)).toBe("lundi à 18h30")
    const demain = etatPlanning({ planning: "Ven 9h Cardio" }, JEUDI_18H)
    expect(quandLisible(demain.prochain!)).toBe("demain à 9h")
  })
  it("le même jour, un cours passé revient la semaine suivante", () => {
    const e = etatPlanning({ planning: "Jeu 12h15 Renfo" }, JEUDI_18H)
    expect(e.prochain).toMatchObject({ dansJours: 7 })
  })
  it("le message de réservation nomme le cours, le jour et l'heure", () => {
    expect(messageDeCours(lirePlanning("Mar 18h30 Yoga")[0])).toBe("Bonjour, je souhaite réserver le cours « Yoga » du mardi à 18h30. Merci !")
  })
})

describe("programme d'un événement", () => {
  const PROG = "20h Ouverture des portes\n21h Concert\n23h DJ set\n1h Dernier service"
  it("après minuit, l'heure continue", () => {
    expect(lireProgramme(PROG).map(m => m.minutes)).toEqual([1200, 1260, 1380, 1500])
  })
  it("lit les dates « 31/12/2026 » et « 2026-12-31 »", () => {
    expect([lireDate("31/12/2026"), lireDate("2026-12-31"), lireDate("demain")]).toEqual(["2026-12-31", "2026-12-31", ""])
    expect(dateLisible("2026-12-31")).toBe("jeudi 31 décembre")
  })
  it("avant le jour J : tout est à venir", () => {
    expect(etatProgramme({ programme: PROG, date: "2026-11-20" }, JEUDI_18H).phase).toBe("avant")
  })
  it("le jour J : ce qui est en cours, ce qui est passé", () => {
    const e = etatProgramme({ programme: PROG, date: "2026-11-19" }, new Date("2026-11-19T20:30:00Z"))   // 21 h 30
    expect(e.phase).toBe("pendant")
    expect(e.moments.map(m => m.etat)).toEqual(["passe", "en_cours", "a_venir", "a_venir"])
  })
  it("la nuit d'après minuit appartient encore à l'événement", () => {
    const e = etatProgramme({ programme: PROG, date: "2026-11-19" }, new Date("2026-11-20T00:15:00Z"))   // 1 h 15 le lendemain
    expect(e.moments.map(m => m.etat)).toEqual(["passe", "passe", "passe", "en_cours"])
  })
  it("terminé (dernier moment + 90 min) : phase « après »", () => {
    expect(etatProgramme({ programme: PROG, date: "2026-11-19" }, new Date("2026-11-20T02:31:00Z")).phase).toBe("apres")
    expect(etatProgramme({ programme: PROG, date: "2026-11-01" }, JEUDI_18H).phase).toBe("apres")
  })
  it("sans date : le programme se lit tel quel", () => {
    expect(etatProgramme({ programme: PROG }, JEUDI_18H).phase).toBe("sans_date")
  })
})
