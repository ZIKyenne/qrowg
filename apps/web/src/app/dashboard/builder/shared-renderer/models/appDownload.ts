// Modèle pur `app_download`. Liens stores iOS/Android. Public masqué si aucun
// lien ; l'éditeur affiche un placeholder textuel (aucune fausse image).
//
// Le lien passait par `extHref`, qui NORMALISE mais ne juge pas : « # » en
// ressort tel quel, et le bouton « App Store » partait vers nulle part. Il passe
// par `destinationUtile`, la règle qui décide si une adresse mène quelque part
// (lot v127).
import { destinationUtile } from "../../types"
import type { CtaLink } from "./ctaLink"

export type AppDownloadViewModel = { visible: boolean; label: string; ios: CtaLink | null; android: CtaLink | null }

function storeLink(url: unknown): CtaLink | null {
  const u = typeof url === "string" ? url : ""
  if (!u) return null
  // `visible: true` alors que `href` pouvait être nul : le modèle disait
  // « montre-le » pour un lien qui ne mène nulle part, et la vue posait « # ».
  // Une adresse inutilisable n'est pas un lien : le bloc entier disparaît si
  // aucun des deux magasins n'en a une.
  const href = destinationUtile(u)
  if (!href) return null
  return { href, external: true, trackTarget: u, visible: true }
}

export function appDownloadViewModel(content: Record<string, any> | null | undefined): AppDownloadViewModel {
  const c = content || {}
  const ios = storeLink(c.ios_url), android = storeLink(c.android_url)
  // « Titre » etait reglable et affiche nulle part.
  const label = typeof c.label === "string" ? c.label.trim() : ""
  return { visible: !!(ios || android), label, ios, android }
}
