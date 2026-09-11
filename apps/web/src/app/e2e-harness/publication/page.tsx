// Banc d'essai de l'écran qui suit la première mise en ligne (captures, tests).
// Le composant est présentationnel : tout arrive par ses propriétés, donc il se
// regarde isolément, sans compte ni page publiée. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { PublicationHarness } from "./PublicationHarness"

export const dynamic = "force-dynamic"

export default async function E2EPublicationPage({ searchParams }: { searchParams: Promise<{ metier?: string; tel?: string }> }) {
  if (!harnessAutorise()) notFound()
  const { metier, tel } = await searchParams
  return <PublicationHarness metier={metier} mobile={tel === "1"} />
}
