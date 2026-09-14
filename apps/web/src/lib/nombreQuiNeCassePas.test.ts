// Un nombre venu du contenu est borné avant d'être rendu — garde de classe.
//
// Relevé du 14 septembre. Le contenu d'un bloc est stocké en TEXTE, et chaque
// rendu reconvertit ce qu'il lui faut. Dix-sept endroits le faisaient à la main
// dans les rendus publics, avec la même formule :
//
//   renduLegacy.tsx:292    {"★".repeat(parseInt(s || "5"))}
//   renduLegacy.tsx:1708   Array.from({ length: parseInt(c.stars || "5") })
//   renduLegacy.tsx:2305   const cols = parseInt(c.columns || "3")
//
// Le `|| "5"` ne protège que du vide. Deux de ces lignes ne se contentent pas
// d'afficher un chiffre faux :
//
//   `"★".repeat(-1)` lève une **RangeError**, pendant le rendu de la page
//   publique. Le client qui vient de scanner le QR ne voit pas le menu : il
//   voit une page d'erreur. Le pire défaut que ce produit puisse avoir, et il
//   tient dans un signe moins.
//
//   `Array.from({ length: 999999999 })` alloue un milliard d'entrées. Un zéro
//   de trop dans un champ, et l'onglet du client se fige.
//
// Le geste existait **neuf fois**, sous des noms qui ne disaient pas
// « nombre » : deux `entier` locaux, `clampInt`, `pct01`, `pourcentageNiveau`,
// et trois lectures inline. Le premier relevé n'en voyait que trois.
//
// La classe : **un nombre venu du contenu est borné avant d'être rendu.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  entier, nombreLu, nombreDuContenu, entierDuContenu, choixDuContenu, combien,
} from "./nombreDuContenu"
import { entier as entierDeBornes } from "./bornes"
import { clampInt, pct01 } from "@/app/dashboard/builder/shared-renderer/models/layoutStyle"
import { googleReviewViewModel } from "@/app/dashboard/builder/shared-renderer/models/googleReview"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Les fichiers qui RENDENT une page publique ou son aperçu. */
function rendus(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) marcher(p)
      else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(path.join(SRC, "app/[slug]"))
  marcher(path.join(SRC, "app/dashboard/builder/shared-renderer"))
  return out
}

describe("lire un nombre écrit par quelqu'un", () => {
  it("la lecture souple prend le premier nombre, ou rien", () => {
    expect(nombreLu("12px")).toBe(12)
    expect(nombreLu("3 colonnes")).toBe(3)
    expect(nombreLu("1,5")).toBe(1.5)
    expect(nombreLu("-2")).toBe(-2)
    expect(nombreLu("deux")).toBeNull()
    expect(nombreLu("")).toBeNull()
    expect(nombreLu(null)).toBeNull()
    expect(nombreLu(NaN), "un NaN entrant n'en ressort pas").toBeNull()
    expect(nombreLu(Infinity)).toBeNull()
  })

  it("la lecture stricte refuse ce qui n'est pas un nombre", () => {
    expect(entier("12px", 0, 100, 7), "« 12px » n'est pas un nombre pour une route").toBe(7)
    expect(entier("12", 0, 100, 7)).toBe(12)
    expect(entier(500, 0, 100, 7), "et elle borne").toBe(100)
    expect(entierDeBornes, "une seule implémentation, pas deux").toBe(entier)
  })

  it("aucune lecture ne rend jamais NaN", () => {
    for (const v of ["", "deux", null, undefined, {}, [], NaN, "NaN", "-", "."]) {
      expect(Number.isFinite(nombreDuContenu(v, 3))).toBe(true)
      expect(Number.isFinite(entierDuContenu(v, 3, 1, 9))).toBe(true)
      expect(Number.isFinite(choixDuContenu(v, 3, 1, 9))).toBe(true)
      expect(Number.isFinite(combien(v, 5, 5))).toBe(true)
    }
  })
})

describe("borner, retomber, dessiner — trois questions", () => {
  it("une taille qui dépasse revient au bord", () => {
    expect(entierDuContenu("5000", 14, 8, 96)).toBe(96)
    expect(entierDuContenu("2", 14, 8, 96)).toBe(8)
    expect(entierDuContenu("24", 14, 8, 96)).toBe(24)
  })

  it("un réglage hors plage retombe sur le défaut — pas sur le bord", () => {
    // « Zéro colonne » ramené au bord donnerait UNE colonne : une mise en page
    // que personne n'a demandée. Deux gardes du produit l'exigeaient déjà.
    expect(choixDuContenu("0", 3, 1, 12), "wave21").toBe(3)
    expect(choixDuContenu("zéro", 3, 1, 12), "wave16").toBe(3)
    expect(choixDuContenu("99", 3, 1, 12)).toBe(3)
    expect(choixDuContenu("2", 3, 1, 12)).toBe(2)
  })

  it("un nombre de choses à dessiner ne lève jamais et n'alloue jamais trop", () => {
    // Les deux formes qui font tomber une page publique.
    expect(() => "★".repeat(combien("-1", 5, 5))).not.toThrow()
    expect("★".repeat(combien("-1", 5, 5))).toBe("")
    expect(combien("999999999", 5, 5), "un zéro de trop ne fige pas l'onglet").toBe(5)
    expect(combien("3", 5, 5)).toBe(3)
    expect(combien("4 étoiles", 5, 5)).toBe(4)
    expect(combien("deux étoiles", 5, 5), "un mot n'est pas un chiffre : on prend le défaut").toBe(5)
    expect(combien(undefined, 5, 5)).toBe(5)
    expect(Array.from({ length: combien("-4", 5, 5) })).toHaveLength(0)
  })

  it("le scénario qui faisait tomber la page d'un client", () => {
    // Une note à -1 en base — un import, une génération, un modèle — et le bloc
    // levait PENDANT le rendu. Il rend maintenant zéro étoile.
    const avant = () => "★".repeat(parseInt("-1"))
    expect(avant, "ce que faisait le produit").toThrow(RangeError)
    expect(() => "★".repeat(combien("-1", 5, 5)), "ce qu'il fait maintenant").not.toThrow()
    // Et le bloc « avis Google » borne aussi le sien.
    expect(googleReviewViewModel({ stars: "-3", url: "https://x.fr" }).stars).toBeGreaterThanOrEqual(0)
    expect(googleReviewViewModel({ stars: "9999", url: "https://x.fr" }).stars).toBeLessThanOrEqual(5)
  })

  it("les neuf copies sont devenues une — `clampInt` et `pct01` délèguent", () => {
    expect(clampInt("34px", 24, 60, 34)).toBe(34)
    expect(clampInt("999", 24, 60, 34)).toBe(60)
    expect(clampInt("rien", 24, 60, 34)).toBe(34)
    expect(pct01("45", 0.45)).toBeCloseTo(0.45)
    expect(pct01("0,3", 0.45)).toBeCloseTo(0.3)
    expect(pct01("nimporte", 0.45)).toBeCloseTo(0.45)
    expect(pct01("500", 0.45), "et jamais au-delà de 1").toBe(1)
    const ls = lire("app/dashboard/builder/shared-renderer/models/layoutStyle.ts")
    expect(ls).toContain("return entierDuContenu(v, fallback, min, max)")
  })
})

describe("garde de classe : un nombre du contenu ne casse pas un rendu", () => {
  it("aucun rendu ne lit un nombre à la main", () => {
    const fautes: string[] = []
    for (const f of rendus()) {
      const rel = path.relative(SRC, f)
      fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
        if (!/\b(?:parseInt|parseFloat)\s*\(/.test(l)) return
        // Le base 16 d'une couleur n'est pas un nombre du contenu : c'est un
        // format, et il a ses propres gardes (lib/contrasteQr, safeColor).
        if (/,\s*16\s*\)/.test(l)) return
        if (/^\s*(\/\/|\*)/.test(l)) return   // les commentaires citent l'ancien code
        fautes.push(`${rel}:${i + 1} — ${l.trim().slice(0, 70)}`)
      })
    }
    expect(fautes, "passer par lib/nombreDuContenu").toEqual([])
  })

  it("rien ne dessine un nombre de choses sans l'avoir borné", () => {
    // `String.repeat` lève sur un négatif ; `Array.from({ length })` alloue.
    // Un littéral ou une constante sont sûrs ; un appel qui n'est pas `combien`
    // ne l'est pas.
    const fautes: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p); continue }
        if (!/\.tsx?$/.test(n) || /\.test\./.test(n)) continue
        fs.readFileSync(p, "utf8").split("\n").forEach((l, i) => {
          if (/^\s*(?:\/\/|\*)/.test(l)) return        // un commentaire cite l'ancien code
          for (const m of l.matchAll(/\.repeat\(([^)]*)|length:\s*([^,}]+)/g)) {
            const arg = (m[1] ?? m[2] ?? "").trim()
            if (!arg || /^combien\(/.test(arg)) continue
            // Le signal est « ça vient du CONTENU », pas le nom du champ : une
            // valeur calculée par le produit (`preflight.stars`, borné 1..5 à
            // la source) n'a rien à faire ici.
            if (!/parseInt|parseFloat|Number\(|\bc\.|content\./.test(arg)) continue
            fautes.push(`${path.relative(SRC, p)}:${i + 1} — ${arg.slice(0, 50)}`)
          }
        })
      }
    }
    marcher(SRC)
    expect(fautes, "un nombre du contenu devant repeat/Array.from doit passer par combien()").toEqual([])
  })

  it("le balayage voit bien les rendus — sinon il ne prouve rien", () => {
    const f = rendus()
    expect(f.length, "des fichiers de rendu").toBeGreaterThan(60)
    const appels = f.reduce((n, p) =>
      n + (fs.readFileSync(p, "utf8").match(/\b(?:combien|entierDuContenu|choixDuContenu|nombreDuContenu|clampInt|pct01)\(/g) || []).length, 0)
    expect(appels, "et beaucoup de nombres lus, tous bornés").toBeGreaterThan(30)
  })

  it("le geste vit à un seul endroit", () => {
    const mod = lire("lib/nombreDuContenu.ts")
    expect(mod).toContain("un nombre venu du contenu est borné avant d'être rendu")
    expect(lire("lib/bornes.ts"), "bornes n'a plus sa copie").toContain('export { entier } from "./nombreDuContenu"')
  })
})
