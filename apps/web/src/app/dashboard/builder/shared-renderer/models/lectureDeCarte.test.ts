import { describe, it, expect } from "vitest"
import { lireUneCarte, prixDansLaLigne, allureDeTitre, contenuDeGrandeCarte, SECTIONS_MAX, PRODUITS_PAR_SECTION } from "./lectureDeCarte"
import { menuTabsViewModel } from "./menuTabs"

const resume = (t: string) => lireUneCarte(t).sections.map(s => [s.titre, s.produits.map(p => [p.nom, p.prix, p.desc])])

describe("une carte copiée d'un PDF (façon Red Fish)", () => {
  it("titres en majuscules, produit + prix, description à la ligne", () => {
    const t = [
      "LONG DRINK",
      "MOJITO 10€",
      "Havana club 3 ans, menthe, citron vert, sucre, Perrier",
      "PINA COLADA 10€",
      "Saint James Bio, jus d'ananas, purée de noix de coco",
      "",
      "SPRITZ",
      "APEROL SPRITZ 7,90€",
      "Apérol, prosecco, perrier",
      "B 52 6€",
      "CÔTE DE GASCOGNE UBY n°3 23.00€",
    ].join("\n")
    expect(resume(t)).toEqual([
      ["LONG DRINK", [
        ["MOJITO", "10€", "Havana club 3 ans, menthe, citron vert, sucre, Perrier"],
        ["PINA COLADA", "10€", "Saint James Bio, jus d'ananas, purée de noix de coco"],
      ]],
      ["SPRITZ", [
        ["APEROL SPRITZ", "7,90€", "Apérol, prosecco, perrier"],
        ["B 52", "6€", ""],
        ["CÔTE DE GASCOGNE UBY n°3", "23.00€", ""],
      ]],
    ])
    expect(lireUneCarte(t).aVerifier).toEqual([])
  })
})

describe("les autres façons d'écrire une carte", () => {
  it("points de conduite, « : » final, prix décimal sans devise, tiret", () => {
    const t = "Nos plats :\nEntrecôte 300g ........ 32,00 €\nSole meunière - 28,50\nRisotto aux truffes  24"
    expect(resume(t)).toEqual([["Nos plats", [["Entrecôte 300g", "32,00 €", ""], ["Sole meunière", "28,50", ""], ["Risotto aux truffes", "24", ""]]]])
  })
  it("prix seul sur sa ligne : il revient au produit d'avant", () => {
    expect(resume("DESSERTS\nCafé gourmand\n8€\nTiramisu\n7 €")).toEqual([["DESSERTS", [["Café gourmand", "8€", ""], ["Tiramisu", "7 €", ""]]]])
  })
  it("prix au milieu : la suite est la description", () => {
    expect(resume("Mojito 10€ menthe, citron vert")).toEqual([["Carte", [["Mojito", "10€", "menthe, citron vert"]]]])
  })
  it("carte sans devise (« Margherita 9 »)", () => {
    expect(resume("PIZZAS\nMargherita 9\nTomate, mozzarella\n4 fromages 12")).toEqual([["PIZZAS", [["Margherita", "9", "Tomate, mozzarella"], ["4 fromages", "12", ""]]]])
  })
  it("tableur (tabulations) et export point-virgule, titres d'une cellule", () => {
    expect(resume("Cocktails\nMojito\t10€\tMenthe\nSpritz\t8€")).toEqual([["Cocktails", [["Mojito", "10€", "Menthe"], ["Spritz", "8€", ""]]]])
    expect(resume("Softs\nCOCA-COLA;4.10€;\nVITTEL;3.30€;\nChaud\nEXPRESSO;2.00€;")).toEqual([
      ["Softs", [["COCA-COLA", "4.10€", ""], ["VITTEL", "3.30€", ""]]],
      ["Chaud", [["EXPRESSO", "2.00€", ""]]],
    ])
  })
})

describe("ce qui ne se lit pas est dit, pas jeté", () => {
  it("un prix seul en tête, un produit sans prix", () => {
    const c = lireUneCarte("12€\nBOISSONS\nCoca 4€\nCarafe d'eau offerte avec chaque repas, servie fraîche, à volonté")
    expect(c.aVerifier.map(a => a.raison)).toContain("Un prix seul, sans produit avant lui.")
    // Une longue ligne sans prix après un produit : sa description.
    expect(c.sections[0].produits[0].desc).toMatch(/^Carafe d'eau offerte/)
  })
  it("deux titres de suite : pas de section vide", () => {
    expect(resume("CARTE\nCOCKTAILS\nMojito 10€").map(s => s[0])).toEqual(["COCKTAILS"])
  })
  it("plafonds du rendu : 50 produits par onglet (« suite »), 20 onglets", () => {
    const long = ["VINS", ...Array.from({ length: 60 }, (_, i) => `Vin ${i + 1} ${i + 10}€`)].join("\n")
    const c = lireUneCarte(long)
    expect(c.sections.map(s => [s.titre, s.produits.length])).toEqual([["VINS", PRODUITS_PAR_SECTION], ["VINS (suite)", 10]])
    const beaucoup = Array.from({ length: 22 }, (_, i) => `SECTION ${String.fromCharCode(65 + i)}\nProduit ${i} 5€`).join("\n")
    const d = lireUneCarte(beaucoup)
    expect(d.sections).toHaveLength(SECTIONS_MAX)
    expect(d.aVerifier).toHaveLength(2)
  })
})

describe("petites règles", () => {
  it("prixDansLaLigne", () => {
    expect(prixDansLaLigne("Brut 75CL")).toBeNull()
    expect(prixDansLaLigne("Coca-Cola 33cl 4€")).toMatchObject({ avant: "Coca-Cola 33cl", prix: "4€" })
    expect(prixDansLaLigne("Menu 2")).toBeNull()              // entier nu hors mode « sans devise »
  })
  it("allureDeTitre", () => {
    expect(allureDeTitre("LONG DRINK")).toBe(true)
    expect(allureDeTitre("Nos desserts :")).toBe(true)
    expect(allureDeTitre("Havana club 3 ans, menthe")).toBe(false)
  })
})

describe("le bloc créé se relit à l'identique", () => {
  it("contenuDeGrandeCarte → menuTabsViewModel redonne sections et produits", () => {
    const lue = lireUneCarte("LONG DRINK\nMOJITO 10€\nHavana; menthe\nSOFTS\nCoca 4€")
    const vm = menuTabsViewModel(contenuDeGrandeCarte("Notre carte", lue.sections))
    expect(vm.title).toBe("Notre carte")
    expect(vm.sections.map(s => [s.title, s.items.map(i => [i.name, i.price, i.desc])])).toEqual([
      ["LONG DRINK", [["MOJITO", "10€", "Havana, menthe"]]],
      ["SOFTS", [["Coca", "4€", ""]]],
    ])
  })
})

describe("où se range la carte importée", () => {
  it("juste après la dernière carte ; les blocs suivants descendent d'un cran", async () => {
    const { placeDeLaCarte } = await import("./lectureDeCarte")
    // La page du Red Fish : profil, soirées, trois cartes, annonce, Instagram, horaires.
    const blocs = [
      { id: "profil", type: "profile", position: 1 }, { id: "soirees", type: "timeline", position: 3 },
      { id: "c1", type: "menu_tabs", position: 5 }, { id: "c2", type: "menu_tabs", position: 7 }, { id: "c3", type: "menu_tabs", position: 8 },
      { id: "annonce", type: "announcement", position: 10 }, { id: "insta", type: "social_feature", position: 11 }, { id: "horaires", type: "opening_hours", position: 13 },
    ]
    expect(placeDeLaCarte(blocs)).toEqual({ position: 9, decaler: [{ id: "annonce", position: 11 }, { id: "insta", position: 12 }, { id: "horaires", position: 14 }] })
  })
  it("positions collées : on décale tout ce qui suit", async () => {
    const { placeDeLaCarte } = await import("./lectureDeCarte")
    expect(placeDeLaCarte([{ id: "a", type: "menu_section", position: 0 }, { id: "b", type: "spacer", position: 1 }]))
      .toEqual({ position: 1, decaler: [{ id: "b", position: 2 }] })
  })
  it("sans carte : à la fin, rien ne bouge", async () => {
    const { placeDeLaCarte } = await import("./lectureDeCarte")
    expect(placeDeLaCarte([{ id: "a", type: "profile", position: 0 }, { id: "b", type: "spacer", position: 4 }])).toEqual({ position: 5, decaler: [] })
    expect(placeDeLaCarte([])).toEqual({ position: 0, decaler: [] })
  })
})

describe("l'import range la carte avec les autres", () => {
  it("importerCarte passe par placeDeLaCarte, décale avant d'insérer", async () => {
    const { readFileSync } = await import("node:fs")
    const { join } = await import("node:path")
    const src = readFileSync(join(__dirname, "../../../pages/[id]/carte/actions.ts"), "utf8")
    const i = src.indexOf("export async function importerCarte")
    const corps = src.slice(i)
    expect(corps).toContain("placeDeLaCarte(")
    expect(corps.indexOf("update({ position: d.position })")).toBeLessThan(corps.indexOf(".insert("))
  })
})

describe("à la création : la carte collée remplace les menus d'exemple", () => {
  it("à la place du premier menu ; les autres blocs restent dans l'ordre", async () => {
    const { avecLaCarteCollee, produitsDExemple } = await import("./lectureDeCarte")
    const { menuSectionViewModel } = await import("./menuSection")
    const modele = [
      { type: "profile", content: { name: "Le Bistrot" } },
      { type: "cta_button", content: { label: "Réserver" } },
      { type: "menu_section", content: { category: "Entrées", item1_name: "Foie gras", item1_price: "18€" } },
      { type: "menu_section", content: { category: "Plats", item1_name: "Entrecôte", item1_price: "32€", item2_name: "Sole", item2_price: "28€" } },
      { type: "opening_hours", content: {} },
    ]
    expect(produitsDExemple(modele, { section: menuSectionViewModel, onglets: menuTabsViewModel })).toBe(3)
    const lue = lireUneCarte("COCKTAILS\nMojito 10€\nSpritz 8€")
    const r = avecLaCarteCollee(modele, lue.sections)
    expect(r.map(b => b.type)).toEqual(["profile", "cta_button", "menu_tabs", "opening_hours"])
    expect(menuTabsViewModel(r[2].content).sections[0].items.map(i => i.name)).toEqual(["Mojito", "Spritz"])
  })
  it("sans carte collée : le modèle tel quel ; modèle sans menu : après le profil", async () => {
    const { avecLaCarteCollee } = await import("./lectureDeCarte")
    const m = [{ type: "profile", content: {} }, { type: "bio", content: {} }]
    expect(avecLaCarteCollee(m, [])).toEqual(m)
    expect(avecLaCarteCollee(m, lireUneCarte("Mojito 10€").sections).map(b => b.type)).toEqual(["profile", "menu_tabs", "bio"])
  })
})
