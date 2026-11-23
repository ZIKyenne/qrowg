"use client"
// Banc générique (19 nov.) : UN bloc du renderer partagé, rendu comme sur la
// page publiée, avec ses données d'exemple (blocks/fixtures). ?type=wifi,
// ?theme=clair, ?vide=1 (le bloc sans contenu). Un banc pour tous les blocs neufs.
import { useSearchParams } from "next/navigation"
import { resolvePublicBlock } from "@/app/dashboard/builder/shared-renderer/publicRegistry"
import { FILL } from "../blocks/fixtures"
import { RenduLegacy } from "@/app/[slug]/renduLegacy"
import { InstantDuRendu } from "@/app/dashboard/builder/shared-renderer/primitives/instantDuRendu"

const SOMBRE = { bg: "#0d0b09", surface: "#16130f", primary: "#E8A33D", text: "#F5F0E8", muted: "#A8A190", fontDisplay: "Inter, sans-serif", fontBody: "Inter, sans-serif" }
const CLAIR = { bg: "#FFF8EF", surface: "#FFFFFF", primary: "#C2410C", text: "#1F1A14", muted: "#6B6258", fontDisplay: "Inter, sans-serif", fontBody: "Inter, sans-serif" }

export default function BancBloc({ renduA }: { renduA?: number }) {
  const q = useSearchParams()
  const type = q.get("type") || ""
  const Public = resolvePublicBlock(type)
  const theme: any = q.get("theme") === "clair" ? CLAIR : SOMBRE
  // ?c={"date":"2020-01-01"} : surcharge les données d'exemple (cas limites).
  let surcharge: Record<string, any> = {}
  try { surcharge = JSON.parse(q.get("c") || "{}") } catch { /* ignoré */ }
  const content = q.get("vide") ? {} : { ...((FILL as Record<string, any>)[type] || {}), ...surcharge }
  const ctx: any = { theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: theme.fontDisplay, FONT_B: theme.fontBody, pageId: "00000000-0000-4000-8000-000000000002", blockId: "bloc", trackClick: () => {} }
  return (
    <div data-banc-bloc={type} style={{ minHeight: "100dvh", background: theme.bg, color: theme.text }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 12 }}>
        <InstantDuRendu instant={renduA ?? null}>{Public ? <Public content={content} ctx={ctx} />
          // Vague 2 : les blocs encore rendus par l'ancien moteur passent aussi au banc.
          : <RenduLegacy block={{ id: "bloc", type, visible: true, content } as any} theme={theme} pageId={ctx.pageId} />}</InstantDuRendu>
      </div>
    </div>
  )
}
