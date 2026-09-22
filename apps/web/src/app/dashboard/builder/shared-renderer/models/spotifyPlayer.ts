// Modèle pur `spotify_player`. Carte média + ouverture externe (lien « Play » jugé par destinationUtile,
// tracké). Aucun lecteur intégré, aucune iframe.
//
// ── Lot v166 : « carte toujours rendue » était le défaut ────────────────────
//
// Cette ligne disait « Carte toujours rendue (fidèle legacy) ». Rendue à vide,
// elle publiait, sur la page qu'un client atteint en scannant :
//
//     🎧  Ma musique
//         Écouter sur Spotify
//
// et **aucun bouton** — parce que le bouton, lui, dépend du lien. Le client
// tapait sur une carte qui promet et ne mène nulle part.
//
// L'éditeur, lui, dessinait le bouton ▶ Play **dans tous les cas** : le
// commerçant voyait une carte complète et publiait une carte morte, sans que
// rien ne l'avertisse.
//
// Sur cent quarante-six blocs, sept restent visibles à vide ; les six autres
// sont des décorations (un trait, une marge, une bande de couleur) qui n'ont
// rien à remplir. Celui-ci était le seul bloc de CONTENU à publier une coquille,
// et ses propres frères — `music_links`, `presave`, `latest_release` —
// disparaissent quand ils n'ont rien à montrer. L'aligner sur eux n'est pas lui
// retirer quelque chose : c'est cesser de publier une promesse vide.
import { destinationUtile } from "../../types"
import { texteUtile } from "./repeaterExtract"
import type { CtaLink } from "./ctaLink"

export type SpotifyPlayerViewModel = { visible: boolean; title: string; link: CtaLink }

export function spotifyPlayerViewModel(content: Record<string, any> | null | undefined): SpotifyPlayerViewModel {
  const c = content || {}
  // Lot v166 : une ligne d'espaces n'est pas une ligne (règle du lot v153).
  const url = texteUtile(c.url)
  return {
    // Sans lien, la carte ne mène nulle part : elle ne se publie pas.
    visible: !!url,
    title: c.title || "Ma musique",
    link: { href: destinationUtile(url), external: true, trackTarget: url || "spotify_player", visible: !!url },
  }
}
