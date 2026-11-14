import { describe, it, expect } from "vitest"
import {
  classer, classerLot, comparerProspects, resumer,
  dernierReleve, ageDuReleve, faitsIllisibles,
  ECARTS_POUR_PRIORITAIRE, PEREMPTION_JOURS, FAITS_LISIBLES_QUI_COMPTENT,
  type Observation,
} from "./scoreProspect"
import { profilVide, sourcer, type ProfilRestaurant, type Provenance } from "./profilEtablissement"
import { profilDepuisFiche } from "./ficheEntreprise"

const MAINTENANT = new Date("2026-11-14T12:00:00.000Z")
const JOUR = 24 * 60 * 60 * 1000
const FRAIS = "2026-11-10T09:00:00.000Z"

const ilYA = (jours: number) => new Date(MAINTENANT.getTime() - jours * JOUR).toISOString()

const prov = (observeLe = FRAIS, certitude: Provenance["certitude"] = "confirme"): Provenance =>
  ({ source: "site de l'établissement (https://exemple.test)", observeLe, certitude })

/** Fabrique un profil en ne posant QUE les champs nommés. Tout le reste reste vide. */
function profil(id: string, champs: Record<string, unknown>, p = prov()): ProfilRestaurant {
  const base = profilVide(id) as unknown as Record<string, unknown>
  for (const [cle, valeur] of Object.entries(champs)) base[cle] = sourcer(valeur, p)
  return base as unknown as ProfilRestaurant
}

const observe = (profil: ProfilRestaurant): Observation =>
  ({ profil, siteConsulte: "https://exemple.test" })

/** Assez de matière pour une page, et trois faits qu'aucune machine ne lit. */
const RICHE = profil("riche", {
  nom: "Les Trois Marches",
  adresse: "12 rue de Marne, 51000 Châlons-en-Champagne",
  telephone: "+33326000000",
  horaires: [{ jour: "tue", heures: "12:00-14:00" }],
})

/** Tout est déjà lisible par une machine : il n'y a rien à leur apporter. */
const EQUIPE = profil("equipe", {
  nom: "Le Comptoir",
  adresse: "3 place du Marché, 51000 Châlons-en-Champagne",
  telephone: "+33326000001",
  horaires: [{ jour: "tue", heures: "12:00-14:00" }],
  reservation: "https://thefork.test/comptoir",
  ficheGoogle: "https://g.page/comptoir",
  plats: [{ nom: "Entrecôte", prix: "19 €", description: null }],
})

/** Un nom, et rien d'autre : le site ne déclare rien d'exploitable. */
const MAIGRE = profil("maigre", { nom: "Chez Nino" })

describe("ce module refuse de classer plutôt que de mal classer", () => {
  it("sans site consulté, le prospect est inclassable — et ce n'est pas « mauvais »", () => {
    // La distinction porte tout le module. Un prospect non observé et un
    // prospect observé comme peu intéressant appellent des actions opposées :
    // aller relever son site, ou passer au suivant. Un rang bas pour les deux
    // ferait abandonner le premier sans l'avoir regardé.
    const c = classer({ profil: RICHE, siteConsulte: null }, MAINTENANT)
    expect(c.rang).toBe("inclassable")
    expect(c.pourquoi.join(" ")).toContain("aucun site consulté")
  })

  it("un profil riche mais non observé reste inclassable", () => {
    // Même avec quatre faits en main : ils viennent d'ailleurs. Tant que le
    // site n'a pas été lu, l'écart à montrer est inconnu — et c'est l'écart qui
    // justifie la démarche.
    const c = classer({ profil: RICHE, siteConsulte: null }, MAINTENANT)
    expect(c.rang).not.toBe("prioritaire")
    expect(c.illisibles).toEqual([])
  })

  it("un relevé d'annuaire seul n'est jamais classé", () => {
    // Intégration réelle avec le module existant : `profilDepuisFiche` ne
    // remplit que le nom, l'adresse du siège et la ville. Il n'observe aucun
    // site, donc il ne produit aucun classement.
    const depuisAnnuaire = profilDepuisFiche(
      { nom: "SARL LES TROIS MARCHES", commune: "Châlons-en-Champagne", adresse: "12 rue de Marne" },
      "annuaire-1", FRAIS,
    )
    const c = classer({ profil: depuisAnnuaire, siteConsulte: null }, MAINTENANT)
    expect(c.rang).toBe("inclassable")
  })

  it("un relevé périmé redevient inclassable, même excellent", () => {
    // Un restaurant change de carte, de téléphone, de propriétaire. Proposer
    // une page bâtie sur un relevé de l'an dernier, c'est l'adresser à un
    // établissement qui n'est peut-être plus celui-là.
    const vieux = profil("vieux", {
      nom: "Les Trois Marches",
      adresse: "12 rue de Marne",
      telephone: "+33326000000",
    }, prov(ilYA(400)))
    const c = classer(observe(vieux), MAINTENANT)
    expect(c.rang).toBe("inclassable")
    expect(c.pourquoi[0]).toContain("400 jours")
  })

  it("la péremption se juge sur sa borne exacte, pas « à peu près »", () => {
    // Leçon payée ailleurs dans ce dépôt : un échec sur une borne a coûté une
    // journée entière de fausse piste. Les deux côtés de la limite sont donc
    // testés, et `maintenant` est passé plutôt que lu à l'horloge.
    const faits = { nom: "Pile", adresse: "12 rue de Marne", telephone: "+33326000000" }
    const pile = classer(observe(profil("pile", faits, prov(ilYA(PEREMPTION_JOURS)))), MAINTENANT)
    const unJourDeTrop = classer(observe(profil("trop", faits, prov(ilYA(PEREMPTION_JOURS + 1)))), MAINTENANT)
    expect(pile.rang).not.toBe("inclassable")
    expect(unJourDeTrop.rang).toBe("inclassable")
  })
})

describe("les deux axes tirent en sens contraire, et c'est tout l'intérêt", () => {
  it("un score unique sur cent mettrait le MOINS exploitable en tête", () => {
    // La démonstration du refus d'un chiffre unique, en nombres.
    //
    // Score naïf = moyenne de (matière / 7) et (écarts / 6), sur cent :
    //   · MAIGRE  (1 fait, 6 écarts) → 57  ← le naïf le classe PREMIER
    //   · RICHE   (4 faits, 3 écarts) → 54
    //   · EQUIPE  (7 faits, 0 écart)  → 50
    //
    // Or MAIGRE est précisément celui dont on ne peut fabriquer aucune page :
    // son site ne déclare qu'un nom. La moyenne récompense son vide, parce
    // qu'un vide maximise l'un des deux axes.
    const naif = (p: ProfilRestaurant) => {
      const c = classer(observe(p), MAINTENANT)
      return Math.round(((c.matiere.length / 7) + (c.illisibles.length / 6)) / 2 * 100)
    }
    expect(naif(MAIGRE)).toBeGreaterThan(naif(RICHE))

    // Le classement nommé, lui, sépare les trois cas et met en tête le seul
    // qu'on sache réellement traiter.
    const trie = classerLot([observe(MAIGRE), observe(EQUIPE), observe(RICHE)], MAINTENANT)
    expect(trie.map(p => p.observation.profil.id)).toEqual(["riche", "maigre", "equipe"])
    expect(trie.map(p => p.classement.rang)).toEqual(["prioritaire", "a_approfondir", "deja_equipe"])
  })

  it("assez de matière et un écart réel : prioritaire", () => {
    const c = classer(observe(RICHE), MAINTENANT)
    expect(c.rang).toBe("prioritaire")
    expect(c.matiere).toEqual(["adresse", "horaires", "nom", "telephone"])
    expect(c.illisibles).toEqual(["ficheGoogle", "plats", "reservation"])
  })

  it("tout déjà lisible : on ne leur propose pas une page inutile", () => {
    // Ce rang existe pour une raison morale autant que pratique : leur vendre
    // une page qui ne corrigerait rien serait exact sur les faits et malhonnête
    // sur l'intérêt.
    const c = classer(observe(EQUIPE), MAINTENANT)
    expect(c.rang).toBe("deja_equipe")
    expect(c.illisibles).toEqual([])
    expect(c.pourquoi.join(" ")).toContain("presque rien à apporter")
  })

  it("le seuil d'écarts se vérifie des deux côtés", () => {
    // Un seul écart ne porte pas une proposition ; deux, oui. La limite est
    // nommée (`ECARTS_POUR_PRIORITAIRE`) et testée sur ses deux côtés, sinon
    // personne ne saura si elle vaut 1 ou 3.
    expect(ECARTS_POUR_PRIORITAIRE).toBe(2)
    const unEcart = { ...EQUIPE, plats: null }
    const deuxEcarts = { ...EQUIPE, plats: null, reservation: null }
    expect(classer(observe(unEcart), MAINTENANT).rang).toBe("deja_equipe")
    expect(classer(observe(deuxEcarts), MAINTENANT).rang).toBe("prioritaire")
  })

  it("pas assez de matière : à approfondir, en disant ce qui bloque", () => {
    // « À approfondir » sans dire quoi serait inexploitable. Le verdict nomme
    // le blocage et l'action suivante.
    const c = classer(observe(MAIGRE), MAINTENANT)
    expect(c.rang).toBe("a_approfondir")
    expect(c.pourquoi.join(" ")).toContain("sur les 3 attendus")
    expect(c.pourquoi.join(" ")).toContain("relevé plus large")
  })

  it("sans nom affichable, la page ne dirait pas de qui elle parle", () => {
    // Cas réel : un site dont le JSON-LD déclare l'adresse, le téléphone et les
    // horaires mais pas le `name`. Six faits lisibles ne rachètent pas un nom
    // manquant, et le verdict doit le nommer plutôt que compter.
    const sansNom = profil("sans-nom", {
      adresse: "12 rue de Marne", telephone: "+33326000000",
      horaires: [{ jour: "tue", heures: "12:00-14:00" }],
      reservation: "https://thefork.test/x",
    })
    const c = classer(observe(sansNom), MAINTENANT)
    expect(c.rang).toBe("a_approfondir")
    expect(c.pourquoi.join(" ")).toContain("nom de l'établissement n'est pas affichable")
  })
})

describe("ce qui compte comme « illisible », et ce qui n'en est pas", () => {
  it("la liste est explicite : les réseaux sociaux n'y sont pas", () => {
    // Une liste dérivée de tous les champs du profil ferait entrer `instagram`
    // et `facebook`, dont l'absence ne coûte rien à un restaurant de quartier.
    // Elle gonflerait l'écart mesuré sans correspondre à un manque.
    expect([...FAITS_LISIBLES_QUI_COMPTENT].sort()).toEqual(
      ["adresse", "ficheGoogle", "horaires", "plats", "reservation", "telephone"],
    )
    const sansReseaux = { ...EQUIPE, instagram: null, facebook: null }
    expect(faitsIllisibles(sansReseaux)).toEqual([])
  })

  it("un champ « à vérifier » ne compte ni comme matière ni comme lisible", () => {
    // `affichable()` exclut déjà `a_verifier` du rendu. Le compter comme lisible
    // serait doublement faux : la page ne l'affiche pas, et sa source ne garantit
    // rien. C'est le cas de l'adresse du SIÈGE pour une chaîne.
    const douteux = profil("douteux", {
      nom: "Chez Nino",
      adresse: "siège social, 75001 Paris",
      telephone: "+33100000000",
    }, prov(FRAIS, "a_verifier"))
    const c = classer(observe(douteux), MAINTENANT)
    expect(c.matiere).toEqual([])
    expect(c.illisibles).toContain("adresse")
    expect(c.illisibles).toContain("telephone")
  })

  it("un champ « probable » compte, lui : la page sait le rendre", () => {
    // `probable` est le niveau d'un nom déduit d'un `<title>`. Il s'affiche, donc
    // il est de la matière — la frontière est `a_verifier`, pas `confirme`.
    const probable = profil("probable", {
      nom: "Chez Nino — Restaurant à Châlons",
      adresse: "12 rue de Marne",
      telephone: "+33326000000",
    }, prov(FRAIS, "probable"))
    expect(classer(observe(probable), MAINTENANT).matiere).toEqual(["adresse", "nom", "telephone"])
  })
})

describe("les dates du relevé", () => {
  it("c'est le relevé le PLUS RÉCENT qui date le profil", () => {
    // Un profil complété en plusieurs passages n'est pas périmé parce que son
    // premier champ est vieux. Prendre le plus ancien rejetterait un profil
    // enrichi hier.
    const melange = profilVide("melange") as unknown as Record<string, unknown>
    melange.nom = sourcer("Chez Nino", prov(ilYA(300)))
    melange.telephone = sourcer("+33326000000", prov(ilYA(2)))
    const p = melange as unknown as ProfilRestaurant
    expect(dernierReleve(p)).toBe(ilYA(2))
    expect(ageDuReleve(p, MAINTENANT)).toBe(2)
  })

  it("un profil vide n'a pas d'âge, et ce n'est pas zéro", () => {
    // Zéro voudrait dire « relevé à l'instant ». Il n'y a rien à dater.
    expect(dernierReleve(profilVide("vide"))).toBeNull()
    expect(ageDuReleve(profilVide("vide"), MAINTENANT)).toBeNull()
  })

  it("un site relevé qui ne déclare rien se classe quand même", () => {
    // Pas de date ⇒ pas de péremption à juger : le refus de classer ne doit
    // frapper que ce qui est périmé, pas ce qui est vide. Un site muet est une
    // observation valide, et même l'observation la plus parlante.
    const c = classer(observe(profilVide("muet")), MAINTENANT)
    expect(c.rang).toBe("a_approfondir")
    expect(c.illisibles).toHaveLength(FAITS_LISIBLES_QUI_COMPTENT.length)
  })
})

describe("l'ordre de traitement", () => {
  it("le rang domine : aucun écart ne fait remonter un « déjà équipé »", () => {
    // Le tri doit rester lisible comme une décision, pas comme un barème qu'on
    // négocie. Le rang passe avant tout nombre.
    const trie = classerLot([observe(EQUIPE), observe(MAIGRE)], MAINTENANT)
    expect(trie[0].observation.profil.id).toBe("maigre")
  })

  it("deux passages sur les mêmes données rendent la même liste", () => {
    // Un ordre non déterministe ferait traiter deux fois le même prospect et
    // jamais un autre. Le dernier départage est l'identifiant, exprès.
    const lot = [observe(MAIGRE), observe(RICHE), observe(EQUIPE)]
    const a = classerLot(lot, MAINTENANT).map(p => p.observation.profil.id)
    const b = classerLot(lot, MAINTENANT).map(p => p.observation.profil.id)
    expect(a).toEqual(b)
  })

  it("deux prospects identiques se départagent par leur identifiant", () => {
    const x = observe(profil("aaa", { nom: "A", adresse: "1 rue", telephone: "+331" }))
    const y = observe(profil("zzz", { nom: "Z", adresse: "2 rue", telephone: "+332" }))
    expect(classerLot([y, x], MAINTENANT).map(p => p.observation.profil.id)).toEqual(["aaa", "zzz"])
  })

  it("le tri ne modifie pas le lot qu'on lui donne", () => {
    const lot = [observe(EQUIPE), observe(RICHE)]
    classerLot(lot, MAINTENANT)
    expect(lot.map(o => o.profil.id)).toEqual(["equipe", "riche"])
  })

  it("le comparateur est cohérent avec lui-même", () => {
    const a = { observation: observe(RICHE), classement: classer(observe(RICHE), MAINTENANT) }
    const b = { observation: observe(EQUIPE), classement: classer(observe(EQUIPE), MAINTENANT) }
    expect(comparerProspects(a, b)).toBeLessThan(0)
    expect(comparerProspects(b, a)).toBeGreaterThan(0)
    expect(comparerProspects(a, a)).toBe(0)
  })
})

describe("chaque verdict se lit sans ouvrir le code", () => {
  it("aucun classement ne rend un « pourquoi » vide", () => {
    // Une décision sans raison est inexploitable : personne ne saura si le rang
    // est trop large ou trop étroit. C'est la même règle que `jugerEligibilite`.
    const cas: Observation[] = [
      observe(RICHE), observe(EQUIPE), observe(MAIGRE), observe(profilVide("muet")),
      { profil: RICHE, siteConsulte: null },
      observe(profil("vieux", { nom: "X", adresse: "1 rue", telephone: "+331" }, prov(ilYA(400)))),
    ]
    for (const o of cas) {
      const c = classer(o, MAINTENANT)
      expect(c.pourquoi.length).toBeGreaterThan(0)
      for (const raison of c.pourquoi) expect(raison.length).toBeGreaterThan(10)
    }
  })

  it("le résumé d'une ligne dit le rang et les deux axes", () => {
    expect(resumer(classer(observe(RICHE), MAINTENANT))).toBe("prioritaire — 4 fait(s), 3 illisible(s)")
    expect(resumer(classer({ profil: RICHE, siteConsulte: null }, MAINTENANT)))
      .toContain("inclassable — aucun site consulté")
  })

  it("aucun verdict ne contient de probabilité, de pourcentage ni de note", () => {
    // Garde-fou contre la dérive la plus probable de ce module : quelqu'un
    // ajoutera un jour un « 78 % de chances ». Rien dans ce dépôt n'a observé
    // une seule conversion de prospection — un tel chiffre serait inventé.
    const tous = [RICHE, EQUIPE, MAIGRE, profilVide("muet")]
      .map(p => classer(observe(p), MAINTENANT))
      .flatMap(c => [c.rang, ...c.pourquoi, resumer(c)])
      .join(" ")
    expect(tous).not.toMatch(/%|\bchances?\b|\bprobabilit|\bsur (cent|100)\b|\/100\b/i)
  })
})
