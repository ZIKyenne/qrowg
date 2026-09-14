// L'angle mort du balayage v101 — garde de classe.
//
// Relevé du 14 septembre. Le lot v101 a posé : **un jour, c'est un jour chez le
// commerçant.** Son balayage interdit `toISOString().slice(0, 10)`. Il ne voit
// pas les DEUX autres façons de lire une horloge qui n'est pas la sienne :
//
//   now.getMonth(), getDate(), getHours()        → l'horloge de la machine
//   toLocaleDateString("fr-FR", { … })           → l'horloge de la machine
//
// Trois conséquences mesurées.
//
// 1) LE MOIS DU QUOTA N'EST PAS CELUI DU TABLEAU DE BORD
//
//      cron/quota-alerts:62   new Date(now.getFullYear(), now.getMonth(), 1)
//      DashboardClient:127    new Date(now.getFullYear(), now.getMonth(), 1)
//
//    La même ligne, deux horloges : le serveur tourne en UTC, le navigateur à
//    l'heure du commerçant. Le 1er juillet à 00 h 30 à Paris :
//
//      borne du serveur       2026-06-01T00:00:00Z   ← le 1er JUIN
//      borne du navigateur    2026-07-01T00:00:00+02
//
//    L'alerte comptait un mois de trop, et pouvait annoncer un quota dépassé sur
//    des vues de juin — l'alerte qui pousse à changer de plan.
//
// 2) L'HEURE DE POINTE EST CELLE DU NAVIGATEUR
//
//      AnalyticsClient:195    new Date(t).getHours()
//
//    Un même scan (2026-07-11T19:30:00Z) donne :
//      Europe/Paris 21 h · UTC 19 h · America/Martinique 15 h · Pacific/Tahiti 9 h
//
//    Le produit dit « votre heure de pointe » comme un fait sur le commerce ;
//    c'était un fait sur l'appareil qui regarde.
//
// 3) LA DATE DES E-MAILS EST CELLE DU SERVEUR
//
//      emails/weekly:88       new Date().toLocaleDateString("fr-FR", { … })
//
//    Un rapport parti lundi 00 h 30 à Paris portait la date de la veille.
//
// La règle du lot v101 ne change pas, elle s'étend : **une heure, un jour, un
// mois sont ceux du commerçant, pas ceux de l'horloge qui calcule.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  champsDuCommerce, heureDuCommerce, cleDuMois,
  debutDuJour, debutDuMois, debutDuJourIlYA, dateLisible, serieDeJours, jourDuCommerce,
} from "./jourDuCommerce"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** 1er juillet 2026, 00 h 30 à Paris — soit le 30 juin 22 h 30 en UTC. */
const MINUIT_PASSE = Date.parse("2026-07-01T00:30:00+02:00")

describe("le cas du relevé : le mois du quota", () => {
  it("le serveur bornait au mois précédent", () => {
    const d = new Date(MINUIT_PASSE)
    // Ce que faisait `new Date(now.getFullYear(), now.getMonth(), 1)` sur un
    // serveur en UTC :
    const ancien = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString()
    expect(ancien).toBe("2026-06-01T00:00:00.000Z")
    expect(cleDuMois(MINUIT_PASSE)).toBe("2026-07")
  })

  it("la borne est maintenant minuit du 1er, chez le commerçant", () => {
    expect(debutDuMois(MINUIT_PASSE)).toBe("2026-06-30T22:00:00.000Z")
    // 30 juin 22 h UTC = 1er juillet 00 h 00 à Paris.
    expect(jourDuCommerce(debutDuMois(MINUIT_PASSE))).toBe("2026-07-01")
  })

  it("et le début du jour, de même", () => {
    expect(jourDuCommerce(debutDuJour(MINUIT_PASSE))).toBe("2026-07-01")
    expect(champsDuCommerce(debutDuJour(MINUIT_PASSE))!.heure).toBe(0)
  })

  it("les deux dimanches de changement d'heure ne décalent rien", () => {
    // Le 25 octobre 2026 dure 25 h à Paris. Un pas fixe de 24 h y glisse.
    const apres = Date.parse("2026-10-26T10:00:00Z")
    for (const borne of [debutDuJour(apres), debutDuMois(apres), debutDuJourIlYA(1, apres), debutDuJourIlYA(6, apres)]) {
      expect(champsDuCommerce(borne)!.heure, `${borne} n'est pas minuit à Paris`).toBe(0)
      expect(champsDuCommerce(borne)!.minute).toBe(0)
    }
    // Et la veille du 26 est bien le 25, pas le 24.
    expect(jourDuCommerce(debutDuJourIlYA(1, apres))).toBe("2026-10-25")
  })

  it("rien ne casse sur une entrée bancale", () => {
    expect(champsDuCommerce(null)).toBeNull()
    expect(champsDuCommerce("nawak")).toBeNull()
    expect(heureDuCommerce(undefined)).toBeNull()
    expect(dateLisible(null)).toBe("")
    expect(debutDuJourIlYA(-3, MINUIT_PASSE)).not.toBe("")
  })
})

describe("le cas du relevé : l'heure de pointe", () => {
  const SCAN = Date.parse("2026-07-11T19:30:00Z")

  it("elle ne dépend plus de l'appareil qui regarde", () => {
    expect(heureDuCommerce(SCAN)).toBe(21)          // fuseau du commerce par défaut
    expect(heureDuCommerce(SCAN, "Europe/Paris")).toBe(21)
    expect(heureDuCommerce(SCAN, "America/Martinique")).toBe(15)
    expect(heureDuCommerce(SCAN, "Pacific/Tahiti")).toBe(9)
  })

  it("minuit se lit 0, pas 24", () => {
    expect(heureDuCommerce(Date.parse("2026-07-11T22:00:00Z"))).toBe(0)
  })
})

describe("le cas du relevé : la date des e-mails", () => {
  it("elle est écrite chez le commerçant, pas sur le serveur", () => {
    const envoi = Date.parse("2026-07-13T22:30:00Z")   // lundi 00 h 30 à Paris
    expect(dateLisible(envoi)).toBe("14 juillet")
    expect(new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", day: "numeric", month: "long" }).format(envoi))
      .toBe("13 juillet")
  })

  it("et elle accepte la forme que l'appelant demande", () => {
    const t = Date.parse("2026-07-14T10:00:00Z")
    expect(dateLisible(t, { weekday: "long" })).toBe("mardi")
    expect(dateLisible(t, { day: "2-digit", month: "2-digit", year: "numeric" })).toBe("14/07/2026")
  })
})

describe("les cinq endroits du relevé sont branchés", () => {
  it("l'alerte de quota et le tableau de bord bornent le mois au même endroit", () => {
    const alerte = lire("app/api/cron/quota-alerts/route.ts")
    const bord = lire("app/dashboard/DashboardClient.tsx")
    expect(alerte).toContain("const monthStart = debutDuMois()")
    expect(alerte).toContain("const monthKey = cleDuMois()")
    expect(bord).toContain("const monthStart = debutDuMois()")
    for (const src of [alerte, bord]) {
      expect(src, "une borne de mois lue sur l'horloge de la machine")
        .not.toContain("new Date(now.getFullYear(), now.getMonth(), 1)")
    }
  })

  it("et le tableau de bord range ses sept jours par JOUR, pas par pas de 24 h", () => {
    const bord = lire("app/dashboard/DashboardClient.tsx")
    expect(bord).toContain("const jours = serieDeJours(7)")
    expect(bord).toContain("jours.indexOf(jourDuCommerce((r as any).viewed_at))")
    expect(bord).not.toContain("/ 86400000")
  })

  it("l'heure de pointe", () => {
    const src = lire("app/dashboard/analytics/AnalyticsClient.tsx")
    expect(src).toContain("const h = heureDuCommerce(t)")
    expect(src).not.toContain("new Date(t).getHours()")
  })

  it("les deux e-mails", () => {
    expect(lire("app/api/emails/weekly/route.ts")).toContain("const dateLabel = dateLisible(Date.now())")
    expect(lire("app/api/reports/send/route.ts")).toContain("const jour = (d: Date) => dateLisible(d)")
  })

  it("le module étend celui du lot v101, il n'en crée pas un second", () => {
    const mod = lire("lib/jourDuCommerce.ts")
    expect(mod).toContain("export function heureDuCommerce")
    expect(mod).toContain("export function debutDuMois")
    // Le fuseau par défaut reste celui des horaires d'ouverture : un seul dans
    // tout le produit, importé et non recopié (règle du lot v101).
    expect(mod).toContain('from "./heureDuCommerce"')
    expect(mod, "un second fuseau par défaut").not.toMatch(/FUSEAU_DEFAUT\s*=\s*"/)
  })
})

describe("garde de classe : l'horloge qui calcule n'est pas celle du commerçant", () => {
  function fichiers(): string[] {
    const out: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
    }
    marcher(SRC)
    return out
  }

  /**
   * Ce qui a le droit de lire l'horloge de la machine :
   *   — le module qui POSE la règle ;
   *   — une durée relative (`Date.now() - 3600_000`), qui ne nomme aucun jour ;
   *   — l'année d'un pied de page, que personne ne compare à une mesure.
   */
  const DUREE_OU_ANNEE = /getFullYear\(\)\}? QRowg|getTime\(\)|Date\.now\(\) -|- \d+_?\d*\)/

  it("aucun jour, mois ou heure MESURÉ n'est lu sur l'horloge de la machine", () => {
    const champs = /\.get(Month|Date|Hours|Day)\(\)/
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/jourDuCommerce.ts" || rel === "lib/heureDuCommerce.ts") continue
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (!champs.test(l)) continue
        if (/getUTC/.test(l) || DUREE_OU_ANNEE.test(l)) continue
        // Un `setDate(getDate() - n)` calcule une DURÉE, pas un jour nommé :
        // il ne devient faux que si son résultat sert de borne de jour.
        if (/set(Date|Month|Hours)\(/.test(l) && !/toISOString\(\)/.test(l)) continue
        fautes.push(`${rel}:${i + 1} — ${l.slice(0, 95)}`)
      }
    }
    expect(fautes, "une date de mesure lue sur l'horloge de la machine").toEqual([])
  })

  it("et aucune date affichée n'est formatée sans dire dans quel fuseau", () => {
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/jourDuCommerce.ts" || rel === "lib/heureDuCommerce.ts") continue
      const lignes = fs.readFileSync(f, "utf8").split("\n")
      for (const [i, ligne] of lignes.entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (!/toLocale(Date|Time)String\(/.test(l)) continue
        if (/timeZone/.test(lignes.slice(i, i + 4).join(" "))) continue
        fautes.push(`${rel}:${i + 1} — ${l.slice(0, 95)}`)
      }
    }
    expect(fautes, "une date affichée sur l'horloge de la machine").toEqual([])
  })

  it("le balayage voit bien les dates du produit — sinon il ne prouve rien", () => {
    let vues = 0
    for (const f of fichiers()) {
      for (const l of fs.readFileSync(f, "utf8").split("\n")) {
        if (/new Date\(|Date\.now\(\)/.test(l) && !l.trim().startsWith("//")) vues++
      }
    }
    expect(vues).toBeGreaterThan(100)
  })

  it("la règle du lot v101 est toujours là, et celle-ci la prolonge", () => {
    expect(fs.existsSync(path.join(SRC, "lib/jourDuCommerce.test.ts"))).toBe(true)
    expect(lire("lib/jourDuCommerce.test.ts")).toContain("aucun jour montré au commerçant n'est découpé sur l'horloge UTC")
  })
})
