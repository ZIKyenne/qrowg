import { describe, it, expect } from "vitest"
import { minuitUtc, joursCivilsEntre, memeJourCivil, minuitDecale } from "./jourCivil"

const JOUR = 86_400_000
/** Dérives réellement relevées dans `cron_runs` le 2026-11-15, en minutes. */
const DERIVES = [15, 20, 26, 39, 53, 55]

describe("le minuit d'un jour", () => {
  it("ramène n'importe quelle heure au même instant", () => {
    const minuit = Date.parse("2026-11-15T00:00:00.000Z")
    for (const h of ["00:00:00.000", "04:39:00.000", "12:00:00.000", "23:59:59.999"]) {
      expect(minuitUtc(new Date(`2026-11-15T${h}Z`))).toBe(minuit)
    }
  })
})

describe("compter en jours civils", () => {
  it("le même jour vaut zéro, quelles que soient les heures", () => {
    const a = new Date("2026-11-15T00:00:00.000Z")
    const b = new Date("2026-11-15T23:59:59.999Z")
    expect(joursCivilsEntre(a, b)).toBe(0)
    expect(joursCivilsEntre(b, a)).toBe(0)
    expect(memeJourCivil(a, b)).toBe(true)
  })

  it("deux minutes peuvent valoir un jour entier, et c'est voulu", () => {
    // 23:59 puis 00:01 : deux minutes d'écart, deux jours civils. C'est
    // exactement ce qu'on veut d'une tâche quotidienne — elle doit changer
    // d'avis à minuit, pas vingt-quatre heures après son dernier passage.
    const veille = new Date("2026-11-15T23:59:00.000Z")
    const lendemain = new Date("2026-11-16T00:01:00.000Z")
    expect(joursCivilsEntre(veille, lendemain)).toBe(1)
    expect(memeJourCivil(veille, lendemain)).toBe(false)
  })

  it("compte à l'envers sans se tromper de signe", () => {
    const a = new Date("2026-11-10T09:00:00.000Z")
    const b = new Date("2026-11-15T09:00:00.000Z")
    expect(joursCivilsEntre(a, b)).toBe(5)
    expect(joursCivilsEntre(b, a)).toBe(-5)
  })

  it("traverse les mois, les années et le 29 février", () => {
    expect(joursCivilsEntre(new Date("2026-01-31T22:00:00Z"), new Date("2026-02-01T02:00:00Z"))).toBe(1)
    expect(joursCivilsEntre(new Date("2026-12-31T22:00:00Z"), new Date("2027-01-01T02:00:00Z"))).toBe(1)
    // 2028 est bissextile : du 28 février au 1er mars, il y a DEUX jours.
    expect(joursCivilsEntre(new Date("2028-02-28T12:00:00Z"), new Date("2028-03-01T12:00:00Z"))).toBe(2)
  })
})

describe("la propriété qui justifie tout le module", () => {
  it("un passage à n'importe quelle heure du jour rend la même réponse", () => {
    // C'est LE contrat. Un cron qui part à 07:15 un jour et à 07:55 le
    // lendemain doit décider la même chose qu'un cron parti à minuit pile.
    const echeance = new Date("2026-12-01T09:00:00.000Z")
    const reponses = new Set<number>()
    for (const derive of DERIVES) {
      for (const heureBase of [4, 7, 9, 10, 23]) {
        const passage = new Date(Date.parse("2026-11-24T00:00:00.000Z") + (heureBase * 60 + derive) * 60_000)
        reponses.add(joursCivilsEntre(passage, echeance))
      }
    }
    expect(reponses.size, "une seule réponse pour toute la journée").toBe(1)
    expect([...reponses][0]).toBe(7)
  })

  it("la soustraction d'instants, elle, change d'avis dans la même journée — contre-épreuve", () => {
    // La façon de faire remplacée, gardée vivante. `ceil` d'un délai en
    // millisecondes répond « 8 » le matin et « 7 » l'après-midi du MÊME jour :
    // c'est par cette bascule que la dérive du cron doublait ou supprimait un
    // envoi. Si cette contre-épreuve devenait verte, le module ci-dessus
    // n'aurait plus de raison d'être.
    const echeance = Date.parse("2026-12-01T09:00:00.000Z")
    const enInstants = (passage: string) =>
      Math.ceil((echeance - Date.parse(passage)) / JOUR)
    expect(enInstants("2026-11-24T08:00:00.000Z")).toBe(8)
    expect(enInstants("2026-11-24T10:00:00.000Z")).toBe(7)
    // Le module, lui, ne bronche pas.
    expect(joursCivilsEntre(new Date("2026-11-24T08:00:00.000Z"), new Date(echeance))).toBe(7)
    expect(joursCivilsEntre(new Date("2026-11-24T10:00:00.000Z"), new Date(echeance))).toBe(7)
  })
})

describe("les bornes de fenêtre", () => {
  it("partent de minuit, jamais de l'heure du passage", () => {
    // Deux passages du même jour, à six heures d'écart, doivent produire des
    // bornes IDENTIQUES. Sinon la requête glisse pendant que la décision reste
    // immobile, et des comptes éligibles tombent entre deux fenêtres.
    const tot = minuitDecale(new Date("2026-11-20T04:39:00Z"), -2)
    const tard = minuitDecale(new Date("2026-11-20T10:55:00Z"), -2)
    expect(tot).toBe(tard)
    expect(tot).toBe("2026-11-18T00:00:00.000Z")
  })

  it("décalent dans les deux sens, et zéro rend le minuit du jour", () => {
    const d = new Date("2026-11-20T07:15:00Z")
    expect(minuitDecale(d, 0)).toBe("2026-11-20T00:00:00.000Z")
    expect(minuitDecale(d, 1)).toBe("2026-11-21T00:00:00.000Z")
    expect(minuitDecale(d, -30)).toBe("2026-10-21T00:00:00.000Z")
  })
})

describe("la limite assumée : UTC et non Paris", () => {
  it("un instant de la nuit parisienne appartient au jour UTC précédent", () => {
    // Écrit noir sur blanc pour que le choix reste VISIBLE. 00:30 heure de
    // Paris en hiver, c'est 23:30 UTC la veille : les deux calendriers ne
    // tombent pas sur le même jour.
    //
    // Conséquence sur les relances : pour un compte dont l'échéance tombe en
    // fin de soirée UTC, « demain » peut être après-demain heure française. On
    // annonce donc TÔT, jamais tard — l'erreur résiduelle fait agir le
    // commerçant en avance, ce qui ne lui coûte rien, alors qu'une annonce en
    // retard arriverait après la coupure.
    const nuitDeParis = new Date("2026-01-14T23:30:00.000Z") // 15 janvier, 00:30 à Paris
    expect(minuitUtc(nuitDeParis)).toBe(Date.parse("2026-01-14T00:00:00.000Z"))
    expect(joursCivilsEntre(nuitDeParis, new Date("2026-01-15T10:00:00.000Z"))).toBe(1)
  })
})
