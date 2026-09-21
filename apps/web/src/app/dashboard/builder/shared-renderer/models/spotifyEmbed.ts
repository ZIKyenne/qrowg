// Modèle pur `spotify_embed`. URL d'embed via `spotifyEmbedUrl` (transformation STRICTE et pure :
// allowlist open.spotify.com / URI spotify:, aucun repli sur URL arbitraire → "" si non reconnu).
// Aucune iframe arbitraire possible. Public masqué si pas de source valide.
//
// ── Lot v159 : cette promesse était écrite, elle n'était pas tenue ──────────
//
// Les trois lignes ci-dessus disaient déjà « aucun repli sur URL arbitraire » et
// « aucune iframe arbitraire possible ». `spotifyEmbedUrl` faisait pourtant
// exactement ce repli, et une adresse `javascript:` arrivait dans l'iframe de la
// page publiée. Le commentaire promettait ce que le code ne faisait pas.
//
// La fonction est réparée. Mais une promesse tenue par une seule fonction tient
// à cette fonction : `models/embed.ts` — le modèle d'iframe sûre de la vidéo et
// de la carte — pose pour cette raison une **double garde**, et écrit pourquoi :
// « la src finale DOIT correspondre à un domaine canonique connu, sinon
// rejetée ». Le bloc Spotify n'avait que la première. Il a maintenant les deux :
// ce qui sort d'ici est une adresse d'embed Spotify, ou rien.
import { spotifyEmbedUrl } from "../../types"

export type SpotifyEmbedViewModel = { visible: boolean; src: string | null; height: number }

/** Seconde garde : la src finale, ou rien. Même forme que `providerOf` (models/embed.ts). */
const EMBED_SPOTIFY = /^https:\/\/open\.spotify\.com\/embed\/(?:track|album|playlist|artist|episode|show)\/[a-zA-Z0-9]+(?:\?|$)/

export function spotifyEmbedViewModel(content: Record<string, any> | null | undefined): SpotifyEmbedViewModel {
  const c = content || {}
  const brut = spotifyEmbedUrl(typeof c.url === "string" ? c.url : "") || ""
  const src = EMBED_SPOTIFY.test(brut) ? brut : null
  const height = c.size === "lg" ? 352 : c.size === "sm" ? 80 : 152
  return { visible: src != null, src, height }
}
