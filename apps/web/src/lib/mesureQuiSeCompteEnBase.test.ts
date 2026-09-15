// Un total se compte dans la base, pas dans le navigateur — garde de classe.
//
// Relevé du 15 septembre. `perimetreDeMesure` porte déjà la règle, écrite après
// une mesure fausse : « un total ne nomme jamais un périmètre plus large que
// celui qu'on a lu. Soit on lit tout, soit on le dit. »
//
// Le produit la suit **trente-deux fois** : il demande un comptage à la base
// (`count: "exact", head: true`) et ne rapatrie aucune ligne. **Sept endroits
// font l'inverse** : ils ramènent les lignes des tables qui grossissent — scans,
// vues, clics — et les comptent en JavaScript.
//
// Le plus net est la fiche d'un QR. Dans le MÊME fichier :
//
//   scans de la période        count: "exact", head: true      ✓ exact
//   scans de la période d'avant count: "exact", head: true     ✓ exact
//   appareil le plus fréquent  .select("device")               toutes les lignes
//   pays le plus fréquent      .select("country")              toutes les lignes
//   courbe jour par jour       .select("scanned_at")           toutes les lignes
//
// Le bon geste et l'autre, à dix lignes d'écart. Et les trois lectures
// n'écrivaient **aucun plafond** et ne vérifiaient **jamais** si elles avaient
// tout reçu : une réponse coupée par le serveur donne un chiffre plus petit, et
// rien ne le dit. Pour un commerçant dont les QR marchent — celui qui a le plus
// de scans — c'est exactement là que le chiffre devient faux.
//
// La classe : **un total se compte dans la base ; une lecture de lignes porte un
// plafond écrit, et dit quand elle l'atteint.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { SCANS_MESURES, phraseScansPartiels } from "./perimetreDeMesure"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

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

/** Les tables qui grossissent avec le succès du commerçant. */
const QUI_GROSSISSENT = ["scans", "page_views", "block_clicks", "page_events", "instant_scan_events"]

type Lecture = { fichier: string; ligne: number; table: string; chaine: string }

/**
 * Chaque `.from(table).select(…)` d'une table qui grossit, avec SA chaîne d'appels.
 *
 * La chaîne s'arrête où elle s'arrête vraiment : la fin de la ligne, puis les
 * lignes suivantes tant qu'elles commencent par un point. Une fenêtre de N
 * caractères déborderait sur la requête d'après — et le plafond du voisin ferait
 * passer une lecture qui n'en a pas. C'est exactement ce que la vérification par
 * mutation a montré (lot v128).
 */
function lectures(): Lecture[] {
  const out: Lecture[] = []
  for (const f of fichiers()) {
    const s = fs.readFileSync(f, "utf8")
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    const lignes = s.split("\n")
    for (const m of s.matchAll(/\.from\("([a-z_]+)"\)\s*\n?\s*\.select\(/g)) {
      if (!QUI_GROSSISSENT.includes(m[1])) continue
      const avant = s.slice(0, m.index!).split("\n")
      const debut = avant.length - 1              // index 0 de la ligne du `.from(`
      const morceaux = [lignes[debut].slice(avant[debut].length)]
      for (let i = debut + 1; i < lignes.length && /^\s*\./.test(lignes[i]); i++) morceaux.push(lignes[i])
      out.push({
        fichier: rel, ligne: debut + 1, table: m[1],
        chaine: morceaux.join(" ").replace(/\s+/g, " "),
      })
    }
  }
  return out
}

describe("ce qu'une mesure doit dire d'elle-même", () => {
  it("le plafond de lecture d'une fiche de QR est écrit, pas deviné", () => {
    expect(SCANS_MESURES).toBeGreaterThan(1000)
    expect(Number.isInteger(SCANS_MESURES)).toBe(true)
  })

  it("et la phrase ne se montre que si la mesure s'est vraiment arrêtée", () => {
    expect(phraseScansPartiels(0), "rien lu, rien à dire").toBeNull()
    expect(phraseScansPartiels(SCANS_MESURES - 1), "sous le plafond : la mesure est complète").toBeNull()
    const p = phraseScansPartiels(SCANS_MESURES)
    expect(p).toContain(SCANS_MESURES.toLocaleString("fr-FR"))
    expect(p, "et elle dit ce qui reste juste").toMatch(/total/i)
    expect(phraseScansPartiels("beaucoup"), "une valeur molle ne déclenche rien").toBeNull()
  })
})

describe("garde de classe : la fiche d'un QR se mesure comme le reste du produit", () => {
  const ROUTE = lire("app/api/qr-stats/[id]/route.ts")

  it("l'appareil le plus fréquent se compte dans la base", () => {
    expect(ROUTE, "quatre comptages exacts, zéro ligne transportée").toContain('const APPAREILS = ["mobile", "tablet", "desktop", "unknown"] as const')
    expect(ROUTE).toContain('.select("id", { count: "exact", head: true })')
    expect(ROUTE, "plus de regroupement en JavaScript").not.toContain("deviceMap")
  })

  it("et les deux lectures qui restent portent un plafond écrit", () => {
    expect((ROUTE.match(/\.limit\(SCANS_MESURES\)/g) ?? []).length, "le pays et la courbe").toBe(2)
    expect(ROUTE, "les plus récents : c'est ce que la phrase promet").toContain('.order("scanned_at", { ascending: false })')
  })

  it("et la réponse dit quand elle s'est arrêtée", () => {
    expect(ROUTE).toContain("phraseScansPartiels(lus)")
    expect(ROUTE).toContain("mesure_partielle: partiel")
    // Un drapeau que personne ne lit est un drapeau inutile : l'export le porte.
    expect(lire("app/dashboard/qr-codes/QRStudio.tsx")).toContain("if (d.mesure_partielle) rows.unshift(")
  })

  it("aucune lecture d'une table qui grossit n'est sans plafond ni comptage", () => {
    const fautes = lectures()
      .filter(l => !/count:\s*["']exact|head:\s*true|\.limit\(|\.range\(|\.single\(\)|\.maybeSingle\(\)/.test(l.chaine))
      .map(l => `${l.fichier}:${l.ligne} (${l.table})`)
    expect(fautes, "compter dans la base, ou écrire un plafond et le dire").toEqual([])
  })

  it("le balayage voit bien les lectures — sinon il ne prouve rien", () => {
    const tout = lectures()
    expect(tout.length, "des lectures de tables qui grossissent").toBeGreaterThan(20)
    expect(tout.filter(l => /count:\s*["']exact/.test(l.chaine)).length, "et beaucoup comptent déjà dans la base").toBeGreaterThan(10)
    expect(new Set(tout.map(l => l.table)).size, "sur plusieurs tables").toBeGreaterThan(2)
  })
})
