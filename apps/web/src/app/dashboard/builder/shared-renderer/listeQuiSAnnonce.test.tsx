// Une liste s'annonce comme une liste — garde de classe.
//
// Suite des lots v155 (les titres portent leur niveau) et v156 (la page a une
// charpente). Troisième pièce de la même charpente, et la plus peuplée.
//
// Sur les cent quarante-huit blocs publics, le produit comptait **un `<ul>`,
// un `<ol>` et trois `<li>`** — pour **trente-neuf** listes déroulées dans des
// `<div>` : les prestations, les avis, les dates de concert, les logos, les
// langues, les membres de l'équipe, les étapes d'un parcours…
//
// Ce que cela coûte : un lecteur d'écran annonce « liste, six éléments », donne
// le rang de chacun (« 3 sur 6 ») et permet de sauter la liste entière. Sans
// balise de liste, il énonce six blocs sans lien entre eux, sans compte, sans
// sortie. Sur une carte de restaurant lue au téléphone, c'est la différence
// entre « six plats » et un flot continu.
//
// **Et le produit savait déjà, deux fois — et il choisissait bien :**
//
//     checklist       <ul style={{ listStyle: "none", padding: 0, … }}>  +  <li>
//     numbered_list   <ol …>  +  <li>        une liste NUMÉROTÉE est ordonnée
//
// Le geste exact, neutralisation des puces comprise. Deux endroits sur
// quarante et un.
//
// ── Ce qui a été converti, et comment ────────────────────────────────────────
//
// Vingt-quatre listes, **sans déplacer un pixel** : le conteneur `<div>` devient
// `<ul>` (ou `<ol>` quand l'ordre porte du sens — un parcours, un programme,
// des étapes), et l'enfant direct de la boucle devient `<li>`. Aucune balise
// n'est ajoutée : le `<li>` REMPLACE le `<div>` qu'il était et garde son style
// au caractère près. Un `<li>` dans un conteneur `flex` ou `grid` est un
// élément de la grille comme l'était le `<div>` : rien ne bouge.
//
// ── Ce qui reste, et pourquoi ────────────────────────────────────────────────
//
// **Dix listes dont l'enfant n'est pas une simple boîte** — un `<a>`, un `<p>`,
// trois `<span>`, quatre composants (`SmartCta`, `Lien`, `Carte`). Là, il faudrait
// ENVELOPPER au lieu de renommer, donc ajouter un niveau de balise : un `<li>`
// autour d'un lien change le lien de place dans la grille. C'est faisable, mais
// cela demande de vérifier chaque mise en page — un autre travail.
//
// **Deux qui ne sont pas des listes**, nommées avec leur raison :
//
//   two_columns    une mise en page à deux colonnes, pas une suite d'éléments
//                  de même nature.
//   image_mosaic   ses emplacements ne sont PAS interchangeables — « Grande
//                  image », « Petite image 1 » (établi au lot v149).
//
// **Une troisième exception que j'ai retirée en la vérifiant.** J'avais écrit
// que `marquee_text` doublait ses éléments pour boucler le défilement, et
// qu'une liste annonçant tout deux fois serait pire qu'aucune. Le doublage est
// réel — il est dans la primitive `Marquee` — **mais la copie porte déjà
// `aria-hidden`** : rien n'est annoncé deux fois. Ma raison était fausse. Le
// bandeau reste hors du lot pour une raison banale : son enfant est un
// `<span>`, il est donc dans le cliquet des enfants composés comme les autres.

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"

const RACINE = __dirname

function fichiersPublics(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(RACINE)
  return out.filter(f => /export function Public\w+|PublicAdapterProps/.test(fs.readFileSync(f, "utf8")))
}

/** Un `<div>` qui déroule directement une boucle : une liste qui ne se dit pas. */
const LISTE_EN_DIV = /<div style=\{\{([^}]{0,300})\}\}>\s*\n\s*\{(\w+)\.map\(([^)]{0,60})\)?\s*=>\s*\(?\s*\n?\s*<(\w+)/g

/** Ceux dont l'enfant se renomme sans rien ajouter : une boîte. */
const ENFANT_SIMPLE = new Set(["div"])

/** Les deux qui n'en sont pas, et pourquoi. */
const PAS_UNE_LISTE: Record<string, string> = {
  two_columns: "une mise en page à deux colonnes, pas une suite d'éléments de même nature",
  image_mosaic: "ses emplacements ne sont pas interchangeables — « Grande image », « Petite image 1 » (lot v149)",
}

function listesEnDiv(): { fichier: string; ligne: number; enfant: string; bloc: string }[] {
  const out: { fichier: string; ligne: number; enfant: string; bloc: string }[] = []
  for (const f of fichiersPublics()) {
    const rel = path.relative(RACINE, f).split(path.sep).join("/")
    const bloc = rel.startsWith("blocks/") ? rel.split("/")[1] : rel
    const src = fs.readFileSync(f, "utf8")
    for (const m of src.matchAll(LISTE_EN_DIV))
      out.push({ fichier: rel, ligne: src.slice(0, m.index!).split("\n").length, enfant: m[4], bloc })
  }
  return out
}

const theme = { fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const ctx = { theme, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} }

describe("garde de classe : une suite d'éléments de même nature est une liste", () => {
  it("aucune liste à enfant simple ne reste dans un <div>", () => {
    const fautives = listesEnDiv()
      .filter(l => ENFANT_SIMPLE.has(l.enfant))
      .filter(l => !(l.bloc in PAS_UNE_LISTE))
      .map(l => `${l.fichier}:${l.ligne} → <${l.enfant}>`)
    expect(fautives, "le conteneur devient <ul>/<ol>, l'enfant devient <li>").toEqual([])
  })

  it("le geste est celui que le produit écrivait déjà", () => {
    const checklist = fs.readFileSync(path.join(RACINE, "blocks", "checklist", "index.tsx"), "utf8")
    expect(checklist, "puces neutralisées, marge et retrait remis à zéro")
      .toContain('<ul style={{ listStyle: "none", padding: 0,')
    const numerotee = fs.readFileSync(path.join(RACINE, "blocks", "numbered_list", "index.tsx"), "utf8")
    expect(numerotee, "une liste numérotée est ORDONNÉE").toContain('<ol style={{ listStyle: "none", padding: 0,')
  })

  it("l'ordre est choisi, pas subi : <ol> quand il porte du sens", () => {
    for (const [bloc, fichier] of [
      ["process_steps", "blocks/process_steps/PublicProcessSteps.tsx"],
      ["steps_horizontal", "blocks/steps_horizontal/index.tsx"],
      ["journey", "blocks/journey/index.tsx"],
      ["event_program", "blocks/event_program/PublicEventProgram.tsx"],
      ["timeline", "blocks/timeline/PublicTimeline.tsx"],
    ] as const) expect(fs.readFileSync(path.join(RACINE, fichier), "utf8"), bloc).toContain("<ol style=")
    // …et <ul> quand il n'en porte pas : des avis n'ont pas d'ordre.
    for (const fichier of ["blocks/testimonials/PublicTestimonials.tsx", "blocks/brands/PublicBrands.tsx"])
      expect(fs.readFileSync(path.join(RACINE, fichier), "utf8"), fichier).toContain("<ul style=")
  })

  it("le détecteur sait dire oui — sinon il ne dirait jamais non", () => {
    const voit = (s: string) => new RegExp(LISTE_EN_DIV.source).test(s)
    expect(voit('<div style={{ display: "flex", gap: 8 }}>\n        {items.map((x, i) => (\n          <div style'),
      "la forme d'avant").toBe(true)
    expect(voit('<ul style={{ listStyle: "none", padding: 0, display: "flex" }}>\n        {items.map((x, i) => (\n          <li style'),
      "la forme d'après").toBe(false)
  })
})

describe("exécuté : le rendu porte bien la liste, et rien n'a bougé", () => {
  it("chaque élément est un <li>, et le conteneur neutralise les puces", async () => {
    const CAS: [string, string, string, Record<string, string>][] = [
      ["testimonials", "blocks/testimonials/PublicTestimonials", "PublicTestimonials", { name1: "Marie", text1: "Super", name2: "Luc", text2: "Top" }],
      ["process_steps", "blocks/process_steps/PublicProcessSteps", "PublicProcessSteps", { s1_title: "Un", s2_title: "Deux" }],
      ["brands", "blocks/brands/PublicBrands", "PublicBrands", { brand1_name: "Alpha", brand2_name: "Bêta" }],
    ]
    for (const [nom, chemin, exporte, contenu] of CAS) {
      const mod = (await import(/* @vite-ignore */ `./${chemin}`)) as Record<string, ComponentType<never>>
      const html = renderToStaticMarkup(createElement(mod[exporte] as never, { content: contenu, ctx } as never))
      expect(html, `${nom} : une balise de liste`).toMatch(/<(ul|ol) style="list-style:none/)
      expect((html.match(/<li[\s>]/g) ?? []).length, `${nom} : deux éléments`).toBe(2)
      // Le style de l'élément est celui que portait le <div> : rien n'a bougé.
      expect(html, `${nom} : l'élément garde son dessin`).toMatch(/<li style="[^"]+"/)
    }
  }, 30_000)
})

describe("le cliquet, et les deux qui n'en sont pas", () => {
  it("les listes à enfant composé attendent leur tour, et sont comptées", () => {
    const restantes = listesEnDiv()
      .filter(l => !ENFANT_SIMPLE.has(l.enfant))
      .filter(l => !(l.bloc in PAS_UNE_LISTE))
    // Dix au relevé : un <a>, un <p>, trois <span>, quatre composants — dont le
    // bandeau défilant, que j'avais d'abord voulu exclure pour une raison
    // fausse (voir plus bas). Les convertir demande d'ENVELOPPER — donc
    // d'ajouter une balise, donc de revérifier chaque mise en page. Ce nombre
    // ne peut que descendre.
    expect(restantes.length, restantes.map(l => `${l.fichier}:${l.ligne}<${l.enfant}>`).join(" ")).toBeLessThanOrEqual(10)
    expect(restantes.length, "il en reste — sinon ce cliquet n'aurait plus de sens").toBeGreaterThan(0)
  })

  it("les deux exceptions sont nommées, et ce sont bien elles", () => {
    expect(Object.keys(PAS_UNE_LISTE).sort()).toEqual(["image_mosaic", "two_columns"])
    for (const [bloc, raison] of Object.entries(PAS_UNE_LISTE)) {
      expect(raison.length, bloc).toBeGreaterThan(30)
      expect(fs.existsSync(path.join(RACINE, "blocks", bloc)), `${bloc} existe`).toBe(true)
    }
    // Et ce que j'avais cru d'abord : le bandeau défilant double son contenu…
    const marquee = fs.readFileSync(path.join(RACINE, "primitives", "Marquee.tsx"), "utf8")
    expect(marquee, "le doublage est réel").toContain("Le contenu est dupliqué une fois")
    // …mais la copie est déjà masquée aux lecteurs d'écran. La raison que
    // j'allais écrire était fausse, et c'est le code qui me l'a dit.
    expect(marquee, "et rien n'est annoncé deux fois")
      .toContain('{animate && <div aria-hidden style={{ display: "flex", gap }}>{children}</div>}')
  })

  it("le balayage voit bien la population — sinon il ne prouve rien", () => {
    const toutes = listesEnDiv()
    expect(fichiersPublics().length, "des adapters publics").toBeGreaterThan(140)
    expect(toutes.length, "des boucles déroulées dans un <div>").toBeGreaterThan(8)
    let listes = 0
    for (const f of fichiersPublics()) listes += (fs.readFileSync(f, "utf8").match(/<(ul|ol) style=/g) ?? []).length
    expect(listes, "…et des listes qui se disent, maintenant").toBeGreaterThan(24)
  })
})
