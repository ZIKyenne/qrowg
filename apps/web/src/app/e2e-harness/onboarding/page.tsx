// Banc d'essai de la création guidée (captures, tests) : monte l'écran sans la garde
// d'auth. Aucune donnée n'est envoyée tant qu'on ne va pas jusqu'à la génération.
// GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import OnboardingClient from "@/app/dashboard/onboarding/OnboardingClient"

export const dynamic = "force-dynamic"

export default async function E2EOnboardingPage() {
  if (!harnessAutorise()) notFound()
  return <OnboardingClient />
}
