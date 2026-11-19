"use client"
import { useSearchParams } from "next/navigation"
import { PublicCarteIllustree } from "@/app/dashboard/builder/shared-renderer/blocks/carte_illustree"
import { CARTE_DEMO, TRADUCTIONS_DEMO } from "./demo"

const SOMBRE = { bg: "#0d0b09", surface: "#16130f", primary: "#E8A33D", text: "#F5F0E8", muted: "#A8A190", fontDisplay: "Inter, sans-serif", fontBody: "Inter, sans-serif" }
const CLAIR = { bg: "#FFF8EF", surface: "#FFFFFF", primary: "#C2410C", text: "#1F1A14", muted: "#6B6258", fontDisplay: "Inter, sans-serif", fontBody: "Inter, sans-serif" }

export default function BancCarte() {
  const q = useSearchParams()
  const theme: any = q.get("theme") === "clair" ? CLAIR : SOMBRE
  const content = { ...CARTE_DEMO, ...(q.get("langues") ? TRADUCTIONS_DEMO : {}), layout: q.get("grille") ? "Grille" : "Liste" }
  const ctx: any = { theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: theme.fontDisplay, FONT_B: theme.fontBody, pageId: "demo", blockId: "carte", trackClick: () => {} }
  return (
    <div style={{ minHeight: "100dvh", background: theme.bg, color: theme.text }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <PublicCarteIllustree content={content} ctx={ctx} />
      </div>
    </div>
  )
}
