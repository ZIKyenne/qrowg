import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { hero, separateur, deuxColonnes, grille, enTeteSection } from "./models/structurePage"
import { EditorHeroBanner, PublicHeroBanner } from "./blocks/hero_banner"
import { EditorSectionBanner, PublicSectionBanner } from "./blocks/section_banner"
import { EditorTwoColumns, PublicTwoColumns } from "./blocks/two_columns"
import { EditorGridSection, PublicGridSection } from "./blocks/grid_section"
import { EditorSectionBlock, PublicSectionBlock } from "./blocks/section_block"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Vague 21 — la structure de page : ce que le visiteur voit en premier.
//
//   · hero_banner n'avait AUCUNE garde de vide côté aperçu : il dessinait une
//     bannière de 180 px avec son dégradé sur un bloc que la page ne publie
//     pas. Et il rendait un <img> brut pour l'image de fond ;
//   · section_banner n'appliquait la couleur choisie qu'au TEXTE : les filets
//     et le dégradé restaient à la couleur du thème. Le commerçant réglait un
//     bleu et voyait des filets dorés ;
//   · grid_section coupait la grille à « colonnes × 2 » cartes côté aperçu :
//     à deux colonnes, les cartes 5 et 6 étaient invisibles pour l'auteur
//     alors que la page les publie ;
//   · section_block posait 14 px de marge intérieure sans style de fond, là où
//     la page n'en met aucune.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const clair: any = { ...sombre, bg: "#FFFFFF", text: "#1A1A1A", muted: "#6B7280" }
const eCtx = (theme: any = sombre): EditorRenderCtx =>
  ({ theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: theme.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const pCtx = (theme: any = sombre): PublicRenderCtx =>
  ({ theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} })
const H = (el: any) => renderToStaticMarkup(el)

const HERO = { title: "Bienvenue à l'atelier", subtitle: "Menuiserie sur mesure", height: "lg", cta_label: "Nous trouver", cta_url: "https://atelier.fr", cta2_label: "Appeler", cta2_url: "tel:0326123456" }
const COLONNES = { col1_icon: "🪵", col1_title: "Sur place", col1_text: "Du lundi au vendredi.", col2_title: "À distance", col2_text: "Devis en 48 h." }
const GRILLE = { title: "Nos services", columns: "2", c1_title: "Découpe", c2_title: "Ponçage", c3_title: "Vernis", c4_title: "Pose", c5_title: "Conseil", c6_title: "Livraison" }

describe("vague 21 - hero_banner : plus de banniere fantome", () => {
  it("sans titre ni image, rien des deux cotes", () => {
    expect(hero({})).toBeNull()
    expect(hero({ subtitle: "Un sous-titre", cta_label: "Voir" })).toBeNull()
    expect(PublicHeroBanner({ content: {}, ctx: pCtx() } as any)).toBeNull()
    const h = H(<EditorHeroBanner content={{}} ctx={eCtx()} />)
    expect(h).toContain("Invisible en ligne")
    expect(h, "il dessinait la banniere et son degrade").not.toContain("height:180px")
  })
  it("la hauteur suit le reglage, et se replie sur la valeur moyenne", () => {
    expect(hero({ title: "A", height: "sm" })!.hauteur).toBe(170)
    expect(hero({ title: "A", height: "lg" })!.hauteur).toBe(280)
    expect(hero({ title: "A" })!.hauteur).toBe(220)
    expect(hero({ title: "A", height: "geant" })!.hauteur).toBe(220)
  })
  it("un bouton sans destination n'est publie nulle part", () => {
    const c = { title: "Bienvenue", cta_label: "Voir" }
    for (const h of [H(<EditorHeroBanner content={c} ctx={eCtx()} />), H(<PublicHeroBanner content={c} ctx={pCtx()} />)]) {
      expect(h).not.toContain("Voir")
    }
  })
  it("l'image de fond passe par le meme chemin dimensionne des deux cotes", () => {
    const c = { title: "A", bg_image: "https://abcdefgh.supabase.co/storage/v1/object/public/h/1.jpg" }
    for (const h of [H(<EditorHeroBanner content={c} ctx={eCtx()} />), H(<PublicHeroBanner content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("/_next/image")
    }
  })
})

describe("vague 21 - section_banner : la couleur choisie s'applique partout", () => {
  it("les filets prennent la couleur du bloc, pas celle du theme", () => {
    // L'apercu peignait le texte en bleu et gardait des filets dores.
    const c = { title: "Nos services", color: "#38BDF8", style: "lines" }
    for (const h of [H(<EditorSectionBanner content={c} ctx={eCtx()} />), H(<PublicSectionBanner content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("#38BDF860")
      expect(h, "la couleur du theme ne doit plus apparaitre").not.toContain("#C9A84C60")
    }
  })
  it("sans couleur choisie, celle du theme", () => {
    expect(separateur({ title: "A" }, "#C9A84C")!.couleur).toBe("#C9A84C")
  })
  it("« SECTION » a disparu de l'apercu", () => {
    expect(separateur({ style: "badge" }, "#C9A84C")).toBeNull()
    for (const style of ["lines", "dots", "gradient", "minimal", "badge"]) {
      expect(H(<EditorSectionBanner content={{ style }} ctx={eCtx()} />)).not.toContain("SECTION")
    }
  })
  it("un style inconnu retombe sur les filets", () => {
    expect(separateur({ title: "A", style: "mosaique" }, "#C9A84C")!.style).toBe("lines")
  })
})

describe("vague 21 - grid_section : plus de plafond invente", () => {
  it("les six cartes sont montrees, meme a deux colonnes", () => {
    // L'apercu coupait a « colonnes x 2 » : les cartes 5 et 6 disparaissaient.
    const g = grille(GRILLE)!
    expect(g.cartes).toHaveLength(6)
    expect(g.colonnes).toBe(2)
    for (const h of [H(<EditorGridSection content={GRILLE} ctx={eCtx()} />), H(<PublicGridSection content={GRILLE} ctx={pCtx()} />)]) {
      expect(h).toContain("Conseil")
      expect(h).toContain("Livraison")
    }
  })
  it("le titre de la carte decide, un nombre de colonnes absurde est borne", () => {
    expect(grille({ c1_text: "Un texte" })).toBeNull()
    expect(grille({ c1_title: "A", columns: "0" })!.colonnes).toBe(3)
    expect(grille({ c1_title: "A", columns: "douze" })!.colonnes).toBe(3)
  })
})

describe("vague 21 - section_block : la marge suit le style de fond", () => {
  it("sans cadre, aucune marge interieure", () => {
    const e = enTeteSection({ title: "Nos services" })!
    expect(e.fond).toBe("transparent")
    const h = H(<PublicSectionBlock content={{ title: "Nos services" }} ctx={pCtx()} />)
    expect(h).toContain("padding:0")
    expect(H(<EditorSectionBlock content={{ title: "Nos services" }} ctx={eCtx()} />)).toContain("padding:0")
  })
  it("avec un cadre, la marge existe des deux cotes", () => {
    const c = { title: "Nos services", bg_style: "card" }
    expect(H(<PublicSectionBlock content={c} ctx={pCtx()} />)).toContain("padding:15px")
    expect(H(<EditorSectionBlock content={c} ctx={eCtx()} />)).toContain("padding:13px")   // 15 x 0,86
  })
  it("un sous-titre seul suffit ; rien du tout ne publie rien", () => {
    expect(enTeteSection({ subtitle: "Depuis 2014" })).not.toBeNull()
    expect(enTeteSection({ show_divider: "no" })).toBeNull()
  })
})

describe("vague 21 - two_columns : une colonne vide n'est pas dessinee", () => {
  it("seules les colonnes remplies comptent", () => {
    expect(deuxColonnes(COLONNES)).toHaveLength(2)
    expect(deuxColonnes({ col1_title: "A" })).toHaveLength(1)
    expect(deuxColonnes({ col1_icon: "🪵" }), "une icone seule n'est pas un contenu").toHaveLength(0)
  })
})

describe("vague 21 - l'apercu montre ce qui sera publie", () => {
  const textes = (h: string) => h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
  for (const [type, Ed, Pub, contenu] of [
    ["hero_banner", EditorHeroBanner, PublicHeroBanner, HERO],
    ["section_banner", EditorSectionBanner, PublicSectionBanner, { title: "Nos services", color: "#38BDF8", style: "gradient" }],
    ["two_columns", EditorTwoColumns, PublicTwoColumns, COLONNES],
    ["grid_section", EditorGridSection, PublicGridSection, GRILLE],
    ["section_block", EditorSectionBlock, PublicSectionBlock, { title: "Nos services", subtitle: "Depuis 2014", bg_style: "highlight" }],
  ] as const) {
    it(type + " : memes textes des deux cotes", () => {
      expect(textes(H(<Ed content={contenu} ctx={eCtx()} />))).toEqual(textes(H(<Pub content={contenu} ctx={pCtx()} /> as any)))
    })
  }
})

describe("vague 21 - liens reels en ligne, coquilles inertes dans l'apercu", () => {
  it("hero_banner : deux vrais liens en ligne, rien de navigable dans le canvas", () => {
    const h = H(<PublicHeroBanner content={HERO} ctx={pCtx()} />)
    expect(h).toContain('href="https://atelier.fr"')
    expect(h).toContain('href="tel:0326123456"')
    const ed = H(<EditorHeroBanner content={HERO} ctx={eCtx()} />)
    expect(ed).not.toContain("href=")
    expect(ed).toContain('aria-disabled="true"')
  })
})

describe("vague 21 - les surfaces suivent le theme", () => {
  it("les cartes de la grille restent visibles sur un theme clair", () => {
    expect(H(<PublicGridSection content={GRILLE} ctx={pCtx(clair)} />)).not.toMatch(/rgba\(255,255,255/)
    expect(H(<PublicGridSection content={GRILLE} ctx={pCtx()} />)).toMatch(/rgba\(255,255,255/)
  })
})

describe("vague 21 - activation", () => {
  it("les cinq blocs sont dans le drapeau de migration", () => {
    for (const t of ["hero_banner", "section_banner", "two_columns", "grid_section", "section_block"]) expect(SHARED_RENDERER_BLOCKS.has(t)).toBe(true)
  })
})
