// Banc d'essai de l'aperçu généré (Growth Engine, phase 1). GATÉ : 404 en
// production.
//
// `?prospect=bistrot|rapide|bar` choisit l'un des trois établissements fictifs.
// Les trois sont volontairement inégaux en informations : le bistrot est bien
// documenté, le comptoir ne l'est presque pas, le bar a des trous précis. C'est
// ce qui permet de vérifier que le générateur se tait là où il ne sait pas.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { GrowthPreviewHarness } from "./GrowthPreviewHarness"

export const dynamic = "force-dynamic"

export default async function E2EGrowthPreviewPage({ searchParams }: { searchParams: Promise<{ prospect?: string }> }) {
  if (!harnessAutorise()) notFound()
  const { prospect } = await searchParams
  return <GrowthPreviewHarness prospect={prospect} />
}
