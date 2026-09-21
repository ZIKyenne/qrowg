// Un titre de section est un titre — garde de classe.
//
// Relevé du 21 septembre, sur la PAGE PUBLIÉE cette fois — celle que voit le
// client qui scanne, pas l'éditeur. Sur cent quarante-huit blocs publics, le
// document entier contenait **deux `<h1>` et deux `<h2>`**. Tout le reste des
// titres de section était un paragraphe en gras :
//
//     <p style={{ fontSize: 21, fontWeight: 700 }}>{title}</p>
//
// Cela se voit pareil. Cela ne se LIT pas pareil :
//
//   · au lecteur d'écran, une page QRowg n'avait aucun plan. La façon normale
//     de parcourir une page — sauter de titre en titre — ne donnait rien, et il
//     fallait tout écouter dans l'ordre pour trouver « Nos tarifs ».
//   · aux moteurs, la page d'un commerçant n'avait pas de structure : un seul
//     niveau, du texte gras, et rien qui dise de quoi parle chaque section.
//
// **Et le produit savait déjà.** Trois endroits le faisaient, dont un qui écrit
// sa raison en tête de fichier :
//
//     profile/index.tsx   « Il porte aussi le <h1> de la page publiee quand il
//                           a un nom. »
//     heading             <h2>
//     hero_banner         <h2>
//
// Trois endroits sur trente-huit. Les trente-cinq autres sont réparés :
// dix-sept d'un coup par `SurfaceHeading`, la primitive partagée, et dix-huit
// un par un.
//
// ── La frontière, et sa raison ───────────────────────────────────────────────
//
// **Un titre d'ÉLÉMENT reste un paragraphe.** Le nom d'un produit dans une
// grille, celui d'un artiste dans une programmation, le titre d'une étape dans
// une liste : ce sont des éléments d'une liste, pas des sections de la page.
// Les promouvoir en titres donnerait un plan de trente entrées pour un bloc —
// un plan illisible est pire que pas de plan. Douze endroits sont dans ce cas,
// tous à l'intérieur d'un `.map(`, et ils ne bougent pas.
//
// Le dessin, lui, ne change nulle part : taille, graisse et marge étaient déjà
// posées en ligne aux trente-cinq endroits. Un `<h2>` sans style hérité rend
// exactement ce que rendait le `<p>`.

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"

const RACINE = __dirname
const REG = fs.readFileSync(path.join(RACINE, "publicRegistry.tsx"), "utf8")

function adaptersPublics(): Record<string, [string, string]> {
  const parNom: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/const (Public\w+) = dynamic\(\(\) => import\("\.\/blocks\/([^"]+)"\)\.then\(m => m\.(\w+)\)\)/g))
    parNom[m[1]] = [m[2], m[3]]
  const out: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/^\s{2}([a-z0-9_]+): (Public\w+),/gm)) if (parNom[m[2]]) out[m[1]] = parNom[m[2]]
  return out
}

function fichiers(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(RACINE)
  return out
}

/**
 * Un titre rendu en paragraphe. DEUX façons de l'écrire, et mon balayage du lot
 * v155 n'en voyait qu'une.
 *
 *   gras        `<p … fontWeight: 700 …>{title}</p>`          trente endroits
 *   sur-titre   `<p … textTransform: "uppercase" …>{title}`   vingt-huit de plus
 *
 * Le sur-titre — onze pixels, majuscules, interlettrage — est le traitement
 * habituel des titres de section de ce produit. Il n'est pas gras, et le lot
 * v155 l'a donc laissé passer : vingt-huit titres de section sur la page
 * publiée sont restés des paragraphes. C'est le lot v157 qui les a trouvés, en
 * regardant un rendu.
 */
const TITRE_EN_PARAGRAPHE = /<p[^>]{0,400}?(?:fontWeight:\s*(?:700|800|"bold")|textTransform: "uppercase")[^>]{0,400}?>\{([^}]*)\}/g

/** Est-on à l'intérieur d'un `.map(` encore ouvert ? Alors c'est un ÉLÉMENT. */
function dansUneListe(avant: string): boolean {
  const i = avant.lastIndexOf(".map(")
  if (i < 0) return false
  const suite = avant.slice(i)
  return suite.split("(").length - suite.split(")").length > 0
}

const theme = { fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
// `titrePrincipal` est ce que la page publiée accorde à UN bloc, celui qui
// portera le `<h1>` (`PublicPageClient` : `titrePrincipal: h1Owner === block.id`).
// La sonde le donne, sinon `profile` retomberait sur un paragraphe et la garde
// accuserait le produit d'un défaut qui est le sien.
const ctx = { theme, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {}, titrePrincipal: true }
const TITRE = "TitreDEssaiUnique"

describe("garde de classe : un titre de section n'est pas un paragraphe en gras", () => {
  it("aucun adapter public ne rend son titre de bloc en <p>", () => {
    const fautifs: string[] = []
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      if (!/export function Public\w+|PublicAdapterProps/.test(src)) continue
      const rel = path.relative(RACINE, f).split(path.sep).join("/")
      for (const m of src.matchAll(TITRE_EN_PARAGRAPHE)) {
        if (!/\b(titre|title)\b/.test(m[1])) continue
        if (dansUneListe(src.slice(0, m.index!))) continue   // un élément de liste, pas une section
        fautifs.push(`${rel}:${src.slice(0, m.index!).split("\n").length} → {${m[1].trim().slice(0, 34)}}`)
      }
    }
    expect(fautifs, "un titre de section se rend en <h2>").toEqual([])
  })

  it("la primitive partagée porte le niveau — dix-sept blocs d'un coup", () => {
    const src = fs.readFileSync(path.join(RACINE, "primitives", "LayoutSurface.tsx"), "utf8")
    expect(src, "SurfaceHeading rend un titre").toMatch(/\{title && <h2 style=/)
    expect(src, "et le sous-titre reste un paragraphe").toMatch(/\{subtitle && <p style=/)
    const combien = fichiers().filter(f => /SurfaceHeading/.test(fs.readFileSync(f, "utf8"))
      && /export function Public\w+|PublicAdapterProps/.test(fs.readFileSync(f, "utf8"))).length
    expect(combien, "des blocs publics qui y passent").toBeGreaterThanOrEqual(17)
  })

  it("le détecteur sait dire oui — sinon il ne dirait jamais non", () => {
    const voit = (l: string) => {
      const re = new RegExp(TITRE_EN_PARAGRAPHE.source)
      const m = re.exec(l)
      return !!m && /\b(titre|title)\b/.test(m[1])
    }
    expect(voit('<p style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>{c.title}</p>'), "la forme d'avant").toBe(true)
    expect(voit('<h2 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>{c.title}</h2>'), "la forme d'après").toBe(false)
    expect(voit('<p style={{ fontSize: 13, fontWeight: 400 }}>{c.description}</p>'), "un texte courant").toBe(false)
    // La seconde forme, celle que le lot v155 ne voyait pas.
    expect(voit('<p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>{title}</p>'), "le sur-titre").toBe(true)
    expect(voit('<h2 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>{title}</h2>')).toBe(false)
    // …et la frontière : un titre d'élément est repéré comme étant dans la liste.
    expect(dansUneListe("items.map((p, i) => (<div><p style={{ fontWeight: 700 }}>")).toBe(true)
    expect(dansUneListe("return (<div>")).toBe(false)
  })
})

describe("exécuté : le titre d'un bloc sort dans une balise de titre", () => {
  it("rendu pour de vrai, il n'est jamais dans un <p>", async () => {
    const fautifs: string[] = []
    let vus = 0
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      const mod = (await import(/* @vite-ignore */ `./blocks/${chemin}`)) as Record<string, ComponentType<never>>
      const C = mod[nom]
      if (!C) continue
      let html = ""
      try {
        html = renderToStaticMarkup(createElement(C as never, {
          content: { title: TITRE, text: "x", name: TITRE, url: "https://exemple.fr" }, ctx,
        } as never))
      } catch { continue }
      const i = html.indexOf(TITRE)
      if (i < 0) continue
      vus++
      const balise = html.lastIndexOf("<", i)
      const ouvrante = html.slice(balise, html.indexOf(">", balise) + 1)
      if (/^<p[\s>]/.test(ouvrante)) fautifs.push(`${type} → ${ouvrante.slice(0, 40)}`)
    }
    expect(vus, "des blocs qui affichent leur titre — sinon la garde ne prouve rien").toBeGreaterThan(25)
    expect(fautifs, "le titre doit sortir dans <h1>/<h2>").toEqual([])
  }, 60_000)

  it("un seul <h1> sur la page, et c'est le nom du commerçant", () => {
    // Et il n'est accordé qu'à un seul bloc, celui que la page désigne.
    const client = fs.readFileSync(path.join(RACINE, "..", "..", "..", "[slug]", "PublicPageClient.tsx"), "utf8")
    expect(client, "un seul bloc reçoit le titre principal").toContain("titrePrincipal: h1Owner === block.id")
    const profil = fs.readFileSync(path.join(RACINE, "blocks", "profile", "index.tsx"), "utf8")
    expect(profil, "le <h1> vit là, et le fichier le dit").toContain("<h1 style=")
    expect(profil).toContain("Il porte aussi le <h1> de la page publiee quand il a un nom.")
    const ailleurs = fichiers()
      .filter(f => !/blocks\/profile\//.test(f.split(path.sep).join("/")))
      .filter(f => /<h1[\s>]/.test(fs.readFileSync(f, "utf8")))
      .map(f => path.relative(RACINE, f).split(path.sep).join("/"))
    expect(ailleurs, "un second <h1> ferait deux pages en une").toEqual([])
  })
})

describe("la frontière : un titre d'élément reste un paragraphe", () => {
  it("elle est peuplée, et c'est ce qui la rend nécessaire", () => {
    let elements = 0
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      for (const m of src.matchAll(TITRE_EN_PARAGRAPHE)) {
        if (!/\b(titre|title)\b/.test(m[1])) continue
        if (dansUneListe(src.slice(0, m.index!))) elements++
      }
    }
    expect(elements, "des titres d'éléments dans des listes").toBeGreaterThan(8)
  })

  it("…et un bloc de liste ne promeut pas ses lignes", async () => {
    const mod = await import("./blocks/numbered_list")
    const html = renderToStaticMarkup(createElement(mod.PublicNumberedList as never, {
      content: { title: TITRE, i1_title: "Première étape", i1_text: "a", i2_title: "Deuxième", i2_text: "b" }, ctx,
    } as never))
    expect(html, "le titre du bloc, lui, porte son niveau").toContain(`<h2`)
    expect(html, "mais pas ses étapes").not.toContain("<h2>Première étape")
    expect(html).toContain("Première étape")
  })
})
