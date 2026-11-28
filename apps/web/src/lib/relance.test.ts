import { describe, it, expect } from "vitest"
import { jugerCompte, comptesARelancer, ageEnHeures, joursDepuisInscription, fenetreInscription, prenom, JOUR_DE_RELANCE, type Compte } from "./relance"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const MAINTENANT = new Date("2026-08-30T09:00:00.000Z")
const ilYA = (h: number) => new Date(MAINTENANT.getTime() - h * 3_600_000).toISOString()
const compte = (o: Partial<Compte> = {}): Compte => ({
  id: "u1", email: "marcel@exemple.fr", inscritLe: ilYA(50), nom: "Marcel Dupont", nbPages: 0, ...o,
})

describe("la fenêtre : ni trop tôt, ni deux fois", () => {
  it("un compte de deux jours sans page est relancé", () => {
    expect(jugerCompte(compte(), MAINTENANT).relancer).toBe(true)
  })
  it("un compte d'hier est trop récent : on laisse passer la nuit", () => {
    const v = jugerCompte(compte({ inscritLe: ilYA(20) }), MAINTENANT)
    expect(v.relancer).toBe(false)
    expect(v).toMatchObject({ motif: "trop_recent" })
  })
  it("un compte de la semaine dernière n'est plus relancé", () => {
    expect(jugerCompte(compte({ inscritLe: ilYA(200) }), MAINTENANT)).toMatchObject({ relancer: false, motif: "trop_ancien" })
  })
  it("l'éligibilité couvre la journée civile entière, et rien autour", () => {
    // MAINTENANT = 2026-08-30. Le jour de relance est donc le 28 août, de son
    // minuit à son dernier instant — et le 27 comme le 29 sont dehors.
    //
    // Les deux bornes sont testées EXPRÈS : l'ancienne règle comptait un âge en
    // heures, et la frontière tombait donc à une heure DIFFÉRENTE selon l'heure
    // d'inscription. C'est par là que la dérive du cron faisait disparaître des
    // comptes entiers.
    const le = (iso: string) => jugerCompte(compte({ inscritLe: iso }), MAINTENANT).relancer
    expect(le("2026-08-27T23:59:59.999Z"), "la veille du jour de relance").toBe(false)
    expect(le("2026-08-28T00:00:00.000Z"), "minuit : la journée commence").toBe(true)
    expect(le("2026-08-28T23:59:59.999Z"), "jusqu'au dernier instant").toBe(true)
    expect(le("2026-08-29T00:00:00.000Z"), "le lendemain, trop récent").toBe(false)
    expect(joursDepuisInscription("2026-08-28T00:00:00.000Z", MAINTENANT)).toBe(JOUR_DE_RELANCE)
  })

  // Le point qui remplace une colonne de suivi : quel que soit le jour du
  // passage quotidien, un même compte ne peut être retenu qu'une seule fois.
  it("un passage par jour n'envoie jamais deux fois au même compte", () => {
    const inscription = ilYA(0)
    let retenus = 0
    for (let jour = 0; jour <= 10; jour++) {
      const passage = new Date(MAINTENANT.getTime() + jour * 24 * 3_600_000)
      if (jugerCompte(compte({ inscritLe: inscription }), passage).relancer) retenus++
    }
    expect(retenus).toBe(1)
  })

  // Dérives relevées dans cron_runs le 2026-11-15 : +15, +26, +39, +53, +55
  // minutes. L'ancienne version de ce test glissait de 0, 7 ou 14 minutes
  // seulement, et depuis une inscription tombant PILE sur l'heure du passage —
  // deux conforts qui cachaient le défaut.
  const DERIVES = [15, 26, 39, 53, 55]

  const retenusSur = (
    inscritLe: string,
    eligible: (inscritLe: string, passage: Date) => boolean,
  ) => {
    let n = 0
    for (let jour = 1; jour <= 10; jour++) {
      const derive = DERIVES[jour % DERIVES.length]
      const passage = new Date(Date.parse("2026-08-24T09:00:00.000Z") + jour * 24 * 3_600_000 + derive * 60_000)
      if (eligible(inscritLe, passage)) n++
    }
    return n
  }

  const MAINTENANT_LA_BONNE = (inscritLe: string, passage: Date) =>
    jugerCompte(compte({ inscritLe }), passage).relancer

  /**
   * L'ancienne règle, gardée VIVANTE comme contre-épreuve : un âge en heures
   * dans [48, 72). La laisser ici est la seule façon de prouver, à chaque
   * passage de la suite, que le défaut existait et qu'il est parti.
   */
  const AVANT_EN_HEURES = (inscritLe: string, passage: Date) => {
    const age = (passage.getTime() - Date.parse(inscritLe)) / 3_600_000
    return age >= 48 && age < 72
  }

  it("un passage par jour relance une fois — quelle que soit l'heure d'inscription", () => {
    for (const h of ["00:10", "08:00", "09:10", "09:30", "09:50", "10:30", "12:00", "23:50"]) {
      const inscritLe = "2026-08-24T" + h + ":00.000Z"
      expect(retenusSur(inscritLe, MAINTENANT_LA_BONNE), "inscription à " + h).toBe(1)
    }
  })

  it("et l'ancienne règle n'en relançait AUCUNE fois — contre-épreuve", () => {
    // Le compte inscrit vers 09:50, c'est-à-dire dans la bande de dérive du
    // cron de 09:00, n'était jamais relancé. Pas en retard : jamais. Son âge
    // passait de 47,9 h (trop récent) à 72,6 h (trop ancien) entre deux
    // passages espacés de 24 h 40 — et la tâche notait « aucun compte dans la
    // fenêtre », ce qui avait l'air parfaitement normal.
    expect(retenusSur("2026-08-24T09:50:00.000Z", AVANT_EN_HEURES)).toBe(0)
    // Hors de cette bande elle était juste, ce qui explique que rien ne l'ait
    // signalé : le défaut ne frappait qu'une tranche d'heures d'inscription.
    expect(retenusSur("2026-08-24T12:00:00.000Z", AVANT_EN_HEURES)).toBe(1)
  })
})

describe("qui est écarté", () => {
  it("quelqu'un qui a déjà créé une page, même en brouillon", () => {
    expect(jugerCompte(compte({ nbPages: 1 }), MAINTENANT)).toMatchObject({ relancer: false, motif: "a_deja_cree" })
  })
  it("un compte sans email exploitable", () => {
    expect(jugerCompte(compte({ email: null }), MAINTENANT)).toMatchObject({ relancer: false, motif: "sans_email" })
    expect(jugerCompte(compte({ email: "pas-un-email" }), MAINTENANT)).toMatchObject({ relancer: false, motif: "sans_email" })
  })
  it("une date d'inscription illisible n'envoie rien et ne plante pas", () => {
    expect(jugerCompte(compte({ inscritLe: "n'importe quoi" }), MAINTENANT)).toMatchObject({ relancer: false, motif: "date_illisible" })
    expect(jugerCompte(compte({ inscritLe: null }), MAINTENANT).relancer).toBe(false)
  })
  it("l'âge est calculé, ou null, jamais NaN", () => {
    expect(ageEnHeures(ilYA(50), MAINTENANT)).toBeCloseTo(50, 5)
    expect(ageEnHeures("bidon", MAINTENANT)).toBeNull()
    expect(ageEnHeures(null, MAINTENANT)).toBeNull()
  })
})

describe("la requête envoyée à la base", () => {
  it("colle exactement à la décision : [depuis, jusqua) est le jour de relance", () => {
    // L'appelant compare avec gte et lt. La borne basse doit donc être
    // éligible, la haute ne doit PAS l'être — sinon la requête et la décision
    // divergent, et la différence se perd en silence.
    //
    // L'ancienne paire divergeait déjà d'un cheveu : jusqua valait « now − 48 h »,
    // éligible pour la décision (âge exactement 48 h) mais exclue par le lt.
    // Alignées sur minuit, les deux disent la même chose.
    const f = fenetreInscription(MAINTENANT)
    expect(jugerCompte(compte({ inscritLe: f.depuis }), MAINTENANT).relancer, "la borne basse est dedans").toBe(true)
    expect(jugerCompte(compte({ inscritLe: f.jusqua }), MAINTENANT).relancer, "la borne haute est dehors").toBe(false)
    expect(Date.parse(f.jusqua) - Date.parse(f.depuis), "exactement une journée").toBe(24 * 3_600_000)
    // Et chaque instant de cette journée est éligible, pas seulement ses bornes.
    for (const h of [1, 7, 12, 18, 23]) {
      const dedans = new Date(Date.parse(f.depuis) + h * 3_600_000).toISOString()
      expect(jugerCompte(compte({ inscritLe: dedans }), MAINTENANT).relancer, dedans).toBe(true)
    }
  })
})

describe("le tri d'une liste", () => {
  it("ne garde que les comptes éligibles", () => {
    const liste = [
      compte({ id: "neuf", inscritLe: ilYA(3) }),
      compte({ id: "bon" }),
      compte({ id: "actif", nbPages: 4 }),
      compte({ id: "vieux", inscritLe: ilYA(500) }),
      // Les deux bouts de la journée du 28 août, désormais l'unité de décision.
      compte({ id: "bon2", inscritLe: "2026-08-28T00:00:00.000Z" }),
      compte({ id: "bon3", inscritLe: "2026-08-28T23:30:00.000Z" }),
      // Trois heures plus tard : c'est le 29, donc trop récent. L'ancienne
      // règle en heures l'acceptait encore — ce changement d'unité est
      // exactement ce qui supprime la dérive, et il se voit ici.
      compte({ id: "limite", inscritLe: "2026-08-29T02:30:00.000Z" }),
    ]
    expect(comptesARelancer(liste, MAINTENANT).map(c => c.id)).toEqual(["bon", "bon2", "bon3"])
  })
  it("une liste vide ne pose pas de problème", () => {
    expect(comptesARelancer([], MAINTENANT)).toEqual([])
  })
})

describe("le prénom", () => {
  it("garde le premier mot, borné", () => {
    expect(prenom("Marcel Dupont")).toBe("Marcel")
    expect(prenom("  Léa  ")).toBe("Léa")
    expect(prenom("x".repeat(80)).length).toBe(40)
  })
  it("rend une chaîne vide plutôt que d'inventer", () => {
    expect(prenom(null)).toBe("")
    expect(prenom("   ")).toBe("")
  })
})

// Les trois seuls comptes que compte la base, avec leurs vraies dates
// d'inscription (identités anonymisées : on ne met pas l'adresse d'une personne
// réelle dans un dépôt). C'est le cas d'usage entier du produit à ce jour.
describe("confrontation aux comptes réels", () => {
  const REELS: Compte[] = [
    { id: "proprio", email: "a@exemple.fr", nom: "Le propriétaire", inscritLe: "2026-06-15T18:50:29.739Z", nbPages: 12 },
    { id: "test", email: "b@exemple.fr", nom: null, inscritLe: "2026-08-04T16:30:36.204Z", nbPages: 0 },
    { id: "inscrit", email: "c@exemple.fr", nom: "L'inscrit", inscritLe: "2026-08-24T11:01:07.438Z", nbPages: 0 },
  ]
  const passageDu = (jour: string) => comptesARelancer(REELS, new Date(`${jour}T09:00:00.000Z`)).map(c => c.id)

  it("le seul vrai inscrit est retenu, et une seule fois", () => {
    // Inscrit le 24 août à 11:01 ⇒ relancé le 26, le surlendemain au
    // calendrier. L'ancienne règle en heures le relançait le 27 à 09:00, soit
    // 70 h après : « deux jours plus tard » devenait presque trois.
    expect(passageDu("2026-08-25")).toEqual([])
    expect(passageDu("2026-08-26")).toEqual(["inscrit"])
    expect(passageDu("2026-08-27")).toEqual([])
    expect(passageDu("2026-08-28")).toEqual([])
    expect(passageDu("2026-08-30")).toEqual([])
  })

  it("le propriétaire n'est jamais relancé : il a douze pages", () => {
    const v = jugerCompte(REELS[0], new Date("2026-06-17T09:00:00.000Z"))
    expect(v).toMatchObject({ relancer: false, motif: "a_deja_cree" })
  })

  it("un compte de test créé pour la QA reste éligible s'il tombe dans la fenêtre", () => {
    // Rien ne le distingue d'un vrai compte : c'est au propriétaire de faire
    // le ménage, pas à ce module de deviner.
    expect(jugerCompte(REELS[1], new Date("2026-08-06T09:00:00.000Z")).relancer).toBe(true)
  })
})

// Le lien entre la décision et son application : sans cron déclaré, le module
// le mieux testé du monde ne s'exécute jamais.
describe("la relance est réellement programmée", () => {
  it("le cron quotidien est déclaré et vise la bonne route", () => {
    const conf = JSON.parse(readFileSync(join(__dirname, "../../../../vercel.json"), "utf8"))
    const relance = (conf.crons ?? []).find((c: { path: string }) => c.path.startsWith("/api/cron/relance"))
    expect(relance, "aucun cron /api/cron/relance dans vercel.json").toBeTruthy()
    // Quotidien : la décision ne retient qu'UN jour civil par compte. Un
    // passage hebdomadaire raterait six inscrits sur sept.
    expect(relance.schedule).toMatch(/^\S+ \S+ \* \* \*$/)
  })

  // « la route refuse sans secret » et « n'interroge que la fenêtre » (ni la
  // veille ni l'avant-veille du jour de relance) : JOUÉ depuis v414 (app/api/cron/bancRappels.test.ts).
})
