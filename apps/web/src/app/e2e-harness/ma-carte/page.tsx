// Banc d'essai de « Ma carte ce soir » : l'écran réel, des données fictives, des
// actions simulées (aucune base). GATÉ : 404 en production. ?refus=1 : le
// serveur refuse chaque geste (vérifie le retour en arrière et le message).
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import MaCarteHarness from "./MaCarteHarness"

export const dynamic = "force-dynamic"

export default async function E2EMaCarte({ searchParams }: { searchParams?: Promise<{ refus?: string; vide?: string }> }) {
  if (!harnessAutorise()) notFound()
  const { refus, vide } = (await searchParams) ?? {}
  return <MaCarteHarness refus={refus === "1"} vide={vide === "1"} />
}
