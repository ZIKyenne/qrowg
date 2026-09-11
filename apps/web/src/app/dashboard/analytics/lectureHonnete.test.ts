import { describe, it, expect } from "vitest"
import { SEUIL_INTERPRETATION, assezPourConclure, evolutionJournaliere, pluriel, titreSynthese, conseilLecture, picLisible, creneauHoraire } from "./lectureHonnete"

// Le cas qui a déclenché ce module : un compte qui vient de publier, trois scans.
describe("une variation qui part de zéro n'est pas une hausse", () => {
  it("hier à zéro : pas de pourcentage, la comparaison n'existe pas", () => {
    expect(evolutionJournaliere(2, 0)).toBeNull()
    expect(evolutionJournaliere(0, 0)).toBeNull()
  })
  it("hier à zéro ne vaut surtout pas « +100 % »", () => {
    expect(evolutionJournaliere(2, 0)).not.toBe(100)
  })
  it("quand la comparaison existe, elle est exacte", () => {
    expect(evolutionJournaliere(12, 10)).toBe(20)
    expect(evolutionJournaliere(5, 10)).toBe(-50)
    expect(evolutionJournaliere(10, 10)).toBe(0)
  })
})

describe("on n'interprète pas trois scans", () => {
  it("le seuil est explicite et bas", () => {
    expect(SEUIL_INTERPRETATION).toBe(20)
    expect(assezPourConclure(3)).toBe(false)
    expect(assezPourConclure(19)).toBe(false)
    expect(assezPourConclure(20)).toBe(true)
  })
  it("sous le seuil : aucune tendance annoncée, même avec une belle variation", () => {
    expect(titreSynthese(3, 80)).toBe("Vos premières mesures arrivent.")
    expect(titreSynthese(3, null)).toBe("Vos premières mesures arrivent.")
  })
  it("au-dessus : la tendance redevient légitime", () => {
    expect(titreSynthese(40, 30)).toBe("Votre trafic augmente.")
    expect(titreSynthese(40, -30)).toBe("Votre trafic ralentit un peu.")
    expect(titreSynthese(40, 0)).toBe("Votre QR est suivi en temps réel.")
    expect(titreSynthese(40, null)).toBe("Votre QR est suivi en temps réel.")
  })
  it("sous le seuil, le conseil fait venir des scans au lieu d'optimiser le vide", () => {
    const c = conseilLecture(3, { heurePic: 0, sourcePrincipale: "QR code" })!
    expect(c).toContain("Partagez votre QR")
    expect(c).not.toContain("heure de pic")
  })
  it("au-dessus, il porte sur ce qui est mesuré", () => {
    expect(conseilLecture(40, { heurePic: 19 })).toContain("19 h")
    expect(conseilLecture(40, { sourcePrincipale: "Instagram" })).toContain("Instagram")
    expect(conseilLecture(40, {})).toBeNull()
  })
})

describe("l'accord, que personne ne fait à la main sans se tromper", () => {
  it("« 1 scan », « 3 scans »", () => {
    expect(pluriel(1, "scan")).toBe("1 scan")
    expect(pluriel(3, "scan")).toBe("3 scans")
    expect(pluriel(0, "scan")).toBe("0 scan")
    expect(pluriel(2, "cheval", "chevaux")).toBe("2 chevaux")
  })
})

describe("un pic ne se désigne que s'il en est un", () => {
  it("aucun pic quand le maximum vaut 1 : le jour mis en avant serait arbitraire", () => {
    expect(picLisible([1, 0, 1, 0, 1])).toBe(false)
    expect(picLisible([0, 0, 0])).toBe(false)
  })
  it("aucun pic quand plusieurs jours partagent le maximum", () => {
    expect(picLisible([2, 5, 3, 5])).toBe(false)
  })
  it("un pic quand un jour domine vraiment", () => {
    expect(picLisible([2, 9, 3, 5])).toBe(true)
  })
})

describe("une heure de pic est un créneau, pas un instant", () => {
  it("« 0h » devient « entre 0 h et 1 h » : lisible sans hésitation", () => {
    expect(creneauHoraire(0)).toBe("entre 0 h et 1 h")
    expect(creneauHoraire(23)).toBe("entre 23 h et 0 h")
    expect(creneauHoraire(14)).toBe("entre 14 h et 15 h")
  })
  it("le conseil reprend le créneau, pas le nombre nu", () => {
    expect(conseilLecture(40, { heurePic: 0 })).toBe("Publiez vos contenus entre 0 h et 1 h, votre heure de pic.")
  })
})

