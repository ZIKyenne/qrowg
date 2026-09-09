// Banc d'essai de « Redirections » (captures, tests) : monte l'écran client sans la garde
// d'auth, avec des données de démonstration clairement fictives. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import RedirectsPanel from "@/app/dashboard/redirects/RedirectsPanel"

export const dynamic = "force-dynamic"

export default async function E2ERedirectionsPage() {
  if (!harnessAutorise()) notFound()

  return <ToastProvider><ConfirmProvider><RedirectsPanel userDomains={["demo.exemple.fr"]} /></ConfirmProvider></ToastProvider>
}
