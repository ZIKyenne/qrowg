"use client"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import CarteClient from "@/app/dashboard/pages/[id]/carte/CarteClient"
import { carteDeLaPage, avecEpuise } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import { menuSectionViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuSection"
import { menuTabsViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuTabs"
import { avecProduit } from "@/app/dashboard/builder/shared-renderer/models/ajoutDeProduit"
import { modifierProduit, retirerProduit, remettreProduit, type Retire } from "@/app/dashboard/builder/shared-renderer/models/editionDeProduit"
import { ardoiseDeLaPage, ardoiseEcrite, ardoiseNeuve, type PlatSaisi } from "@/app/dashboard/builder/shared-renderer/models/ardoiseDuJour"
import { OBJECTIVES, composeRecipe } from "@/app/dashboard/onboarding/objectives"
import { fermetureDeLaPage, avecFermeture, sansFermeture } from "@/app/dashboard/builder/shared-renderer/models/fermetureDuCommerce"
import { jourDuCommerce } from "@/app/dashboard/builder/shared-renderer/models/platDuJour"

const BLOCS_DEMO = [
  { id: "b1", type: "menu_section", position: 1, visible: true, content: avecEpuise({ category: "Cocktails signature", item1_name: "Mojito (démo)", item1_price: "9 €", item2_name: "Spritz (démo)", item2_price: "8 €", item3_name: "Espresso Martini (démo)", item3_price: "11 €" }, "Spritz (démo)", true) },
  { id: "b2", type: "menu_tabs", position: 2, visible: true, content: { title: "Boissons", sec1_title: "Bières", sec1_items: "Blonde pression (démo);5 €\nIPA (démo);6,5 €", sec2_title: "Softs", sec2_items: "Citronnade maison (démo);4 €", sec3_title: "Mocktail", sec3_items: "" } },
]

// ?ardoise= : « hier » (une ardoise d'hier à remettre), « jour » (déjà en ligne), absent = pas d'ardoise.
function ardoiseDuBanc(cas: string | undefined) {
  if (cas !== "hier" && cas !== "jour") return null
  const hier = new Date(Date.now() - 86400000)
  const c = { title: "L'ardoise du jour", validite: "Aujourd'hui seulement", d1_name: "Blanquette (démo)", d1_price: "14 €", d2_name: "Tarte du jour (démo)", d2_price: "6 €" } as Record<string, any>
  c.date = jourDuCommerce(cas === "hier" ? hier : new Date(), c)
  return { id: "b0", type: "plat_du_jour", position: 0, visible: true, content: c }
}

// ?recette=1 : l'arrivée après la création guidée « menu » (carte vide, page en brouillon).
const RECETTE = [{ id: "b9", type: "menu_tabs", position: 1, visible: true, content: composeRecipe(OBJECTIVES.find(o => o.key === "menu")!).blocks.find(b => b.type === "menu_tabs")!.content as any }]

export default function MaCarteHarness({ refus, vide, ardoise: cas, recette = false, horaires = false }: { refus: boolean; vide: boolean; ardoise?: string; recette?: boolean; horaires?: boolean }) {
  // Un tableau À PART : modifier BLOCS ici le changerait pour toutes les requêtes suivantes du serveur.
  const BLOCS = recette ? RECETTE : BLOCS_DEMO
  const rubriques = vide ? [] : carteDeLaPage(BLOCS as any, { section: menuSectionViewModel, onglets: menuTabsViewModel })
  const blocArdoise = ardoiseDuBanc(cas)
  const ardoise = blocArdoise ? ardoiseDeLaPage([blocArdoise], new Date()) : null
  // ?horaires=1 : la page a des horaires (sinon, Ma carte propose d'en ajouter).
  const blocHoraires = horaires ? { id: "h1", type: "opening_hours", position: 5, visible: true, content: { title: "Horaires", mon_fri: "12h - 14h30, 19h - 22h30" } as Record<string, any> } : null
  const fermeture = blocHoraires ? fermetureDeLaPage([blocHoraires], new Date()) : null
  const attendre = () => new Promise(r => setTimeout(r, 150))
  const actions = {
    basculer: async () => { await attendre(); return refus ? { ok: false, phrase: "Le serveur a refusé (banc d'essai)." } : { ok: true } },
    toutRemettre: async () => { await attendre(); return refus ? { ok: false, phrase: "Le serveur a refusé (banc d'essai)." } : { ok: true } },
    prix: async () => { await attendre(); return refus ? { ok: false, phrase: "Le serveur a refusé (banc d'essai)." } : { ok: true } },
    // Le VRAI module pur, sur une copie en mémoire : doublons et plafonds testés au navigateur.
    ajouter: async (blocId: string, section: number | null, nom: string, prix: string, desc: string) => {
      await attendre()
      if (refus) return { ok: false as const, phrase: "Le serveur a refusé (banc d'essai)." }
      const b = BLOCS.find(x => x.id === blocId)!
      const r = avecProduit(b.type, b.content as any, section, { nom, prix, desc })
      if (!r.ok) return { ok: false as const, phrase: r.phrase }
      b.content = r.content as any
      return { ok: true as const, produit: r.produit }
    },
    modifier: async (blocId: string, section: number | null, identite: string, nom: string, desc: string) => {
      await attendre()
      if (refus) return { ok: false as const, phrase: "Le serveur a refusé (banc d'essai)." }
      const b = BLOCS.find(x => x.id === blocId)!
      const r = modifierProduit(b.type, b.content as any, section, identite, { nom, desc })
      if (!r.ok) return r
      b.content = r.content as any
      return { ok: true as const, produit: r.produit }
    },
    retirer: async (blocId: string, section: number | null, identite: string) => {
      await attendre()
      if (refus) return { ok: false as const, phrase: "Le serveur a refusé (banc d'essai)." }
      const b = BLOCS.find(x => x.id === blocId)!
      const r = retirerProduit(b.type, b.content as any, section, identite)
      if (!r.ok) return r
      b.content = r.content as any
      return { ok: true as const, retire: r.retire }
    },
    remettre: async (blocId: string, section: number | null, retire: Retire) => {
      await attendre()
      const b = BLOCS.find(x => x.id === blocId)!
      const r = remettreProduit(b.type, b.content as any, section, retire)
      if (!r.ok) return r
      b.content = r.content as any
      return { ok: true as const }
    },
    // Le VRAI module pur, comme le serveur : existante réécrite, sinon une neuve.
    ardoise: async (_pageId: string, plats: PlatSaisi[]) => {
      await attendre()
      if (refus) return { ok: false as const, phrase: "Le serveur a refusé (banc d'essai)." }
      const r = blocArdoise ? ardoiseEcrite(blocArdoise.content, plats, new Date()) : ardoiseNeuve(plats, new Date())
      if (!r.ok) return r
      return { ok: true as const, ardoise: ardoiseDeLaPage([{ id: "b0", type: "plat_du_jour", position: 0, visible: true, content: r.content }], new Date())! }
    },
    fermer: async (_pageId: string, debut: string, fin: string | null) => {
      await attendre()
      if (refus) return { ok: false as const, phrase: "Le serveur a refusé (banc d'essai)." }
      const r = avecFermeture(blocHoraires!.content, debut, fin, new Date())
      if (!r.ok) return r
      blocHoraires!.content = r.content
      return { ok: true as const, fermeture: fermetureDeLaPage([blocHoraires!], new Date())! }
    },
    rouvrir: async () => {
      await attendre()
      blocHoraires!.content = sansFermeture(blocHoraires!.content)
      return { ok: true as const, fermeture: fermetureDeLaPage([blocHoraires!], new Date())! }
    },
  }
  return (
    <ToastProvider><ConfirmProvider>
      <CarteClient page={{ id: "00000000-0000-4000-8000-000000000001", title: "Red Fish (démo)", slug: "red-fish-demo", status: recette ? "draft" : "published" }} rubriques={rubriques} ardoise={ardoise} fermeture={fermeture} actions={actions} />
    </ConfirmProvider></ToastProvider>
  )
}
