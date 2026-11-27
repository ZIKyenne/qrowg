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
    expect(r.map(x => [x.blocId, x.section, x.titre])).toEqual([["b1", null, "Cocktails"], ["b2", 1, "Boissons · Softs"]])
    expect(r[0].plats).toEqual([
      { nom: "Mojito", prix: "9€", desc: "", identite: "Mojito", epuise: true, allergenes: null },
      { nom: "Spritz", prix: "8€", desc: "", identite: "Spritz", epuise: false, allergenes: null },   // null = allergènes pas renseignés (vague 2)
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
  // Session, écriture confirmée, page revalidée, carte d'autrui intouchable :
  // JOUÉS depuis v404 (pages/[id]/carte/bancMaCarte.test.ts). Reste ici ce qu'un
  // banc ne voit pas : aucune de ces actions ne contourne la RLS.
  it("action serveur, jamais en service role", () => {
    expect(src).toContain('"use server"')
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

describe("« Ma carte » à un toucher de l'accueil", () => {
  it("avecCarte réduit les types de blocs à un booléen, sans garder les blocs", async () => {
    const { avecCarte } = await import("./epuises")
    const r = avecCarte([{ id: "a", blocks: [{ type: "profile" }, { type: "menu_tabs" }] }, { id: "b", blocks: [{ type: "profile" }] }, { id: "c", blocks: null }])
    expect(r).toEqual([{ id: "a", carte: true }, { id: "b", carte: false }, { id: "c", carte: false }])
  })
  it("l'accueil lit les types de blocs au chargement ET au rafraîchissement, et montre « Ma carte »", () => {
    const serveur = readFileSync(join(__dirname, "../../../page.tsx"), "utf8")
    const client = readFileSync(join(__dirname, "../../../DashboardClient.tsx"), "utf8")
    expect(serveur).toContain('select("id,title,slug,status,total_views,created_at,blocks(type)")')
    expect(client).toContain('select("id,title,slug,status,total_views,created_at,blocks(type)")')
    expect(client).toContain("href={lienMaCarte(page.id)}")
    // Une fonction d'un fichier "use client" ne s'appelle pas depuis le serveur.
    expect(serveur).toContain('import { avecCarte } from "@/app/dashboard/builder/shared-renderer/models/epuises"')
    expect(client).not.toMatch(/export function avecCarte/)
  })
})

describe("un onglet vide mais titré reste une rubrique (on y ajoute ses produits)", () => {
  it("« Mocktail » sans produit apparaît, avec son numéro d'onglet", () => {
    const r = carteDeLaPage([{ id: "b", type: "menu_tabs", position: 0, visible: true, content: { sec1_title: "Long drink", sec1_items: "Mojito;10€", sec2_title: "Mocktail", sec2_items: "" } }] as any, { section: menuSectionViewModel, onglets: menuTabsViewModel })
    expect(r.map(x => [x.section, x.titre, x.plats.length])).toEqual([[1, "Long drink", 1], [2, "Mocktail", 0]])
  })
})
