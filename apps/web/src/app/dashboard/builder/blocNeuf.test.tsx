import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { renderToStaticMarkup } from "react-dom/server"
import { BLOCK_DEFS } from "./blockDefs"
import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "./blockEmptyState"
import { SHARED_RENDERER_BLOCKS } from "./shared-renderer/architecture"
import { resolveEditorBlock } from "./shared-renderer/editorRegistry"
import { RenduLegacy } from "../../[slug]/renduLegacy"

// ═══════════════════════════════════════════════════════════════════════════════
// UN BLOC QU'ON VIENT DE POSER.
//
// Contrepartie de contenuParDefaut.test.ts. Vider les contenus inventés du
// `defaultContent` supprime le mensonge, mais crée un risque symétrique : le
// commerçant pose un bloc et se retrouve devant un vide inexpliqué, sans savoir
// s'il a raté une manipulation.
//
// La règle : un bloc neuf publie ce que le commerçant a écrit — donc souvent
// rien. Mais l'ÉDITEUR, lui, doit toujours dire quelque chose : soit le bloc
// montre son contenu, soit il montre une invite qui prévient qu'il restera
// invisible en ligne tant qu'il sera vide. Jamais un cadre muet.
// ═══════════════════════════════════════════════════════════════════════════════

const theme: any = {
  bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F",
  text: "#F5F0E8", muted: "#A8A190", fontDisplay: "Fraunces, serif", fontBody: "DM Sans, sans-serif",
}
const ctx: any = { theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: theme.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} }
const apercu = readFileSync(fileURLToPath(new URL("./builderPreview.tsx", import.meta.url)), "utf8")

const neuf = (type: string) => ({ ...((BLOCK_DEFS[type] as any)?.defaultContent ?? {}) }) as Record<string, any>

function publie(type: string, content: Record<string, any>): string {
  if (SHARED_RENDERER_BLOCKS.has(type)) return ""   // chargé à la demande : rendu vide ici
  try {
    return renderToStaticMarkup(
      <RenduLegacy block={{ id: "b1", type, content, position: 0 }} theme={theme} pageId="p1" ownerEmail="a@b.co" totalViews={0} />,
    )
  } catch { return "" }
}

/** L'éditeur prévient-il que ce bloc restera invisible tant qu'il est vide ? */
function editeurInvite(type: string): boolean {
  if (SHARED_RENDERER_BLOCKS.has(type)) {
    const Adapter = resolveEditorBlock(type)
    if (!Adapter) return false
    const html = renderToStaticMarkup(<Adapter content={{}} ctx={ctx} />)
    return html.includes('role="note"')
  }
  return apercu.includes(`hasPublishableContent("${type}"`)
}

describe("un bloc neuf n'affirme rien à la place du commerçant", () => {
  // Les valeurs retirées le 7 septembre : horaires, adresse, note moyenne,
  // prix, compteurs. Aucune ne doit revenir par une autre porte.
  const INVENTIONS: Array<[string, string]> = [
    ["opening_hours", "9h - 18h"], ["opening_hours", "10h - 16h"],
    ["google_maps", "Paris, France"], ["google_maps_embed", "Paris, France"],
    ["google_reviews_block", "4.9"], ["google_reviews_block", "127"],
    ["business_stats", "500+"], ["business_stats", "4.9/5"], ["business_stats", "10 ans"],
    ["stats_block", "500+"], ["scan_counter", "1 240"], ["sales_counter", "127"],
    ["participants_count", "287"], ["tickets_left", "14"],
    ["announcement", "25 décembre"], ["availability", "Ouvert aux nouvelles missions"],
    ["product", "29€"], ["pricing", "49€"], ["offer_comparison", "99€"],
    ["reassurance", "Satisfait ou remboursé"], ["reassurance", "Livraison offerte"],
    ["advantages", "Support 24/7"], ["engagements", "Satisfaction garantie"],
    ["service_area", "France entière"], ["menu_tabs", "Mojito"],
    ["promo_code", "QROWG10"], ["timeline", "2020"], ["journey", "5 ans d"],
  ]

  for (const [type, texte] of INVENTIONS) {
    it(`${type} ne naît plus avec « ${texte} »`, () => {
      expect(BLOCK_DEFS[type], `${type} : bloc inconnu`).toBeTruthy()
      expect(JSON.stringify(neuf(type)), `${type} livre encore « ${texte} »`).not.toContain(texte)
    })
  }

  it("et la suggestion reste visible dans le panneau de réglages", () => {
    // Retirer sans remplacer laisserait le commerçant sans repère. Chaque
    // valeur retirée survit en placeholder — montrée, jamais publiée.
    const def = (t: string) => BLOCK_DEFS[t] as any
    const ph = (t: string, k: string) => def(t).fields.find((f: any) => f.key === k)?.placeholder
    expect(ph("opening_hours", "mon_fri")).toBe("9h - 18h")
    expect(ph("google_maps", "address")).toBeTruthy()
    expect(ph("business_stats", "stat1_value")).toBe("500+")
    expect(ph("scan_counter", "count")).toBe("1 240")
  })
})

describe("un bloc neuf n'est jamais un cadre muet dans l'éditeur", () => {
  const muets: string[] = []
  for (const type of Object.keys(BLOCK_DEFS)) {
    const c = neuf(type)
    // Le bloc publie-t-il quelque chose de lisible avec ses seuls réglages ?
    const html = publie(type, c)
    const texte = html.replace(/<[^>]*>/g, "").replace(/&[a-z#0-9]+;/g, "").trim()
    if (texte) continue                       // il montre du contenu : rien à signaler
    if (SHARED_RENDERER_BLOCKS.has(type)) continue   // couvert par les tests de vague
    if (!hasPublishableContent(type, c) && editeurInvite(type)) continue
    if (!EMPTY_STATE_BLOCK_TYPES.includes(type)) continue   // hors doctrine déclarée
    muets.push(type)
  }

  it("chaque bloc déclaré « masqué si vide » prévient l'auteur dès sa pose", () => {
    expect(muets.sort(), "posés vides, sans invite dans l'aperçu").toEqual([])
  })
})

describe("les liens livrés mènent quelque part, ou n'existent pas", () => {
  it("plus aucun bouton par défaut ne pointe vers « # »", () => {
    // `availability` naissait avec « Prendre contact » vers « # » : un bouton
    // publié, bien visible, qui ne va nulle part.
    const morts = Object.entries(BLOCK_DEFS).flatMap(([t, d]) =>
      Object.entries(((d as any).defaultContent ?? {}) as Record<string, string>)
        .filter(([k, v]) => /(^|_)(url|link|href)$/.test(k) && String(v).trim() === "#")
        .map(([k]) => `${t}.${k}`))
    expect(morts).toEqual([])
  })
})
