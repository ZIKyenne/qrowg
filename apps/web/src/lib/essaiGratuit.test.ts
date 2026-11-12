import { describe, it, expect } from "vitest"
import {
  DUREE_ESSAI_JOURS, planSoumisALEssai, finDeLEssai, joursRestants, essaiExpire, etapeAlerte,
  MESSAGE_VISITEUR, MESSAGE_PROPRIETAIRE,
} from "./essaiGratuit"
import { PLAN_ORDER } from "./plans"

const T0 = new Date("2026-11-01T10:00:00Z")
const dans = (jours: number, heures = 0) =>
  new Date(T0.getTime() + jours * 86_400_000 + heures * 3_600_000)

describe("qui est soumis à l'essai", () => {
  it("le gratuit, et lui seul parmi les plans vendus", () => {
    expect(planSoumisALEssai("free")).toBe(true)
    expect(planSoumisALEssai("starter")).toBe(false)
    expect(planSoumisALEssai("pro")).toBe(false)
    expect(planSoumisALEssai("business")).toBe(false)
  })

  // Le jour où un palier est ajouté à la grille, il faut décider s'il paie ou
  // non. Sans cette garde, il hériterait du défaut en silence — et un plan
  // payant qui se met en pause au bout de trente jours est le pire des bogues.
  it("chaque plan de la grille a une réponse DÉLIBÉRÉE", () => {
    const payants = PLAN_ORDER.filter(id => id !== "free")
    expect(payants.length, "la grille n'a plus de plan payant ?").toBeGreaterThanOrEqual(1)
    for (const id of payants) {
      expect(planSoumisALEssai(id), `${id} est payant : il ne doit jamais expirer`).toBe(false)
    }
    expect(planSoumisALEssai("free")).toBe(true)
  })

  it("un plan inconnu ou vide est traité comme gratuit — jamais l'inverse", () => {
    for (const v of [null, undefined, "", "   ", "entreprise", "PRO_LEGACY"]) {
      expect(planSoumisALEssai(v as string), `« ${v} »`).toBe(true)
    }
  })

  it("la casse et les espaces ne font pas basculer un payant dans l'essai", () => {
    expect(planSoumisALEssai("  Pro  ")).toBe(false)
    expect(planSoumisALEssai("BUSINESS")).toBe(false)
  })
})

describe("la fin de l'essai", () => {
  it("tombe trente jours après la première publication", () => {
    expect(finDeLEssai(T0)?.toISOString()).toBe(dans(DUREE_ESSAI_JOURS).toISOString())
  })

  it("n'existe pas tant que rien n'a été publié", () => {
    expect(finDeLEssai(null)).toBeNull()
    expect(finDeLEssai(undefined)).toBeNull()
    expect(finDeLEssai("")).toBeNull()
  })

  it("ne se laisse pas abîmer par une date illisible", () => {
    expect(finDeLEssai("pas une date")).toBeNull()
  })
})

describe("essaiExpire — la question que pose chaque affichage", () => {
  it("non pendant les trente jours, oui après", () => {
    expect(essaiExpire("free", T0, dans(0))).toBe(false)
    expect(essaiExpire("free", T0, dans(29, 23))).toBe(false)
    expect(essaiExpire("free", T0, dans(30))).toBe(true)
    expect(essaiExpire("free", T0, dans(31))).toBe(true)
  })

  it("jamais pour un compte qui paie, même très ancien", () => {
    for (const p of ["starter", "pro", "business"]) {
      expect(essaiExpire(p, T0, dans(400)), p).toBe(false)
    }
  })

  it("jamais pour un compte qui n'a rien publié", () => {
    expect(essaiExpire("free", null, dans(400))).toBe(false)
  })

  // C'est tout l'enjeu du lot : le compteur appartient au COMPTE. Supprimer sa
  // page et en republier une ne redonne pas trente jours, parce que la date
  // lue n'est pas celle de la page.
  it("republier ne rouvre pas l'essai : la date lue est celle du COMPTE", () => {
    const premiereDuCompte = T0
    const republicationLeLendemainDeLExpiration = dans(31)
    expect(essaiExpire("free", premiereDuCompte, republicationLeLendemainDeLExpiration)).toBe(true)
  })

  it("s'abonner rouvre la page sans toucher à la date", () => {
    expect(essaiExpire("free", T0, dans(45))).toBe(true)
    expect(essaiExpire("starter", T0, dans(45)), "le même compte, abonné").toBe(false)
  })
})

describe("les jours restants, tels qu'on les montre", () => {
  it("trente au départ, et jamais négatifs", () => {
    expect(joursRestants("free", T0, dans(0))).toBe(30)
    expect(joursRestants("free", T0, dans(29))).toBe(1)
    expect(joursRestants("free", T0, dans(30))).toBe(0)
    expect(joursRestants("free", T0, dans(99))).toBe(0)
  })

  // Arrondi vers le HAUT : à trente heures de l'échéance il reste deux jours,
  // pas un. Annoncer moins de temps qu'il n'en a le ferait courir pour rien.
  it("s'arrondissent vers le haut — on n'enlève pas du temps au commerçant", () => {
    expect(joursRestants("free", T0, dans(28, 18)), "30 h avant la fin").toBe(2)
    expect(joursRestants("free", T0, dans(29, 1)), "23 h avant la fin").toBe(1)
  })

  it("n'existent pas sans essai en cours", () => {
    expect(joursRestants("pro", T0, dans(5))).toBeNull()
    expect(joursRestants("free", null, dans(5))).toBeNull()
  })
})

describe("quand prévenir", () => {
  it("à une semaine, puis à la veille", () => {
    expect(etapeAlerte(30)).toBeNull()
    expect(etapeAlerte(8)).toBeNull()
    expect(etapeAlerte(7)).toBe("j7")
    expect(etapeAlerte(2)).toBe("j7")
    expect(etapeAlerte(1)).toBe("j1")
    expect(etapeAlerte(0)).toBe("j1")
  })

  it("jamais sans essai", () => {
    expect(etapeAlerte(null)).toBeNull()
  })

  it("les deux jalons sont atteignables depuis un vrai compte", () => {
    // Contre-épreuve : si `joursRestants` et `etapeAlerte` ne s'accordaient
    // pas, un jalon pourrait n'être jamais atteint et personne ne serait
    // jamais prévenu — une alerte muette ressemble à une alerte qui marche.
    const vus = new Set<string | null>()
    for (let j = 0; j <= DUREE_ESSAI_JOURS; j++) vus.add(etapeAlerte(joursRestants("free", T0, dans(j))))
    expect([...vus].sort()).toEqual(["j1", "j7", null])
  })
})

describe("ce qu'on écrit, et à qui", () => {
  // Le client qui scanne n'a pas à savoir qu'une facture n'a pas été payée.
  it("le visiteur n'apprend rien de la situation commerciale du commerçant", () => {
    const texte = `${MESSAGE_VISITEUR.titre} ${MESSAGE_VISITEUR.corps}`.toLowerCase()
    for (const mot of ["essai", "gratuit", "plan", "abonn", "pay", "facture", "expir"]) {
      expect(texte, `le visiteur ne doit pas lire « ${mot} »`).not.toContain(mot)
    }
  })

  it("mais il apprend que son QR reste bon — sinon il le jette", () => {
    expect(MESSAGE_VISITEUR.corps.toLowerCase()).toContain("qr code")
    expect(MESSAGE_VISITEUR.corps.toLowerCase()).toContain("valable")
  })

  it("le commerçant, lui, apprend exactement ce qui s'est passé et quoi faire", () => {
    const texte = `${MESSAGE_PROPRIETAIRE.titre} ${MESSAGE_PROPRIETAIRE.corps}`.toLowerCase()
    expect(texte).toContain("essai")
    expect(texte).toContain("plan")
    // Et surtout : que rien n'est perdu. C'est ce qui décide un achat plutôt
    // qu'un abandon.
    expect(texte).toContain("intact")
    expect(texte).toContain("réimprimer")
  })
})
