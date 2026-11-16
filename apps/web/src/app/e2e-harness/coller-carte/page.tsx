// Banc d'essai de « Coller ma carte » : l'écran réel, une page fictive, un import
// simulé (aucune base). GATÉ : 404 en production. ?refus=1 : le serveur refuse.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import ColleCarteHarness from "./ColleCarteHarness"

export const dynamic = "force-dynamic"

export default async function E2EColleCarte({ searchParams }: { searchParams?: Promise<{ refus?: string }> }) {
  if (!harnessAutorise()) notFound()
  const { refus } = (await searchParams) ?? {}
  return <ColleCarteHarness refus={refus === "1"} />
}
