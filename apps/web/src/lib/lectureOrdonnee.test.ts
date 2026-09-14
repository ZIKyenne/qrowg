// « Prendre N lignes » sans dire lesquelles — garde de classe.
//
// Relevé du 14 septembre, en balayant les lectures de liste du produit.
// Vingt-six requêtes demandent un nombre maximum de lignes. Dix-sept disent
// AUSSI dans quel ordre — donc lesquelles. Neuf ne le disaient pas :
//
//   analytics/page.tsx:64   blocks         .limit(LIM)
//   analytics/page.tsx:68   page_events    .limit(LIM)   engagement
//   analytics/page.tsx:73   page_events    .limit(LIM)   carte de chaleur
//   analytics/page.tsx:88   page_views     .limit(LIM)   attribution par support
//   analytics/page.tsx:89   block_clicks   .limit(LIM)   attribution par support
//   analytics/page.tsx:90   leads          .limit(LIM)   attribution par support
//   q/[code]/route.ts:380   blocks         .limit(60)
//   cron/relance:67         profiles       .limit(500)
//   lib/journalCron:140     cron_runs      .limit(1)
//
// `LIM` vaut 50 000. Sans `order by`, Postgres ne promet aucun ordre : « les
// 50 000 premières » n'existe pas. Deux conséquences :
//
//   1. Au-delà du plafond, l'entonnoir de scroll, la carte de chaleur et
//      l'attribution par support CHANGENT entre deux rafraîchissements de la
//      même période, sans que rien n'ait bougé dans les données.
//
//   2. Sur le MÊME écran, `page_views` et `block_clicks` prenaient déjà les
//      50 000 plus récents. Deux panneaux côte à côte ne décrivaient donc pas
//      les mêmes événements : l'un la période récente, l'autre un échantillon
//      arbitraire. Leurs totaux ne se recoupaient pas.
//
// Et `cron/relance` relançait 500 comptes au hasard dans sa fenêtre, puis 500
// autres à la tentative suivante — ce que le lot v91 avait interdit sous une
// autre forme : « une tâche planifiée ne saute jamais quelqu'un en silence ».
//
// La classe : **une lecture qui plafonne dit aussi dans quel ordre.** Une seule
// exception, et elle doit dire pourquoi : demander « y en a-t-il ? » n'a pas
// besoin de savoir lequel.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  PLAFOND_MESURE, COLONNE_DORDRE, ordreDeLecture, estUneTableDEvenements,
  trancheCoupee, phraseTranche,
} from "./lectureOrdonnee"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

describe("la colonne d'ordre de chaque table", () => {
  it("elle est relevée dans le produit, pas inventée", () => {
    // Chaque colonne nommée ici doit exister dans un `.order(...)` du produit :
    // sinon le module fabrique un ordre que la base ne connaît peut-être pas.
    const fichiers: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) fichiers.push(p)
      }
    }
    marcher(SRC)
    const tout = fichiers.map(f => fs.readFileSync(f, "utf8")).join("\n")
    for (const [table, { colonne }] of Object.entries(COLONNE_DORDRE)) {
      expect(tout, `${table} → « ${colonne} » n'apparaît dans aucun .order() du produit`)
        .toContain(`.order("${colonne}"`)
    }
  })

  it("les événements se lisent du plus récent au plus ancien", () => {
    for (const t of ["page_views", "block_clicks", "page_events", "leads", "scans"]) {
      expect(ordreDeLecture(t)!.ascendant, `${t} devrait remonter le temps`).toBe(false)
      expect(estUneTableDEvenements(t)).toBe(true)
    }
  })

  it("un bloc, lui, n'a pas d'heure : son ordre est celui du commerçant", () => {
    expect(ordreDeLecture("blocks")).toEqual({ colonne: "position", ascendant: true })
    expect(estUneTableDEvenements("blocks")).toBe(false)
  })

  it("et une table inconnue ne reçoit pas un ordre inventé", () => {
    expect(ordreDeLecture("table_qui_nexiste_pas")).toBeNull()
    expect(ordreDeLecture("")).toBeNull()
    expect(ordreDeLecture(null)).toBeNull()
    expect(estUneTableDEvenements(null)).toBe(false)
  })
})

describe("dire que la tranche a été coupée", () => {
  it("elle l'est quand on a lu autant que le plafond", () => {
    expect(trancheCoupee(PLAFOND_MESURE)).toBe(true)
    expect(trancheCoupee(PLAFOND_MESURE - 1)).toBe(false)
    expect(trancheCoupee(0)).toBe(false)
  })

  it("la phrase nomme ce qui est mesuré — et se tait sinon", () => {
    expect(phraseTranche(PLAFOND_MESURE)).toContain("les plus récents")
    expect(phraseTranche(PLAFOND_MESURE)).toContain(PLAFOND_MESURE.toLocaleString("fr-FR"))
    expect(phraseTranche(12)).toBeNull()
  })

  it("et rien ne casse sur une entrée bancale", () => {
    expect(trancheCoupee(null)).toBe(false)
    expect(trancheCoupee("beaucoup")).toBe(false)
    expect(trancheCoupee(10, 0)).toBe(false)
    expect(phraseTranche(undefined)).toBeNull()
  })

  it("le plafond du module est celui de l'écran", () => {
    expect(PLAFOND_MESURE).toBe(50_000)
    expect(lire("app/dashboard/analytics/page.tsx")).toContain("const LIM = PLAFOND_MESURE")
  })
})

describe("les neuf lectures du relevé", () => {
  it("l'écran d'analyse : les six qui prenaient une tranche quelconque", () => {
    const src = lire("app/dashboard/analytics/page.tsx")
    // Les deux tables d'événements lues deux fois chacune, plus les blocs.
    expect(src.split('.order("created_at", { ascending: false }).limit(LIM)').length - 1,
      "engagement, taps et messages").toBeGreaterThanOrEqual(3)
    expect(src).toContain('.eq("is_visible", true).order("position")')
    expect(src).toContain('.neq("device", APPAREIL_ROBOT).order("viewed_at", { ascending: false }).limit(LIM)')
    expect(src).toContain('.not("qr_source", "is", null).order("clicked_at", { ascending: false }).limit(LIM)')
  })

  it("le mur du QR : les blocs d'où l'on tire comment joindre le commerce", () => {
    // Au-delà de 60 blocs, une tranche quelconque pouvait ne pas contenir le
    // numéro de téléphone qui est pourtant sur la page.
    expect(lire("app/q/[code]/route.ts"))
      .toContain('.eq("is_visible", true).order("position").limit(60)')
  })

  it("la relance : plus personne n'est sauté au hasard", () => {
    const src = lire("app/api/cron/relance/route.ts")
    expect(src).toContain('.order("created_at", { ascending: true })')
    expect(src, "la raison est écrite là où elle se lit").toContain("AU HASARD")
  })
})

describe("garde de classe : une lecture qui plafonne dit aussi dans quel ordre", () => {
  /** Les lectures de liste du produit, avec leur chaîne d'appels. */
  function lectures(): { rel: string; ligne: number; table: string; bloc: string }[] {
    const out: { rel: string; ligne: number; table: string; bloc: string }[] = []
    const fichiers: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) fichiers.push(p)
      }
    }
    marcher(SRC)
    for (const f of fichiers) {
      const rel = path.relative(SRC, f)
      const lignes = fs.readFileSync(f, "utf8").split("\n")
      for (const [i, l] of lignes.entries()) {
        const t = l.trim()
        if (t.startsWith("//") || t.startsWith("*")) continue
        const m = /\.from\(["']([a-z_]+)["']\)/.exec(t)
        if (!m) continue
        const bloc = lignes.slice(i, i + 14).join(" ")
        if (!/\.select\(/.test(bloc)) continue
        if (/\.single\(\)|\.maybeSingle\(\)/.test(bloc)) continue
        out.push({ rel, ligne: i + 1, table: m[1], bloc })
      }
    }
    return out
  }

  // La seule lecture qui a le droit de ne pas dire dans quel ordre : elle
  // demande « y en a-t-il ? », pas « lequel ».
  const EXISTENCE = "lib/journalCron.ts"

  it("aucune lecture plafonnée ne prend des lignes au hasard", () => {
    const fautes: string[] = []
    for (const { rel, ligne, table, bloc } of lectures()) {
      if (!/\.limit\(/.test(bloc)) continue
      if (rel === EXISTENCE) continue
      if (!/\.order\(/.test(bloc)) fautes.push(`${rel}:${ligne} — ${table}`)
    }
    expect(fautes, "« N lignes » sans dire lesquelles").toEqual([])
  })

  it("et l'exception dit pourquoi elle en est une, dans son propre fichier", () => {
    const src = lire(EXISTENCE)
    expect(src).toContain("on demande « y en a-t-il ? »")
    expect(src).toContain("N'importe quelle ligne répond")
  })

  it("le balayage voit bien les lectures du produit", () => {
    const toutes = lectures()
    expect(toutes.length, "un balayage devenu aveugle ne prouve rien").toBeGreaterThan(50)
    expect(toutes.filter(l => /\.limit\(/.test(l.bloc)).length).toBeGreaterThan(20)
  })

  it("chaque table plafonnée est une table dont le module connaît l'ordre", () => {
    // Sinon la règle n'est qu'un vœu : la prochaine lecture plafonnée d'une
    // table inconnue n'aurait aucun ordre à poser.
    const inconnues = new Set<string>()
    for (const { table, bloc } of lectures()) {
      if (/\.limit\(/.test(bloc) && !ordreDeLecture(table)) inconnues.add(table)
    }
    expect([...inconnues], "table plafonnée sans colonne d'ordre connue").toEqual([])
  })
})
