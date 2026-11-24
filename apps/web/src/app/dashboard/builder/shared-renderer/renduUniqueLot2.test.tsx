import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { compteARebours, compteurDeVisites, cadeauOffert, zoneDesservie, produitsPopulaires, banniereVisible } from "./models/affichagesSimples"
import { EditorCountdown, PublicCountdown } from "./blocks/countdown"
import { EditorVisitCounter, PublicVisitCounter } from "./blocks/visit_counter"
import { EditorCoverBanner, PublicCoverBanner } from "./blocks/cover_banner"
import { EditorServiceArea, PublicServiceArea } from "./blocks/service_area"
import { EditorFreeGift, PublicFreeGift } from "./blocks/free_gift"
import { EditorPopularProducts, PublicPopularProducts } from "./blocks/popular_products"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import { hasPublishableContent } from "../blockEmptyState"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Rendu unique, lot 2 — les affichages simples (24 nov.).
//
// Six blocs qui n'avaient qu'un rendu par écran : la page publiée, l'aperçu de
// l'éditeur et l'aperçu de la galerie de modèles en gardaient chacun sa copie.
// Les trois disaient des choses différentes :
//   · la galerie affichait « 1 234 visiteurs », écrit en dur, et un compte à
//     rebours vers le 31 décembre 2026 quand le modèle n'avait pas de date ;
//   · l'aperçu de la bannière peignait son fond dans la couleur d'ACCENT du
//     thème, la page dans la PRIMAIRE ;
//   · l'aperçu du compte à rebours dessinait son bouton sans destination ;
//   · le cadeau publiait sa carte pour une adresse que la page refusait ensuite.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const eCtx = (): EditorRenderCtx =>
  ({ theme: sombre, primary: sombre.primary, text: sombre.text, muted: sombre.muted, accent: sombre.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const pCtx = (extra: Partial<PublicRenderCtx> = {}): PublicRenderCtx =>
  ({ theme: sombre, G: sombre.primary, TEXT: sombre.text, MUTED: sombre.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {}, ...extra })
const H = (el: any) => renderToStaticMarkup(el)
// Les entités sortent aussi : « &#x27; » (une apostrophe) contient des chiffres.
const texte = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&[#a-z0-9]+;/gi, " ").replace(/\s+/g, " ").trim()

const SIX = ["countdown", "visit_counter", "cover_banner", "service_area", "free_gift", "popular_products"]

describe("rendu unique, lot 2 — les six sont servis par le renderer partagé", () => {
  it("les six sont activés", () => {
    for (const t of SIX) expect(SHARED_RENDERER_BLOCKS.has(t), t).toBe(true)
  })
  it("aucun des trois anciens rendus n'en garde une copie", () => {
    const ici = __dirname
    for (const f of ["../../../[slug]/renduLegacy.tsx", "../builderPreview.tsx", "../../templates/TemplatePreviewModal.tsx"]) {
      const src = readFileSync(join(ici, f), "utf8")
      for (const t of SIX) expect(src, `${f} : ${t}`).not.toContain(`case "${t}"`)
    }
  })
  it("la galerie de modèles n'écrit plus de chiffre ni de date de démonstration", () => {
    const tpm = readFileSync(join(__dirname, "../../templates/TemplatePreviewModal.tsx"), "utf8")
    expect(tpm).not.toContain("1 234")
    expect(tpm).not.toContain("2026-12-31")
  })
})

describe("countdown", () => {
  it("sans date lisible, rien — et l'ancienne clé `date` est toujours lue", () => {
    expect(compteARebours({})).toBeNull()
    expect(compteARebours({ target: "pas une date" })).toBeNull()
    expect(compteARebours({ date: "2030-01-01T20:00" })!.cibleMs).toBe(new Date("2030-01-01T20:00").getTime())
  })
  it("le bouton n'existe qu'avec une destination — des deux côtés", () => {
    expect(compteARebours({ target: "2030-01-01", cta_label: "J'en profite" })!.cta).toBeNull()
    const c = { target: "2030-01-01", cta_label: "J'en profite", cta_url: "https://exemple.fr/offre" }
    expect(compteARebours(c)!.cta).toEqual({ label: "J'en profite", href: "https://exemple.fr/offre" })
    const sans = { target: "2030-01-01", cta_label: "J'en profite" }
    expect(H(<EditorCountdown content={sans} ctx={eCtx()} />), "l'aperçu dessinait ce bouton").not.toContain("J'en profite")
    expect(H(<PublicCountdown content={sans} ctx={pCtx()} />)).not.toContain("J'en profite")
  })
  it("une couleur hors format retombe sur le rouge d'origine", () => {
    expect(compteARebours({ target: "2030-01-01", accent: "red;background:url(x)" })!.accent).toBe("#EF4444")
  })
  it("le premier rendu ne lit pas l'horloge : des tirets, jamais « Offre terminée » depuis un cache", () => {
    const passe = { target: "2001-01-01", title: "Soldes" }
    const h = H(<PublicCountdown content={passe} ctx={pCtx()} />)
    expect(h).toContain("––")
    expect(h).not.toContain("Offre terminée")
  })
  it("le titre est un titre", () => {
    expect(H(<PublicCountdown content={{ target: "2030-01-01", title: "Ouverture" }} ctx={pCtx()} />)).toMatch(/<h2[^>]*>Ouverture<\/h2>/)
  })
})

describe("visit_counter", () => {
  it("le nombre vient de la page, jamais du contenu", () => {
    expect(compteurDeVisites(undefined, { count: "1 234" })).toBeNull()
    expect(compteurDeVisites(0, {})).toBeNull()
    expect(compteurDeVisites(-3, {})).toBeNull()
    expect(compteurDeVisites(1234567, {})).toEqual({ nombre: "1 234 567", libelle: "visiteurs" })
  })
  it("l'aperçu annonce le bloc sans inventer de chiffre", () => {
    const e = H(<EditorVisitCounter content={{ label: "fidèles" }} ctx={eCtx()} />)
    expect(e).toContain("fidèles")
    expect(texte(e)).not.toMatch(/\d/)
  })
  it("la page publie son vrai total", () => {
    expect(H(<PublicVisitCounter content={{}} ctx={pCtx()} />)).toBe("")
    expect(texte(H(<PublicVisitCounter content={{ label: "fidèles" }} ctx={pCtx({ totalVues: 4321 })} />))).toBe("4 321 fidèles")
  })
})

describe("cover_banner", () => {
  it("même règle de visibilité que le détecteur, cas par cas", () => {
    for (const c of [{}, { src: "  " }, { src: "https://x.supabase.co/a.png" }, { cover_title: "Bienvenue" }, { cover_subtitle: "Depuis 1998" },
      { banner_type: "gradient" }, { banner_type: "color" }, { banner_type: "image" }, { badge: "Nouveau" }])
      expect(banniereVisible(c), JSON.stringify(c)).toBe(hasPublishableContent("cover_banner", c))
  })
  it("l'aperçu peint le fond dans la couleur PRIMAIRE, comme la page", () => {
    const c = { banner_type: "gradient", cover_title: "Atelier Nord" }
    const e = H(<EditorCoverBanner content={c} ctx={eCtx()} />)
    const p = H(<PublicCoverBanner content={c} ctx={pCtx()} />)
    expect(e).toContain(sombre.primary)
    expect(e, "l'accent du thème n'avait rien à faire là").not.toContain(sombre.accent)
    expect(texte(e)).toBe(texte(p))
  })
  it("le lien n'existe qu'en ligne, et une adresse refusée n'en fait pas", () => {
    const c = { cover_title: "Atelier Nord", link_url: "https://atelier-nord.fr" }
    expect(H(<EditorCoverBanner content={c} ctx={eCtx()} />)).not.toContain("<a ")
    expect(H(<PublicCoverBanner content={c} ctx={pCtx()} />)).toContain('href="https://atelier-nord.fr"')
    expect(H(<PublicCoverBanner content={{ ...c, link_url: "javascript:alert(1)" }} ctx={pCtx()} />)).not.toContain("<a ")
  })
  it("le texte est là où le réglage le dit (les axes étaient inversés)", () => {
    // En colonne : justify-content = hauteur, align-items = largeur.
    const cadre = (pos?: string) => {
      const h = H(<PublicCoverBanner content={{ cover_title: "Atelier Nord", text_position: pos }} ctx={pCtx()} />)
      const s = /class="qfb-content" style="([^"]*)"/.exec(h)![1]
      return [/justify-content:([^;]+)/.exec(s)![1], /align-items:([^;]+)/.exec(s)![1]]
    }
    expect(cadre(), "défaut : en bas à gauche").toEqual(["flex-end", "flex-start"])
    expect(cadre("bottom-left")).toEqual(["flex-end", "flex-start"])
    expect(cadre("bottom-center")).toEqual(["flex-end", "center"])
    expect(cadre("center")).toEqual(["center", "center"])
  })
  it("vide : l'éditeur le dit, la page se tait", () => {
    expect(H(<EditorCoverBanner content={{}} ctx={eCtx()} />)).toContain("Ajoutez une image ou un titre")
    expect(H(<PublicCoverBanner content={{}} ctx={pCtx()} />)).toBe("")
  })
})

describe("service_area", () => {
  it("une ville seule suffit, des deux côtés", () => {
    const c = { city3: "Reims" }
    expect(zoneDesservie(c)!.villes).toEqual(["Reims"])
    expect(hasPublishableContent("service_area", c)).toBe(true)
    expect(H(<PublicServiceArea content={c} ctx={pCtx()} />)).toContain("Reims")
    expect(H(<EditorServiceArea content={c} ctx={eCtx()} />)).toContain("Reims")
  })
  it("une ligne d'espaces n'est pas une ville", () => {
    expect(zoneDesservie({ city1: "   " })).toBeNull()
  })
  it("l'aperçu et la page disent la même chose", () => {
    const c = { title: "Où j'interviens", area: "Marne", radius: "40 km", city1: "Reims", city2: "Épernay", note: "Déplacement offert" }
    expect(texte(H(<EditorServiceArea content={c} ctx={eCtx()} />))).toBe(texte(H(<PublicServiceArea content={c} ctx={pCtx()} />)))
  })
})

describe("free_gift", () => {
  it("le lien EST le cadeau : une adresse refusée ne publie plus de carte", () => {
    for (const url of ["", "   ", "#", "javascript:alert(1)"]) {
      expect(cadeauOffert({ url, description: "Mon guide" }), url).toBeNull()
      expect(hasPublishableContent("free_gift", { url }), url).toBe(false)
      expect(H(<PublicFreeGift content={{ url, description: "Mon guide" }} ctx={pCtx()} />), url).toBe("")
    }
  })
  it("rempli : un vrai lien, compté, et le même texte dans l'aperçu", () => {
    const c = { url: "https://atelier-nord.fr/guide.pdf", description: "Le guide des bougies", label: "Je le veux" }
    const p = H(<PublicFreeGift content={c} ctx={pCtx()} />)
    expect(p).toContain('href="https://atelier-nord.fr/guide.pdf"')
    expect(texte(H(<EditorFreeGift content={c} ctx={eCtx()} />))).toBe(texte(p))
  })
})

describe("popular_products", () => {
  it("le rang ne garde que sa médaille, le lien est jugé", () => {
    const [p] = produitsPopulaires({ p1_rank: "🥇 Numéro 1", p1_name: "Le classique", p1_url: "javascript:x" })
    expect(p.rang).toBe("🥇")
    expect(p.href).toBeNull()
  })
  it("un classement est une liste, et le prix est plafonné", () => {
    const c = { p1_name: "Le classique", p1_price: "1 290 € / an", p2_name: "Le léger" }
    const h = H(<PublicPopularProducts content={c} ctx={pCtx()} />)
    expect(h.match(/<li\b/g)?.length).toBe(2)
    expect(h).toContain("max-width:50%")
  })
  it("une ligne avec adresse devient un lien en ligne — pas dans l'aperçu", () => {
    const c = { p1_name: "Le classique", p1_url: "https://atelier-nord.fr/classique" }
    expect(H(<PublicPopularProducts content={c} ctx={pCtx()} />)).toContain('href="https://atelier-nord.fr/classique"')
    expect(H(<EditorPopularProducts content={c} ctx={eCtx()} />)).not.toContain("href=")
  })
  it("vide : l'éditeur le dit, la page se tait", () => {
    expect(H(<EditorPopularProducts content={{}} ctx={eCtx()} />)).toContain("Nommez un produit")
    expect(H(<PublicPopularProducts content={{}} ctx={pCtx()} />)).toBe("")
  })
})
