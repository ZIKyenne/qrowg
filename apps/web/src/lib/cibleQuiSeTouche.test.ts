// Ce qu'on touche du doigt a la taille d'un doigt — garde de classe.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F19, second volet). La
// revue le dit prudemment — « le minimum WCAG 2.5.8 est de 24 × 24 pixels CSS,
// sous réserve de ses exceptions » — et elle a raison des deux côtés : la règle
// existe, et son exception aussi.
//
// **Dix-huit commandes déclarent une taille sous 24 px.** Appliquée
// honnêtement, l'exception d'espacement en innocente quatorze : un disque de
// 24 px centré sur la cible ne rencontre aucun autre disque.
//
//   interrupteurs 20-23 px   un par ligne de réglages
//   pastilles de couleur     22 px, écart 5 → centres à 27 px
//   croix isolées 22 px      seules dans leur coin
//
// **Quatre ne passent pas, et deux sont sur la page du visiteur** — celle qu'on
// ouvre en scannant un QR, au téléphone :
//
//   [slug]/blocsPublics    les pastilles du carrousel : 7 × 7 px, écart 6.
//                          Centres à 13 px. Un doigt en couvre trois, et c'est
//                          le seul moyen d'atteindre la photo n° 4.
//   [slug]/blocsPublics    « Fermer l'annonce » : 22 px, deux de trop.
//   print-studio           les variantes d'un modèle : 16 px, écart 4.
//   print-studio           la croix d'un filtre actif : 14 px.
//
// Le produit connaissait la règle : il l'écrit en prose à trois endroits, avec
// trois nombres (44, 46, 44), et une seule garde — la barre mobile.
//
// La classe : **ce qu'on touche du doigt a la taille d'un doigt.** Le dessin ne
// bouge pas ; c'est la zone sensible qui grandit autour de lui.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { CIBLE_MIN, CIBLE_CONFORT, cibleSuffisante, zoneDeTouche } from "./cibleTactile"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/**
 * Le grenier de l'accueil : des sections retirées, importées par personne
 * (`accueilDecoupe.test.ts` le vérifie). Ce qui ne s'affiche jamais ne se
 * touche jamais. Même exception qu'aux lots v139 et v140.
 */
const GRENIER = new Set(["app/homeSectionsRetirees.tsx"])

function fichiers(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

/** Le texte complet d'une balise ouvrante, accolades et chaînes respectées. */
function balises(src: string, quoi = /<(button|a)\b/g): { ligne: number; texte: string; debut: number }[] {
  const out: { ligne: number; texte: string; debut: number }[] = []
  quoi.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = quoi.exec(src)) !== null) {
    let i = quoi.lastIndex, prof = 0, fin = -1
    const stop = Math.min(src.length, i + 4000)
    while (i < stop) {
      const c = src[i]
      if (c === "{") prof++
      else if (c === "}") prof--
      else if ((c === '"' || c === "'" || c === "`") && prof === 0) {
        const q = c; i++
        while (i < src.length && src[i] !== q) { if (src[i] === "\\") i++; i++ }
      } else if (c === ">" && prof === 0) { fin = i; break }
      i++
    }
    if (fin < 0) continue
    out.push({ ligne: src.slice(0, m.index).split("\n").length, texte: src.slice(m.index, fin + 1).replace(/\n/g, " "), debut: m.index })
  }
  return out
}

/**
 * L'écart déclaré par le conteneur le plus proche au-dessus de cette commande.
 * `null` quand aucun `gap` ne figure dans les 400 caractères qui précèdent :
 * la commande est alors tenue pour isolée, ce qui est l'hypothèse FAVORABLE —
 * un balayage ne doit pas inventer un voisin.
 */
function ecartDuConteneur(src: string, debut: number): number | null {
  const avant = src.slice(Math.max(0, debut - 400), debut)
  const m = [...avant.matchAll(/\bgap:\s*(\d+)/g)].pop()
  return m ? Number(m[1]) : null
}

type Petite = { fichier: string; ligne: number; min: number; ecart: number | null; texte: string }

function ciblesTropPetites(): { toutes: Petite[]; fautives: Petite[] } {
  const toutes: Petite[] = [], fautives: Petite[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    if (GRENIER.has(rel)) continue
    const src = fs.readFileSync(f, "utf8")
    for (const b of balises(src)) {
      const tailles = [...b.texte.matchAll(/\b(?:width|height):\s*(\d+)\b/g)].map(x => Number(x[1]))
      if (tailles.length === 0) continue
      const min = Math.min(...tailles)
      if (min >= CIBLE_MIN) continue
      const ecart = ecartDuConteneur(src, b.debut)
      const p = { fichier: rel, ligne: b.ligne, min, ecart, texte: b.texte.slice(0, 90) }
      toutes.push(p)
      if (!cibleSuffisante({ largeur: min, hauteur: min }, ecart)) fautives.push(p)
    }
  }
  return { toutes, fautives }
}

describe("la règle, et son exception", () => {
  it("24 px au plancher, 44 px quand c'est le confort que le produit vise", () => {
    expect(CIBLE_MIN, "WCAG 2.5.8 niveau AA").toBe(24)
    expect(CIBLE_CONFORT, "ce que PageHeader, Button et la barre mobile visent déjà").toBe(44)
    expect(CIBLE_CONFORT).toBeGreaterThan(CIBLE_MIN)
  })

  it("une cible assez grande passe, quoi qu'il y ait autour", () => {
    expect(cibleSuffisante({ largeur: 24, hauteur: 24 }, 0)).toBe(true)
    expect(cibleSuffisante({ largeur: 44, hauteur: 44 }, 0)).toBe(true)
  })

  it("une petite cible isolée passe — c'est l'exception d'espacement", () => {
    expect(cibleSuffisante({ largeur: 14, hauteur: 14 }, null), "rien autour").toBe(true)
    // Les pastilles de couleur du relevé : 22 px, écart 5 → centres à 27.
    expect(cibleSuffisante({ largeur: 22, hauteur: 22 }, 5)).toBe(true)
  })

  it("…et ne passe plus dès qu'une voisine entre dans son disque", () => {
    // Les pastilles du carrousel : 7 px, écart 6 → centres à 13, il en faut 24.
    expect(cibleSuffisante({ largeur: 7, hauteur: 7 }, 6)).toBe(false)
    // Les variantes d'un modèle : 16 px, écart 4 → centres à 20.
    expect(cibleSuffisante({ largeur: 16, hauteur: 16 }, 4)).toBe(false)
    // Le cas limite est ouvert : 24 pile suffit.
    expect(cibleSuffisante({ largeur: 18, hauteur: 18 }, 6)).toBe(true)
    expect(cibleSuffisante({ largeur: 18, hauteur: 18 }, 5)).toBe(false)
  })

  it("`zoneDeTouche` agrandit la zone sensible sans toucher au dessin", () => {
    const z = zoneDeTouche(7)
    expect(z.width).toBe(CIBLE_MIN)
    expect(z.height).toBe(CIBLE_MIN)
    expect(z.display, "le dessin reste centré dedans").toBe("inline-flex")
    expect(z.padding, "aucune place prise en plus par du remplissage").toBe(0)
    // Un dessin déjà grand n'est pas rétréci.
    expect(zoneDeTouche(40, 30).width).toBe(40)
    expect(zoneDeTouche(40, 30).height).toBe(30)
    // Et jamais de marge négative : deux zones sensibles ne se chevauchent pas.
    expect(Object.values(z).some(v => typeof v === "number" && v < 0)).toBe(false)
  })
})

describe("garde de classe : plus aucune cible trop petite", () => {
  it("chaque commande passe la règle, exception d'espacement comprise", () => {
    const { fautives } = ciblesTropPetites()
    expect(fautives.map(p => `${p.fichier}:${p.ligne} — ${p.min}px, écart ${p.ecart} — ${p.texte}`),
      "passer par `zoneDeTouche`, ou écarter les voisines").toEqual([])
  })

  it("les deux commandes de la page du visiteur sont réparées", () => {
    const src = lire("app/[slug]/blocsPublics.tsx")
    expect(src, "les pastilles du carrousel").toContain("aria-label={`Photo ${i + 1}`} aria-current={i === idx ? \"true\" : undefined} style={zoneDeTouche()}")
    expect(src, "et leur dessin n'a pas changé").toContain('width: i === idx ? 18 : 7, height: 7, borderRadius: 4')
    expect(src, "l'écart tombe à zéro : ce sont les centres qui comptent").toContain('display: "flex", gap: 0 }}>')
    expect(src, "« Fermer l'annonce »").toContain("{ ...zoneDeTouche(), position: \"absolute\", top: 6, right: 8")
  })

  it("et les deux de l'atelier d'impression aussi", () => {
    const src = lire("app/dashboard/print-studio/PrintStudioClient.tsx")
    expect(src, "la croix d'un filtre actif").toContain("...zoneDeTouche(14)")
    expect(src, "les variantes d'un modèle").toContain("style={zoneDeTouche(16)}")
    expect(src, "leur pastille garde ses 16 px").toContain('width: 16, height: 16, borderRadius: "50%"')
  })

  it("le produit ne garde pas trois nombres pour une seule intention", () => {
    // Les trois endroits qui l'écrivaient en prose la disent toujours — ce lot
    // ne les réécrit pas — mais le seuil qui FAIT foi vit désormais ici.
    expect(lire("lib/cibleTactile.ts")).toContain("export const CIBLE_MIN = 24")
    expect(lire("components/barreMobileCalme.test.ts"), "la garde d'origine tient toujours sa surface")
      .toContain("au moins 44 px")
  })

  it("le balayage voit bien les commandes — sinon il ne prouve rien", () => {
    let commandes = 0
    for (const f of fichiers()) commandes += balises(fs.readFileSync(f, "utf8")).length
    expect(commandes, "des boutons et des liens dans le produit").toBeGreaterThan(400)
    const { toutes } = ciblesTropPetites()
    expect(toutes.length, "et des cibles sous 24 px, que l'exception innocente").toBeGreaterThan(8)

    // Le détecteur sait dire oui — sinon il ne dirait jamais non.
    const nu = '<button onClick={f} style={{ width: 7, height: 7, borderRadius: 4 }} />'
    const t = [...nu.matchAll(/\b(?:width|height):\s*(\d+)\b/g)].map(x => Number(x[1]))
    expect(Math.min(...t)).toBe(7)
    expect(cibleSuffisante({ largeur: 7, hauteur: 7 }, 6)).toBe(false)
    // …et il lit bien l'écart du conteneur qui précède.
    const avec = 'const x = <div style={{ display: "flex", gap: 6 }}>\n<button style={{ width: 7 }} />'
    expect(ecartDuConteneur(avec, avec.indexOf("<button"))).toBe(6)
    expect(ecartDuConteneur("<button style={{ width: 7 }} />", 0), "rien avant : isolée").toBeNull()
  })
})
