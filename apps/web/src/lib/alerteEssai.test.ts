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

describe("le jalon du jour — un jour exact, pas un intervalle", () => {
  it("tombe à sept jours de l'échéance, et pendant ce jour-là seulement", () => {
    expect(jalonDuJour("free", T0, dans(22, 23)), "il reste 8 jours").toBeNull()
    expect(jalonDuJour("free", T0, dans(23)), "pile 7 jours").toBe(7)
    expect(jalonDuJour("free", T0, dans(23, 20)), "encore le même jour").toBe(7)
    expect(jalonDuJour("free", T0, dans(24)), "il reste 6 jours").toBeNull()
  })

  it("puis à la veille, et plus rien après", () => {
    expect(jalonDuJour("free", T0, dans(28, 23)), "il reste 2 jours").toBeNull()
    expect(jalonDuJour("free", T0, dans(29))).toBe(1)
    expect(jalonDuJour("free", T0, dans(29, 23))).toBe(1)
    expect(jalonDuJour("free", T0, dans(30)), "l'échéance est passée : la page est déjà en pause").toBeNull()
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
      if (t <= d || t > f) dehors.push(`${debut.toISOString()} (J-${v.jalon})`)
    }
    expect(dehors, "ces comptes seraient éligibles mais la requête ne les ramène pas").toEqual([])
  })

  it("la borne haute est inclusive — le compte publié pile à l'heure est dedans", () => {
    const { jusqua } = fenetreDesJalons(MAINTENANT)
    const pileALHeure = new Date(Date.parse(jusqua))
    const v = jugerCompte(compte({ premierePublication: pileALHeure.toISOString() }), MAINTENANT)
    expect(v.prevenir && v.jalon, "il lui reste exactement sept jours").toBe(Math.max(...ALERTES_JOURS))
  })

  it("et ne ramène pas toute la table pour autant", () => {
    const { depuis, jusqua } = fenetreDesJalons(MAINTENANT)
    const largeurJours = (Date.parse(jusqua) - Date.parse(depuis)) / JOUR
    expect(largeurJours, "du plus lointain jalon au dernier").toBe(Math.max(...ALERTES_JOURS) - Math.min(...ALERTES_JOURS) + 1)
    expect(Date.parse(depuis)).toBe(MAINTENANT.getTime() - DUREE_ESSAI_JOURS * JOUR)
  })

  it("elle suit les jalons : personne ne la recalcule à la main", () => {
    // Si quelqu'un ajoute un jalon à `ALERTES_JOURS` sans toucher à ce module,
    // la fenêtre doit s'élargir toute seule.
    const { depuis, jusqua } = fenetreDesJalons(MAINTENANT)
    const attenduDepuis = MAINTENANT.getTime() - (DUREE_ESSAI_JOURS - Math.min(...ALERTES_JOURS) + 1) * JOUR
    const attenduJusqua = MAINTENANT.getTime() - (DUREE_ESSAI_JOURS - Math.max(...ALERTES_JOURS)) * JOUR
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
