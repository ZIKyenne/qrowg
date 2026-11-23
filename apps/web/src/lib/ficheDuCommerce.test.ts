import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ficheDuCommerce, estUnRestaurant, horairesDuCommerce, carteDuCommerce, prixSchema, imageDeLaPage, telephoneDuCommerce, adresseDuCommerce } from "./ficheDuCommerce"
import { jsonLdPage } from "./identitePageSeo"
import { sansCommentaires } from "./codeSeul"

// Vague 2, point 4 (revue du 23 nov.) : le JSON-LD d'un restaurant déclarait son
// nom… et l'avatar du compte. Adresse, téléphone, horaires et carte étaient sur
// la page, saisis par le commerçant.

const PAGE = [
  { type: "profile", content: { name: "Chez Nénette", avatar: "https://cdn.exemple.fr/nenette.jpg" } },
  { type: "google_maps", content: { label: "Nous trouver", address: "4 place du Marché, 51100 Reims" } },
  { type: "call_button", content: { label: "Appeler", phone: "03 26 00 00 00" } },
  { type: "opening_hours", content: { mon_fri: "12h - 14h30, 19h - 22h30", saturday: "19h - 02h", sunday: "Fermé" } },
  { type: "menu_section", content: { category: "Entrées", item1_name: "Soupe", item1_price: "7", item1_desc: "Maison", item2_name: "Terrine", item2_price: "Prix du marché" } },
  { type: "carte_boissons", content: { title: "Vins", b1_name: "Brouilly", b1_type: "Rouges", b1_p1: "6 €" } },
]

describe("la fiche reprend ce que le commerçant a saisi", () => {
  const f = ficheDuCommerce(PAGE)
  it("adresse, téléphone, image de la page", () => {
    expect(f.address).toBe("4 place du Marché, 51100 Reims")
    expect(f.telephone).toBe("03 26 00 00 00")
    expect(f.image).toBe("https://cdn.exemple.fr/nenette.jpg")
  })
  it("les horaires, jours identiques regroupés ; le samedi ferme à 02:00 (le lendemain) ; dimanche fermé = absent", () => {
    expect(horairesDuCommerce(PAGE)).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "12:00", closes: "14:30" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "19:00", closes: "22:30" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "19:00", closes: "02:00" },
    ])
  })
  it("la carte : rubriques, produits, prix seulement quand c'est un montant net", () => {
    const menu = carteDuCommerce(PAGE) as any
    expect(menu["@type"]).toBe("Menu")
    expect(menu.hasMenuSection[0]).toEqual({ "@type": "MenuSection", name: "Entrées", hasMenuItem: [
      { "@type": "MenuItem", name: "Soupe", description: "Maison", offers: { "@type": "Offer", price: "7.00", priceCurrency: "EUR" } },
      { "@type": "MenuItem", name: "Terrine" },
    ] })
    expect(menu.hasMenuSection[1].name).toBe("Vins · Rouges")
    expect(prixSchema("12,5 €")).toBe("12.50")
    expect(prixSchema("+1 €")).toBeNull()
  })
  it("rien d'inventé : pas de gamme de prix, de cuisine ni de note", () => {
    for (const k of ["priceRange", "servesCuisine", "aggregateRating", "review", "starRating"]) expect(f, k).not.toHaveProperty(k)
  })
})

describe("ce qui n'est pas un fait du commerce n'est pas publié", () => {
  it("une valeur restée du modèle (plat d'exemple) est écartée", () => {
    const menu = carteDuCommerce([{ type: "menu_section", content: { item1_name: "Entrée du jour", item1_price: "—", item2_name: "Soupe" } }]) as any
    expect(menu.hasMenuSection[0].hasMenuItem.map((i: any) => i.name)).toEqual(["Soupe"])
  })
  it("un téléphone sans chiffres, une image embarquée ou locale : rien", () => {
    expect(telephoneDuCommerce([{ type: "call_button", content: { phone: "Appelez-nous" } }])).toBe("")
    expect(imageDeLaPage([{ type: "profile", content: { avatar: "data:image/png;base64,AAAA" } }])).toBe("")
    expect(imageDeLaPage([{ type: "profile", content: { avatar: "/images/x.png" } }])).toBe("")
  })
  it("une page sans ces blocs n'ajoute aucun champ", () => {
    expect(ficheDuCommerce([{ type: "profile", content: { name: "Studio" } }, { type: "social_links", content: {} }])).toEqual({})
    expect(adresseDuCommerce([])).toBe("")
  })
})

describe("le JSON-LD de la page", () => {
  it("une page à carte est un Restaurant, avec ses faits ; jamais l'avatar du compte", () => {
    const ld = jsonLdPage({ titre: "Chez Nénette", templateId: "resto_bistrot", url: "https://qrowg.com/chez-nenette", blocs: PAGE }) as any
    expect(ld.mainEntity["@type"]).toBe("Restaurant")
    expect(ld.mainEntity).toMatchObject({ name: "Chez Nénette", address: "4 place du Marché, 51100 Reims", telephone: "03 26 00 00 00", image: "https://cdn.exemple.fr/nenette.jpg" })
    expect(ld.mainEntity.hasMenu["@type"]).toBe("Menu")
    expect(estUnRestaurant([{ type: "carte_illustree" }])).toBe(true)
    expect(estUnRestaurant([{ type: "profile" }])).toBe(false)
  })
  it("la page d'une personne reste une personne, sans fiche d'établissement", () => {
    const ld = jsonLdPage({ titre: "Léa", templateId: "freelance_dev", url: "https://qrowg.com/lea", blocs: PAGE }) as any
    expect(ld.mainEntity["@type"]).toBe("Person")
    expect(ld.mainEntity).not.toHaveProperty("telephone")
  })
  it("la route passe les blocs, et ni la page ni l'image de partage ne lisent l'avatar du compte", () => {
    const page = sansCommentaires(readFileSync(join(__dirname, "../app/[slug]/page.tsx"), "utf8"))
    expect(page).toContain("blocs: blocks || []")
    expect(page).not.toContain("profile?.avatar_url")
    const og = sansCommentaires(readFileSync(join(__dirname, "../app/[slug]/og/route.tsx"), "utf8"))
    expect(og).not.toMatch(/avatar_url|full_name/)
  })
})
