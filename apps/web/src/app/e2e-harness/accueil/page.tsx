// Banc d'essai de « Accueil connecté » (captures, tests) : monte l'écran client sans la garde
// d'auth, avec des données de démonstration clairement fictives. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import DashboardClient from "@/app/dashboard/DashboardClient"

export const dynamic = "force-dynamic"

export default async function E2EAccueilPage() {
  if (!harnessAutorise()) notFound()
  const il_y_a = (j: number) => new Date(Date.now() - j * 864e5).toISOString()
  const pages = [
    { id: "demo-page-1", title: "Carte restaurant (démo)", slug: "carte-restaurant-demo", status: "published", total_views: 384, created_at: il_y_a(40) },
    { id: "demo-page-2", title: "Avis Google (démo)", slug: "avis-google-demo", status: "published", total_views: 123, created_at: il_y_a(12) },
    { id: "demo-page-3", title: "Menu du soir (démo)", slug: "menu-du-soir-demo", status: "draft", total_views: 0, created_at: il_y_a(2) },
  ]
  return <ToastProvider><ConfirmProvider><DashboardClient
      initialProfile={{ full_name: "Studio Horizon (démo)", plan: "pro", total_scans: 169, total_pages: 3, avatar_url: null }}
      initialPages={pages} initialMonthViews={507} initialTodayViews={23} initialWeekViews={[41, 58, 73, 66, 90, 102, 77]} /></ConfirmProvider></ToastProvider>
}
