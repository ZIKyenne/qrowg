import { describe, it, expect } from "vitest"
import { lireCreneaux, creneauxRestants, messageDeCreneau, attenteActuelle, depuisLisible, FRAICHEUR_MS } from "./momentDuSalon"

describe("les créneaux libres d'aujourd'hui", () => {
  it("lit les heures dans tous les formats courants, triées, sans doublon", () => {
    expect(lireCreneaux("16h15, 10h30 ; 14h\n14:00 et 9.45")).toEqual([585, 630, 840, 975])
    expect(lireCreneaux("25h, n'importe quoi")).toEqual([])
  })
  it("seulement le jour de la liste, et seulement ceux qui ne sont pas passés", () => {
    const c = { creneaux: "10h30, 14h, 16h15", date: "2026-07-07", fuseau: "UTC" }
    expect(creneauxRestants(c, new Date(Date.UTC(2026, 6, 7, 11, 0)))).toEqual([840, 975])   // 11 h : 10 h 30 est passé
    expect(creneauxRestants(c, new Date(Date.UTC(2026, 6, 7, 17, 0)))).toEqual([])           // tous passés
    expect(creneauxRestants(c, new Date(Date.UTC(2026, 6, 8, 9, 0)))).toEqual([])            // le lendemain
  })
  it("le message prérempli dit l'heure", () => {
    expect(messageDeCreneau(840)).toBe("Bonjour, je souhaiterais le créneau de 14h aujourd'hui. Merci !")
  })
})

describe("l'attente sans rendez-vous", () => {
  const maj = Date.UTC(2026, 6, 7, 10, 0)
  it("affichée tant qu'elle est fraîche, avec son âge", () => {
    const a = attenteActuelle({ attente: "Environ 20 min", maj: String(maj) }, maj + 12 * 60_000)!
    expect(a).toEqual({ libelle: "Environ 20 min", depuisMin: 12, complet: false, libre: false })
    expect(depuisLisible(a.depuisMin)).toBe("il y a 12 min")
  })
  it("masquée au-delà de 3 h, ou si rien n'est saisi, ou si la valeur est hors liste", () => {
    expect(attenteActuelle({ attente: "Environ 20 min", maj: String(maj) }, maj + FRAICHEUR_MS + 1)).toBeNull()
    expect(attenteActuelle({ attente: "Environ 20 min" }, maj)).toBeNull()
    expect(attenteActuelle({ attente: "Bientôt", maj: String(maj) }, maj)).toBeNull()
  })
  it("dit l'âge lisiblement", () => {
    expect(depuisLisible(0)).toBe("à l'instant")
    expect(depuisLisible(65)).toBe("il y a 1 h 05")
  })
})
