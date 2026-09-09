// Banc d'essai de « Équipe » (captures, tests) : monte l'écran client sans la garde
// d'auth, avec des données de démonstration clairement fictives. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import TeamPage from "@/app/dashboard/team/page"

export const dynamic = "force-dynamic"

export default async function E2EEquipePage() {
  if (!harnessAutorise()) notFound()

  return <ToastProvider><ConfirmProvider><TeamPage /></ConfirmProvider></ToastProvider>
}
