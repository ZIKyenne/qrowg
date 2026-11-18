// Banc de la coquille « appli » (lot 1, 18 nov.) : les crochets de
// lib/coquilleAppli montés sur une vraie zone de défilement, sans la coquille
// complète (qui exige une session). GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../../gate"
import BancCoquille from "../BancCoquille"

export const dynamic = "force-dynamic"

export default async function E2ECoquille({ params }: { params: Promise<{ ecran: string }> }) {
  if (!harnessAutorise()) notFound()
  const { ecran } = await params
  return <BancCoquille ecran={ecran} />
}
