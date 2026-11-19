// wifi.ts — le modèle PUR du bloc « Wi-Fi » (19 nov.).
//
// La question n°1 posée aux serveurs. Le client lit le nom du réseau, copie le
// mot de passe d'un geste. Pas de QR code dans la page : le client la lit déjà
// sur le téléphone qu'il veut connecter — il ne peut pas se scanner lui-même.

import { texteUtile } from "./repeaterExtract"

export type Wifi = { reseau: string; motDePasse: string; ouvert: boolean; note: string }

/** Le Wi-Fi du bloc, ou null tant qu'aucun réseau n'est nommé. */
export function wifiDuBloc(c: Record<string, any>): Wifi | null {
  const reseau = texteUtile(c?.ssid)
  if (!reseau) return null
  const motDePasse = texteUtile(c?.password)
  return { reseau, motDePasse, ouvert: !motDePasse, note: texteUtile(c?.note) }
}

/** Le mot de passe caché : autant de points que de caractères, au plus douze. */
export function masquer(motDePasse: string): string {
  return "•".repeat(Math.min(12, Math.max(6, motDePasse.length)))
}
