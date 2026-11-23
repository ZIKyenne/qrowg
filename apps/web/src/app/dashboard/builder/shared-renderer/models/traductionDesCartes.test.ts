import { describe, it, expect } from "vitest"
import {
  aTraduireDansLaPage, demandeDeLaPage, couvertureDeLaPage, repartirLaTraduction, avecLangue,
  languesDeLaPage, languesDuBloc, traductionDuBloc, itemsTraduits, etatDesLangues,
} from "./traductionDesCartes"
import { avecAllergenes, phraseAllergenes, ALLERGENES, ALLERGENES_TRADUITS } from "./allergenes"
import { menuSectionViewModel } from "./menuSection"

// Vague 2, point 2 (revue du 23 nov.) : toutes les cartes de la page dans la
// langue du client — une demande pour la page, répartie bloc par bloc.

const ENTREES = { id: "e", type: "menu_section", content: { category: "Entrées", item1_name: "Soupe", item1_desc: "Maison", item2_name: "Salade" } }
const PLATS = { id: "p", type: "menu_section", content: { category: "Plats", item1_name: "Steak", item2_name: "Soupe", item2_desc: "Maison" } }
const VINS = { id: "v", type: "carte_boissons", content: { title: "Vins", b1_name: "Brouilly", b1_type: "Rouges", b1_detail: "Gamay" } }
const PROFIL = { id: "x", type: "profile", content: { name: "Chez Nénette" } }
const PAGE = [PROFIL, ENTREES, PLATS, VINS]
const REPONSE = "# Entrées ; Starters\n# Plats ; Mains\nSoupe ; Soup ; Homemade\nSteak ; Steak\nBrouilly ; Brouilly ; Gamay grape\nInconnu ; Unknown"

describe("une demande pour toute la page", () => {
  const a = aTraduireDansLaPage(PAGE)
  it("produits et rubriques de toutes les cartes, sans doublon (« Soupe » est dans deux menus), sans le profil", () => {
    expect(a.produits.map(p => p.nom)).toEqual(["Soupe", "Salade", "Steak", "Brouilly"])
    expect(a.rubriques).toEqual(["Entrées", "Plats", "Vins", "Rouges"])
  })
  it("la demande garde le format de la carte illustrée", () => {
    const d = demandeDeLaPage(a, "en")
    expect(d).toContain("en anglais")
    expect(d).toContain("# Entrées")
    expect(d).toContain("Soupe ; Maison")
    expect(d).not.toContain("Chez Nénette")
  })
  it("la couverture compte ce que la réponse traduit, et ce qui restera en français", () => {
    const c = couvertureDeLaPage(a, REPONSE)
    // Traduits : Entrées, Plats (rubriques) + Soupe, Steak, Brouilly (produits).
    expect([c.traduits, c.total]).toEqual([5, 8])
    expect(c.manquants).toEqual(["Vins", "Rouges", "Salade"])
  })
})

describe("la réponse, répartie bloc par bloc", () => {
  const parBloc = repartirLaTraduction(PAGE, REPONSE)
  it("chaque carte reçoit ses lignes ; la ligne inconnue est ignorée ; le profil n'est pas touché", () => {
    expect(parBloc.get("e")).toBe("# Entrées ; Starters\nSoupe ; Soup ; Homemade")
    expect(parBloc.get("p")).toBe("# Plats ; Mains\nSteak ; Steak\nSoupe ; Soup ; Homemade")
    expect(parBloc.get("v")).toBe("Brouilly ; Brouilly ; Gamay grape")
    expect(parBloc.has("x")).toBe(false)
    expect([...parBloc.values()].join("\n")).not.toContain("Unknown")
  })
  it("le bloc offre la langue ; la page aussi ; retirer la langue l'efface", () => {
    const e = avecLangue(ENTREES.content, "en", parBloc.get("e")!)
    expect(languesDuBloc(e)).toEqual(["en"])
    expect(languesDeLaPage([{ ...ENTREES, content: e }, PLATS])).toEqual(["en"])
    expect(languesDuBloc(avecLangue(e, "en", ""))).toEqual([])
  })
  it("Ma carte voit chaque langue et ce qu'elle couvre", () => {
    const blocs = PAGE.map(b => ({ ...b, content: avecLangue(b.content, "en", parBloc.get(b.id) ?? "") }))
    expect(etatDesLangues(blocs)).toEqual([{ langue: "en", traduits: 5, total: 8 }])
  })
})

describe("appliquer : le texte affiché change, l'identité française reste", () => {
  it("noms, descriptions, et allergènes dans la langue du client", () => {
    let c: Record<string, any> = avecLangue(ENTREES.content, "en", "Soupe ; Soup ; Homemade")
    c = avecAllergenes(c, "Soupe · Maison", ["celeri", "lait"])
    const items = itemsTraduits(menuSectionViewModel(c).items, c, traductionDuBloc(c, "en"), "en")
    expect(items.map(i => [i.name, i.desc, i.allergenes])).toEqual([["Soup", "Homemade", "Milk, Celery"], ["Salade", undefined, ""]])
    // En français, rien ne bouge.
    expect(itemsTraduits(menuSectionViewModel(c).items, c, null, "fr")[0].name).toBe("Soupe")
  })
  it("les 14 allergènes existent dans chacune des 8 langues", () => {
    for (const [l, noms] of Object.entries(ALLERGENES_TRADUITS)) {
      expect(noms, l).toHaveLength(ALLERGENES.length)
      expect(noms.every(n => n.trim().length > 0), l).toBe(true)
    }
    expect(phraseAllergenes(["gluten", "fruits_a_coque"], "de")).toBe("Gluten, Schalenfrüchte")
    expect(phraseAllergenes(["gluten"], "xx")).toBe("Gluten")
  })
})
