// Un bloc ajouté ne reste pas muet — garde de classe.
//
// ── Ce que le commerçant voyait ───────────────────────────────────────────
//
// Quatorze blocs de mise en page portaient leur condition de publication dans
// leur adapter PUBLIC, écrite à la main :
//
//     export function PublicFrameBox({ content, ctx }) {
//       const c = content || {}
//       if (!c.title && !c.text) return null
//
// …et leur adapter ÉDITEUR rendait la vue sans condition :
//
//     export function EditorFrameBox({ content, ctx }) { return <View … /> }
//
// La vue d'un bloc vide ne dessine rien. Le commerçant ajoute « Encadré »
// depuis la bibliothèque et voit un cadre de 36 px, sans un mot dedans.
// L'étiquette du bloc, dans le canvas, ne s'affiche que tant qu'il est
// SÉLECTIONNÉ : dès qu'il clique ailleurs, il reste un trou muet au milieu de
// sa page. Rien ne lui dit quoi remplir, ni que le bloc ne partira pas en ligne.
//
// ── Pourquoi la condition n'était pas simplement recopiée ────────────────
//
// Recopier la condition dans l'éditeur, c'est la dérive que les lots v151 à
// v154 ont passé leur temps à défaire. Les quatorze conditions sont déclarées
// dans `models/misesEnPage`, et TROIS côtés les lisent là : le rendu public,
// l'aperçu éditeur, et le détecteur de la liste d'avant publication.
//
// ── Ce que la déclaration a corrigé au passage ───────────────────────────
//
// Les conditions écrites à la main demandaient `!c.title` : une ligne d'espaces
// passait pour du contenu, et le bloc se publiait vide. Le contrat du produit
// dit le contraire depuis toujours — « une ligne blanche, un item fantôme ne
// sont PAS du contenu publiable ».

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"
import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "./blockEmptyState"
import { alertesPublication } from "./AlertesPublication"
import { BLOCK_DEFS } from "./blockDefs"
import { SHARED_RENDERER_BLOCKS } from "./shared-renderer/architecture"
import { resolveEditorBlock } from "./shared-renderer/editorRegistry"
import { CE_QUI_PORTE, porteQuelqueChose } from "./shared-renderer/models/misesEnPage"
import type { Block } from "./types"

const RACINE = path.join(__dirname, "shared-renderer")
const REG = fs.readFileSync(path.join(RACINE, "publicRegistry.tsx"), "utf8")

function adaptersPublics(): Record<string, [string, string]> {
  const parNom: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/const (Public\w+) = dynamic\(\(\) => import\("\.\/blocks\/([^"]+)"\)\.then\(m => m\.(\w+)\)\)/g))
    parNom[m[1]] = [m[2], m[3]]
  const out: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/^\s{2}([a-z0-9_]+): (Public\w+),/gm)) if (parNom[m[2]]) out[m[1]] = parNom[m[2]]
  return out
}

const theme: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const ctxPublic: any = { theme, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {} }
const ctxEditeur: any = { theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: "#39FF8F", surfaceStyle: {}, canEdit: false, edit: () => () => {} }

async function page(chemin: string, nom: string, contenu: Record<string, unknown>): Promise<string> {
  const mod = (await import(/* @vite-ignore */ `./shared-renderer/blocks/${chemin}`)) as Record<string, ComponentType<never>>
  const C = mod[nom]
  if (!C) return ""
  try { return renderToStaticMarkup(createElement(C as never, { content: contenu, ctx: ctxPublic } as never)).trim() } catch { return "" }
}
function editeur(type: string, contenu: Record<string, unknown>): string {
  const A = resolveEditorBlock(type)
  if (!A) return ""
  try { return renderToStaticMarkup(createElement(A as never, { content: contenu, ctx: ctxEditeur } as never)) } catch { return "" }
}

/** Ce que le commerçant LIT : le texte, et les images qui tiennent lieu de texte. */
const lu = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
// Une image se montre aussi en fond de bloc (`overlay_card`, `full_bleed_image`
// posent `background-image`) : ne chercher qu'un `<img>` ferait passer pour
// muet un bloc qui remplit tout l'écran.
const montreUneImage = (html: string) => /<img\b/.test(html) || /background(-image)?:[^"]*url\(/.test(html)

const LES_QUATORZE = Object.keys(CE_QUI_PORTE)

/** Une valeur plausible pour un champ, selon la façon dont il est jugé. */
function valeurPour(type: string, cle: string): string {
  const p = CE_QUI_PORTE[type].find(x => x.cle === cle)
  return p?.image ? "https://exemple.supabase.co/photo.png" : p?.ancre ? "Nos tarifs" : "Réel"
}

describe("garde de classe : à vide, l'éditeur dit quoi faire", () => {
  it("chacun des quatorze montre une invite, et pas un cadre vide", () => {
    expect(LES_QUATORZE.length, "les quatorze du relevé").toBe(14)
    for (const type of LES_QUATORZE) {
      const html = editeur(type, {})
      expect(html, `${type} : l'éditeur rend quelque chose`).not.toBe("")
      expect(html.includes('role="note"'), `${type} : c'est bien l'état vide du produit`).toBe(true)
      expect(lu(html).length, `${type} : et il est lisible`).toBeGreaterThan(10)
      // Sur le texte LU : l'apostrophe est échappée dans le HTML rendu.
      expect(lu(html), `${type} : …avec la phrase qui dit ce qui arrivera en ligne`)
        .toContain("Invisible en ligne tant qu")
    }
  })

  it("les trois côtés s'accordent : page muette, éditeur parlant, détecteur au courant", async () => {
    const adapters = adaptersPublics()
    const desaccords: string[] = []
    for (const type of LES_QUATORZE) {
      const [chemin, nom] = adapters[type]
      if ((await page(chemin, nom, {})) !== "") desaccords.push(`${type} : la page publie quelque chose à vide`)
      if (hasPublishableContent(type, {})) desaccords.push(`${type} : le détecteur le croit plein`)
      if (!editeur(type, {}).includes('role="note"')) desaccords.push(`${type} : l'éditeur ne dit rien`)
    }
    expect(desaccords).toEqual([])
  }, 120_000)

  it("rempli, l'éditeur montre le bloc — et plus l'invite", async () => {
    // Sans ce sens-là, un état vide affiché TOUJOURS passerait pour juste.
    const adapters = adaptersPublics()
    for (const type of LES_QUATORZE) {
      const cle = CE_QUI_PORTE[type][0].cle
      const contenu = { [cle]: valeurPour(type, cle) }
      const html = editeur(type, contenu)
      expect(html.includes('role="note"'), `${type} : l'invite a disparu`).toBe(false)
      expect(lu(html) !== "" || montreUneImage(html), `${type} : et le bloc se voit`).toBe(true)
      const [chemin, nom] = adapters[type]
      // `anchor_target` est invisible en ligne PAR DESSEIN : il ne pose qu'une
      // ancre, sans rien à lire. C'est écrit dans son fichier.
      if (type !== "anchor_target")
        expect(await page(chemin, nom, contenu), `${type} : et la page le publie`).not.toBe("")
    }
  }, 120_000)
})

describe("garde de classe : la déclaration est exacte, et complète", () => {
  it("chaque champ déclaré porteur fait exister le bloc, à lui seul", async () => {
    // L'exactitude : rien n'a été ajouté à la condition d'origine.
    const adapters = adaptersPublics()
    const fautifs: string[] = []
    let sondes = 0
    for (const type of LES_QUATORZE) {
      const [chemin, nom] = adapters[type]
      for (const p of CE_QUI_PORTE[type]) {
        sondes++
        const contenu = { [p.cle]: valeurPour(type, p.cle) }
        if (!porteQuelqueChose(type, contenu)) fautifs.push(`${type}.${p.cle} : déclaré porteur, et ne porte rien`)
        if (type !== "anchor_target" && (await page(chemin, nom, contenu)) === "")
          fautifs.push(`${type}.${p.cle} : déclaré porteur, et la page ne publie rien`)
      }
    }
    expect(sondes, "des champs porteurs éprouvés").toBeGreaterThan(25)
    expect(fautifs).toEqual([])
  }, 120_000)

  it("aucun AUTRE champ déclaré du bloc ne le fait exister — sinon il en manquerait un", async () => {
    // La complétude, et c'est la moitié qui coûte : si un champ oublié faisait
    // publier la page, le détecteur dirait « vide » sur un bloc qui part en
    // ligne — exactement l'écart que ce fichier existe pour interdire.
    const adapters = adaptersPublics()
    const oublies: string[] = []
    let sondes = 0
    for (const type of LES_QUATORZE) {
      const [chemin, nom] = adapters[type]
      const porteurs = new Set(CE_QUI_PORTE[type].map(p => p.cle))
      const champs = ((BLOCK_DEFS as Record<string, { fields?: { key: string; type?: string }[] }>)[type]?.fields ?? [])
      for (const f of champs) {
        if (porteurs.has(f.key)) continue
        sondes++
        const valeur = f.type === "url" ? "https://exemple.fr/p"
          : /(^|_)(img|image|photo|cover)\d*$/.test(f.key) ? "https://exemple.supabase.co/photo.png" : "Réel"
        if ((await page(chemin, nom, { [f.key]: valeur })) !== "")
          oublies.push(`${type}.${f.key} : publie, et n'est pas déclaré porteur`)
      }
    }
    expect(sondes, "des champs non porteurs éprouvés").toBeGreaterThan(80)
    expect(oublies).toEqual([])
  }, 180_000)

  it("ce que la vue DESSINE porte le bloc — l'oracle est la vue, pas la déclaration", () => {
    // Une mutation me l'a appris. Retirer `{ cle: "text" }` de `frame_box` ne
    // faisait échouer aucun test : les trois côtés lisent la déclaration, donc
    // ils restent d'accord entre eux, y compris sur une erreur. Il fallait un
    // oracle INDÉPENDANT, et le voici — la vue du bloc, qui dessine ce qu'elle
    // dessine :
    //
    //     {c.title && <h2 …>{c.title}</h2>}
    //
    // Un champ que la vue interpole est du contenu. S'il ne porte pas le bloc,
    // le commerçant l'écrit, le voit dans l'aperçu, et la page ne publie rien.
    // C'est ainsi que treize oublis sont apparus — dont `text_columns.title`.
    const oublies: string[] = []
    let dessinesVus = 0
    for (const type of LES_QUATORZE) {
      const src = fs.readFileSync(path.join(RACINE, "blocks", type, "index.tsx"), "utf8")
      const porteurs = new Set(CE_QUI_PORTE[type].map(p => p.cle))
      const declares = new Set(((BLOCK_DEFS as Record<string, { fields?: { key: string }[] }>)[type]?.fields ?? []).map(f => f.key))
      for (const m of src.matchAll(/\{c\.([a-z0-9_]+)\}/g)) {
        const cle = m[1]
        if (!declares.has(cle)) continue        // ce que le panneau ne propose pas n'est pas du contenu
        dessinesVus++
        if (!porteurs.has(cle)) oublies.push(`${type}.${cle} : dessiné par la vue, et ne porte pas le bloc`)
      }
    }
    expect(dessinesVus, "des champs dessinés par les vues").toBeGreaterThan(25)
    expect(oublies, "le produit effacerait ce que le commerçant a écrit").toEqual([])
  })

  it("une ligne d'espaces ne porte rien — ce que la condition écrite à la main laissait passer", async () => {
    const adapters = adaptersPublics()
    for (const type of LES_QUATORZE) {
      const vide: Record<string, string> = {}
      for (const p of CE_QUI_PORTE[type]) vide[p.cle] = "   "
      expect(porteQuelqueChose(type, vide), `${type} : des espaces`).toBe(false)
      const [chemin, nom] = adapters[type]
      expect(await page(chemin, nom, vide), `${type} : et la page n'en publie rien`).toBe("")
    }
  }, 120_000)
})

describe("exécuté : la liste d'avant publication les nomme", () => {
  const bloc = (type: string, content: Record<string, unknown>): Block =>
    ({ id: `b-${type}`, type, content, visible: true } as unknown as Block)

  it("les quatorze vides y figurent", () => {
    const alertes = alertesPublication(LES_QUATORZE.map(t => bloc(t, {})))
    const manquants = LES_QUATORZE.filter(t => !alertes.some(a => a.blocId === `b-${t}`))
    expect(manquants, "un bloc absent de la liste se publie dans le dos du commerçant").toEqual([])
  })

  it("…et se taisent une fois remplis", () => {
    const alertes = alertesPublication(LES_QUATORZE.map(t => {
      const cle = CE_QUI_PORTE[t][0].cle
      return bloc(t, { [cle]: valeurPour(t, cle) })
    }))
    expect(alertes.map(a => a.blocId), "un bloc rempli n'a rien à signaler").toEqual([])
  })
})

describe("le cliquet : les éditeurs encore muets", () => {
  /** Une décoration dessine une forme : c'est son contenu, elle n'a rien à lire. */
  const DECORATIONS = ["divider", "spacer", "shape_divider", "decor_line", "color_band", "back_to_top"]

  it("leur nombre ne peut que descendre", () => {
    const muets: string[] = []
    let vus = 0
    for (const type of Object.keys(BLOCK_DEFS)) {
      if (!SHARED_RENDERER_BLOCKS.has(type) || DECORATIONS.includes(type)) continue
      if (!resolveEditorBlock(type)) continue
      vus++
      const html = editeur(type, {})
      if (lu(html) === "" && !montreUneImage(html)) muets.push(type)
    }
    expect(vus, "des adapters éditeur rendus").toBeGreaterThan(130)
    // 28 avant ce lot (hors décorations), 14 depuis. Ceux qui restent décident
    // sur une LISTE d'items, et leur helper vit dans le fichier du bloc : leur
    // tour demande de le remonter dans un modèle, pas de recopier une condition.
    expect(muets.length, `muets : ${muets.join(", ")}`).toBeLessThanOrEqual(14)
    expect(muets.length, "il en reste — sinon ce cliquet n'aurait plus de sens").toBeGreaterThan(0)
    for (const t of LES_QUATORZE) expect(muets, `${t} parle depuis ce lot`).not.toContain(t)
  }, 120_000)
})
