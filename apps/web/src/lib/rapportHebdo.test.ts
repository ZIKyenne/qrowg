// Deux rapports hebdomadaires, deux interrupteurs, deux chiffres — garde de classe.
//
// Relevé du 14 septembre. `vercel.json` planifie DEUX tâches qui envoient chacune
// un rapport hebdomadaire :
//
//     /api/emails/weekly   « 0 8 * * 1 »     (lundi 8 h)
//     /api/reports/send    « 0 8 * * * »     (tous les jours, filtre last_sent_at)
//
// Même commerçant, même semaine — trois pages publiées, une remise en brouillon
// lundi dernier, plus une page de l'équipe dont il est membre :
//
//     /api/emails/weekly   « Votre semaine »   730 visites  sur 4 pages
//     /api/reports/send    « Semaine du … »    420 visites  sur 3 pages
//     écart : 310 visites ; ni l'un ni l'autre ne compte la page d'équipe (180).
//
//     Réglages : Rapport hebdo OFF      → aucun e-mail
//     Réglages OFF + abonnement ON      → reports/send      (1 e-mail)
//     Réglages ON  + abonnement ON      → les deux          (2 e-mails)
//
// Et `reports/send` faisait `if (!pageIds.length) continue` : aucun e-mail,
// `last_sent_at` non mis à jour — l'abonnement re-tenté tous les jours pour
// toujours — et le journal notant « 0 envoyé(s) ».
//
// La classe : deux tâches qui parlent de la même chose la comptent de la même
// façon, obéissent au même interrupteur, et n'écartent personne en silence.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  PREFERENCE_HEBDO, LIBELLE_RAISON,
  hebdoDesactive, raisonDuRapportSimple, raisonDuRapportAbonne,
  pagesDuRapport, journalDesIgnores, detailDuPassage,
} from "./rapportHebdo"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")
const RACINE = path.join(SRC, "../../..")

describe("un seul interrupteur pour les deux rapports", () => {
  it("opt-out : absent vaut activé, comme l'écran l'affiche", () => {
    expect(hebdoDesactive(null)).toBe(false)
    expect(hebdoDesactive({})).toBe(false)
    expect(hebdoDesactive({ [PREFERENCE_HEBDO]: true })).toBe(false)
    expect(hebdoDesactive({ [PREFERENCE_HEBDO]: false })).toBe(true)
  })

  it("le cas du relevé : couper dans les Réglages coupe les DEUX", () => {
    const prefs = { [PREFERENCE_HEBDO]: false }
    expect(raisonDuRapportSimple({ email: "a@b.fr", preferences: prefs })).toBe("desactive")
    // Avant le lot, celui-ci partait quand même : l'écran Réglages mentait.
    expect(raisonDuRapportAbonne({ email: "a@b.fr", preferences: prefs, frequence: "weekly" })).toBe("desactive")
  })

  it("le mensuel n'a pas d'interrupteur : on ne lui applique pas celui d'une autre fréquence", () => {
    expect(raisonDuRapportAbonne({ email: "a@b.fr", preferences: { [PREFERENCE_HEBDO]: false }, frequence: "monthly" })).toBeNull()
  })

  it("et l'écran des Réglages écrit bien cette clé", () => {
    const reglages = lire("app/dashboard/settings/page.tsx")
    expect(reglages).toContain(PREFERENCE_HEBDO)
  })
})

describe("personne ne reçoit deux fois la même semaine", () => {
  it("l'abonné au rapport détaillé ne reçoit pas le rapport simple", () => {
    expect(raisonDuRapportSimple({ email: "a@b.fr", abonneHebdo: true })).toBe("deja_couvert")
    expect(raisonDuRapportSimple({ email: "a@b.fr", abonneHebdo: false })).toBeNull()
  })

  it("sans adresse, on n'envoie pas — et on le dit", () => {
    for (const v of [null, undefined, "", "   "]) {
      expect(raisonDuRapportSimple({ email: v as any }), String(v)).toBe("sans_adresse")
      expect(raisonDuRapportAbonne({ email: v as any, frequence: "weekly" }), String(v)).toBe("sans_adresse")
    }
  })

  it("l'ordre des raisons ne cache pas la plus importante", () => {
    // Coupé ET abonné : c'est le refus explicite qui prime.
    expect(raisonDuRapportSimple({ email: "a@b.fr", preferences: { [PREFERENCE_HEBDO]: false }, abonneHebdo: true })).toBe("desactive")
  })
})

describe("le périmètre compté est le même des deux côtés", () => {
  it("toutes les pages, quel que soit leur statut", () => {
    const pages = [{ id: "p1" }, { id: "p2" }, { id: "p3" }, { id: "p4" }]
    expect(pagesDuRapport(pages)).toEqual(["p1", "p2", "p3", "p4"])
  })

  it("et rien d'inventé quand la liste est vide ou abîmée", () => {
    expect(pagesDuRapport([])).toEqual([])
    expect(pagesDuRapport(null)).toEqual([])
    expect(pagesDuRapport([{ id: null }, { id: "" }, {}, { id: "p1" }] as any)).toEqual(["p1"])
  })
})

describe("un destinataire écarté apparaît dans le journal", () => {
  it("le détail nomme chaque raison, avec son compte", () => {
    const d = detailDuPassage(12, { desactive: 3, deja_couvert: 2 })
    expect(d).toContain("12 envoyé(s)")
    expect(d).toContain(`3 ${LIBELLE_RAISON.desactive}`)
    expect(d).toContain(`2 ${LIBELLE_RAISON.deja_couvert}`)
  })

  it("et « 0 envoyé(s) » ne veut plus dire deux choses différentes", () => {
    // Personne à servir.
    expect(detailDuPassage(0, {})).toBe("0 envoyé(s)")
    // Tout le monde écarté : ça se voit.
    expect(detailDuPassage(0, { sans_adresse: 4 })).toContain(LIBELLE_RAISON.sans_adresse)
  })

  it("les échecs restent visibles à côté des ignorés", () => {
    const d = detailDuPassage(1, { desactive: 1 }, ["429 rate limit"])
    expect(d).toContain("1 échec(s)")
    expect(d).toContain("429 rate limit")
  })

  it("rien à signaler ne produit pas une phrase vide de sens", () => {
    expect(journalDesIgnores({})).toBe("")
    expect(journalDesIgnores({ desactive: 0 })).toBe("")
  })
})

describe("les deux tâches planifiées appliquent la règle", () => {
  it("elles sont bien deux, et planifiées", () => {
    const vercel = JSON.parse(fs.readFileSync(path.join(RACINE, "vercel.json"), "utf8"))
    const chemins = (vercel.crons ?? []).map((c: any) => c.path)
    expect(chemins, "le rapport simple n'est plus planifié").toContain("/api/emails/weekly")
    expect(chemins, "le rapport détaillé n'est plus planifié").toContain("/api/reports/send")
  })

  it("le rapport détaillé n'écarte plus personne en silence", () => {
    const route = lire("app/api/reports/send/route.ts")
    expect(route, "l'abonnement était sauté sans trace ni last_sent_at").not.toContain("if (!pageIds.length) continue")
    expect(route).toContain("raisonDuRapportAbonne(")
    expect(route).toContain("detailDuPassage(")
    expect(route).toContain("ignorer(refus)")
  })

  it("il compte les pages de l'équipe, et tous les statuts", () => {
    const route = lire("app/api/reports/send/route.ts")
    expect(route).toContain("accessibleOwnerIds(supabase, sub.user_id)")
    expect(route, "le rapport ignore encore les pages en brouillon").not.toContain('.eq("status", "published")')
    expect(route).toContain("pagesDuRapport(pages)")
  })

  it("le rapport simple dédoublonne et obéit au même interrupteur", () => {
    const route = lire("app/api/emails/weekly/route.ts")
    expect(route).toContain("raisonDuRapportSimple(")
    expect(route, "la préférence est relue à la main").not.toContain("preferences?.weekly_report === false")
    expect(route).toContain('.eq("frequency", "weekly")')
    expect(route).toContain("abonnesHebdo")
    expect(route).toContain("teams(owner_id)")
  })
})

describe("garde de classe : une tâche planifiée ne saute jamais quelqu'un en silence", () => {
  const TACHES = [
    "app/api/emails/weekly/route.ts",
    "app/api/reports/send/route.ts",
    "app/api/cron/relance/route.ts",
    "app/api/cron/quota-alerts/route.ts",
    "app/api/cron/dynamic-expiry/route.ts",
  ]

  const compte = (l: string) => /\bignores?\b|ignorer\(/.test(l)

  it("un saut faute de coordonnées est toujours compté", () => {
    // C'est le saut qui compte vraiment : quelqu'un devait recevoir quelque
    // chose et ne l'a pas reçu. « en dessous du palier » ou « déjà alerté » sont
    // des non-événements ; une adresse manquante, non.
    for (const f of TACHES) {
      for (const ligne of lire(f).split("\n")) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (!/\bcontinue\b/.test(l) || !/email|adresse/i.test(l)) continue
        expect(compte(l), `${f} : « ${l} » écarte quelqu'un sans le compter`).toBe(true)
      }
    }
  })

  it("et les deux rapports ne sautent plus personne sans le dire", () => {
    for (const f of ["app/api/emails/weekly/route.ts", "app/api/reports/send/route.ts"]) {
      for (const ligne of lire(f).split("\n")) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (!/\bcontinue\b/.test(l)) continue
        expect(compte(l), `${f} : « ${l} » saute un destinataire sans trace`).toBe(true)
      }
    }
  })

  it("et chaque tâche écrit son détail dans le journal", () => {
    for (const f of TACHES) {
      expect(lire(f), `${f} : aucun passage journalisé`).toContain("noterPassage(")
    }
  })
})
