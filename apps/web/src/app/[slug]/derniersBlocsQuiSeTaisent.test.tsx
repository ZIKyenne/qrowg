// Les derniers blocs qui se taisaient — garde de classe.
//
// ── Ce qui restait ────────────────────────────────────────────────────────
//
// Les lots v166 à v171 ont donné son détecteur à chacun des cent quarante-six
// blocs du renderer partagé. Restaient ceux que **seul le rendu legacy sert** :
// leur condition vit dans un `case` de `renduLegacy.tsx`, sans modèle à
// appeler. Quatorze d'entre eux n'avaient pas de détecteur — donc
// `hasPublishableContent` leur répondait « plein » par prudence, et :
//
//   · ils étaient absents de la liste d'avant publication ;
//   · une page qui n'aurait porté qu'eux, vides, s'annonçait comme montrant
//     quelque chose (lot v172) alors qu'elle serait blanche.
//
// ── Ce que recopier veut dire ici, et à quelle condition ─────────────────
//
// Il n'y a pas de modèle à interroger : les détecteurs ajoutés RECOPIENT la
// condition du `case`. La doctrine ne l'accepte qu'à une condition, posée au lot
// v152 pour les blocs d'action : une garde qui **exécute les deux côtés** et
// exige qu'ils disent la même chose. C'est ce fichier. Et chaque détecteur
// emploie la fonction du produit là où il y en a une — `destinationUtile`,
// `paymentLink`, `stickyActionHref` — plutôt que d'en réécrire le jugement.
//
// ── Deux blocs à part, et leur raison ────────────────────────────────────
//
// `visit_counter` ne se remplit pas : c'est le PRODUIT qui lui donne son
// nombre (les vues de la page). Aucun contenu ne peut le décider.
//
// `qr_code_block` ne publie **jamais** rien : son `case` est `return null`,
// sans condition. Il figure pourtant dans la bibliothèque. Ce n'est pas un bloc
// vide, c'est un bloc sans rendu — et ce lot ne fait que le nommer.

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import { RenduLegacy } from "./renduLegacy"
import { BLOCK_DEFS } from "../dashboard/builder/blockDefs"
import { SHARED_RENDERER_BLOCKS } from "../dashboard/builder/shared-renderer/architecture"
import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "../dashboard/builder/blockEmptyState"
import { alertesPublication } from "../dashboard/builder/AlertesPublication"
import { pageQuiMontreQuelqueChose, DECORATIONS, FORMULAIRES } from "@/lib/pageQuiMontreQuelqueChose"

const theme: any = { primary: "#C9A84C", muted: "#8A8478", text: "#F5F0E8", surface: "#111009", fontDisplay: "Fraunces", fontBody: "DM Sans" }
const publie = (type: string, content: Record<string, any>): boolean => {
  try {
    return renderToStaticMarkup(createElement(RenduLegacy as never,
      { block: { id: "b1", type, content, visible: true }, theme, pageId: "p1" } as never)).trim() !== ""
  } catch { return false }
}

/** Les onze qui reçoivent leur détecteur, avec de quoi les remplir pour de vrai. */
const LES_ONZE: { type: string; rempli: Record<string, any> }[] = [
  { type: "documents", rempli: { d1_title: "Notre carte", d1_url: "https://exemple.fr/carte.pdf" } },
  { type: "external_shop", rempli: { url: "https://boutique.exemple.fr" } },
  { type: "popular_products", rempli: { p1_name: "Le classique" } },
  { type: "service_area", rempli: { area: "Lyon et alentours" } },
  { type: "image_carousel", rempli: { img1: "https://exemple.supabase.co/a.png" } },
  { type: "media_before_after", rempli: { before_img: "https://exemple.supabase.co/a.png" } },
  { type: "youtube_gallery", rempli: { video1_url: "https://youtube.com/watch?v=abc" } },
  { type: "tiktok_gallery", rempli: { video1_url: "https://tiktok.com/@marcel/video/1" } },
  { type: "sticky_bar", rempli: { a1_type: "call", a1_value: "+33 6 12 34 56 78" } },
  { type: "multi_cta", rempli: { btn1_label: "Réserver", btn1_url: "https://exemple.fr" } },
  { type: "payment_button", rempli: { platform: "PayPal", url: "https://paypal.me/marcel" } },
]

describe("garde de classe : l'éditeur et la page legacy disent la même chose", () => {
  it("à vide : aucun des onze ne publie, et le détecteur le sait", () => {
    const desaccords: string[] = []
    for (const { type } of LES_ONZE) {
      expect(EMPTY_STATE_BLOCK_TYPES, `${type} a son détecteur`).toContain(type)
      if (publie(type, {})) desaccords.push(`${type} : la page publie quelque chose à vide`)
      if (hasPublishableContent(type, {})) desaccords.push(`${type} : le détecteur le croit plein`)
    }
    expect(desaccords).toEqual([])
  })

  it("rempli : la page publie, et le détecteur dit oui", () => {
    // Sans ce sens-là, onze détecteurs répondant toujours « vide » passeraient.
    const fautifs: string[] = []
    for (const { type, rempli } of LES_ONZE) {
      if (!publie(type, rempli)) fautifs.push(`${type} : la page ne publie rien alors qu'il est rempli`)
      if (!hasPublishableContent(type, rempli)) fautifs.push(`${type} : le détecteur le croit vide alors qu'il est rempli`)
    }
    expect(fautifs).toEqual([])
  })

  it("champ par champ : le détecteur est le miroir EXACT du `case`", () => {
    // C'est la condition à laquelle la recopie est admise. On interroge chaque
    // champ déclaré du bloc, un par un, et on compare ce que la page en fait à
    // ce que le détecteur en dit — le geste du lot v152.
    const desaccords: string[] = []
    let sondes = 0
    for (const { type } of LES_ONZE) {
      const champs = ((BLOCK_DEFS as Record<string, { fields?: { key: string; type?: string }[] }>)[type]?.fields ?? [])
      for (const f of champs.slice(0, 16)) {
        const valeur = f.type === "url" || /url$/.test(f.key) ? "https://exemple.fr/p"
          : /(^|_)(img|image|photo)\d*$/.test(f.key) ? "https://exemple.supabase.co/a.png" : "Réel"
        const contenu = { [f.key]: valeur }
        sondes++
        const p = publie(type, contenu)
        const d = hasPublishableContent(type, contenu)
        if (p !== d) desaccords.push(`${type}.${f.key} : la page ${p ? "publie" : "ne publie rien"}, le détecteur dit ${d ? "plein" : "vide"}`)
      }
    }
    expect(sondes, "des sondes tirées des champs déclarés").toBeGreaterThan(60)
    expect(desaccords, "une recopie n'est admise que si elle est vérifiée").toEqual([])
  }, 120_000)

  it("une ligne d'espaces ne remplit rien", () => {
    for (const { type, rempli } of LES_ONZE) {
      const vide = Object.fromEntries(Object.keys(rempli).map(k => [k, "   "]))
      expect(hasPublishableContent(type, vide), `${type} : des espaces`).toBe(false)
    }
  })
})

describe("les deux blocs à part, et leur raison", () => {
  it("`visit_counter` ne se remplit pas : c'est le produit qui lui donne son nombre", () => {
    const champs = ((BLOCK_DEFS as Record<string, { fields?: { key: string }[] }>).visit_counter?.fields ?? [])
    expect(champs.every(f => !/count|value|nombre/i.test(f.key)),
      "aucun champ ne porte le compte : il vient des vues de la page").toBe(true)
    expect(EMPTY_STATE_BLOCK_TYPES, "il n'a donc pas de détecteur de contenu").not.toContain("visit_counter")
  })

  it("`qr_code_block` ne publie JAMAIS rien — et il est dans la bibliothèque", () => {
    // Ce n'est pas un bloc vide : c'est un bloc sans rendu. Ce lot le nomme,
    // il ne le répare pas — retirer une entrée de la bibliothèque est une
    // décision de produit, pas de garde.
    expect("qr_code_block" in BLOCK_DEFS, "il est bien proposé").toBe(true)
    expect(publie("qr_code_block", { size: "200", color: "#000" }), "et rien ne le fait publier").toBe(false)
  })
})

describe("le compte : plus un seul bloc du catalogue ne se tait", () => {
  it("aucun type sans détecteur, hors décorations, formulaires et les deux nommés", () => {
    const A_PART = ["visit_counter", "qr_code_block"]
    const sans = Object.keys(BLOCK_DEFS)
      .filter(t => !SHARED_RENDERER_BLOCKS.has(t))
      .filter(t => !DECORATIONS.includes(t) && !FORMULAIRES.includes(t) && !A_PART.includes(t))
      .filter(t => pageQuiMontreQuelqueChose([{ type: t, content: {} } as never]))
    expect(sans, `sans détecteur : ${sans.join(", ")}`).toEqual([])
    expect(Object.keys(BLOCK_DEFS).length, "le balayage voit bien le catalogue").toBeGreaterThan(150)
  })

  it("…et une page qui n'en porte que des vides s'annonce vide", () => {
    const page = LES_ONZE.slice(0, 4).map(({ type }) => ({ id: type, type, content: {}, visible: true } as never))
    expect(pageQuiMontreQuelqueChose(page as never), "elle ne montre rien").toBe(false)
    const alertes = alertesPublication(page as never)
    expect(alertes.some(a => a.texte.includes("la page sera vide")), "et le commerçant l'apprend avant").toBe(true)
    expect(alertes.filter(a => a.blocId !== "").length, "chaque bloc est nommé aussi").toBe(4)
  })
})
