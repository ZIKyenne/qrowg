import { describe, it, expect } from "vitest"
import { lignesDeProduits, modifierProduit, retirerProduit, remettreProduit } from "./editionDeProduit"
import { avecEpuise, identiteDuPlat, estEpuise } from "./epuises"
import { parseMenuPaste } from "../../menuImport"
import { menuSectionViewModel } from "./menuSection"

const lu = (t: string) => parseMenuPaste(t, 500).map(p => [p.name, p.price, p.desc])
const FORMATS: Record<string, string> = {
  "point-virgule (Red Fish)": "MOJITO;10€;Havana club 3 ans, menthe\nCOCA-COLA;4.10€;\nPINA COLADA;10€;Saint James Bio",
  "tabulation": "Mojito\t10€\tMenthe\nSpritz\t8€\tApérol",
  "virgule": "Mojito,10,Menthe\nSpritz,8,Apérol",
  "markdown": "| Nom | Prix | Description |\n| --- | --- | --- |\n| Mojito | 10€ | Menthe |\n| Spritz | 8€ | Apérol |",
  "une colonne": "Mojito 10€\nSpritz 8€",
  "en-tête + Windows": "Nom;Prix;Description\r\n\r\nMojito;10€;Menthe\r\nSpritz;8€;Apérol",
}

describe("le repérage des lignes lit comme le rendu public", () => {
  for (const [nom, t] of Object.entries(FORMATS)) it(nom, () => {
    expect(lignesDeProduits(t).lignes.map(l => [l.nom, l.prix, l.desc])).toEqual(lu(t))
  })
})

describe("modifier un produit d'une grande carte", () => {
  for (const [format, t] of Object.entries(FORMATS)) it(`${format} : seule la ligne visée change`, () => {
    const avant = lu(t)
    const [n, , d] = avant[0]
    const r = modifierProduit("menu_tabs", { sec1_items: t }, 1, identiteDuPlat(n, d), { nom: "Virgin Mojito", desc: d })
    expect(r.ok).toBe(true)
    const apres = lu((r as any).content.sec1_items)
    expect(apres).toEqual([["Virgin Mojito", avant[0][1], d], ...avant.slice(1)])
  })
  it("ajouter une description à une carte d'une colonne", () => {
    const r = modifierProduit("menu_tabs", { sec1_items: "Mojito 10€\nSpritz 8€" }, 1, "Mojito", { nom: "Mojito", desc: "Menthe fraîche" })
    expect(lu((r as any).content.sec1_items)).toEqual([["Mojito", "10€", "Menthe fraîche"], ["Spritz", "8€", ""]])
  })
  it("l'état « épuisé » suit le produit renommé", () => {
    const c = avecEpuise({ sec1_items: "MOJITO;10€;Menthe" }, identiteDuPlat("MOJITO", "Menthe"), true)
    const r = modifierProduit("menu_tabs", c, 1, identiteDuPlat("MOJITO", "Menthe"), { nom: "MOJITO CLASSIQUE", desc: "Menthe" })
    expect(estEpuise((r as any).content, identiteDuPlat("MOJITO CLASSIQUE", "Menthe"))).toBe(true)
  })
  it("refus : doublon, nom vide, produit introuvable", () => {
    const t = { sec1_items: "MOJITO;10€;Menthe\nSPRITZ;8€;Apérol" }
    expect(modifierProduit("menu_tabs", t, 1, "MOJITO · Menthe", { nom: "spritz", desc: "Apérol" })).toMatchObject({ ok: false })
    expect(modifierProduit("menu_tabs", t, 1, "MOJITO · Menthe", { nom: " ", desc: "" })).toMatchObject({ ok: false, phrase: "Donnez un nom au produit." })
    expect(modifierProduit("menu_tabs", t, 1, "DAÏQUIRI", { nom: "X", desc: "" })).toMatchObject({ ok: false })
  })
})

describe("retirer, puis « Annuler »", () => {
  for (const [format, t] of Object.entries(FORMATS)) it(`${format} : retirer le 1er puis le remettre redonne la carte`, () => {
    const avant = lu(t)
    const [n, , d] = avant[0]
    const r = retirerProduit("menu_tabs", { sec1_items: t }, 1, identiteDuPlat(n, d))
    expect(r.ok).toBe(true)
    expect(lu((r as any).content.sec1_items)).toEqual(avant.slice(1))
    const back = remettreProduit("menu_tabs", (r as any).content, 1, (r as any).retire)
    expect(lu((back as any).content.sec1_items)).toEqual(avant)
  })
  it("retirer le DERNIER produit d'un onglet ne laisse pas de ligne vide", () => {
    const r = retirerProduit("menu_tabs", { sec1_items: "Mojito;10€\nSpritz;8€" }, 1, "Spritz")
    expect((r as any).content.sec1_items).toBe("Mojito;10€")
  })
  it("homonymes : seul le magnum part", () => {
    const t = "CHAMPAGNE JOSEPH PERRIER;50€;Brut 75CL\nCHAMPAGNE JOSEPH PERRIER;110€;Magnum Brut 150CL"
    const r = retirerProduit("menu_tabs", { sec1_items: t }, 1, identiteDuPlat("CHAMPAGNE JOSEPH PERRIER", "Magnum Brut 150CL"))
    expect((r as any).content.sec1_items).toBe("CHAMPAGNE JOSEPH PERRIER;50€;Brut 75CL")
  })
  it("menu simple : les lignes suivantes remontent ; « Annuler » le remet à sa place", () => {
    const c = { item1_name: "Mojito", item1_price: "10€", item2_name: "Spritz", item2_price: "8€", item3_name: "Negroni", item3_price: "11€", item3_desc: "Gin" }
    const r = retirerProduit("menu_section", c, null, "Spritz")
    expect(menuSectionViewModel((r as any).content).items.map(i => i.name)).toEqual(["Mojito", "Negroni"])
    expect((r as any).retire).toEqual({ nom: "Spritz", prix: "8€", desc: "", index: 1 })
    const back = remettreProduit("menu_section", (r as any).content, null, (r as any).retire)
    expect(menuSectionViewModel((back as any).content).items.map(i => [i.name, i.price, i.desc ?? ""])).toEqual([["Mojito", "10€", ""], ["Spritz", "8€", ""], ["Negroni", "11€", "Gin"]])
  })
  it("un produit épuisé retiré puis remis revient épuisé", () => {
    const c = avecEpuise({ sec1_items: "Mojito;10€\nSpritz;8€" }, "Spritz", true)
    const r = retirerProduit("menu_tabs", c, 1, "Spritz")
    const back = remettreProduit("menu_tabs", (r as any).content, 1, (r as any).retire)
    expect(estEpuise((back as any).content, "Spritz")).toBe(true)
  })
})
