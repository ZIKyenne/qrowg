import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { BLOCK_DEFS } from "./blockDefs"
import { SHARED_RENDERER_BLOCKS } from "./shared-renderer/architecture"
import { RenduLegacy } from "../../[slug]/renduLegacy"

// ═══════════════════════════════════════════════════════════════════════════════
// UN BOUTON QUI NE MÈNE NULLE PART.
//
// Dette relevée le 7 septembre en vidant les `cta_url` inventés, et traitée ici.
// Le rendu public écrivait `href={extHref(c.cta_url) || "#"}` à trente endroits.
// Conséquence : le commerçant remplit « Commander », oublie l'adresse — ou en
// colle une que `extHref` refuse — et la page publie quand même un bouton bien
// visible. Le visiteur clique, la page se recharge, il ne se passe rien. C'est
// pire qu'un bouton absent : il croit que le commerce ne fonctionne pas.
//
// Même famille que le lien de formule extrait puis jeté (vague 12) et que la
// carte menant à une recherche Google vide (vague 13).
//
// LA RÈGLE : un bouton n'est publié que s'il a une destination. Pas de repli
// sur « # », pas d'ancre sans href — les deux se cliquent et ne font rien.
// ═══════════════════════════════════════════════════════════════════════════════

const theme: any = {
  bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F",
  text: "#F5F0E8", muted: "#A8A190", fontDisplay: "Fraunces, serif", fontBody: "DM Sans, sans-serif",
}

/** Les blocs qui portaient un repli « # », avec de quoi les rendre visibles
 *  SANS jamais leur donner d'adresse. */
const SANS_ADRESSE: Record<string, Record<string, any>> = {
  cta_button: { label: "Réserver" },
  social_feature: { network: "instagram", title: "Suivez-moi", cta_label: "Suivre" },
  pricing: { title1: "Essentiel", price1: "49 €", cta_label: "Choisir" },
  product: { name: "Le pain de campagne", price: "4,20 €", cta_label: "Commander" },
  promo_banner: { text: "Offre spéciale", cta_label: "En profiter" },
  event_info: { name: "Concert", cta_label: "Réserver" },
  calendly: { label: "Réserver un créneau" },
  instagram_feed: { username: "@atelier", cta_label: "Me suivre" },
  multi_cta: { btn1_label: "Appeler", btn1_icon: "📞" },
  product_catalog: { title: "Nos produits", p1_name: "Pain", p1_price: "4 €" },
  featured_product: { name: "Le pain", cta_label: "Commander" },
  offer_comparison: { plan1_name: "Basic", cta_label: "Choisir" },
  limited_offer: { title: "Black Friday", cta_label: "En profiter" },
  order_online: { label: "Commander en ligne" },
  free_gift: { title: "Votre cadeau", label: "Recevoir mon cadeau" },
  discord_server: { server_name: "Mon serveur", cta_label: "Rejoindre" },
  telegram_channel: { channel_name: "Mon canal", cta_label: "Rejoindre" },
  youtube_channel: { channel_name: "Ma chaîne", cta_label: "S'abonner" },
  twitch_live: { username: "atelier", cta_label: "Rejoindre le live" },
  tiktok_feed: { username: "@atelier", cta_label: "Me suivre" },
  favorite_links: { l1_label: "Mon site" },
  event_ticketing: { label: "Réserver ma place" },
  tickets_left: { count: "14", cta_label: "Réserver" },
  quote_request: { title: "Demander un devis", label: "Envoyer" },
  gift_card: { title: "Offrez une expérience", cta_label: "Acheter" },
  external_shop: { label: "Voir la boutique" },
  ticketing: { label: "Acheter mes billets" },
  merch: { title: "Mon shop", cta_label: "Voir la boutique" },
  hero_banner: { title: "Bienvenue", cta_label: "Découvrir", cta2_label: "Nous appeler" },
}

function rendre(type: string, content: Record<string, any>): string {
  return renderToStaticMarkup(
    <RenduLegacy block={{ id: "b1", type, content, position: 0 }} theme={theme} pageId="p1" ownerEmail="a@b.co" totalViews={0} />,
  )
}

describe("aucun bouton n'est publié sans destination", () => {
  const fautifs: string[] = []
  const orphelins: string[] = []
  for (const [type, contenu] of Object.entries(SANS_ADRESSE)) {
    if (SHARED_RENDERER_BLOCKS.has(type)) continue
    let html = ""
    try { html = rendre(type, contenu) } catch (e) { fautifs.push(`${type} : rendu impossible — ${(e as Error).message.slice(0, 60)}`); continue }
    if (/href="#"/.test(html)) fautifs.push(`${type} publie un bouton vers « # »`)
    // Une ancre sans href se clique aussi, et ne fait rien non plus.
    if (/<a(?![^>]*\shref=)/.test(html)) orphelins.push(`${type} publie une ancre sans href`)
  }

  it("plus aucun repli vers « # » sur la page publiée", () => {
    expect(fautifs.sort()).toEqual([])
  })

  it("ni ancre sans destination, qui se clique tout autant", () => {
    expect(orphelins.sort()).toEqual([])
  })

  it("le relevé porte sur assez de blocs pour valoir quelque chose", () => {
    const inconnus = Object.keys(SANS_ADRESSE).filter(t => !BLOCK_DEFS[t])
    expect(inconnus, "types inconnus dans le relevé").toEqual([])
    expect(Object.keys(SANS_ADRESSE).length).toBeGreaterThan(25)
  })
})

describe("mais un bouton avec une adresse est bien publié", () => {
  // L'autre moitié : supprimer le repli ne doit pas faire disparaître les
  // boutons qui, eux, mènent quelque part.
  const AVEC: Array<[string, Record<string, any>]> = [
    ["cta_button", { label: "Réserver", url: "https://resa.co" }],
    ["calendly", { label: "Réserver", url: "https://calendly.com/atelier" }],
    ["product", { name: "Le pain", price: "4 €", cta_label: "Commander", cta_url: "https://boutique.fr" }],
    ["external_shop", { label: "Voir la boutique", url: "https://boutique.fr" }],
    ["merch", { title: "Mon shop", cta_label: "Voir", cta_url: "https://shop.fr" }],
    ["hero_banner", { title: "Bienvenue", cta_label: "Découvrir", cta_url: "https://x.fr" }],
    ["tickets_left", { count: "14", cta_label: "Réserver", cta_url: "https://billets.fr" }],
    ["gift_card", { title: "Offrez", cta_label: "Acheter", cta_url: "https://cadeau.fr" }],
  ]
  for (const [type, contenu] of AVEC) {
    it(type + " : le lien saisi mène bien à cette adresse", () => {
      if (SHARED_RENDERER_BLOCKS.has(type)) return
      const html = rendre(type, contenu)
      const attendu = (contenu.url ?? contenu.cta_url) as string
      expect(html, `${type} a perdu son lien`).toContain(`href="${attendu}"`)
    })
  }
})

describe("le repli « # » a disparu du source", () => {
  it("plus aucun href ne retombe sur une ancre morte", async () => {
    const { readFileSync } = await import("node:fs")
    const { fileURLToPath } = await import("node:url")
    const src = readFileSync(fileURLToPath(new URL("../../[slug]/renduLegacy.tsx", import.meta.url)), "utf8")
    const restants = src.match(/href=\{[^}]*\|\|\s*"#"\}/g) ?? []
    expect(restants, "sites encore à corriger").toEqual([])
  })
})

// ── L'autre côté : l'aperçu ne dessine plus un bouton en silence ────────────
import { boutonsSansLien, cleDuLien, mentionBoutonSansLien } from "./boutonSansLien"

describe("l'aperçu dit ce que la page fera du bouton", () => {
  it("la clé du lien se déduit de celle du libellé", () => {
    expect(cleDuLien("cta_label")).toBe("cta_url")
    expect(cleDuLien("cta2_label")).toBe("cta2_url")
    expect(cleDuLien("label")).toBe("url")
    expect(cleDuLien("btn1_label")).toBe("btn1_url")
    expect(cleDuLien("stat1_label")).toBe("stat1_url")   // dérivée, mais non déclarée
    expect(cleDuLien("title")).toBeNull()
  })

  it("un libellé sans adresse est signalé", () => {
    const b = boutonsSansLien("product", { name: "Le pain", cta_label: "Commander" })
    expect(b.map(x => x.libelle)).toEqual(["Commander"])
    expect(b[0].cleLien).toBe("cta_url")
  })

  it("avec une adresse valable, aucun reproche", () => {
    expect(boutonsSansLien("product", { cta_label: "Commander", cta_url: "https://boutique.fr" })).toEqual([])
    expect(boutonsSansLien("product", { cta_label: "Commander", cta_url: "boutique.fr" })).toEqual([])
  })

  it("une adresse qui ne mène nulle part compte comme absente", () => {
    // `extHref` ne juge pas : elle laisse « # » tel quel et préfixe le reste en
    // https://, si bien que « javascript:alert(1) » devient
    // « https://javascript:alert(1) » — inoffensif, mais qui ne mène nulle part.
    for (const mauvais of ["#", "##", "  ", "javascript:alert(1)", "data:text/html,x", "vbscript:x"]) {
      expect(boutonsSansLien("product", { cta_label: "Commander", cta_url: mauvais }), mauvais).toHaveLength(1)
    }
  })

  it("« # » stocké sur d'anciennes pages ne publie plus de bouton", () => {
    // `availability` naissait avec cta_url: "#" avant le 7 septembre : ces
    // valeurs sont toujours en base sur les pages déjà composées.
    const html = rendre("product", { name: "Le pain", price: "4 €", cta_label: "Commander", cta_url: "#" })
    expect(html).not.toContain("href=")
    expect(html).toContain("Le pain")
  })

  it("on n'invente pas de reproche sur un champ que le panneau ne propose pas", () => {
    // `stat1_label` existe, `stat1_url` non : ce n'est pas un bouton.
    expect(boutonsSansLien("business_stats", { stat1_label: "Clients", stat1_value: "500+" })).toEqual([])
    expect(boutonsSansLien("type_inconnu", { cta_label: "X" })).toEqual([])
  })

  it("la mention est une phrase, au singulier comme au pluriel", () => {
    expect(mentionBoutonSansLien([])).toBeNull()
    expect(mentionBoutonSansLien([{ libelle: "Commander", cleLien: "cta_url" }])).toContain("« Commander »")
    expect(mentionBoutonSansLien([{ libelle: "A", cleLien: "x" }, { libelle: "B", cleLien: "y" }])).toContain("2 boutons")
  })

  it("l'aperçu est bien branché sur ce modèle", async () => {
    const { readFileSync } = await import("node:fs")
    const { fileURLToPath } = await import("node:url")
    const src = readFileSync(fileURLToPath(new URL("./builderPreview.tsx", import.meta.url)), "utf8")
    expect(src, "l'aperçu doit calculer la mention").toMatch(/const mention = mentionBoutonSansLien\(boutonsSansLien\(block\.type, c\)\)/)
    expect(src, "et l'afficher").toMatch(/avecMention\(\(\(\) =>/)
  })
})
