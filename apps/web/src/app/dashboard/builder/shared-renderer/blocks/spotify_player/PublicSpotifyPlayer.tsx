"use client"
import { spotifyPlayerViewModel } from "../../models/spotifyPlayer"
import { PublicCtaLink } from "../../primitives/BlockCtaLink"
import type { PublicAdapterProps } from "../../renderTypes"

// Public : carte + lien externe « Play » (aucun lecteur intégré). Sans lien, rien —
// le bloc ne publie plus une carte qui promet et ne mène nulle part (lot v166).
export function PublicSpotifyPlayer({ content, ctx }: PublicAdapterProps) {
  const { visible, title, link } = spotifyPlayerViewModel(content)
  if (!visible) return null
  const { TEXT, MUTED, FONT_B, trackClick } = ctx
  return (
    <div style={{ padding: "6px 24px 16px" }}>
      <div style={{ background: "rgba(29,185,84,0.07)", border: "1px solid rgba(29,185,84,0.18)", borderRadius: 13, padding: "16px 16px", display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 48, height: 48, background: "#1DB954", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎧</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{title}</h2>
          <p style={{ color: MUTED, fontSize: 12, margin: 0, fontFamily: FONT_B }}>Écouter sur Spotify</p>
        </div>
        {link.visible && <PublicCtaLink href={link.href} external={link.external} trackTarget={link.trackTarget} trackClick={trackClick} style={{ background: "#1DB954", color: "#000", padding: "8px 16px", borderRadius: 20, textDecoration: "none", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>▶ Play</PublicCtaLink>}
      </div>
    </div>
  )
}
