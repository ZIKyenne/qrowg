// Banc d'essai de « Domaines » (captures, tests) : monte l'écran client sans la garde
// d'auth, avec des données de démonstration clairement fictives. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import DomainsPage from "@/app/dashboard/domains/DomainsPage"

export const dynamic = "force-dynamic"

export default async function E2EDomainesPage() {
  if (!harnessAutorise()) notFound()
  const pages = [{ id: "demo-page-1", title: "Carte restaurant (démo)", slug: "carte-restaurant-demo", status: "published" }, { id: "demo-page-2", title: "Avis Google (démo)", slug: "avis-google-demo", status: "published" }]
  return <ToastProvider><ConfirmProvider><DomainsPage pages={pages} plan="pro" /></ConfirmProvider></ToastProvider>
}
