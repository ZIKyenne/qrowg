import { describe, it, expect, vi, beforeEach } from "vitest"

// « Ma carte » — les VRAIES actions serveur du comptoir (épuiser, prix, ajouter,
// retirer/remettre, tout remettre en vente, coller une carte, ardoise,
// traduction, fermeture), jouées contre une fausse base qui applique la RLS
// (v404) :
//  - pages : lecture de ses pages, de son équipe, et de TOUTE page publiée ;
//    écriture des siennes et de son équipe ;
//  - blocs : lecture ET écriture seulement via une page de son compte ou de
//    son équipe — aucun bloc d'autrui n'est lisible, même publié.
// Avant, epuises.test, lectureDeCarte.test et recetteMenu.test lisaient le
// texte de actions.ts.
//
// En le jouant (v404) : sur la page EN LIGNE d'un autre compte, « tout remettre
// en vente » et la traduction répondaient « fait » (zéro bloc lu, zéro écrit)
// et revalidaient son cache ; l'ardoise, l'import et les fermetures
// répondaient « vérifiez votre connexion » ou « ajoutez vos horaires ».

const banc = vi.hoisted(() => ({
  session: null as null | { id: string },
  base: {} as Record<string, Record<string, any>[]>,
  revalidees: [] as string[],
  pannes: [] as ((table: string, op: string) => any)[],
}))

vi.mock("next/cache", () => ({ revalidatePath: (p: string) => { banc.revalidees.push(p) } }))

let seq = 0
function requete(table: string, moi: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "update" | "insert" = "select", patch: Record<string, any> = {}, colonnes = "*", tri: string | null = null, retour = false
  const t = () => (banc.base[table] ??= [])
  const proprios = () => new Set([moi, ...(banc.base.team_members ?? []).filter(m => m.user_id === moi)
    .map(m => (banc.base.teams ?? []).find(x => x.id === m.team_id)?.owner_id).filter(Boolean)])
  const pageDe = (id: string) => (banc.base.pages ?? []).find(p => p.id === id)
  const ecrivable = (l: Record<string, any>) =>
    table === "pages" ? proprios().has(l.user_id) : table === "blocks" ? proprios().has(pageDe(l.page_id)?.user_id) : false
  const lisible = (l: Record<string, any>) =>
    table === "team_members" ? l.user_id === moi
    : table === "pages" ? ecrivable(l) || l.status === "published"
    : ecrivable(l)
  const garde = (l: Record<string, any>) => filtres.every(f => f(l))
  const embarquer = (l: Record<string, any>) => {
    const r: Record<string, any> = { ...l }
    if (colonnes.includes("pages(")) r.pages = pageDe(l.page_id) ? { slug: pageDe(l.page_id)!.slug } : null
    if (colonnes.includes("teams(")) r.teams = (banc.base.teams ?? []).find(x => x.id === l.team_id) ?? null
    return r
  }
  const executer = () => {
    for (const p of banc.pannes) { const e = p(table, op); if (e) return { data: null, error: e } }
    if (op === "update") {
      const ls = t().filter(l => lisible(l) && ecrivable(l) && garde(l)); ls.forEach(l => Object.assign(l, patch))
      return { data: retour ? ls.map(l => ({ id: l.id })) : null, error: null }
    }
    if (op === "insert") {
      if (!ecrivable(patch)) return { data: null, error: { code: "42501", message: "new row violates row-level security policy" } }
      const l = { id: `bloc_${++seq}`, ...patch }; t().push(l)
      return { data: [{ id: l.id }], error: null }
    }
    let ls = t().filter(l => lisible(l) && garde(l))
    if (tri) ls = [...ls].sort((a, b) => a[tri!] - b[tri!])
    return { data: ls.map(embarquer), error: null }
  }
  const q: any = {
    select(c?: string) { if (op === "select") colonnes = c ?? "*"; else retour = true; return q },
    update(p: Record<string, any>) { op = "update"; patch = p; return q },
    insert(p: Record<string, any>) { op = "insert"; patch = p; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    in(c: string, vs: unknown[]) { filtres.push(l => vs.includes(l[c])); return q },
    order(c: string) { tri = c; return q },
    maybeSingle: async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } },
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: banc.session } }) },
    from: (t: string) => requete(t, banc.session?.id ?? "anon"),
  }),
}))

import {
  basculerEpuise, changerPrix, ajouterProduit, toutRemettreEnVente, importerCarte,
  ecrireArdoise, enregistrerTraduction, annoncerFermeture, rouvrir, retirerUnProduit, remettreUnProduit, changerAllergenes,
} from "./actions"

const UU = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`
const MOI = "u_moi", AUTRE = "u_autre"
const PAGE = UU(1), PAGE_AUTRE = UU(2)
const COCKTAILS = UU(11), BOISSONS = UU(12), PROFIL = UU(13), INFOS = UU(14), BLOC_AUTRE = UU(21)
const bloc = (id: string) => banc.base.blocks.find(b => b.id === id)!
const SESSION_EXPIREE = "Votre session a expiré. Reconnectez-vous puis réessayez."

beforeEach(() => {
  banc.session = { id: MOI }
  banc.revalidees = []
  banc.pannes = []
  banc.base = {
    teams: [], team_members: [],
    pages: [
      { id: PAGE, user_id: MOI, slug: "red-fish", status: "published" },
      { id: PAGE_AUTRE, user_id: AUTRE, slug: "chez-autre", status: "published" },
    ],
    blocks: [
      { id: PROFIL, page_id: PAGE, type: "profile", position: 0, is_visible: true, content: { name: "Red Fish" } },
      { id: COCKTAILS, page_id: PAGE, type: "menu_section", position: 1, is_visible: true, content: { category: "Cocktails", item1_name: "Mojito", item1_price: "9€", item2_name: "Spritz", item2_price: "8€" } },
      { id: BOISSONS, page_id: PAGE, type: "menu_tabs", position: 2, is_visible: true, content: { title: "Boissons", sec1_title: "Softs", sec1_items: "Coca;3€", epuises: "Coca" } },
      { id: INFOS, page_id: PAGE, type: "text", position: 3, is_visible: true, content: { text: "Ouvert tard" } },
      { id: BLOC_AUTRE, page_id: PAGE_AUTRE, type: "menu_section", position: 0, is_visible: true, content: { category: "Plats", item1_name: "Burger", item1_price: "14€", epuises: "Burger" } },
    ],
  }
})

describe("épuiser, changer un prix, ajouter : sur sa carte", () => {
  it("épuiser puis remettre un produit : la page publique est revalidée à chaque fois", async () => {
    expect(await basculerEpuise(COCKTAILS, "Mojito", true)).toEqual({ ok: true })
    expect(bloc(COCKTAILS).content.epuises).toBe("Mojito")
    expect(bloc(COCKTAILS).content.item1_name).toBe("Mojito")
    expect(await basculerEpuise(COCKTAILS, "Mojito", false)).toEqual({ ok: true })
    expect(bloc(COCKTAILS).content.epuises ?? "").toBe("")
    expect(banc.revalidees).toEqual(["/red-fish", "/red-fish"])
  })

  it("changer un prix : écrit ; un prix illisible ou un produit disparu : rien n'est écrit", async () => {
    expect(await changerPrix(COCKTAILS, "Spritz", "8,50€")).toEqual({ ok: true })
    expect(bloc(COCKTAILS).content.item2_price).toBe("8,50€")
    const avant = JSON.stringify(bloc(COCKTAILS).content)
    const illisible = await changerPrix(COCKTAILS, "Spritz", "x".repeat(80))
    expect(illisible.ok).toBe(false)
    const disparu = await changerPrix(COCKTAILS, "Margarita", "10€")
    expect(disparu).toEqual({ ok: false, phrase: "Ce produit a changé depuis l'ouverture de l'écran. Rechargez la page." })
    expect(JSON.stringify(bloc(COCKTAILS).content)).toBe(avant)
    expect(banc.revalidees).toEqual(["/red-fish"])
  })

  it("ajouter un produit au bout de la rubrique ; un doublon est refusé", async () => {
    const r = await ajouterProduit(COCKTAILS, null, "  Negroni ", "10€", "")
    expect(r).toEqual({ ok: true, produit: { nom: "Negroni", prix: "10€", desc: "" } })
    expect(bloc(COCKTAILS).content).toMatchObject({ item3_name: "Negroni", item3_price: "10€" })
    expect((await ajouterProduit(COCKTAILS, null, "negroni", "11€", "")).ok).toBe(false)
    expect(bloc(COCKTAILS).content.item4_name).toBeUndefined()
  })

  it("retirer puis remettre (« Annuler ») rend la rubrique telle qu'elle était", async () => {
    const avant = JSON.stringify(bloc(COCKTAILS).content)
    const r = await retirerUnProduit(COCKTAILS, null, "Mojito")
    expect(r.ok).toBe(true)
    expect(JSON.stringify(bloc(COCKTAILS).content)).not.toContain("Mojito")
    expect((await remettreUnProduit(COCKTAILS, null, (r as any).retire)).ok).toBe(true)
    expect(JSON.parse(JSON.stringify(bloc(COCKTAILS).content))).toMatchObject(JSON.parse(avant))
  })

  it("des allergènes seulement pour un produit qui existe", async () => {
    expect(await changerAllergenes(COCKTAILS, "Mojito", [])).toEqual({ ok: true })
    expect(await changerAllergenes(COCKTAILS, "Produit inventé", [])).toEqual({ ok: false, phrase: "Ce produit a changé depuis l'ouverture de l'écran. Rechargez la page." })
  })

  it("tout remettre en vente vide les produits épuisés de tous les blocs", async () => {
    await basculerEpuise(COCKTAILS, "Spritz", true)
    expect(await toutRemettreEnVente(PAGE)).toEqual({ ok: true })
    expect(bloc(COCKTAILS).content.epuises ?? "").toBe("")
    expect(bloc(BOISSONS).content.epuises ?? "").toBe("")
    expect(bloc(BOISSONS).content.sec1_items).toBe("Coca;3€")
  })
})

describe("coller une carte", () => {
  const sections = [{ titre: "Vins", produits: [{ nom: "Bordeaux", prix: "6€", desc: "verre" }, { nom: "Rosé", prix: "5€", desc: "" }] }]

  it("rangée juste après la dernière carte : les blocs suivants descendent d'un cran", async () => {
    expect(await importerCarte(PAGE, "Cave", sections)).toEqual({ ok: true })
    const ordre = banc.base.blocks.filter(b => b.page_id === PAGE).sort((a, b) => a.position - b.position)
    expect(ordre.map(b => b.type)).toEqual(["profile", "menu_section", "menu_tabs", "menu_tabs", "text"])
    expect(ordre.map(b => b.position)).toEqual([0, 1, 2, 3, 4])
    expect(JSON.stringify(ordre[3].content)).toContain("Bordeaux")
    expect(banc.revalidees).toEqual(["/red-fish"])
  })

  it("une carte encore vide (création guidée) est remplie, pas doublée", async () => {
    bloc(BOISSONS).content = { title: "", sec1_title: "", sec1_items: "" }
    expect(await importerCarte(PAGE, "Cave", sections)).toEqual({ ok: true })
    expect(banc.base.blocks.filter(b => b.page_id === PAGE)).toHaveLength(4)
    expect(JSON.stringify(bloc(BOISSONS).content)).toContain("Bordeaux")
  })

  it("rien à coller : refus, rien n'est écrit", async () => {
    const avant = JSON.stringify(banc.base.blocks)
    expect((await importerCarte(PAGE, "Cave", [{ titre: "Vide", produits: [] }])).ok).toBe(false)
    expect(JSON.stringify(banc.base.blocks)).toBe(avant)
  })
})

describe("en équipe", () => {
  it("un membre tient la carte du propriétaire", async () => {
    banc.session = { id: "u_membre" }
    banc.base.teams = [{ id: "t1", owner_id: MOI }]
    banc.base.team_members = [{ team_id: "t1", user_id: "u_membre", role: "editor" }]
    expect(await basculerEpuise(COCKTAILS, "Mojito", true)).toEqual({ ok: true })
    expect(await toutRemettreEnVente(PAGE)).toEqual({ ok: true })
    expect(bloc(COCKTAILS).content.epuises ?? "").toBe("")
  })
})

describe("la carte d'un autre compte, même en ligne", () => {
  const INTROUVABLE = { ok: false, phrase: "Page introuvable." }

  it("aucun geste ne la touche, et son cache n'est jamais revalidé", async () => {
    const avant = JSON.stringify(banc.base.blocks)
    expect(await basculerEpuise(BLOC_AUTRE, "Burger", false)).toEqual({ ok: false, phrase: "Produit introuvable." })
    expect((await changerPrix(BLOC_AUTRE, "Burger", "1€")).ok).toBe(false)
    expect((await ajouterProduit(BLOC_AUTRE, null, "Frites", "4€", "")).ok).toBe(false)
    expect((await retirerUnProduit(BLOC_AUTRE, null, "Burger")).ok).toBe(false)
    expect(JSON.stringify(banc.base.blocks)).toBe(avant)
    expect(banc.revalidees).toEqual([])
  })

  it("les gestes de page : « introuvable », jamais « fait » ni une phrase fausse (défaut v404)", async () => {
    const avant = JSON.stringify(banc.base.blocks)
    expect(await toutRemettreEnVente(PAGE_AUTRE)).toEqual(INTROUVABLE)
    expect(await enregistrerTraduction(PAGE_AUTRE, "en", "Burger = Burger")).toEqual(INTROUVABLE)
    expect(await importerCarte(PAGE_AUTRE, "Cave", [{ titre: "Vins", produits: [{ nom: "Rosé", prix: "5€", desc: "" }] }])).toEqual(INTROUVABLE)
    expect(await ecrireArdoise(PAGE_AUTRE, [{ nom: "Plat du jour", prix: "12€" } as any])).toEqual(INTROUVABLE)
    expect(await annoncerFermeture(PAGE_AUTRE, "2026-12-24", null)).toEqual({ ok: false, phrase: "Page introuvable." })
    expect(await rouvrir(PAGE_AUTRE)).toEqual({ ok: false, phrase: "Page introuvable." })
    expect(JSON.stringify(banc.base.blocks)).toBe(avant)
    expect(banc.base.blocks.find(b => b.id === BLOC_AUTRE)!.content.epuises).toBe("Burger")
    expect(banc.revalidees).toEqual([])
  })
})

describe("ce qui n'écrit rien", () => {
  it("sans session : la phrase le dit, rien ne bouge", async () => {
    banc.session = null
    const avant = JSON.stringify(banc.base.blocks)
    expect(await basculerEpuise(COCKTAILS, "Mojito", true)).toEqual({ ok: false, phrase: SESSION_EXPIREE })
    expect(await toutRemettreEnVente(PAGE)).toEqual({ ok: false, phrase: SESSION_EXPIREE })
    expect(await importerCarte(PAGE, "Cave", [{ titre: "V", produits: [{ nom: "Rosé", prix: "5€", desc: "" }] }])).toEqual({ ok: false, phrase: SESSION_EXPIREE })
    expect(JSON.stringify(banc.base.blocks)).toBe(avant)
  })

  it("des entrées illisibles : refus avant toute lecture", async () => {
    expect((await basculerEpuise("pas-un-uuid", "Mojito", true)).ok).toBe(false)
    expect((await basculerEpuise(COCKTAILS, "", true)).ok).toBe(false)
    expect((await basculerEpuise(COCKTAILS, 42 as any, true)).ok).toBe(false)
    expect((await enregistrerTraduction(PAGE, "klingon", "x")).ok).toBe(false)
    expect((await ajouterProduit(COCKTAILS, 1.5, "A", "1€", "")).ok).toBe(false)
  })

  it("un bloc qui n'est pas une carte n'est pas un produit", async () => {
    expect(await basculerEpuise(PROFIL, "Red Fish", true)).toEqual({ ok: false, phrase: "Produit introuvable." })
    expect(bloc(PROFIL).content).toEqual({ name: "Red Fish" })
  })

  it("une écriture refusée par la base n'est jamais un « fait »", async () => {
    banc.pannes = [(t, op) => t === "blocks" && op === "update" ? { code: "XX000", message: "panne" } : null]
    expect((await basculerEpuise(COCKTAILS, "Mojito", true)).ok).toBe(false)
    expect((await toutRemettreEnVente(PAGE)).ok).toBe(false)
    expect(banc.revalidees).toEqual([])
  })

  it("une fermeture sans horaires sur la page : la phrase dit quoi faire", async () => {
    expect(await annoncerFermeture(PAGE, "2026-12-24", null)).toEqual({ ok: false, phrase: "Ajoutez d'abord vos horaires à la page." })
  })
})
