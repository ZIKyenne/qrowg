// Une description se lit : deux lignes, et jamais sous le plancher — garde de classe.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F10, premier volet) :
// « plusieurs descriptions finissent par des points de suspension : Rangée
// d'icônes, Encadré d'emphase, Séparateur de forme, Logos défilants. »
//
// DEUX VOLETS, UNE SEULE CLASSE — la description est le texte qui fait choisir,
// et elle ne se lit ni coupée ni trop petite.
//
// ── Volet A : la coupe ───────────────────────────────────────────────────────
// Cent quatre-vingt-deux descriptions de blocs, médiane 32 caractères, la plus
// longue 64. Le catalogue les coupait à UNE ligne, à six endroits :
//
//     whiteSpace: "nowrap", textOverflow: "ellipsis"
//
// **Le produit savait déjà faire autrement.** `BlockLibraryCard` — la carte
// refondue, même produit, même écran — leur donnait DEUX lignes. Deux lignes
// tiennent la plus longue des cent quatre-vingt-deux ; une ligne n'en tient pas
// la moitié. Le nom d'un bloc fait quatorze caractères en médiane (« Encadré »,
// « Rangée d'icônes ») : il ne suffit pas à choisir, et la description est ce
// qui reste.
//
// ── Volet B : le plancher ────────────────────────────────────────────────────
// En mesurant le volet A, une garde plus ancienne a cassé — et c'est elle qui a
// montré le second défaut. Le produit a DEUX planchers écrits, avec leur raison
// (`app/[slug]/lisibilite.test.ts`, relevé du 4 septembre) :
//
//     13 px   une description sur la page publiée
//     12 px   une description dans l'éditeur ou sur le site
//
// Le relevé de septembre nommait même le cas : « éditeur 10,5 px (descriptions
// de blocs) ». Mais **un plancher vérifié sur huit cas nommés n'est pas un
// plancher.** La garde de septembre est une LISTE : huit fichiers, huit
// marqueurs écrits à la main. Tout ce qui n'y figurait pas est passé dessous.
//
//   16 endroits   dans les écrans (tableau de bord, studio QR, profil,
//                 redirections, exports, panneaux de l'éditeur) : 11 à 11,5 px.
//   1 endroit     `BlockLibraryCard` à 10,5 px sur PC — le cas exact que la
//                 note du plancher nommait, dans le fichier qu'elle ne lisait
//                 pas.
//   2 endroits    sur la PAGE PUBLIÉE, sous les 13 px :
//                 `renduLegacy:1750` (« Demander un devis », 11 px) et
//                 `SharedLeadFormView:56` (12 px).
//
// Et les deux derniers étaient invisibles pour deux raisons distinctes, toutes
// deux corrigées dans `lisibilite.test.ts` au même lot :
//
//   · la garde lisait le PREMIER `fontSize` de la ligne, pas celui de la
//     description — une ligne qui pose d'abord un titre à 13 px masquait le 11
//     de la description qui suit ;
//   · elle ne balayait que les fichiers NOMMÉS `Public*.tsx` sous `blocks/` :
//     `forms/` et `views/` n'étaient jamais lus.
//
// La classe : **une description se lit.** Ce fichier ne vérifie plus une liste,
// il balaie tout l'arbre et confronte chaque description à son plancher.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { BLOCK_DEFS } from "./blockDefs"
import {
  DESCRIPTION_MAX, LIGNES_DE_DESCRIPTION, PLANCHER_DE_LECTURE, PLANCHER_PAGE_PUBLIEE,
  descriptionTropLongue, styleDeDescription,
} from "./descriptionQuiTient"

const SRC = path.join(__dirname, "../../..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

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

/**
 * Les MINIATURES. Elles ne montrent pas du texte à lire : elles dessinent un
 * modèle réduit de la page publiée dans un cadre de quelques centaines de
 * pixels, pour qu'on RECONNAISSE un bloc. Leur en-tête le dit :
 *
 *   TemplatePreviewModal   « Preview d'un template dans une simulation iPhone »
 *   Editor<Bloc>.tsx       « Adapter ÉDITEUR de X. Reproduit builderPreview »
 *
 * Les agrandir au plancher de lecture ferait déborder la maquette : le texte
 * deviendrait lisible et le modèle, faux. Ce qui se lit vraiment, c'est la page
 * publiée — et elle, elle a son plancher à 13 px, vérifié plus bas.
 */
const MINIATURES = [
  { motif: /^app\/dashboard\/builder\/builderPreview\.tsx$/, pourquoi: "le modèle réduit de la page, dans l'éditeur" },
  { motif: /^app\/dashboard\/templates\/TemplatePreviewModal\.tsx$/, pourquoi: "« une simulation iPhone » — son en-tête le dit" },
  { motif: /^app\/dashboard\/builder\/shared-renderer\/blocks\/[^/]+\/Editor[A-Za-z]+\.tsx$/, pourquoi: "les adaptateurs ÉDITEUR, qui reproduisent builderPreview" },
]

/** La page publiée : plancher 13 px. Les adaptateurs `Editor*` n'en sont pas. */
const PUBLIEE = /^app\/\[slug\]\/renduLegacy\.tsx$|^app\/dashboard\/builder\/shared-renderer\//

/** Une description rendue : `>{x.description}<`, `>{desc}<`, `{hlText(def.description`. */
const LIAISON = />\{[a-zA-Z_]*\.?(?:desc|description|role)\}<|hlText\([a-zA-Z_]*\.description/

/**
 * La taille effective juste avant la liaison. Trois écritures existent dans le
 * produit — le littéral, les helpers d'échelle (`fs(14)`, `sz(u, 13.5)`) et
 * l'appel à `styleDeDescription`. Un ternaire compte par sa plus PETITE
 * branche : c'est elle qu'un lecteur subira.
 */
export function tailleAvant(ligne: string): number | null {
  const fin = ligne.search(LIAISON)
  if (fin < 0) return null
  const avant = ligne.slice(0, fin)
  const trouves: { i: number; px: number }[] = []
  for (const m of avant.matchAll(/fontSize\s*:\s*/g)) {
    // Jusqu'à la virgule ou l'accolade qui ferme la PROPRIÉTÉ : `sz(u, 13.5)`
    // en contient une, et s'arrêter dessus perdrait la taille.
    let i = m.index! + m[0].length, prof = 0
    while (i < avant.length) {
      const c = avant[i]
      if (c === "(" || c === "{" || c === "[") prof++
      else if (c === ")" || c === "]") prof--
      else if (c === "}") { if (prof === 0) break; prof-- }
      else if (c === "," && prof === 0) break
      i++
    }
    const nombres = [...avant.slice(m.index! + m[0].length, i).matchAll(/(\d+(?:\.\d+)?)/g)].map(x => parseFloat(x[1]))
    if (nombres.length) trouves.push({ i: m.index!, px: Math.min(...nombres) })
  }
  for (const m of avant.matchAll(/styleDeDescription\(([^)]*)\)/g)) {
    const nombres = [...m[1].matchAll(/(\d+(?:\.\d+)?)/g)].map(x => parseFloat(x[1]))
    trouves.push({ i: m.index!, px: nombres.length ? Math.min(...nombres) : PLANCHER_DE_LECTURE })
  }
  if (!trouves.length) return null
  return trouves.sort((a, b) => a.i - b.i)[trouves.length - 1].px
}

type Desc = { fichier: string; ligne: number; px: number | null; plancher: number; miniature: string | null }

function toutesLesDescriptions(): Desc[] {
  const out: Desc[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    const mini = MINIATURES.find(m => m.motif.test(rel))
    const src = fs.readFileSync(f, "utf8")
    src.split("\n").forEach((l, i) => {
      if (!LIAISON.test(l)) return
      out.push({
        fichier: rel, ligne: i + 1, px: tailleAvant(l),
        plancher: !mini && PUBLIEE.test(rel) ? PLANCHER_PAGE_PUBLIEE : PLANCHER_DE_LECTURE,
        miniature: mini?.pourquoi ?? null,
      })
    })
  }
  return out
}

describe("ce que vaut une taille écrite dans le produit", () => {
  it("le littéral, l'échelle, et l'appel au style partagé", () => {
    expect(tailleAvant('<p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.description}</p>')).toBe(11)
    expect(tailleAvant('<p style={{ fontSize: sz(u, 13.5), margin: 0 }}>{p.description}</p>')).toBe(13.5)
    expect(tailleAvant('<p style={{ fontSize: fs(14) }}>{it.desc}</p>')).toBe(14)
    expect(tailleAvant('<span style={{ ...styleDeDescription(), color: MUTED }}>{item.description}</span>')).toBe(12)
  })

  it("la taille lue est celle de la DESCRIPTION, pas celle du titre qui la précède", () => {
    // Le défaut exact de `renduLegacy:1750`, invisible pendant des semaines.
    const l = '<p style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</p>{c.description && <p style={{ fontSize: 11 }}>{c.description}</p>}'
    expect(tailleAvant(l)).toBe(11)
  })

  it("un ternaire compte par sa plus petite branche", () => {
    expect(tailleAvant('<span style={{ ...styleDeDescription(mobile ? 12 : 10.5) }}>{item.description}</span>')).toBe(10.5)
    expect(tailleAvant('<p style={{ fontSize: mobile ? 14 : 11.5 }}>{s.desc}</p>')).toBe(11.5)
  })

  it("…et une ligne sans description ne rend rien", () => {
    expect(tailleAvant('<p style={{ fontSize: 9 }}>{c.title}</p>')).toBeNull()
  })
})

describe("garde de classe A : une description du catalogue tient sur deux lignes", () => {
  it("le catalogue ne coupe plus aucune description à une ligne", () => {
    const v4 = lire("app/dashboard/builder/BuilderV4.tsx")
    expect(v4, "la coupe à une ligne du relevé").not.toMatch(/whiteSpace: "nowrap"[^\n]*\{(?:hlText\()?def\.description/)
    expect((v4.match(/styleDeDescription\(\)/g) ?? []).length, "les six emplacements du catalogue").toBe(6)
  })

  it("les deux bibliothèques passent par le même geste", () => {
    for (const f of ["app/dashboard/builder/BuilderV4.tsx", "app/dashboard/builder/BlockLibraryCard.tsx"])
      expect(lire(f), f).toContain('from "./descriptionQuiTient"')
    expect(styleDeDescription().WebkitLineClamp).toBe(LIGNES_DE_DESCRIPTION)
    expect(LIGNES_DE_DESCRIPTION, "deux lignes : ce que BlockLibraryCard donnait déjà").toBe(2)
  })

  it("le cliquet : aucune description de bloc ne dépasse ce que deux lignes tiennent", () => {
    const trop = Object.entries(BLOCK_DEFS as Record<string, { description?: string }>)
      .filter(([, d]) => descriptionTropLongue(d.description))
      .map(([t, d]) => `${t} — ${d.description!.trim().length} caractères`)
    expect(trop, `plafond ${DESCRIPTION_MAX}`).toEqual([])
  })

  it("…et ce cliquet serre vraiment : la plus longue n'est pas loin du plafond", () => {
    const longueurs = Object.values(BLOCK_DEFS as Record<string, { description?: string }>)
      .map(d => (d.description ?? "").trim().length)
    expect(longueurs.length, "des blocs au catalogue").toBeGreaterThan(150)
    expect(Math.max(...longueurs), "la plus longue mesurée au relevé : 64").toBeGreaterThan(55)
    expect(Math.max(...longueurs)).toBeLessThanOrEqual(DESCRIPTION_MAX)
  })
})

describe("garde de classe B : aucune description sous son plancher", () => {
  it("dans les écrans et sur le site — 12 px", () => {
    const fautifs = toutesLesDescriptions()
      .filter(d => !d.miniature && d.plancher === PLANCHER_DE_LECTURE)
      .filter(d => d.px !== null && d.px < PLANCHER_DE_LECTURE)
      .map(d => `${d.fichier}:${d.ligne} → ${d.px} px`)
    expect(fautifs, "plancher de lecture du 4 septembre").toEqual([])
  })

  it("sur la page publiée — 13 px", () => {
    const fautifs = toutesLesDescriptions()
      .filter(d => !d.miniature && d.plancher === PLANCHER_PAGE_PUBLIEE)
      .filter(d => d.px !== null && d.px < PLANCHER_PAGE_PUBLIEE)
      .map(d => `${d.fichier}:${d.ligne} → ${d.px} px`)
    expect(fautifs, "le texte qu'on lit à table").toEqual([])
  })

  it("les deux endroits que l'ancienne garde ne voyait pas sont réparés", () => {
    // Réancré au lot v169 : ce test épinglait deux NUMÉROS DE LIGNE. Le lot a
    // ajouté dix-sept lignes en tête de `renduLegacy`, et la garde s'est mise à
    // mesurer une ligne qui n'avait rien à voir. Un numéro de ligne n'est pas
    // une intention : on retrouve les deux endroits par ce qu'ils DISENT.
    const ligneQuiDit = (fichier: string, marqueur: string) => {
      const l = lire(fichier).split("\n").filter(x => x.includes(marqueur))
      expect(l.length, `${fichier} : « ${marqueur} » se trouve une fois`).toBe(1)
      return l[0]
    }
    expect(tailleAvant(ligneQuiDit("app/[slug]/renduLegacy.tsx", '{c.label || "Demander un devis"}')),
      "« Demander un devis » — un titre à 13 px masquait sa description à 11").toBeGreaterThanOrEqual(PLANCHER_PAGE_PUBLIEE)
    expect(tailleAvant(ligneQuiDit("app/dashboard/builder/shared-renderer/forms/SharedLeadFormView.tsx", "{model.description}")),
      "dans forms/, que le balayage par nom de fichier ne lisait pas").toBeGreaterThanOrEqual(PLANCHER_PAGE_PUBLIEE)
  })

  it("l'ancienne garde lit maintenant la bonne taille, et le dit", () => {
    const g = lire("app/[slug]/lisibilite.test.ts")
    expect(g, "réancrée au lot v147").toContain("Réancré au lot v147")
    expect(g, "la taille la plus proche AVANT la liaison").toContain("const avant = [...l.slice(0, fin).matchAll(tailles)].map(m => parseFloat(m[1]))")
    expect(g, "et elle ne lit plus le premier fontSize venu").not.toContain("const m = l.match(petit)")
  })
})

describe("les miniatures sont nommées, et ce sont bien des miniatures", () => {
  it("trois motifs, chacun avec sa raison écrite", () => {
    expect(MINIATURES).toHaveLength(3)
    for (const m of MINIATURES) expect(m.pourquoi.length, String(m.motif)).toBeGreaterThan(20)
  })

  it("…et leur en-tête dit qu'elles reproduisent la page, pas qu'elles la remplacent", () => {
    expect(lire("app/dashboard/templates/TemplatePreviewModal.tsx").split("\n")[0])
      .toContain("simulation iPhone")
    expect(lire("app/dashboard/builder/shared-renderer/blocks/pricing/EditorPricing.tsx"))
      .toContain("Reproduit builderPreview")
  })

  it("le balayage voit bien les descriptions — sinon il ne prouve rien", () => {
    const toutes = toutesLesDescriptions()
    expect(toutes.length, "des descriptions rendues dans le produit").toBeGreaterThan(150)
    const mini = toutes.filter(d => d.miniature)
    expect(mini.length, "dont une bonne part dans les miniatures").toBeGreaterThan(50)
    expect(toutes.length - mini.length, "et le reste, qui doit tenir le plancher").toBeGreaterThan(80)
    // Le détecteur sait dire oui : les miniatures, elles, sont bien sous le plancher.
    expect(mini.filter(d => d.px !== null && d.px < PLANCHER_DE_LECTURE).length,
      "sinon l'exception ne protégerait rien").toBeGreaterThan(30)
  })
})
