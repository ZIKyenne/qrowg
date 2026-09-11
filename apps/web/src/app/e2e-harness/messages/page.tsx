// Banc d'essai de « Messages » (captures, tests) : monte l'écran client sans la garde
// d'auth, avec des données de démonstration clairement fictives. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import LeadsClient from "@/app/dashboard/leads/LeadsClient"

export const dynamic = "force-dynamic"

// ?vide=1 : le compte qui n'a encore reçu aucun message — l'état que traverse
// tout nouveau client, et que personne n'avait regardé.
export default async function E2EMessagesPage({ searchParams }: { searchParams?: Promise<{ vide?: string }> }) {
  if (!harnessAutorise()) notFound()
  const vide = ((await searchParams) ?? {}).vide === "1"
  const il_y_a = (h: number) => new Date(Date.now() - h * 36e5).toISOString()
  const pages = [{ id: "demo-page-1", title: "Carte restaurant (démo)", slug: "carte-restaurant-demo" }, { id: "demo-page-2", title: "Avis Google (démo)", slug: "avis-google-demo" }]
  const leads = [
    { id: "demo-l1", page_id: "demo-page-1", block_id: null, type: "reservation", name: "Camille (démo)", email: "camille@exemple.fr", phone: "+33 6 00 00 00 01", message: "Table pour 4, vendredi 20 h.", data: { personnes: 4 }, is_read: false, status: "new", created_at: il_y_a(2) },
    { id: "demo-l2", page_id: "demo-page-1", block_id: null, type: "quote", name: "Atelier Nord (démo)", email: "contact@exemple.fr", phone: null, message: "Devis pour une privatisation de 30 personnes.", data: {}, is_read: true, status: "in_progress", created_at: il_y_a(30) },
    { id: "demo-l3", page_id: "demo-page-2", block_id: null, type: "form", name: null, email: "anonyme@exemple.fr", phone: null, message: "Merci pour l'accueil !", data: {}, is_read: true, status: "done", created_at: il_y_a(80) },
  ]
  return <ToastProvider><ConfirmProvider><LeadsClient leads={vide ? [] : leads} pages={vide ? [pages[0]] : pages} /></ConfirmProvider></ToastProvider>
}
