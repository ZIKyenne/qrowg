// Ce qui revient du navigateur se relit sans casser l'écran — garde de classe.
//
// Relevé du 20 septembre. `memoireDuNavigateur` porte déjà les deux moitiés du
// geste. La première a été posée le 14 septembre : **le navigateur a le droit de
// refuser de se souvenir**, et `lire`/`ecrire` ne lèvent jamais. La seconde est
// écrite juste en dessous, dans `lireJson` :
//
//     « Un contenu illisible — écrit par une version précédente, tronqué par un
//       quota atteint — rend le repli, jamais une exception et jamais
//       `undefined`. »
//
// **`lireJson` est utilisé six fois. Quatre endroits relisent à la main.** Et
// les deux plus coûteux ne sont protégés par rien :
//
//   print-studio/PrintStudioClient:404   lire(…) puis JSON.parse(raw)
//   print-studio/PrintStudioClient:413   idem, pour la charte de marque
//
// Ces deux-là sont le **repli** : ils ne s'exécutent que lorsque la base vient de
// refuser. Le commerçant est donc déjà dans le mauvais cas — et c'est là qu'on
// parse un contenu local sans filet. Pire, ils sont DANS un `.then` : une
// exception y devient un rejet de promesse que personne n'écoute. Pas d'erreur,
// pas de message, pas de modèles — l'atelier s'ouvre vide, et rien ne dit
// pourquoi.
//
// Un contenu illisible n'est pas une hypothèse d'école : un onglet fermé pendant
// l'écriture, un quota atteint au milieu d'un `setItem`, une version précédente
// du produit qui écrivait une autre forme — le navigateur garde alors une chaîne
// tronquée, et la garde du 14 septembre ne protège que l'ACCÈS, pas la RELECTURE.
//
// Les deux autres écrivent leur propre `try { … } catch {}` autour du même
// `JSON.parse` : `BannerStudio.pasteStyle` et l'historique de `qr-link`. Ils ne
// tombent pas — ils recopient simplement un geste qui existe, avec leur propre
// repli.
//
// La classe : **ce qui revient du navigateur se relit avec son repli, jamais à
// la main.**

import { describe, it, expect, afterEach } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { lireJson, ecrireJson, oublierLaSonde } from "./memoireDuNavigateur"

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

/**
 * Un `JSON.parse` qui relit le stockage du navigateur.
 *
 * `JSON.parse(JSON.stringify(x))` est un clone d'objet en mémoire, pas une
 * relecture : il ne peut pas rencontrer de contenu tronqué.
 */
function relecturesALaMain(): { fichier: string; ligne: number; texte: string }[] {
  const out: { fichier: string; ligne: number; texte: string }[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    if (rel === "lib/memoireDuNavigateur.ts") continue
    fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (/^\s*(\/\/|\*)/.test(l)) return
      if (!/JSON\.parse\(/.test(l) || /JSON\.parse\(JSON\.stringify/.test(l)) return
      if (/\blire\(|localStorage|sessionStorage|getItem\(/.test(l)) out.push({ fichier: rel, ligne: i + 1, texte: l.trim().slice(0, 110) })
    })
  }
  return out
}

afterEach(() => { oublierLaSonde() })

describe("relire ce que le navigateur a gardé", () => {
  it("un contenu tronqué rend le repli, pas une exception", () => {
    // Exactement le cas du quota atteint au milieu d'un `setItem`.
    const faux = { getItem: () => '{"presets":[{"id":"a"', setItem: () => {}, removeItem: () => {} }
    const vrai = globalThis.window
    ;(globalThis as { window?: unknown }).window = { localStorage: faux, sessionStorage: faux }
    oublierLaSonde()
    expect(() => lireJson("x", [])).not.toThrow()
    expect(lireJson("x", ["repli"])).toEqual(["repli"])
    ;(globalThis as { window?: unknown }).window = vrai
    oublierLaSonde()
  })

  it("et un `null` écrit volontairement ne passe pas pour une valeur", () => {
    const mem: Record<string, string> = {}
    const faux = {
      getItem: (k: string) => (k in mem ? mem[k] : null),
      setItem: (k: string, v: string) => { mem[k] = v },
      removeItem: (k: string) => { delete mem[k] },
    }
    const vrai = globalThis.window
    ;(globalThis as { window?: unknown }).window = { localStorage: faux, sessionStorage: faux }
    oublierLaSonde()
    expect(ecrireJson("k", null)).toBe(true)
    expect(lireJson("k", "repli"), "`null` enregistré n'efface pas le repli").toBe("repli")
    expect(ecrireJson("l", { a: 1 })).toBe(true)
    expect(lireJson("l", {})).toEqual({ a: 1 })
    expect(lireJson("jamais-ecrite", 42), "une clé absente rend le repli").toBe(42)
    ;(globalThis as { window?: unknown }).window = vrai
    oublierLaSonde()
  })

  it("un navigateur qui refuse de se souvenir rend le repli aussi", () => {
    const vrai = globalThis.window
    ;(globalThis as { window?: unknown }).window = {
      get localStorage(): never { throw new Error("SecurityError") },
      get sessionStorage(): never { throw new Error("SecurityError") },
    }
    oublierLaSonde()
    expect(() => lireJson("x", "repli")).not.toThrow()
    expect(lireJson("x", "repli")).toBe("repli")
    ;(globalThis as { window?: unknown }).window = vrai
    oublierLaSonde()
  })
})

describe("garde de classe : plus aucune relecture à la main", () => {
  it("aucun JSON.parse ne relit le stockage du navigateur", () => {
    expect(relecturesALaMain().map(r => `${r.fichier}:${r.ligne} — ${r.texte}`),
      "`lireJson` porte déjà le repli").toEqual([])
  })

  it("les deux replis de l'atelier d'impression ne lèvent plus", () => {
    const src = lire("app/dashboard/print-studio/PrintStudioClient.tsx")
    expect(src).toContain('lireJson("qrowg-print-presets"')
    expect(src).toContain('lireJson<Record<string, unknown> | null>("qrowg-print-brandkit", null)')
    // Ils vivent dans un `.then` : c'est ce qui rendait l'exception invisible.
    expect(src, "et toujours à la place du refus de la base").toContain("else setSavedPresets(lireJson(")
  })

  it("et les deux try/catch écrits à la main ont disparu", () => {
    expect(lire("app/dashboard/builder/BannerStudio.tsx")).toContain('lireJson<Record<string, unknown>>("qfb_banner_style", {})')
    expect(lire("app/dashboard/qr-link/page.tsx")).toContain('lireJson<QrHistEntry[]>("qrfolio_qr_history", [])')
  })

  it("le balayage voit bien les relectures — sinon il ne prouve rien", () => {
    let parses = 0, avecRepli = 0
    for (const f of fichiers()) {
      const s = fs.readFileSync(f, "utf8")
      parses += (s.match(/JSON\.parse\(/g) ?? []).length
      avecRepli += (s.match(/\blireJson[(<]/g) ?? []).length
    }
    expect(parses, "des JSON.parse dans le produit").toBeGreaterThan(8)
    expect(avecRepli, "et des lectures qui portent leur repli").toBeGreaterThan(8)
    // Le détecteur sait dire oui — sinon il ne dirait jamais non.
    const nu = 'const raw = lire("k"); if (raw) setX(JSON.parse(raw))'
    expect(/JSON\.parse\(/.test(nu) && /\blire\(/.test(nu)).toBe(true)
    // …et non sur un clone d'objet, qui ne relit rien.
    const clone = 'const copie = JSON.parse(JSON.stringify(etat))'
    expect(/JSON\.parse\(JSON\.stringify/.test(clone)).toBe(true)
  })
})
