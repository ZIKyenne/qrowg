import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { produit, produitVedette, comparaison, tarifs } from "./models/produitsEtTarifs"
import { EditorProduct, PublicProduct } from "./blocks/product"
import { EditorFeaturedProduct, PublicFeaturedProduct } from "./blocks/featured_product"
import { EditorOfferComparison, PublicOfferComparison } from "./blocks/offer_comparison"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Vague 18 — les blocs qui affichent un PRIX. Ceux qui rapportent de l'argent au
// commerçant, et ceux où l'aperçu mentait le plus :
//
//   · product écrivait « Produit » à la place du nom manquant, et n'affichait
//     PAS la description — un champ que le commerçant remplit, que le visiteur
//     lit, et que l'auteur ne voyait jamais. `apercuFidele.test.ts` le savait
//     déjà et l'avait inscrit comme « écart assumé » ;
//   · featured_product inventait un prix de « 99 € » quand le champ était vide,
//     PUIS calculait la remise contre ce faux prix : l'auteur voyait un
//     pourcentage qui n'existait pas ;
//   · offer_comparison posait le bouton dans chaque formule (trois boutons)
//     côté aperçu, et un seul sous le tableau côté page.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const clair: any = { ...sombre, bg: "#FFFFFF", text: "#1A1A1A", muted: "#6B7280" }

const eCtx = (theme: any = sombre): EditorRenderCtx =>
  ({ theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: theme.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const pCtx = (theme: any = sombre): PublicRenderCtx =>
  ({ theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} })

const H = (el: any) => renderToStaticMarkup(el)
const PAIN = { name: "Le pain de campagne", price: "4,20 €", old_price: "5,00 €", description: "Levain naturel, 24 h de pousse.", stock: "12", cta_label: "Commander", cta_url: "https://boutique.fr" }
const VEDETTE = { ...PAIN, badge: "Signature" }
const FORMULES = { title: "Nos formules", plan1_name: "Essentiel", plan1_price: "49 €", plan1_features: "Une chose\nDeux choses", plan2_name: "Confort", plan2_price: "89 €", plan2_highlight: "yes", cta_label: "Choisir", cta_url: "https://resa.fr" }

describe("vague 18 - product : plus de faux nom, et la description enfin visible", () => {
  it("un bloc sans nom, sans photo et sans prix ne publie rien", () => {
    expect(produit({})).toBeNull()
    expect(produit({ description: "Un texte", stock: "4" })).toBeNull()
    expect(PublicProduct({ content: {}, ctx: pCtx() } as any)).toBeNull()
  })
  it("l'apercu n'ecrit plus « Produit » a la place du nom", () => {
    const h = H(<EditorProduct content={{ price: "4,20 €" }} ctx={eCtx()} />)
    expect(h).toContain("4,20")
    expect(h).not.toContain(">Produit<")
  })
  it("la description apparait des deux cotes", () => {
    // Elle etait inscrite dans apercuFidele.test.ts comme « ecart assume ».
    for (const h of [H(<EditorProduct content={PAIN} ctx={eCtx()} />), H(<PublicProduct content={PAIN} ctx={pCtx()} />)]) {
      expect(h).toContain("Levain naturel")
    }
  })
  it("la remise se calcule sur les prix reels, ou pas du tout", () => {
    expect(produit({ name: "A", price: "4,20 €", old_price: "5,00 €" })!.remise!.label).toBe("-16%")
    expect(produit({ name: "A", price: "4,20 €" })!.remise).toBeNull()
    expect(produit({ name: "A", price: "5 €", old_price: "4 €" })!.remise, "un « ancien prix » plus bas n'est pas une remise").toBeNull()
  })
  it("un produit epuise remplace le bouton, il ne le laisse pas cliquable", () => {
    const p = produit({ ...PAIN, stock: "0" })!
    expect(p.epuise).toBe(true)
    const h = H(<PublicProduct content={{ ...PAIN, stock: "0" }} ctx={pCtx()} />)
    expect(h).toContain("Épuisé")
    expect(h).not.toContain('href="https://boutique.fr"')
  })
  it("le bouton n'existe pas sans destination", () => {
    expect(produit({ name: "A", cta_label: "Commander" })!.cta).toBeNull()
    expect(produit({ name: "A", cta_label: "Commander", cta_url: "#" })!.cta).toBeNull()
  })
})

describe("vague 18 - featured_product : plus de prix invente", () => {
  it("sans prix saisi, aucun prix affiche", () => {
    // L'apercu ecrivait « 99€ », et calculait la remise CONTRE ce faux prix.
    const v = produitVedette({ name: "Le pain" })!
    expect(v.prix).toBe("")
    expect(v.remise).toBeNull()
    const h = H(<EditorFeaturedProduct content={{ name: "Le pain" }} ctx={eCtx()} />)
    expect(h).not.toContain("99")
  })
  it("une remise ne s'affiche qu'entre deux prix reels", () => {
    expect(produitVedette({ name: "A", old_price: "99 €" })!.remise, "un ancien prix seul n'est pas une remise").toBeNull()
    expect(produitVedette({ name: "A", price: "49 €", old_price: "99 €" })!.remise!.label).toBe("-51%")
  })
  it("le bloc se montre des qu'il a un nom OU une image ; le prix est facultatif", () => {
    expect(produitVedette({})).toBeNull()
    expect(produitVedette({ price: "49 €" })).toBeNull()
    expect(produitVedette({ name: "A" })).not.toBeNull()
    expect(produitVedette({ image: "https://x.co/a.jpg" })).not.toBeNull()
  })
  it("le badge prend sa couleur du mot employe", () => {
    expect(produitVedette({ name: "A", badge: "Signature" })!.badge!.icone).toBe("⭐")
    expect(produitVedette({ name: "A" })!.badge).toBeNull()
  })
})

describe("vague 18 - offer_comparison : un seul bouton, pas trois", () => {
  it("le bouton est unique et vit sous le tableau", () => {
    const h = H(<PublicOfferComparison content={FORMULES} ctx={pCtx()} />)
    expect((h.match(/Choisir/g) ?? []).length, "l'apercu en dessinait un par formule").toBe(1)
  })
  it("et l'apercu dessine exactement le meme", () => {
    const ed = H(<EditorOfferComparison content={FORMULES} ctx={eCtx()} />)
    expect((ed.match(/Choisir/g) ?? []).length).toBe(1)
    expect(ed).not.toContain("href=")
    expect(ed).toContain('aria-disabled="true"')
  })
  it("sans formule nommee, rien n'est publie", () => {
    expect(comparaison({ title: "Nos formules", cta_label: "Choisir" })).toBeNull()
    expect(H(<EditorOfferComparison content={{ title: "Nos formules" }} ctx={eCtx()} />)).toContain("Invisible en ligne")
  })
  it("les avantages se decoupent ligne a ligne, les vides sont ignores", () => {
    expect(comparaison({ plan1_name: "A", plan1_features: "Une chose\n\n  \nDeux choses" })!.formules[0].lignes)
      .toEqual(["Une chose", "Deux choses"])
  })
  it("seule la deuxieme formule peut etre mise en avant, et seulement si on le demande", () => {
    expect(comparaison(FORMULES)!.formules.map(f => f.vedette)).toEqual([false, true])
    expect(comparaison({ plan1_name: "A", plan2_name: "B" })!.formules.map(f => f.vedette)).toEqual([false, false])
  })
  it("tarifs : la colonne du milieu est mise en avant par position", () => {
    const t = tarifs({ title1: "A", price1: "1 €", title2: "B", price2: "2 €", title3: "C", price3: "3 €" })!
    expect(t.formules.map(f => f.vedette)).toEqual([false, true, false])
    expect(tarifs({})).toBeNull()
  })
})

describe("vague 18 - l'apercu montre ce qui sera publie", () => {
  const textes = (h: string) => h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
  for (const [type, Ed, Pub, contenu] of [
    ["product", EditorProduct, PublicProduct, PAIN],
    ["product-epuise", EditorProduct, PublicProduct, { ...PAIN, stock: "0" }],
    ["featured_product", EditorFeaturedProduct, PublicFeaturedProduct, VEDETTE],
    ["featured_product-sans-prix", EditorFeaturedProduct, PublicFeaturedProduct, { name: "Le pain", image: "" }],
    ["offer_comparison", EditorOfferComparison, PublicOfferComparison, FORMULES],
  ] as const) {
    it(type + " : memes textes des deux cotes", () => {
      expect(textes(H(<Ed content={contenu} ctx={eCtx()} />))).toEqual(textes(H(<Pub content={contenu} ctx={pCtx()} /> as any)))
    })
  }

  it("la photo passe par le meme chemin dimensionne des deux cotes", () => {
    const c = { ...PAIN, image: "https://abcdefgh.supabase.co/storage/v1/object/public/p/1.jpg" }
    for (const h of [H(<EditorProduct content={c} ctx={eCtx()} />), H(<PublicProduct content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("/_next/image")
    }
  })
})

describe("vague 18 - les surfaces suivent le theme", () => {
  it("la carte produit reste visible sur un theme clair", () => {
    expect(H(<PublicProduct content={PAIN} ctx={pCtx(clair)} />)).not.toMatch(/rgba\(255,255,255/)
    expect(H(<PublicProduct content={PAIN} ctx={pCtx()} />)).toMatch(/rgba\(255,255,255/)
  })
})

describe("vague 18 - activation", () => {
  it("les trois blocs sont dans le drapeau de migration", () => {
    for (const t of ["product", "featured_product", "offer_comparison"]) expect(SHARED_RENDERER_BLOCKS.has(t)).toBe(true)
  })
})
