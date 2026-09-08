import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { RenduLegacy } from "../../[slug]/renduLegacy"
import { BLOCK_DEFS } from "./blockDefs"
import { SHARED_RENDERER_BLOCKS } from "./shared-renderer/architecture"

// ═══════════════════════════════════════════════════════════════════════════════
// UN CADRE VIDE.
//
// La doctrine anti-invention dit : un champ vide est MASQUÉ. On l'a appliquée
// champ par champ. Restait le cas où le bloc ENTIER n'a plus rien à dire mais
// dessine quand même son décor — un cadre, une bordure, une grille, et rien
// dedans. Le visiteur voit un rectangle et se demande si la page est cassée.
//
// Trois blocs le faisaient, tous pour la même raison : la condition de publication
// regardait le LIBELLÉ du bouton, alors que c'est l'ADRESSE qui décide. Depuis
// que le rendu public refuse de publier un bouton sans destination, le libellé
// ne prouve plus rien — le bouton s'efface, le cadre reste.
//
//   external_shop  « Voir la boutique » posé sans adresse → 41 octets de cadre.
//   quote_request  idem.
//   multi_cta      quatre boutons nommés, aucune adresse → une grille vide.
//
// La règle tenue ici : un bloc publie quelque chose de lisible — du texte, un
// lien, une image, un média — ou il ne publie rien du tout.
// ═══════════════════════════════════════════════════════════════════════════════

const theme: any = {
  bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F",
  text: "#F5F0E8", muted: "#A8A190", fontDisplay: "Fraunces, serif", fontBody: "DM Sans, sans-serif",
}
const pctx: any = { theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} }

// Le registre public passe par `next/dynamic` : sous un rendu serveur de test,
// ces composants ne rendent RIEN. Un balayage qui l'utiliserait ne verrait que
// les 32 blocs legacy en croyant en couvrir 178. On charge donc les vues
// partagées directement depuis leurs fichiers.
const MODULES = import.meta.glob("./shared-renderer/blocks/*/{index,Public*}.tsx", { eager: true }) as Record<string, any>
const VUES_PARTAGEES: Record<string, any> = (() => {
  const out: Record<string, any> = {}
  for (const [chemin, mod] of Object.entries(MODULES)) {
    const type = chemin.split("/")[3]
    const vue = Object.entries(mod as Record<string, any>)
      .find(([nom, v]) => typeof v === "function" && /^Public/.test(nom))?.[1]
    if (vue) out[type] = vue
  }
  return out
})()

function publie(type: string, content: Record<string, any>): string {
  if (SHARED_RENDERER_BLOCKS.has(type)) {
    const Vue = VUES_PARTAGEES[type]
    if (!Vue) return ""
    try { return renderToStaticMarkup(<Vue content={content} ctx={pctx} />) } catch { return "" }
  }
  try {
    return renderToStaticMarkup(
      <RenduLegacy block={{ id: "b1", type, content, position: 0 } as any} theme={theme} pageId="p1" ownerEmail="a@b.co" totalViews={0} />,
    )
  } catch { return "" }
}

/** Ce qu'un visiteur peut lire, cliquer ou regarder. */
export function donneQuelqueChose(html: string): boolean {
  const texte = html.replace(/<[^>]*>/g, "").replace(/&[a-z#0-9]+;/g, "").trim()
  return !!texte || /<(?:a|img|audio|video|iframe|svg|input|button|textarea)\b/.test(html)
}

/** Une DESTINATION au sens du rendu public : ce qui décide qu'un bouton existe. */
const EST_UNE_DESTINATION = /(?:^|_)(?:url|link|href|src|handle|embed_url)$/

/** Le cas réel : le commerçant nomme ses boutons et oublie de coller les adresses. */
function sansAucuneAdresse(type: string): Record<string, any> {
  const def = BLOCK_DEFS[type] as any
  const c: Record<string, any> = { ...(def?.defaultContent ?? {}) }
  for (const f of (def?.fields ?? []) as any[]) {
    if (!f?.key || EST_UNE_DESTINATION.test(f.key)) continue
    if (c[f.key] === undefined) c[f.key] = /label|title|name|nom|text/.test(f.key) ? "Mon texte" : "x"
  }
  for (const f of (def?.fields ?? []) as any[]) if (f?.key && EST_UNE_DESTINATION.test(f.key)) delete c[f.key]
  return c
}

// LA seule famille qui a le droit de ne rien dire : les blocs décoratifs. Un
// séparateur, un espace, une bande de couleur n'ont pas de texte par nature —
// c'est le trait lui-même qui est le contenu. Toute autre entrée ici serait un
// cadre vide déguisé, alors cette liste ne doit pas grandir.
const DECORATIFS = ["divider", "spacer", "color_band", "decor_line", "anchor_target"]

const CAS: Array<[string, (t: string) => Record<string, any>]> = [
  ["sans aucun contenu", () => ({})],
  ["tel qu'il naît", t => ({ ...((BLOCK_DEFS[t] as any)?.defaultContent ?? {}) })],
  ["rempli, sans aucune adresse", sansAucuneAdresse],
]

describe("un bloc publie quelque chose de lisible, ou rien du tout", () => {
  for (const [quoi, fixture] of CAS) {
    it(`aucun bloc ne publie de cadre vide — ${quoi}`, () => {
      const vides: string[] = []
      for (const type of Object.keys(BLOCK_DEFS)) {
        if (DECORATIFS.includes(type)) continue
        const html = publie(type, fixture(type))
        if (html && !donneQuelqueChose(html)) vides.push(`${type} (${html.length} octets)`)
      }
      expect(vides.sort()).toEqual([])
    })
  }

  it("les blocs decoratifs le sont vraiment, et ils sont peu nombreux", () => {
    // Sans ce garde-fou, il suffirait d'ajouter un type ici pour faire taire le
    // contrôle. Chacun doit être un bloc dont le DÉCOR est tout le propos.
    expect(DECORATIFS.length).toBeLessThan(7)
    for (const t of DECORATIFS) {
      expect(BLOCK_DEFS[t], `${t} : bloc inconnu`).toBeTruthy()
      // Ils vivent dans les deux rayons de mise en forme : « layout » (séparateur,
      // espacement) et « freeform » (bande, filet, ancre). Aucun bloc de contenu
      // — commerce, événement, identité — ne peut se glisser ici.
      expect(["layout", "freeform"], `${t} n'est pas un bloc de mise en forme`).toContain((BLOCK_DEFS[t] as any).category)
    }
  })

  it("le detecteur sait distinguer un cadre vide d'un bloc qui parle", () => {
    // Sans ces garde-fous, `donneQuelqueChose` pourrait tout accepter.
    expect(donneQuelqueChose('<div style="border:1px solid red"></div>')).toBe(false)
    expect(donneQuelqueChose('<div><div style="gap:8px"></div></div>')).toBe(false)
    expect(donneQuelqueChose("<div>Bonjour</div>")).toBe(true)
    expect(donneQuelqueChose('<div><a href="https://x.fr"></a></div>')).toBe(true)
    expect(donneQuelqueChose('<div><img src="/x.jpg"/></div>')).toBe(true)
  })

  it("le releve porte bien sur tous les blocs", () => {
    expect(Object.keys(BLOCK_DEFS).length).toBeGreaterThan(170)
    // Et les fixtures produisent bien du contenu : sinon tout serait « vide et
    // masqué », et le contrôle passerait sans rien avoir regardé.
    const parlants = Object.keys(BLOCK_DEFS).filter(t => publie(t, sansAucuneAdresse(t)).length > 0)
    expect(parlants.length, "trop peu de blocs rendus : le balayage ne prouverait rien").toBeGreaterThan(120)
    // Et les vues partagées sont bien chargées : sans elles, 146 blocs sur 178
    // passeraient pour « rien à publier » sans avoir été regardés une seule fois.
    expect(Object.keys(VUES_PARTAGEES).length, "vues partagées introuvables").toBeGreaterThan(130)
  })

  it("les neuf cadres du 8 septembre ne reviennent pas", () => {
    // Quatre blocs partagés dont le modèle affirmait `visible: true` sans
    // condition, plus deux autres trouvés en ajoutant le cas « contenu vide ».
    for (const type of ["bio", "skills", "event_info", "menu_section", "promo_banner", "order_online"]) {
      expect(publie(type, {}), `${type} : posé vide, il ne doit RIEN publier`).toBe("")
    }
    expect(publie("event_info", { name: "Vernissage" })).toContain("Vernissage")
    expect(publie("promo_banner", { text: "Soldes" })).toContain("Soldes")
    expect(publie("bio", { text: "Photographe à Lyon" })).toContain("Photographe à Lyon")
    expect(publie("skills", { tags: "React, Design" })).toContain("Design")
    expect(publie("menu_section", { item1_name: "Pizza" })).toContain("Pizza")
    expect(publie("order_online", { url: "https://ubereats.com/x" })).toContain("Commander")
  })

  it("les trois cadres legacy du 8 septembre ne reviennent pas", () => {
    for (const type of ["external_shop", "quote_request", "multi_cta"]) {
      const html = publie(type, sansAucuneAdresse(type))
      expect(html, `${type} : nommé mais sans adresse, il ne doit RIEN publier`).toBe("")
    }
    // Et avec une adresse, ils publient bien leur bouton.
    expect(publie("external_shop", { label: "Voir la boutique", url: "https://boutique.fr" })).toContain("Voir la boutique")
    expect(publie("quote_request", { label: "Demander un devis", url: "https://devis.fr" })).toContain("Demander un devis")
    expect(publie("multi_cta", { btn1_label: "Appeler", btn1_url: "tel:+33123456789", btn2_label: "Muet" })).toContain("Appeler")
    expect(publie("multi_cta", { btn1_label: "Appeler", btn1_url: "tel:+33123456789", btn2_label: "Muet" }), "le bouton sans adresse reste absent").not.toContain("Muet")
  })
})
