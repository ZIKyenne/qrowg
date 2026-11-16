import { describe, it, expect } from "vitest"
import { avecPrix, texteAvecPrix, formaterCommeAvant, refusDuPrix } from "./prixDeLaCarte"
import { identiteDuPlat } from "./epuises"
import { parseMenuPaste } from "../../menuImport"
import { menuSectionViewModel } from "./menuSection"

// Le critère : après le changement, RELIRE le texte doit redonner les mêmes
// produits, avec seulement le nouveau prix là où il faut.
function verifie(texte: string, nom: string, desc: string, prix: string) {
  const avant = parseMenuPaste(texte)
  const r = texteAvecPrix(texte, identiteDuPlat(nom, desc), prix)
  const apres = parseMenuPaste(r.texte)
  expect(apres.length).toBe(avant.length)
  apres.forEach((p, i) => {
    const vise = p.name === nom && p.desc === desc
    expect({ ...p, price: vise ? avant[i].price : p.price }).toEqual(avant[i])
    if (vise) expect(p.price).toBe(prix)
  })
  return r
}

describe("une ligne de grande carte, quel que soit son format", () => {
  it("point-virgule (la vraie carte du Red Fish)", () => {
    const t = "MOJITO;10€;Havana club 3 ans, menthe, citron vert, sucre, Perrier\nPINA COLADA;10€;Saint James Bio, jus d’ananas, purée de noix de coco"
    expect(verifie(t, "MOJITO", "Havana club 3 ans, menthe, citron vert, sucre, Perrier", "11€").changees).toBe(1)
  })
  it("homonymes : seul le magnum change", () => {
    const t = "CHAMPAGNE JOSEPH PERRIER;50,00€;Brut 75CL\nCHAMPAGNE JOSEPH PERRIER;110.00€;Magnum Brut 150CL"
    const r = verifie(t, "CHAMPAGNE JOSEPH PERRIER", "Magnum Brut 150CL", "120.00€")
    expect(r.texte).toBe("CHAMPAGNE JOSEPH PERRIER;50,00€;Brut 75CL\nCHAMPAGNE JOSEPH PERRIER;120.00€;Magnum Brut 150CL")
  })
  it("tabulation, et espaces autour de la cellule conservés", () => {
    verifie("Mojito\t 10€ \tMenthe\nSpritz\t8€\tApérol", "Mojito", "Menthe", "11€")
    expect(texteAvecPrix("Mojito\t 10€ \tMenthe", "Mojito · Menthe", "11€").texte).toBe("Mojito\t 11€ \tMenthe")
  })
  it("virgule : un prix « 12,50 » ne crée pas de colonne", () => {
    const r = verifie("Mojito,10,Menthe\nSpritz,8,Apérol", "Mojito", "Menthe", "12.50")
    expect(texteAvecPrix("Mojito,10,Menthe", "Mojito · Menthe", "12,50").texte).toBe("Mojito,12.50,Menthe")
    expect(r.changees).toBe(1)
  })
  it("tableau markdown, ligne de tirets intacte", () => {
    const t = "| Nom | Prix | Description |\n| --- | --- | --- |\n| Mojito | 10€ | Menthe |"
    const r = texteAvecPrix(t, "Mojito · Menthe", "11€")
    expect(r.texte).toBe("| Nom | Prix | Description |\n| --- | --- | --- |\n| Mojito | 11€ | Menthe |")
  })
  it("une seule colonne « Nom 10€ »", () => {
    verifie("Mojito 10€\nSpritz 8€", "Mojito", "", "11€")
  })
  it("fins de ligne Windows, lignes vides et en-tête gardés", () => {
    const t = "Nom;Prix;Description\r\n\r\nMojito;10€;Menthe\r\nSpritz;8€;Apérol"
    expect(texteAvecPrix(t, "Mojito · Menthe", "11€").texte).toBe("Nom;Prix;Description\r\n\r\nMojito;11€;Menthe\r\nSpritz;8€;Apérol")
  })
  it("produit introuvable : rien ne change", () => {
    expect(texteAvecPrix("Mojito;10€;Menthe", "Daïquiri", "9€")).toEqual({ texte: "Mojito;10€;Menthe", changees: 0 })
  })
})

describe("les deux blocs de carte", () => {
  it("menu_section : le champ du prix, par identité", () => {
    const c = { item1_name: "Mojito", item1_price: "10€", item1_desc: "Menthe", item2_name: "Spritz", item2_price: "8€" }
    const r = avecPrix("menu_section", c, "Mojito · Menthe", "11€")
    expect(r.changees).toBe(1)
    expect(menuSectionViewModel(r.content).items.map(i => i.price)).toEqual(["11€", "8€"])
    expect(c.item1_price).toBe("10€")                 // l'original n'est pas muté
  })
  it("menu_tabs : chaque onglet est parcouru", () => {
    const c = { sec1_items: "Mojito;10€;Menthe", sec2_items: "Coca;4€;" }
    const r = avecPrix("menu_tabs", c, "Coca", "4.50€")
    expect(r.changees).toBe(1)
    expect(r.content.sec2_items).toBe("Coca;4.50€;")
    expect(r.content.sec1_items).toBe(c.sec1_items)
  })
})

describe("ce qu'on tape au clavier", () => {
  it("« 11 » prend la devise et l'espacement des prix voisins", () => {
    expect(formaterCommeAvant("10€", "11")).toBe("11€")
    expect(formaterCommeAvant("9 €", "9,50")).toBe("9,50 €")
    expect(formaterCommeAvant("10€", "11 €")).toBe("11 €")      // devise écrite : gardée
    expect(formaterCommeAvant("", "12")).toBe("12")
  })
  it("refus lisibles", () => {
    expect(refusDuPrix("11€")).toBeNull()
    expect(refusDuPrix("")).toBeNull()                          // vider le prix est permis
    expect(refusDuPrix("gratuit")).toBe("vide_interdit")
    expect(refusDuPrix("10;5")).toBe("caractere")
    expect(refusDuPrix("1".repeat(30))).toBe("trop_long")
  })
})
