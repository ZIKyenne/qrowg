// Banc d'essai de la création guidée (captures, tests) : monte l'écran sans la garde
// d'auth. Aucune donnée n'est envoyée tant qu'on ne va pas jusqu'à la génération.
// GATÉ : 404 en production.
//
// M01b, 5 octobre. Ce banc répondait **HTTP 500** aux trois largeurs du relevé
// mobile : « useToast doit être utilisé à l'intérieur de <ToastProvider> ».
// `OnboardingClient` appelle `useToast()`, et en production ce sont les deux
// fournisseurs de `DashboardShell` (ligne ~510) qui le lui donnent. Le banc
// montait le client tout nu.
//
// L'écran le plus décisif du produit — vu une seule fois, il décide de la suite —
// était donc le seul qu'aucune mesure ne pouvait atteindre. On reproduit ici la
// paire exacte de la production : ni plus, pour que le banc ne mente pas sur ce
// dont l'écran dispose vraiment, ni moins, pour qu'il démarre.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import OnboardingClient from "@/app/dashboard/onboarding/OnboardingClient"

export const dynamic = "force-dynamic"

export default async function E2EOnboardingPage() {
  if (!harnessAutorise()) notFound()
  return (
    <ToastProvider>
      <ConfirmProvider>
        <OnboardingClient />
      </ConfirmProvider>
    </ToastProvider>
  )
}
