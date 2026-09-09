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
  const il_y_a = (j: number) => new Date(Date.now() - j * 864e5).toISOString()
  const domains = [
    { id: "demo-d1", domain: "carte.bistrot-horizon.fr", page_id: "demo-page-1", txt_record: "qrowg-verify=demo1", is_primary: true, verified: true, verified_at: il_y_a(20), vercel_status: "verified", vercel_error: null, created_at: il_y_a(25), pages: { title: "Carte restaurant (démo)", slug: "carte-restaurant-demo" } },
    { id: "demo-d2", domain: "avis.bistrot-horizon.fr", page_id: "demo-page-2", txt_record: "qrowg-verify=demo2", is_primary: false, verified: false, verified_at: null, vercel_status: "pending", vercel_error: null, created_at: il_y_a(1), pages: { title: "Avis Google (démo)", slug: "avis-google-demo" } },
  ]
  return <ToastProvider><ConfirmProvider><DomainsPage pages={pages} plan="business" initialDomains={domains} /></ConfirmProvider></ToastProvider>
}
