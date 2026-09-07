// Modeles PURS de la famille musique (aucun React) : `latest_release`,
// `playlist_block`, `presave` et `music_links`.
//
// Ce qu'ils avaient :
//
//  · music_links — le bloc publiait jusqu'a CINQ liens et n'en tracait AUCUN.
//    Tous les autres blocs a lien remontent le clic ; celui-ci, non. L'artiste
//    voyait donc zero statistique sur le bloc dont c'est tout l'objet, et
//    pouvait en conclure que personne ne cliquait.
//
//  · presave — sans aucune adresse de plateforme, l'apercu dessinait quand meme
//    un bouton vert « Pre-sauvegarder sur Spotify ». La page n'en publie aucun.
//
//  · latest_release et playlist_block — le bouton Spotify etait vert plein dans
//    l'apercu et translucide en ligne. Deux dessins pour le meme bouton, et
//    seulement pour Spotify : Apple et Deezer, eux, concordaient.
//
//  · les quatre — l'apercu rendait un <img> brut pour la pochette.

import { destinationUtile } from "../../types"

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

/** Une plateforme d'ecoute : sa cle de contenu, son habillage, son adresse. */
export type Plateforme = { cle: string; label: string; couleur: string; texteSur: string; href: string }

type Definition = { cle: string; label: string; couleur: string; texteSur?: string }

function plateformes(c: Record<string, any>, defs: Definition[]): Plateforme[] {
  return defs
    .map(d => ({ ...d, texteSur: d.texteSur ?? "#fff", href: destinationUtile(txt(c[d.cle])) }))
    .filter((p): p is Plateforme => p.href !== null)
}

const ECOUTE: Definition[] = [
  { cle: "spotify_url", label: "🎧 Spotify", couleur: "#1DB954", texteSur: "#000" },
  { cle: "apple_url", label: "🍎 Apple", couleur: "#FC3C44" },
  { cle: "youtube_url", label: "▶ YT", couleur: "#FF0000" },
]
const PLAYLIST: Definition[] = [
  { cle: "spotify_url", label: "🎧 Spotify", couleur: "#1DB954", texteSur: "#000" },
  { cle: "apple_url", label: "🍎 Apple", couleur: "#FC3C44" },
  { cle: "deezer_url", label: "🎶 Deezer", couleur: "#A238FF" },
]
const PRESAVE: Definition[] = [
  { cle: "spotify_url", label: "💾 Pré-save Spotify", couleur: "#1DB954", texteSur: "#000" },
  { cle: "apple_url", label: "🍎 Apple Music", couleur: "#FC3C44" },
]
const CATALOGUE: Definition[] = [
  { cle: "spotify", label: "Spotify", couleur: "#1DB954" },
  { cle: "apple_music", label: "Apple Music", couleur: "#FC3C44" },
  { cle: "deezer", label: "Deezer", couleur: "#A238FF" },
  { cle: "youtube_music", label: "YouTube Music", couleur: "#FF0000" },
  { cle: "soundcloud", label: "SoundCloud", couleur: "#FF5500" },
]
const ICONES: Record<string, string> = {
  spotify: "🎵", apple_music: "🍎", deezer: "🎶", youtube_music: "▶️", soundcloud: "☁️",
}

// ── Dernière sortie ─────────────────────────────────────────────────────────

export type Sortie = { badge: string; pochette: string; titre: string; artiste: string; date: string; plateformes: Plateforme[] }

export function derniereSortie(c: Record<string, any> | null | undefined): Sortie | null {
  const src = c || {}
  const p = plateformes(src, ECOUTE)
  const titre = txt(src.title), pochette = txt(src.cover)
  if (!titre && !pochette && p.length === 0) return null
  return { badge: txt(src.badge), pochette, titre, artiste: txt(src.artist), date: txt(src.release_date), plateformes: p }
}

// ── Playlist ────────────────────────────────────────────────────────────────

export type Playlist = { pochette: string; titre: string; description: string; titres: string; plateformes: Plateforme[] }

export function playlist(c: Record<string, any> | null | undefined): Playlist | null {
  const src = c || {}
  const p = plateformes(src, PLAYLIST)
  const titre = txt(src.title)
  if (!titre && p.length === 0) return null
  return { pochette: txt(src.cover), titre, description: txt(src.description), titres: txt(src.tracks_count), plateformes: p }
}

// ── Pré-sauvegarde ──────────────────────────────────────────────────────────

export type Presave = { titre: string; pochette: string; nom: string; date: string; plateformes: Plateforme[] }

export function presave(c: Record<string, any> | null | undefined): Presave | null {
  const src = c || {}
  const p = plateformes(src, PRESAVE)
  const nom = txt(src.release_name)
  if (!nom && p.length === 0) return null
  return { titre: txt(src.title), pochette: txt(src.cover), nom, date: txt(src.release_date), plateformes: p }
}

// ── Liens d'écoute ──────────────────────────────────────────────────────────

export type LiensMusique = { artiste: string; plateformes: (Plateforme & { icone: string })[] }

export function liensMusique(c: Record<string, any> | null | undefined): LiensMusique | null {
  const src = c || {}
  const p = plateformes(src, CATALOGUE).map(x => ({ ...x, icone: ICONES[x.cle] ?? "🔗" }))
  if (p.length === 0) return null
  return { artiste: txt(src.artist_name), plateformes: p }
}
