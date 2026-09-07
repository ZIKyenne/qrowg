// Modèle pur `album_block`. Couverture via SharedImageModel (décorative), plateformes
// (spotify/apple/deezer → liens durcis extHref), CTA via albumBlockCtaModel (libellé non
// navigable, faute de champ cta_url — parité éditeur/public établie en B09.11).
import { extHref, destinationUtile } from "../../types"
import { sharedImageModel, type SharedImageModel } from "./sharedImage"
import { albumBlockCtaModel, type AlbumBlockCtaModel } from "./albumBlockCta"

export type AlbumPlatform = { key: string; href: string; label: string; color: string; trackTarget: string }
export type AlbumBlockViewModel = {
  visible: boolean; cover: SharedImageModel; title: string; artist?: string
  year?: string; tracks?: string; description?: string; platforms: AlbumPlatform[]; cta: AlbumBlockCtaModel
}

const PLATS: [string, string, string][] = [["spotify_url", "🎧 Spotify", "#1DB954"], ["apple_url", "🍎 Apple", "#FC3C44"], ["deezer_url", "🎶 Deezer", "#A238FF"]]

export function albumBlockViewModel(content: Record<string, any> | null | undefined): AlbumBlockViewModel {
  const c = content || {}
  // Une plateforme dont l'adresse ne mene nulle part n'est pas listee : un
  // bouton « Spotify » qui ne fait rien vaut moins que pas de bouton du tout.
  const platforms = PLATS.map(([k, label, color]) => {
    const url = typeof c[k] === "string" ? c[k] : ""
    const href = destinationUtile(url)
    return href ? { key: k, href, label, color, trackTarget: url } : null
  }).filter((p): p is NonNullable<typeof p> => p !== null)
  return {
    visible: !!(c.title || c.cover), cover: sharedImageModel(c.cover, { decorative: true }),
    title: c.title || "Mon Album", artist: c.artist || undefined, year: c.year || undefined,
    tracks: c.tracks || undefined, description: c.description || undefined, platforms, cta: albumBlockCtaModel(c),
  }
}
