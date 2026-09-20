// Une animation que le produit joue s'arrête quand on le lui demande — garde de classe.
//
// Relevé du 20 septembre. `globals.css` porte cette phrase, juste au-dessus de sa
// règle d'accessibilité :
//
//     « Accessibilité : le Motion System respecte reduced-motion par construction. »
//
// Et c'était vrai — **pour les classes**. Une feuille de style ne peut viser que
// ce qu'elle connaît : `.mo-spin { animation: none !important }` n'atteint que
// les éléments qui portent `mo-spin`.
//
// Or le produit pose **cent dix-sept animations en style inline**. Et **soixante-
// neuf d'entre elles jouent les images-clés du système lui-même** :
//
//   mo-spin      52 fois    les voyants de chargement, partout
//   mo-pulse     11 fois    les squelettes et les pastilles
//   mo-fade-up    6 fois    les entrées de cartes
//
// Écrites dans l'attribut `style`, sans la classe. Elles échappaient toutes à la
// ligne écrite pour elles. Le système protégeait la forme qu'il recommande, et
// le produit utilisait l'autre.
//
// Une personne qui règle son téléphone sur « réduire les animations » le fait
// souvent parce que le mouvement lui donne la nausée — trouble vestibulaire,
// migraine, commotion. Elle scanne le QR d'un restaurant, la page s'ouvre, et
// ça tourne quand même. Le commerçant, lui, a le même dans son tableau de bord.
//
// La classe : **une animation que le produit joue s'arrête quand la personne a
// demandé qu'elle s'arrête** — quelle que soit la façon dont elle est écrite.
//
// Le remède est un sélecteur d'ATTRIBUT : `[style*="animation"]`. Un attribut se
// voit, une classe absente non. `!important` dans la feuille l'emporte sur une
// déclaration inline ordinaire : les cent dix-sept sont atteintes sans qu'aucune
// soit renommée.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { DURATION, EASE } from "./motion"

const SRC = path.join(__dirname, "..")
const CSS = fs.readFileSync(path.join(SRC, "app/globals.css"), "utf8")

function fichiers(ext = /\.tsx$/): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (ext.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

/** Les blocs `@media (prefers-reduced-motion: reduce)` de la feuille, accolades comprises. */
function blocsReduits(): string[] {
  const out: string[] = []
  for (const m of CSS.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/g)) {
    let i = m.index! + m[0].length, prof = 1
    while (i < CSS.length && prof > 0) {
      if (CSS[i] === "{") prof++
      else if (CSS[i] === "}") prof--
      i++
    }
    out.push(CSS.slice(m.index! + m[0].length, i))
  }
  return out
}

/** Chaque animation posée dans un objet de style JSX — celles qu'aucune classe ne vise. */
function animationsEnLigne(): { fichier: string; ligne: number; nom: string }[] {
  const out: { fichier: string; ligne: number; nom: string }[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (/^\s*(\/\/|\*)/.test(l)) return
      for (const m of l.matchAll(/\banimation\s*:\s*["`']\s*([\w-]+)/g)) {
        out.push({ fichier: rel, ligne: i + 1, nom: m[1] })
      }
    })
  }
  return out
}

describe("ce que la feuille de style peut voir", () => {
  it("une classe absente ne se vise pas — un attribut, si", () => {
    const reduit = blocsReduits().join("\n")
    expect(reduit, "le sélecteur d'attribut atteint le style inline").toContain('[style*="animation"] { animation: none !important; }')
    // La même ceinture que pour les classes : `backwards` ne s'applique plus
    // quand l'animation est coupée, l'élément revient à son état naturel.
    expect(reduit).toContain('[style*="animation"].mo-fade-up')
    expect(reduit).toMatch(/opacity: 1 !important; transform: none !important;/)
  })

  it("et le squelette de chargement, qui n'était cité nulle part, l'est", () => {
    expect(blocsReduits().join("\n")).toContain(".skeleton { animation: none !important; }")
  })
})

describe("garde de classe : toute image-clé jouée finit par s'arrêter", () => {
  it("chaque image-clé jouée par une classe est coupée sous reduced-motion", () => {
    const reduit = blocsReduits().join("\n")
    const fautes: string[] = []
    for (const k of new Set([...CSS.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]))) {
      const classes = new Set<string>()
      for (const m of CSS.matchAll(new RegExp(`(\\.[\\w-]+(?:[:\\w-]*)?(?:\\s*,\\s*\\.[\\w-]+)*)\\s*\\{[^}]*animation\\s*:\\s*${k}\\b`, "g"))) {
        for (const c of m[1].match(/\.([\w-]+)/g) ?? []) classes.add(c.slice(1))
      }
      if (!classes.size) continue
      if (![...classes].some(c => new RegExp(`\\.${c}\\b`).test(reduit))) fautes.push(`${k} (${[...classes].join(", ")})`)
    }
    expect(fautes, "une image-clé qui tourne sans pouvoir s'arrêter").toEqual([])
  })

  it("et celles posées en ligne sont atteintes par l'attribut, sans exception", () => {
    // Il n'y a plus rien à énumérer : le sélecteur d'attribut les prend toutes.
    // Ce test existe pour que la règle ne puisse pas disparaître en silence.
    const reduit = blocsReduits().join("\n")
    const enLigne = animationsEnLigne()
    expect(enLigne.length, "des animations en style inline, il y en a").toBeGreaterThan(80)
    // La règle NUE, sans classe accolée : c'est elle qui les prend toutes. Chercher
    // la simple présence de `[style*="animation"]` ne suffisait pas — les trois
    // lignes de la ceinture la contiennent aussi, et la garde restait muette
    // quand la règle nue disparaissait (trouvé par mutation, lot v133).
    const nue = /(^|\n)\s*\[style\*="animation"\]\s*\{[^}]*animation:\s*none\s*!important/
    expect(nue.test(reduit), `${enLigne.length} animations en dépendent`).toBe(true)
  })

  it("les images-clés du système sont jouées en ligne — c'est là qu'était le trou", () => {
    const parNom = new Map<string, number>()
    for (const a of animationsEnLigne()) parNom.set(a.nom, (parNom.get(a.nom) ?? 0) + 1)
    // Le relevé : ce ne sont pas des animations exotiques qui échappaient, mais
    // celles que le système recommande, écrites de l'autre façon.
    expect(parNom.get("mo-spin") ?? 0, "les voyants de chargement").toBeGreaterThan(30)
    expect((parNom.get("mo-spin") ?? 0) + (parNom.get("mo-pulse") ?? 0) + (parNom.get("mo-fade-up") ?? 0),
      "des images-clés du système, posées sans leur classe").toBeGreaterThan(50)
  })
})

describe("garde de classe : les deux moitiés du système disent la même chose", () => {
  // `globals.css` écrit ses durées et ses courbes en variables ; `lib/motion.ts`
  // les écrit en constantes. Un commentaire affirmait qu'elles sont égales ; rien
  // ne le vérifiait — et `motion.ts` n'était importé par personne, pas même pour ça.
  const variable = (nom: string) => new RegExp(`--mo-${nom}:\\s*([^;]+);`).exec(CSS)?.[1]?.trim()

  it("les durées de la feuille sont celles du module", () => {
    expect(variable("fast")).toBe(`${DURATION.fast}ms`)
    expect(variable("base")).toBe(`${DURATION.base}ms`)
    expect(variable("sheet")).toBe(`${DURATION.sheet}ms`)
    expect(variable("slow")).toBe(`${DURATION.slow}ms`)
    expect(variable("instant")).toBe(`${DURATION.instant}ms`)
  })

  it("et ses courbes aussi", () => {
    expect(variable("ease-standard")).toBe(EASE.standard)
    expect(variable("ease-entrance")).toBe(EASE.entrance)
    expect(variable("ease-spring")).toBe(EASE.spring)
    expect(variable("ease-emphasized")).toBe(EASE.emphasized)
  })

  it("le balayage voit bien la feuille — sinon il ne prouve rien", () => {
    expect(blocsReduits().length, "des blocs reduced-motion dans la feuille").toBeGreaterThan(10)
    expect([...CSS.matchAll(/@keyframes\s+[\w-]+/g)].length, "et des images-clés").toBeGreaterThan(20)
    expect(variable("base"), "et les variables se lisent").toBeTruthy()
    // Et le lecteur de blocs sait dire non : une feuille sans règle n'en rend aucune.
    expect(CSS.includes("prefers-reduced-motion"), "sans quoi tout le reste est vide").toBe(true)
  })
})
