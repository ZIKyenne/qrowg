"use client"
import { bioViewModel } from "../../models/bio"
import type { PublicAdapterProps } from "../../renderTypes"

export function PublicBio({ content, ctx }: PublicAdapterProps) {
  const { visible, text, align } = bioViewModel(content)
  // Rien à publier : pas de cadre non plus. (Vague 25.)
  if (!visible) return null
  const { TEXT, FONT_B } = ctx
  return (
    <div style={{ padding: "6px 24px 16px", textAlign: align as any }}>
      <p style={{ color: TEXT, fontSize: 15, lineHeight: 1.75, margin: 0, fontFamily: FONT_B }}>{text}</p>
    </div>
  )
}
