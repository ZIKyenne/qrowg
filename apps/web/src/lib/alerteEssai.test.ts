import { describe, it, expect } from "vitest"
import {
  jalonDuJour, jugerCompte, comptesAPrevenir, fenetreDesJalons,
  MESSAGES, RASSURANCE, type CompteEnEssai,
} from "./alerteEssai"
import { ALERTES_JOURS, DUREE_ESSAI_JOURS, joursRestants, etapeAlerte } from "./essaiGratuit"

const JOUR = 86_400_000
const T0 = new Date("2026-11-01T09:00:00Z")
const dans = (jours: number, heures = 0) => new Date(T0.getTime() + jours * JOUR + heures * 3_600_000)

const compte = (p: Partial<CompteEnEssai> = {}): CompteEnEssai => ({
  id: "u1",
  email: "commercant@exemple.fr",
  nom: "Camille Dupont",
  plan: "free",
  premierePublication: T0.toISOString(),
  aUnePagePubliee: true,
  ...p,
})

// T0 = 2026-11-01T09:00Z, donc la pause tombe le 2026-12-01 à 09:00Z.
// Le jour civil du jalon 7 est le 24 novembre ; celui du jalon 1, le 30.
const a = (iso: string) => new Date(iso)

describe("le jalon du jour — une journée civile exacte, pas un intervalle", () => {
  it("couvre la journée du jalon de minuit à 23 h 59, et rien autour", () => {
    // Les deux bornes de la journée sont testées EXPRÈS. L'ancien calcul
    // mesurait un délai entre instants : il répondait « 8 jours » à 08:00 et
    // « 7 » à 09:00 le MÊME jour. C'est par cette faille que la dérive du cron
    // (de +15 à +55 min, observée) faisait sauter ou doubler un envoi.
    expect(jalonDuJour("free", T0, a("2026-11-23T23:59:59.999Z")), "la veille du jalon").toBeNull()
    expect(jalonDuJour("free", T0, a("2026-11-24T00:00:00.000Z")), "minuit : le jalon commence").toBe(7)
    expect(jalonDuJour("free", T0, a("2026-11-24T08:00:00.000Z")), "avant l'heure de publication").toBe(7)
    expect(jalonDuJour("free", T0, a("2026-11-24T23:59:59.999Z")), "jusqu'au dernier instant").toBe(7)
    expect(jalonDuJour("free", T0, a("2026-11-25T00:00:00.000Z")), "le lendemain, plus rien").toBeNull()
  })

  it("puis la veille entière, et plus rien après", () => {
    expect(jalonDuJour("free", T0, a("2026-11-29T23:59:59.999Z")), "deux jours avant").toBeNull()
    expect(jalonDuJour("free", T0, a("2026-11-30T00:00:00.000Z"))).toBe(1)
    expect(jalonDuJour("free", T0, a("2026-11-30T23:59:59.999Z"))).toBe(1)
    // Le jour de la pause, on n'annonce plus « demain » : c'est aujourd'hui.
    // L'ancien calcul envoyait ce message ce jour-là pour tout compte publié
    // après l'heure du cron — quinze minutes avant la coupure.
    expect(jalonDuJour("free", T0, a("2026-12-01T00:00:00.000Z")), "le jour de la pause").toBeNull()
    expect(jalonDuJour("free", T0, a("2026-12-01T09:00:00.000Z")), "à l'instant de la pause").toBeNull()
    expect(jalonDuJour("free", T0, dans(90)), "et on ne relance pas indéfiniment").toBeNull()
  })

  it("jamais pour un compte qui paie, ni pour un compte qui n'a rien publié", () => {
    for (const p of ["starter", "pro", "business"]) {
      expect(jalonDuJour(p, T0, dans(23)), p).toBeNull()
    }
    expect(jalonDuJour("free", null, dans(23))).toBeNull()
  })
})

// C'EST LE TEST DU LOT. Tout le reste en découle.
describe("un compte, soixante passages quotidiens", () => {
  const passages = () => {
    const recus: number[] = []
    for (let j = 0; j < 60; j++) {
      // Le cron passe une fois par jour, à heure fixe.
      const jalon = jalonDuJour("free", T0, dans(j, 7))
      if (jalon !== null) recus.push(jalon)
    }
    return recus
  }

  it("reçoit exactement deux e-mails : J-7, puis J-1", () => {
    expect(passages()).toEqual([7, 1])
  })

  it("et `etapeAlerte` en aurait envoyé des dizaines — contre-épreuve", () => {
    // `etapeAlerte` répond par INTERVALLE : elle est faite pour un bandeau qui
    // reste affiché, pas pour un envoi. Si les deux étaient confondus, ce
    // compte recevrait un e-mail par jour — et après l'échéance, pour toujours,
    // puisqu'il reste 0 jour indéfiniment.
    let avecEtape = 0
    for (let j = 0; j < 60; j++) {
      if (etapeAlerte(joursRestants("free", T0, dans(j, 7))) !== null) avecEtape++
    }
    expect(avecEtape, "l'intervalle couvre beaucoup de jours").toBeGreaterThan(10)
    expect(passages().length, "le jalon exact, lui, en couvre deux").toBe(2)
    // Si ce rapport tombait à 1, c'est que les deux notions se seraient
    // rejointes — et la distinction que ce module protège aurait disparu.
    expect(avecEtape).toBeGreaterThan(passages().length * 3)
  })

  it("s'abonner en cours de route arrête tout", () => {
    const recus: number[] = []
    for (let j = 0; j < 60; j++) {
      const plan = j >= 25 ? "starter" : "free"
      const jalon = jalonDuJour(plan, T0, dans(j, 7))
      if (jalon !== null) recus.push(jalon)
    }
    expect(recus, "il a payé après le J-7 : la veille ne part plus").toEqual([7])
  })
})

// LA GARDE QUI MANQUAIT. Le bloc ci-dessus faisait passer le cron « à heure
// fixe » — l'hypothèse exacte que la production ne tient pas.
describe("un cron qui dérive, comme il dérive vraiment", () => {
  // Dérives relevées dans `cron_runs` le 2026-11-15, sur les six tâches
  // quotidiennes et leur horaire annoncé : +15, +26, +39, +53, +55 minutes.
  // Deux passages successifs peuvent donc être espacés de 24 h ± 40 min.
  const DERIVES = [15, 26, 39, 53, 55]

  /** Les jalons envoyés sur 45 jours, un passage par jour, dérive appliquée. */
  const envoisAvecDerive = (
    publication: string,
    jalon: (pub: string, passage: Date) => number | null,
  ) => {
    const recus: number[] = []
    for (let j = 1; j <= 45; j++) {
      const derive = DERIVES[j % DERIVES.length]
      const passage = new Date(Date.parse("2026-11-01T07:00:00.000Z") + j * JOUR + derive * 60_000)
      const v = jalon(publication, passage)
      if (v !== null) recus.push(v)
    }
    return recus
  }

  const MAINTENANT_LE_BON = (pub: string, passage: Date) => jalonDuJour("free", pub, passage)

  /**
   * L'ancien calcul, gardé VIVANT comme contre-épreuve.
   *
   * Il mesurait un délai entre instants (`joursRestants`) puis cherchait le
   * jalon exact. Le laisser ici est la seule façon de prouver, à chaque
   * passage de la suite, que le défaut existait et qu'il est parti.
   */
  const AVANT_EN_INSTANTS = (pub: string, passage: Date) => {
    const restants = joursRestants("free", pub, passage)
    return restants === null ? null : (ALERTES_JOURS.find(j => j === restants) ?? null)
  }

  it("envoie exactement deux e-mails quelle que soit l'heure de publication", () => {
    for (const heure of ["00:05", "04:00", "07:10", "07:20", "07:45", "12:00", "23:50"]) {
      const pub = `2026-11-01T${heure}:00.000Z`
      expect(envoisAvecDerive(pub, MAINTENANT_LE_BON), `publication à ${heure}`).toEqual([7, 1])
    }
  })

  it("et l'ancien calcul en envoyait TROIS — contre-épreuve", () => {
    // Le compte publié à 07:20, c'est-à-dire dans la bande de dérive du cron de
    // 07:00, recevait deux fois « Demain, vos clients ne verront plus votre
    // page » : la veille, puis le jour même de la coupure. Un e-mail qui reste
    // est du harcèlement — et celui-là mentait en plus sur la date.
    expect(envoisAvecDerive("2026-11-01T07:20:00.000Z", AVANT_EN_INSTANTS)).toEqual([7, 1, 1])
    expect(envoisAvecDerive("2026-11-01T07:45:00.000Z", AVANT_EN_INSTANTS)).toEqual([7, 1, 1])
    // Et hors de cette bande il était juste — ce qui explique pourquoi rien ne
    // le signalait : le défaut ne frappait qu'une tranche d'horaires.
    expect(envoisAvecDerive("2026-11-01T12:00:00.000Z", AVANT_EN_INSTANTS)).toEqual([7, 1])
  })

  it("le jalon ne dépend plus de l'heure du passage, du tout", () => {
    // Formulation directe du contrat : deux passages le même jour civil, à
    // n'importe quelle heure, rendent la même réponse.
    const pub = "2026-11-01T07:20:00.000Z"
    const jour = "2026-11-24"
    const reponses = ["00:00:00.000", "04:39:00.000", "07:15:00.000", "10:55:00.000", "23:59:59.999"]
      .map(h => jalonDuJour("free", pub, new Date(`${jour}T${h}Z`)))
    expect(new Set(reponses).size, "une seule réponse pour toute la journée").toBe(1)
    expect(reponses[0]).toBe(7)
  })
})

describe("qui est écarté, et pourquoi", () => {
  const maintenant = dans(23)
  const motif = (p: Partial<CompteEnEssai>) => {
    const v = jugerCompte(compte(p), maintenant)
    return v.prevenir ? "envoye" : v.motif
  }

  it("le compte nominal est bien retenu — sinon le reste ne prouve rien", () => {
    expect(motif({})).toBe("envoye")
  })

  it("sans adresse exploitable, rien", () => {
    expect(motif({ email: null })).toBe("sans_email")
    expect(motif({ email: "" })).toBe("sans_email")
    expect(motif({ email: "pas-une-adresse" })).toBe("sans_email")
  })

  it("un compte qui paie n'est jamais relancé", () => {
    expect(motif({ plan: "pro" })).toBe("plan_payant")
    expect(motif({ plan: "  Business  " }), "la casse et les espaces non plus").toBe("plan_payant")
  })

  it("un compte sans rien en ligne n'apprend pas qu'on va éteindre son néant", () => {
    expect(motif({ aUnePagePubliee: false })).toBe("rien_a_eteindre")
    expect(motif({ premierePublication: null })).toBe("jamais_publie")
  })

  it("et hors des deux jalons, silence", () => {
    expect(jugerCompte(compte(), dans(10))).toEqual({ prevenir: false, motif: "hors_jalon" })
  })

  it("comptesAPrevenir rend le jalon avec le compte", () => {
    const lot = [compte({ id: "a" }), compte({ id: "b", plan: "pro" }), compte({ id: "c", email: null })]
    expect(comptesAPrevenir(lot, dans(23)).map(x => [x.compte.id, x.jalon])).toEqual([["a", 7]])
  })
})

describe("la fenêtre envoyée à la base", () => {
  const MAINTENANT = new Date("2026-11-20T07:00:00Z")
  const MINUIT = Date.parse("2026-11-20T00:00:00.000Z")

  // La faute classique : une fenêtre SQL plus étroite que la décision. Les
  // comptes tombés dehors ne reçoivent jamais rien, et RIEN ne le signale —
  // la tâche se note « ok », avec zéro envoi.
  it("ne laisse dehors aucun compte que la décision accepterait", () => {
    const { depuis, jusqua } = fenetreDesJalons(MAINTENANT)
    const d = Date.parse(depuis), f = Date.parse(jusqua)
    const dehors: string[] = []
    for (let h = 0; h <= 40 * 24; h++) {
      const debut = new Date(MAINTENANT.getTime() - h * 3_600_000)
      const v = jugerCompte(compte({ premierePublication: debut.toISOString() }), MAINTENANT)
      if (!v.prevenir) continue
      // Borne basse exclue, borne haute INCLUSE : c'est le sens de l'arrondi
      // vers le haut. Écrit dans l'autre sens, ce test échoue sur le compte
      // publié pile à l'heure — et c'est ainsi qu'il a trouvé le décalage.
      const t = debut.getTime()
      // Le signalement porte les NOMBRES, pas seulement la date.
      //
      // Ce test a échoué une fois, le 2026-11-14, pendant un passage complet —
      // et pas deux, ni seul. Il a signalé la borne haute ELLE-MÊME, ce que
      // l'arithmétique rend impossible : `t > f` ne peut pas être vrai quand
      // `t === f`, et les deux valeurs descendent de la même constante figée.
      // Le message ne portait qu'une date, donc rien ne permettait de dire
      // LAQUELLE des trois valeurs avait bougé, ni si les constantes lues
      // étaient bien celles du produit.
      //
      // Quand le raisonnement dit « impossible » et que le fait dit le
      // contraire, c'est au raisonnement qu'il manque une donnée. Un échec
      // qu'on ne sait pas reproduire ne laisse qu'une prise : ce qu'il raconte
      // en tombant. Alors il raconte tout.
      if (t <= d || t > f) {
        dehors.push(
          `${debut.toISOString()} (J-${v.jalon}) — t=${t} depuis=${d} jusqua=${f} ` +
          `écart_haut=${t - f} écart_bas=${t - d} ` +
          `durée=${DUREE_ESSAI_JOURS} jalons=[${[...ALERTES_JOURS].join(",")}] jour=${JOUR}`,
        )
      }
    }
    expect(dehors, "ces comptes seraient éligibles mais la requête ne les ramène pas").toEqual([])
  })

  it("couvre la JOURNÉE ENTIÈRE de chaque jalon, minuit comme 23 h 59", () => {
    // La décision porte sur un jour civil : tout compte publié entre minuit et
    // 23 h 59 du jour du jalon doit être ramené. La version précédente coupait
    // à l'heure du passage et laissait donc dehors les comptes publiés plus
    // tard dans cette journée — éligibles, mais jamais lus.
    const { depuis, jusqua } = fenetreDesJalons(MAINTENANT)
    const d = Date.parse(depuis), f = Date.parse(jusqua)
    for (const jour of ["2026-10-28", "2026-10-22"]) {
      for (const heure of ["00:00:00.000", "12:00:00.000", "23:59:59.999"]) {
        const pub = new Date(`${jour}T${heure}Z`)
        const v = jugerCompte(compte({ premierePublication: pub.toISOString() }), MAINTENANT)
        expect(v.prevenir, `${pub.toISOString()} atteint un jalon`).toBe(true)
        const t = pub.getTime()
        expect(t > d && t <= f, `${pub.toISOString()} est dans la fenêtre lue`).toBe(true)
      }
    }
  })

  it("et ne ramène pas toute la table pour autant", () => {
    const { depuis, jusqua } = fenetreDesJalons(MAINTENANT)
    const largeurJours = (Date.parse(jusqua) - Date.parse(depuis)) / JOUR
    // Les jours de jalon s'étalent sur 7 journées (du 7e au 1er), plus UNE :
    // chaque jalon est une journée entière de publications possibles, donc la
    // fenêtre déborde d'un jour en haut. Un jour de trop coûte quelques lignes
    // lues ; un jour de moins perd des comptes en silence.
    expect(largeurJours, "du plus lointain jalon au dernier, plus la journée").toBe(
      Math.max(...ALERTES_JOURS) - Math.min(...ALERTES_JOURS) + 2,
    )
    expect(Date.parse(depuis)).toBe(MINUIT - DUREE_ESSAI_JOURS * JOUR)
  })

  it("part de MINUIT, pas de l'heure du passage", () => {
    // Sinon les bornes glisseraient de quarante minutes d'un jour sur l'autre
    // pendant que la décision, elle, ne bougerait pas. C'est ce décalage qui a
    // produit le défaut : trois e-mails au lieu de deux.
    const tot = fenetreDesJalons(new Date("2026-11-20T04:39:00Z"))
    const tard = fenetreDesJalons(new Date("2026-11-20T10:55:00Z"))
    expect(tot).toEqual(tard)
  })

  it("elle suit les jalons : personne ne la recalcule à la main", () => {
    // Si quelqu'un ajoute un jalon à `ALERTES_JOURS` sans toucher à ce module,
    // la fenêtre doit s'élargir toute seule.
    const { depuis, jusqua } = fenetreDesJalons(MAINTENANT)
    const attenduDepuis = MINUIT - (DUREE_ESSAI_JOURS - Math.min(...ALERTES_JOURS) + 1) * JOUR
    const attenduJusqua = MINUIT - (DUREE_ESSAI_JOURS - Math.max(...ALERTES_JOURS) - 1) * JOUR
    expect(Date.parse(depuis)).toBe(attenduDepuis)
    expect(Date.parse(jusqua)).toBe(attenduJusqua)
  })
})

describe("ce qu'on écrit au commerçant", () => {
  it("un message par jalon — un jalon ajouté sans texte ne part pas muet", () => {
    expect(Object.keys(MESSAGES).map(Number).sort((a, b) => b - a))
      .toEqual([...ALERTES_JOURS].sort((a, b) => b - a))
  })

  it("chacun dit ce que le CLIENT verra, pas ce que le compte devient", () => {
    for (const [jalon, m] of Object.entries(MESSAGES)) {
      const texte = `${m.objet} ${m.titre} ${m.corps}`.toLowerCase()
      expect(texte, `J-${jalon} : le QR imprimé est le vrai enjeu`).toContain("qr code")
      expect(texte, `J-${jalon} : dire ce qui arrive aux clients`).toMatch(/client|scann/)
      expect(m.objet.length, `J-${jalon} : un objet lisible dans une boîte mail`).toBeLessThan(60)
      expect(m.bouton.length, `J-${jalon} : un bouton, pas une phrase`).toBeLessThan(40)
    }
  })

  // Rien n'est effacé — ni les pages, ni les blocs, ni les QR. La migration des
  // trente jours ne supprime rien, la pause se CALCULE. Écrire le contraire
  // ferait acheter sur une peur fausse.
  it("aucun ne menace de supprimer quoi que ce soit", () => {
    for (const [jalon, m] of Object.entries(MESSAGES)) {
      const texte = `${m.objet} ${m.titre} ${m.corps} ${m.bouton}`.toLowerCase()
      for (const mot of ["supprim", "effac", "perdu", "perdre", "définitiv"]) {
        expect(texte, `J-${jalon} ne doit pas dire « ${mot} » : c'est faux`).not.toContain(mot)
      }
    }
  })

  it("et la phrase qui rassure dit exactement ce qui est vrai", () => {
    const t = RASSURANCE.toLowerCase()
    expect(t).toContain("intact")
    expect(t, "le QR imprimé n'a pas à être refait").toContain("réimprimer")
  })

  it("la veille parle bien de demain", () => {
    expect(`${MESSAGES[1].objet} ${MESSAGES[1].corps}`.toLowerCase()).toContain("demain")
    expect(MESSAGES[7].corps.toLowerCase()).toContain("semaine")
  })
})
