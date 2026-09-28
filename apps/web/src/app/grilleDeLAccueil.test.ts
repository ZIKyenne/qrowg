// grilleDeLAccueil — lot v196.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Mesure au navigateur sur l'accueil, avant ce lot :
//
//   • **six largeurs de page** — 1180 · 1140 · 1000 · 960 · 820 · 720 ;
//   • **huit mesures de lecture** — 800 · 540 · 520 · 480 · 460 · 452 · 440 · 400 ;
//   • **six rythmes verticaux** — 72 · 64 · 56 · 48, plus deux valeurs de bas
//     de section différentes du haut ;
//   • **trois gouttières** sur téléphone — 18 · 20 · 24 px, posées par quatre
//     règles @media qui réécrivaient chacune le rembourrage d'une section.
//
// Chacune de ces valeurs avait été écrite à la main, section par section. Rien
// ne s'alignait d'une section à l'autre, et c'est l'un des traits qui font dire
// « assemblé bloc par bloc ».
//
// ── Ce que le lot a fait ───────────────────────────────────────────────────
//
// Six jetons, six rôles. Une largeur qui n'entre dans aucun de ces rôles n'a
// pas de raison d'exister :
//
//   --largeur-page      le conteneur d'une section
//   --largeur-etroite   un bloc d'une seule colonne (FAQ, carte d'appel)
//   --mesure-titre      un titre
//   --mesure-texte      un paragraphe
//   --rythme-section    le rembourrage vertical d'une section
//   --gouttiere         le rembourrage horizontal, en clamp — plus aucune @media
//
// ── Ce que cette garde tient ───────────────────────────────────────────────
//
// Elle ne compte pas des pixels : elle tient la RÈGLE — l'accueil ne décide
// plus d'une largeur ni d'un rythme dans un composant. C'est la même famille
// que --texte-discret (v187), --cible-pouce (v186) et --police-titre (v195).

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const SRC = path.resolve(__dirname, "..")
const CSS = fs.readFileSync(path.join(SRC, "app/globals.css"), "utf8")

/**
 * Le périmètre : l'accueil et ses sections.
 *
 * `homeSectionsRetirees.tsx` en sort : ce sont des sections conservées comme
 * archive et rendues nulle part — la même exception que la garde
 * `pasDEmojiDecoratif` (v188). Une garde qui crie sur ce que personne ne voit
 * finit par être éteinte, c'est la leçon du lot v190.
 */
export const FICHIERS = [
  "app/HomeClient.tsx",
  "app/homeSections/Analytics.tsx",
  "app/homeSections/Faq.tsx",
  "app/homeSections/Features.tsx",
  "app/homeSections/Pricing.tsx",
  "app/homeSections/QRStudioLive.tsx",
  "app/homeSections/Templates.tsx",
  "app/homeSections/UseCases.tsx",
]

const lire = (f: string) => fs.readFileSync(path.join(SRC, f), "utf8")

/** Les jetons que ce lot pose, avec ce qu'ils doivent valoir au moins. */
export const JETONS = [
  "--largeur-page", "--largeur-etroite", "--mesure-titre",
  "--mesure-texte", "--rythme-section", "--gouttiere",
]

/**
 * Les largeurs de CONTENU écrites en dur.
 *
 * Une largeur de contenu se reconnaît à sa taille : au-delà de 300 px, ce n'est
 * plus un élément graphique (une barre de graphique, une vignette, une pastille)
 * mais une colonne de mise en page. Le seuil est écrit ici parce qu'il est la
 * seule chose qui sépare les deux, et il est vérifié par une contre-épreuve.
 */
const SEUIL_CONTENU = 300

/** Les emplois légitimes d'une largeur écrite en clair, nommés et motivés. */
const EMPLOIS: Record<string, string> = {
  "app/HomeClient.tsx:520":
    "la boîte de décoration du héros : 520 px est la distance au-delà de laquelle les pastilles s'éloigneraient trop de la carte sur un très grand écran — ce n'est ni une page ni une mesure de lecture",
}

export function largeursEcrites() {
  const out: { fichier: string; ligne: number; valeur: number }[] = []
  for (const rel of FICHIERS) {
    lire(rel).split("\n").forEach((l, i) => {
      for (const m of l.matchAll(/maxWidth:\s*(\d+)\b/g)) {
        const v = +m[1]
        if (v < SEUIL_CONTENU) continue
        if (EMPLOIS[`${rel}:${v}`]) continue
        out.push({ fichier: rel, ligne: i + 1, valeur: v })
      }
    })
  }
  return out
}

/** Les rembourrages de section écrits en dur (le rythme vertical). */
export function rythmesEcrits() {
  const out: string[] = []
  for (const rel of FICHIERS) {
    lire(rel).split("\n").forEach((l, i) => {
      // `padding: "64px 48px"` et ses variantes, sur une <section>.
      for (const m of l.matchAll(/padding:\s*["'](\d+)px\s+(\d+)px/g)) {
        if (+m[1] >= 40 && +m[2] >= 16) out.push(`${rel}:${i + 1} → ${m[0]}`)
      }
      // Les @media qui réécrivaient la gouttière d'une section.
      for (const m of l.matchAll(/#[a-z-]+\s*\{\s*padding:\s*\d+px\s+\d+px\s*!important/g)) {
        out.push(`${rel}:${i + 1} → ${m[0]}`)
      }
    })
  }
  return out
}

describe("l'accueil tient sur une seule grille", () => {
  it("le relevé lit bien les sections (sinon il est aveugle)", () => {
    for (const f of FICHIERS) {
      expect(fs.existsSync(path.join(SRC, f)), `${f} a disparu du périmètre`).toBe(true)
      expect(lire(f).length, `${f} est vide`).toBeGreaterThan(1000)
    }
    // Et il doit voir les jetons à l'œuvre, sinon il ne vérifie rien.
    const emplois = FICHIERS.reduce((n, f) => n + [...lire(f).matchAll(/var\(--(largeur|mesure|rythme|gouttiere)/g)].length, 0)
    expect(emplois, "plus aucune section ne lit les jetons de grille").toBeGreaterThan(25)
  })

  it("chaque jeton de grille est déclaré, une seule fois", () => {
    for (const j of JETONS) {
      const n = [...CSS.matchAll(new RegExp(`${j}\\s*:`, "g"))].length
      expect(n, `${j} est déclaré ${n} fois ; une valeur écrite deux fois finit par diverger`).toBe(1)
    }
  })

  it("aucune section n'écrit sa propre largeur de contenu", () => {
    expect(
      largeursEcrites().map(x => `${x.fichier}:${x.ligne} → maxWidth: ${x.valeur}`),
      "une largeur de contenu écrite à la main ; employez --largeur-page, --largeur-etroite, --mesure-titre ou --mesure-texte",
    ).toEqual([])
  })

  it("aucune section n'écrit son propre rythme", () => {
    expect(
      rythmesEcrits(),
      "un rembourrage de section écrit à la main ; employez var(--rythme-section) var(--gouttiere)",
    ).toEqual([])
  })

  it("la gouttière ne dépend d'aucune règle @media", () => {
    // C'est ce qui produisait 18, 20 et 24 px sur le même téléphone : quatre
    // @media qui rabattaient chacune la gouttière d'une section à sa façon.
    const v = CSS.match(/--gouttiere\s*:\s*([^;]+);/)?.[1] ?? ""
    expect(v, "la gouttière doit être un clamp, pas une valeur fixe rattrapée par des @media").toContain("clamp(")
  })

  it("aucun emploi écrit n'est devenu faux", () => {
    // Un registre qui ne se vide jamais finit par tout autoriser.
    const morts = Object.keys(EMPLOIS).filter(k => {
      const [f, v] = k.split(":")
      return !new RegExp(`maxWidth:\\s*${v}\\b`).test(lire(f))
    })
    expect(morts, "emploi sans largeur correspondante — retirez-le du registre").toEqual([])
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  it("une largeur de contenu réintroduite serait vue", () => {
    const faux = 'style={{ maxWidth: 960, margin: "0 auto" }}'
    expect([...faux.matchAll(/maxWidth:\s*(\d+)\b/g)].map(m => +m[1]).filter(v => v >= SEUIL_CONTENU)).toEqual([960])
  })

  it("une taille d'élément graphique n'est PAS prise pour une largeur de contenu", () => {
    // Le pendant : une barre de graphique de 14 px et une vignette de 220 px
    // n'ont rien à voir avec la grille. Sans cette borne, la garde crierait sur
    // du code sain — et serait éteinte, comme `exemplesReels` au lot v190.
    const sain = 'style={{ maxWidth: 14 }} … style={{ maxWidth: 220 }}'
    expect([...sain.matchAll(/maxWidth:\s*(\d+)\b/g)].map(m => +m[1]).filter(v => v >= SEUIL_CONTENU)).toEqual([])
  })

  it("un rythme réintroduit serait vu", () => {
    const faux = 'style={{ padding: "56px 48px" }}'
    expect([...faux.matchAll(/padding:\s*["'](\d+)px\s+(\d+)px/g)].length).toBe(1)
  })
})
