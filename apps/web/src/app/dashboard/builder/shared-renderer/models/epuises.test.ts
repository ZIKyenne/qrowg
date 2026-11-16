import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { avecEpuise, toutEnVente, estEpuise, epuisesDuBloc, carteDeLaPage, phraseEpuises, cleDuPlat, identiteDuPlat, CLE_EPUISES } from "./epuises"
import { menuSectionViewModel } from "./menuSection"
import { menuTabsViewModel } from "./menuTabs"
import { actionsDePage } from "@/lib/actionsDePage"

// « Plus de menthe ce soir » : un produit épuisé d'un toucher, sans rien effacer.
const carte = { category: "Cocktails", item1_name: "Mojito", item1_price: "9€", item2_name: "Spritz", item2_price: "8€" }

describe("épuiser, remettre en vente", () => {
  it("épuise par le NOM, sans toucher au reste du bloc", () => {
    const c = avecEpuise(carte, "Mojito", true)
    expect(c[CLE_EPUISES]).toBe("Mojito")
    expect({ ...c, [CLE_EPUISES]: undefined }).toEqual({ ...carte, [CLE_EPUISES]: undefined })
    expect(estEpuise(c, "mojito ")).toBe(true)     // casse et espaces ignorés
    expect(estEpuise(c, "Spritz")).toBe(false)
  })
  it("remettre en vente retire le nom ; deux fois le même geste ne double rien", () => {
    const deux = avecEpuise(avecEpuise(carte, "Mojito", true), "MOJITO", true)
    expect(epuisesDuBloc(deux).size).toBe(1)
    expect(estEpuise(avecEpuise(deux, "Mojito", false), "Mojito")).toBe(false)
  })
  it("l'état suit le plat quand l'éditeur réordonne les lignes", () => {
    const c = avecEpuise(carte, "Mojito", true)
    const reordonne = { ...c, item1_name: "Spritz", item1_price: "8€", item2_name: "Mojito", item2_price: "9€" }
    const vm = menuSectionViewModel(reordonne)
    expect(vm.items.map(i => [i.name, i.epuise])).toEqual([["Spritz", false], ["Mojito", true]])
  })
  it("tout remettre en vente vide la liste", () => {
    expect(epuisesDuBloc(toutEnVente(avecEpuise(carte, "Spritz", true))).size).toBe(0)
  })
})

describe("la grande carte à onglets", () => {
  it("un produit collé dans un onglet s'épuise aussi", () => {
    const c = avecEpuise({ title: "Boissons", sec1_title: "Cocktails", sec1_items: "Mojito;9€\nSpritz;8€" }, "Spritz", true)
    const vm = menuTabsViewModel(c)
    expect(vm.sections[0].items.map(i => [i.name, !!i.epuise])).toEqual([["Mojito", false], ["Spritz", true]])
  })
})

describe("la carte vue du comptoir", () => {
  const blocs = [
    { id: "b2", type: "menu_tabs", position: 2, visible: true, content: { title: "Boissons", sec1_title: "Softs", sec1_items: "Coca;3€" } },
    { id: "b1", type: "menu_section", position: 1, visible: true, content: avecEpuise(carte, "Mojito", true) },
    { id: "b3", type: "menu_section", position: 3, visible: false, content: { item1_name: "Caché" } },
    { id: "b4", type: "profile", position: 0, visible: true, content: { name: "Red Fish" } },
  ] as any[]
  const r = carteDeLaPage(blocs, { section: menuSectionViewModel, onglets: menuTabsViewModel })
  it("dans l'ordre de la page, sans les blocs masqués ni les autres blocs", () => {
    expect(r.map(x => [x.blocId, x.titre])).toEqual([["b1", "Cocktails"], ["b2", "Boissons · Softs"]])
    expect(r[0].plats).toEqual([
      { nom: "Mojito", prix: "9€", desc: "", identite: "Mojito", epuise: true },
      { nom: "Spritz", prix: "8€", desc: "", identite: "Spritz", epuise: false },
    ])
  })
  it("dit combien de produits sont épuisés, ou rien", () => {
    expect(phraseEpuises(r)).toBe("1 produit épuisé")
    expect(phraseEpuises([])).toBeNull()
  })
  it("clé de comparaison stable", () => {
    expect(cleDuPlat("  Piña   Colada ")).toBe(cleDuPlat("piña colada"))
  })
})

describe("on y arrive depuis Mes pages", () => {
  it("« Ma carte » juste après Modifier, seulement sur une page en ligne qui a une carte", () => {
    const p = { id: "p1", slug: "red-fish", status: "published", carte: true }
    expect(actionsDePage(p).slice(0, 2).map(a => [a.cle, (a as any).href])).toEqual([["modifier", "/dashboard/builder/p1"], ["carte", "/dashboard/pages/p1/carte"]])
    expect(actionsDePage({ ...p, carte: false }).map(a => a.cle)).not.toContain("carte")
  })
})

describe("les gestes passent par une action serveur gardée", () => {
  const src = readFileSync(join(__dirname, "../../../pages/[id]/carte/actions.ts"), "utf8")
  it("session, RLS, écriture confirmée, page revalidée", () => {
    expect(src).toContain('"use server"')
    expect(src).toContain("supabase.auth.getUser()")
    expect(src).toContain('.update({ content }).eq("id", blocId).select("id")')
    expect(src).toContain("revalidatePath(")
    expect(src).not.toContain("createAdminClient")
  })
})

// Relevé du 16 novembre, vraie carte du Red Fish : cinq « CHAMPAGNE JOSEPH
// PERRIER » distincts dans un même bloc, et des vins au verre et à la bouteille.
describe("des homonymes sur une vraie carte", () => {
  const vins = { title: "Champagnes et vins", sec1_title: "Champagnes brut",
    sec1_items: "CHAMPAGNE JOSEPH PERRIER;50,00€;Brut 75CL\nCHAMPAGNE JOSEPH PERRIER;53.00€;Brut Nature 75CL\nCHAMPAGNE JOSEPH PERRIER;110.00€;Magnum Brut 150CL",
    sec2_title: "Vins blancs", sec2_items: "POUILLY FUME;23.00€;Bouteille\nPOUILLY FUME;5.30€;Verre" }
  it("épuiser le magnum n'épuise que le magnum", () => {
    const c = avecEpuise(vins, identiteDuPlat("CHAMPAGNE JOSEPH PERRIER", "Magnum Brut 150CL"), true)
    const vm = menuTabsViewModel(c)
    expect(vm.sections[0].items.map(i => !!i.epuise)).toEqual([false, false, true])
  })
  it("la bouteille épuisée, le verre reste en vente", () => {
    const c = avecEpuise(vins, identiteDuPlat("POUILLY FUME", "Bouteille"), true)
    const r = carteDeLaPage([{ id: "b", type: "menu_tabs", position: 0, visible: true, content: c }] as any, { section: menuSectionViewModel, onglets: menuTabsViewModel })
    expect(r[1].plats.map(p => [p.desc, p.epuise])).toEqual([["Bouteille", true], ["Verre", false]])
  })
})

describe("la lecture de la carte demande les bonnes colonnes", () => {
  it("`is_visible` (nom en base), jamais `visible` ; une lecture refusée se dit", () => {
    const src = readFileSync(join(__dirname, "../../../pages/[id]/carte/page.tsx"), "utf8")
    expect(src).toContain('.select("id, type, content, is_visible, position")')
    expect(src).not.toMatch(/select\("[^"]*[\s,]visible/)
    expect(src).toContain("if (error) return <CarteClient")
  })
})
