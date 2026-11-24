// Banc d'essai du Atelier d'impression (tests) : monte l'îlot client sans la garde d'auth,
// pour vérifier l'arrivée depuis une page publiée (?metier/?objectif/?brand/?message/?cta/?item).
// GATÉE : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import PrintStudioClient from "@/app/dashboard/print-studio/PrintStudioClient"
import { ConfirmProvider } from "@/components/ui/Confirm"

export const dynamic = "force-dynamic"

export default async function E2EPrintStudioPage() {
  if (!harnessAutorise()) notFound()
  // La coquille du tableau de bord fournit la confirmation ; le banc aussi (vague 3 : relecture).
  return <ConfirmProvider><PrintStudioClient canAccess /></ConfirmProvider>
}
