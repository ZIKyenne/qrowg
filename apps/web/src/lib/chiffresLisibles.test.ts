// L'arrondi ne doit pas effacer le fait — garde de classe.
//
// Relevé du 14 septembre, en rejouant les formules de pourcentage du produit :
//
//   profile/page.tsx:736    Math.round((scansQR / vues) * 100)
//     3 scans / 1200 vues (0,25 %)   →  « 0 % »
//     4 scans / 1000 vues (0,40 %)   →  « 0 % »
//     Le commerçant lit « 0 % » et conclut que son QR ne convertit pas. Les
//     scans sont pourtant comptés deux lignes plus haut sur le même écran.
//
//   DashboardShell.tsx:417  Math.min(100, Math.round((actifs / limite) * 100))
//     199 pages sur 200              →  jauge « 100 % », pleine. Il reste un slot.
//
//   api/reports/send:32     Math.round(((curr - prev) / prev) * 100)
//     1000 → 1002 vues               →  « +0 % ». Stable, alors que ça a bougé.
//
//   api/qr-stats/[id]:99
//     2000 → 7 scans                 →  « -100 % ». Tout perdu, alors qu'il reste.
//     0 → 50 scans                   →  « +100 % ». Inventé : il n'y avait rien.
//
//   Et le même chiffre s'écrit de deux façons dans le même produit :
//     profile/page.tsx   « 12 543 scans »   (toLocaleString("fr-FR"))
//     OverviewCards.tsx  « 12543 scans »    (brut)
//
// Le produit connaissait DÉJÀ la moitié de la règle : `lectureHonnete.ts`
// documente « partir de zéro n'est pas +100 % : c'est un départ, et ça se dit
// avec des mots ». Cette décision ne valait que pour un écran.
//
// La classe : **un arrondi ne transforme jamais un chiffre non nul en zéro, ni
// un incomplet en total.** Quand l'arrondi effacerait le fait, on descend d'une
// décimale au lieu de mentir d'un cran.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  nombreFr, compte, pourcentage, partDeJauge, jauge, evolution, phraseEvolution,
} from "./chiffresLisibles"
import { FINE } from "./typographieFr"

// Depuis le lot v103, l'espace avant le « % » est une FINE INSÉCABLE : ordinaire,
// elle laissait le signe partir seul à la ligne. Les attentes la composent au
// lieu de l'écrire — sinon deux chaînes visuellement identiques diffèrent.
const pc = (x: string) => `${x}${FINE}%`

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Ce que rendait `Math.round(x * 100)`, pour comparer. */
const ancien = (part: number, total: number) => Math.round((part / total) * 100)

describe("le cas du relevé : « 0 % » alors qu'il y en a", () => {
  it("une part non nulle ne s'écrit jamais zéro", () => {
    expect(ancien(3, 1200)).toBe(0)
    expect(pourcentage(3, 1200)).toBe(pc("0,3"))
    expect(ancien(4, 1000)).toBe(0)
    expect(pourcentage(4, 1000)).toBe(pc("0,4"))
    expect(pourcentage(1, 900)).toBe(pc("0,1"))
  })

  it("mais une part réellement nulle, si", () => {
    expect(pourcentage(0, 1000)).toBe(pc("0"))
  })

  it("et sous le centième, on le dit au lieu d'écrire un zéro", () => {
    expect(pourcentage(1, 1_000_000)).toBe(pc("< 0,01"))
  })

  it("au-dessus, l'arrondi entier reprend la main — on n'encombre pas", () => {
    expect(pourcentage(5, 1000)).toBe(pc("1"))
    expect(pourcentage(110, 1000)).toBe(pc("11"))
    expect(pourcentage(1, 2)).toBe(pc("50"))
  })

  it("rien à diviser : on ne fabrique pas un pourcentage", () => {
    expect(pourcentage(5, 0)).toBe("—")
    expect(pourcentage(5, 0, { siVide: "aucune vue" })).toBe("aucune vue")
    expect(pourcentage(NaN, 10)).toBe("—")
    expect(pourcentage(5, null)).toBe("—")
  })
})

describe("le cas du relevé : la jauge pleine à 199 sur 200", () => {
  it("l'étiquette ne dit « 100 % » que si c'est vrai", () => {
    expect(ancien(199, 200)).toBe(100)
    const j = jauge(199, 200)
    expect(j.texte).toBe(pc("99,5"))
    expect(j.pleine).toBe(false)
    expect(jauge(200, 200).texte).toBe(pc("100"))
    expect(jauge(200, 200).pleine).toBe(true)
  })

  it("« pleine » se lit sur les chiffres, jamais sur l'étiquette", () => {
    // 1999 sur 2000 : l'étiquette arrondie à deux décimales dirait « 99,95 % ».
    // C'est `pleine` qui porte la décision, et elle regarde les nombres.
    expect(jauge(1999, 2000).pleine).toBe(false)
    expect(jauge(2001, 2000).pleine).toBe(true)   // dépassement : plein quand même
    expect(jauge(5, 0).pleine).toBe(false)        // pas de limite : pas de plein
  })

  it("la largeur de la barre reste exacte, elle n'est pas arrondie", () => {
    expect(partDeJauge(199, 200)).toBe(99.5)
    expect(partDeJauge(1, 200)).toBe(0.5)
    expect(partDeJauge(300, 200)).toBe(100)   // bornée
    expect(partDeJauge(-5, 200)).toBe(0)
    expect(partDeJauge(1, 0)).toBe(0)
  })

  it("et au-delà de 99,99 %, on le dit plutôt que d'écrire « 100 % »", () => {
    expect(pourcentage(99_999, 100_000)).toBe(pc("> 99,99"))
  })
})

describe("le cas du relevé : « +0 % » et « -100 % »", () => {
  it("un écart réel n'est pas « stable »", () => {
    expect(ancien(1002 - 1000, 1000)).toBe(0)
    expect(evolution(1002, 1000)).toEqual({ texte: pc("+0,2"), sens: "hausse" })
    expect(evolution(1000, 998).sens).toBe("hausse")
  })

  it("une baisse est plafonnée à 100 : on ne perd pas plus que tout", () => {
    expect(Math.round(((7 - 2000) / 2000) * 100)).toBe(-100)
    expect(evolution(7, 2000)).toEqual({ texte: pc("−99,7"), sens: "baisse" })
    // Mais tout perdre s'écrit bien « −100 % ».
    expect(evolution(0, 50)).toEqual({ texte: pc("−100"), sens: "baisse" })
  })

  it("partir de zéro est « nouveau », pas « +100 % » — la règle de lectureHonnete", () => {
    expect(evolution(50, 0)).toEqual({ texte: "nouveau", sens: "nouveau" })
    expect(evolution(0, 0)).toEqual({ texte: "—", sens: "stable" })
    expect(evolution(100, 100)).toEqual({ texte: "stable", sens: "stable" })
    expect(lire("app/dashboard/analytics/lectureHonnete.ts"))
      .toContain("Partir de zéro n'est pas « +100 % »")
  })

  it("le signe est un vrai signe moins, pas un trait d'union", () => {
    expect(evolution(7, 2000).texte.startsWith("−")).toBe(true)
    expect(evolution(7, 2000).texte.startsWith("-")).toBe(false)
  })

  it("et une entrée illisible ne rend pas « NaN % »", () => {
    for (const e of [evolution(NaN, 10), evolution(10, NaN), evolution(null, undefined)]) {
      expect(e.texte).not.toContain("NaN")
    }
  })

  it("la phrase des e-mails dit la même chose, sans flèche", () => {
    expect(phraseEvolution(1002, 1000, "vue")).toBe(`${nombreFr(1002)} vues (${pc("+0,2")} par rapport à la semaine dernière).`)
    expect(phraseEvolution(12, 0, "vue")).toBe("12 vues — une première.")
    expect(phraseEvolution(40, 40, "vue")).toBe("40 vues, comme la semaine dernière.")
  })
})

describe("un seul nombre, une seule écriture", () => {
  it("le séparateur de milliers vient d'Intl", () => {
    expect(nombreFr(12543)).toBe((12543).toLocaleString("fr-FR"))
    expect(nombreFr(0)).toBe("0")
    expect(nombreFr("847")).toBe("847")
  })

  it("et un non-nombre ne devient pas « NaN »", () => {
    expect(nombreFr(NaN)).toBe("0")
    expect(nombreFr(undefined)).toBe("0")
    expect(nombreFr("douze")).toBe("0")
    expect(nombreFr(Infinity)).toBe("0")
  })

  it("l'accord se fait au même endroit", () => {
    expect(compte(1, "scan")).toBe("1 scan")
    expect(compte(0, "scan")).toBe("0 scan")
    expect(compte(12543, "scan")).toBe(`${nombreFr(12543)} scans`)
    expect(compte(3, "événement")).toBe("3 événements")
    expect(compte(2, "journal", "journaux")).toBe("2 journaux")
  })
})

describe("les cinq endroits du relevé sont branchés", () => {
  it("le taux de conversion du profil", () => {
    const src = lire("app/dashboard/profile/page.tsx")
    expect(src).toContain("pourcentage(totalScansQR, totalViews")
    expect(src, "l'étiquette arrondie a disparu de l'écran").not.toContain("{convRate}%")
    expect(src, "la barre suit la part exacte").toContain("partDeJauge(totalScansQR, totalViews)")
  })

  it("la jauge de quota de l'entête", () => {
    const src = lire("app/dashboard/DashboardShell.tsx")
    expect(src).toContain("jauge(qrActive, planLimit)")
    expect(src).not.toContain("Math.min(100, Math.round((qrActive / planLimit) * 100))")
  })

  it("le rapport hebdomadaire et l'alerte de quota", () => {
    const rapport = lire("app/api/reports/send/route.ts")
    expect(rapport).toContain("evolution(curr, prev)")
    expect(rapport).not.toContain("Math.round(((curr - prev) / prev) * 100)")
    expect(lire("app/api/cron/quota-alerts/route.ts")).toContain("pourcentage(views, limit)")
  })

  it("l'évolution d'un QR — et la réponse de la route reste lisible", () => {
    const route = lire("app/api/qr-stats/[id]/route.ts")
    expect(route).toContain("evolutionDe(scansCurrent ?? 0, scansPrev ?? 0)")
    expect(route, "le sens voyage à côté du texte").toContain("evolutionSens: evol.sens")
    expect(lire("app/dashboard/qr-codes/QRStudio.tsx"),
      "le client suit le type de la route").toContain("evolution: string")
  })

  it("et les grands nombres des cartes d'analyse", () => {
    expect(lire("app/dashboard/analytics/OverviewCards.tsx")).toContain("{nombreFr(totalScans)}")
    expect(lire("app/dashboard/analytics/TopLinksPanel.tsx")).toContain('compte(totalClicks, "clic")')
    expect(lire("app/dashboard/analytics/DevicePanel.tsx")).toContain('compte(fScans.length, "événement")')
  })
})

describe("garde de classe : un arrondi n'efface pas le fait", () => {
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

  it("aucun pourcentage affiché ne sort d'un Math.round posé là", () => {
    // Le motif exact : un `Math.round(… * 100)` dont le résultat part directement
    // dans une chaîne suivie d'un « % ». Les Math.round qui servent à DÉCIDER
    // (seuils, largeurs, positions) ne sont pas concernés — ils ne s'affichent pas.
    const motif = /\$\{[^}]*Math\.(round|floor|ceil)\([^}]*\*\s*100[^}]*\}\s*%|Math\.(round|floor|ceil)\([^)]*\*\s*100\)\}\s*%/
    // Une longueur CSS n'est pas une phrase. Et la règle porte sur un RAPPORT de
    // deux quantités mesurées : `Math.round(zoom * 100)` est un réglage que la
    // personne a choisi elle-même, exact par construction — il ne divise rien.
    const CSS = /(width|height|left|top|right|bottom|translate|inset|size|flex|basis|opacity|circle at)\s*[:(]/
    const RAPPORT = /\//
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (CSS.test(l)) continue
        const m = motif.exec(l)
        if (!m || !RAPPORT.test(m[0])) continue
        fautes.push(`${rel}:${i + 1} — ${l.slice(0, 110)}`)
      }
    }
    expect(fautes, "un pourcentage arrondi part à l'écran sans passer par le module").toEqual([])
  })

  it("le balayage voit bien les pourcentages du produit", () => {
    let vus = 0
    for (const f of fichiers()) {
      for (const l of fs.readFileSync(f, "utf8").split("\n")) {
        if (/\*\s*100\b/.test(l) && !l.trim().startsWith("//")) vus++
      }
    }
    expect(vus, "un balayage devenu aveugle ne prouve rien").toBeGreaterThan(15)
  })

  it("le module ne réécrit pas le formatage que le produit avait déjà", () => {
    const mod = lire("lib/chiffresLisibles.ts")
    expect(mod, "le séparateur de milliers vient d'Intl").toContain('toLocaleString("fr-FR")')
    for (const [i, ligne] of mod.split("\n").entries()) {
      const l = ligne.trim()
      if (l.startsWith("//") || l.startsWith("*")) continue
      expect(/replace\(\/\\B\(\?=/.test(l),
        `chiffresLisibles.ts:${i + 1} refabrique un séparateur de milliers à la main`).toBe(false)
    }
  })
})
