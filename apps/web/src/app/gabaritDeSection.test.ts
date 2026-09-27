// gabaritDeSection — lot v189.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Revue du 27 septembre, captures réelles des 54 pages. L'accueil répétait neuf
// fois la même ouverture de section :
//
//     ⊡ EYEBROW EN CAPITALES        ← une petite ligne or, espacée, centrée
//     Titre en blanc **et derniers mots en or**
//     Sous-titre centré, gris
//     ───────────── ⊡ ─────────────  ← un trait avec un ornement au centre
//
// Pris un par un, aucun de ces éléments n'est fautif. **C'est la répétition qui
// fait gabarit** : neuf fois la même ouverture, à intervalle régulier, et la
// page se lit comme un formulaire rempli plutôt que comme une page écrite.
//
// Relevé : 235 eyebrows sur le site, 18 titres bicolores, 6 séparateurs
// ornementaux sur la seule page d'accueil.
//
// ── Ce que le lot a fait ───────────────────────────────────────────────────
//
// • Les six séparateurs sont retirés. L'espace sépare déjà deux sections ; un
//   trait ornementé répété six fois n'ajoute qu'un rythme mécanique.
// • Les sept eyebrows de l'accueil sont retirés. « ⊡ MODÈLES » au-dessus de
//   « Des modèles prêts pour votre métier » ne dit rien de plus que le titre.
// • **Un seul titre bicolore reste : celui du héros.** C'était le problème de
//   fond — un accent employé neuf fois n'accentue plus rien. Réservé à une
//   seule phrase, il redevient un accent.
//
// ── Ce que cette garde tient ───────────────────────────────────────────────
//
// Elle ne compte pas des éléments : elle tient la RARETÉ de l'accent. Un
// plafond, comme le cliquet des boutons (lot v182) et celui des champs (v185) —
// il ne peut que descendre.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const ICI = path.resolve(__dirname)
const lire = (...p: string[]) => fs.readFileSync(path.join(ICI, ...p), "utf8")

/** Les sections rendues sur l'accueil. `homeSectionsRetirees` ne l'est pas. */
const SECTIONS = ["Features.tsx", "Templates.tsx", "QRStudioLive.tsx", "Analytics.tsx", "UseCases.tsx", "Pricing.tsx", "Faq.tsx"]

const sources = () => [lire("HomeClient.tsx"), ...SECTIONS.map(f => lire("homeSections", f))]

/** Les blocs `<h1>…</h1>` / `<h2>…</h2>`, sans borne de longueur. */
export function blocsDeTitre(src: string): string[] {
  const out: string[] = []
  const re = /<(h[12])[\s>]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    const fin = src.indexOf(`</${m[1]}>`, m.index)
    if (fin === -1) continue
    out.push(src.slice(m.index, fin + 5))
  }
  return out
}

/**
 * Un titre dont une partie porte la couleur d'accent.
 *
 * On cherche un `<span>` coloré en or DANS un `<h1>` ou un `<h2>`, pas un span
 * coloré n'importe où : une étiquette de carte a le droit d'être dorée.
 */
export function titresBicolores() {
  const out: { fichier: string; extrait: string }[] = []
  const noms = ["HomeClient.tsx", ...SECTIONS.map(f => `homeSections/${f}`)]
  sources().forEach((src, i) => {
    // Lire jusqu'à la balise fermante, jamais sur un nombre de caractères.
    // Premier essai : `{0,400}`. La balise `<h1>` du héros porte un style de
    // plus de 400 caractères, donc le `<span>` doré qui la suit tombait hors
    // de la fenêtre : la garde annonçait ZÉRO titre accentué alors qu'il y en
    // avait un. C'est le quatrième aveuglement de ce genre dans la série
    // (v182, v185, v187) — une borne de lecture ne prouve rien.
    for (const m of blocsDeTitre(src)) {
      const bloc = m
      if (!/<span[^>]*color:\s*["']?(#C9A84C|var\(--accent\)|#D4AF45)/.test(bloc)) continue
      out.push({ fichier: noms[i], extrait: bloc.replace(/\s+/g, " ").slice(0, 80) })
    }
  })
  return out
}

/** L'ouverture répétée : la petite capitale or au-dessus d'un titre. */
export function eyebrowsDeSection() {
  const out: string[] = []
  const noms = ["HomeClient.tsx", ...SECTIONS.map(f => `homeSections/${f}`)]
  sources().forEach((src, i) => {
    for (const _ of src.matchAll(/<Eyebrow>/g)) out.push(`${noms[i]} → <Eyebrow>`)
    // La version écrite à la main : petite capitale espacée, or, centrée.
    for (const m of src.matchAll(/letterSpacing:\s*3\.5[\s\S]{0,120}?textTransform:\s*"uppercase"/g)) {
      out.push(`${noms[i]} → ${m[0].replace(/\s+/g, " ").slice(0, 50)}`)
    }
  })
  return out
}

describe("l'accueil n'ouvre pas neuf fois de la même façon", () => {
  it("le relevé lit bien les sections (sinon il est aveugle)", () => {
    const s = sources()
    expect(s.length).toBe(8)
    for (const src of s) expect(src.length).toBeGreaterThan(400)
    // Et il sait reconnaître un titre : il doit en trouver dans chaque section.
    const titres = s.filter(src => /<h[12]/.test(src)).length
    expect(titres, "plus aucun titre trouvé — l'extraction ne lit plus le JSX").toBeGreaterThanOrEqual(7)
  })

  it("un seul titre porte l'accent, et c'est le héros", () => {
    const t = titresBicolores()
    expect(
      t.map(x => `${x.fichier} : ${x.extrait}`),
      "l'accent doit rester rare : employé neuf fois, il n'accentue plus rien",
    ).toHaveLength(1)
    expect(t[0].fichier, "le titre accentué n'est plus celui du héros").toBe("HomeClient.tsx")
  })

  it("aucune section ne s'ouvre par une petite capitale dorée", () => {
    expect(
      eyebrowsDeSection(),
      "une section retrouve son eyebrow : c'est l'ouverture répétée qui fait gabarit",
    ).toEqual([])
  })

  it("aucun séparateur ornemental entre les sections", () => {
    expect(lire("HomeClient.tsx")).not.toContain("SectionSeam")
  })

  // ── Contre-épreuves ─────────────────────────────────────────────────────

  it("un deuxième titre accentué serait vu", () => {
    // L'extraction doit savoir repérer la forme, pas seulement compter zéro.
    const faux = '<h2 style={{ fontSize: 40 }}>Un titre <span style={{ color: "#C9A84C" }}>accentué</span></h2>'
    expect(blocsDeTitre(faux)).toHaveLength(1)
    expect(/<span[^>]*color:\s*["']?(#C9A84C|var\(--accent\)|#D4AF45)/.test(faux)).toBe(true)
  })

  it("une étiquette dorée hors d'un titre reste permise", () => {
    // Le pendant : une carte a le droit de porter une étiquette or. Sans ça, la
    // garde interdirait la charte du produit.
    const carte = '<div><span style={{ color: "var(--accent)" }}>MODÈLES</span><p>texte</p></div>'
    expect(blocsDeTitre(carte)).toEqual([])
  })
})
