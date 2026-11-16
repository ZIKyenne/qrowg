"use client"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import CarteClient from "@/app/dashboard/pages/[id]/carte/CarteClient"
import { carteDeLaPage, avecEpuise } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import { menuSectionViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuSection"
import { menuTabsViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuTabs"
import { avecProduit } from "@/app/dashboard/builder/shared-renderer/models/ajoutDeProduit"

const BLOCS = [
  { id: "b1", type: "menu_section", position: 1, visible: true, content: avecEpuise({ category: "Cocktails signature", item1_name: "Mojito (démo)", item1_price: "9 €", item2_name: "Spritz (démo)", item2_price: "8 €", item3_name: "Espresso Martini (démo)", item3_price: "11 €" }, "Spritz (démo)", true) },
  { id: "b2", type: "menu_tabs", position: 2, visible: true, content: { title: "Boissons", sec1_title: "Bières", sec1_items: "Blonde pression (démo);5 €\nIPA (démo);6,5 €", sec2_title: "Softs", sec2_items: "Citronnade maison (démo);4 €", sec3_title: "Mocktail", sec3_items: "" } },
]

export default function MaCarteHarness({ refus, vide }: { refus: boolean; vide: boolean }) {
  const rubriques = vide ? [] : carteDeLaPage(BLOCS as any, { section: menuSectionViewModel, onglets: menuTabsViewModel })
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
  }
  return (
    <ToastProvider><ConfirmProvider>
      <CarteClient page={{ id: "00000000-0000-4000-8000-000000000001", title: "Red Fish (démo)", slug: "red-fish-demo", status: "published" }} rubriques={rubriques} actions={actions} />
    </ConfirmProvider></ToastProvider>
  )
}
