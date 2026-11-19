"use client"
import { PublicAppelServeur } from "@/app/dashboard/builder/shared-renderer/blocks/appel_serveur"

const THEME = { bg: "#0F0805", surface: "#1A0F09", primary: "#F97316", text: "#FFF7ED", muted: "#B39584", fontDisplay: "Inter, sans-serif", fontBody: "Inter, sans-serif" }

// Un identifiant de page au bon FORMAT (le bloc refuse d'envoyer depuis un
// aperçu sans page) ; l'envoi est intercepté par le test.
export default function BancAppel() {
  const content = { title: "Besoin de nous ?", ask_table: "Oui", show_serveur: "Oui", show_addition: "Oui", show_commande: "Oui" }
  const ctx: any = { theme: THEME, G: THEME.primary, TEXT: THEME.text, MUTED: THEME.muted, FONT_D: THEME.fontDisplay, FONT_B: THEME.fontBody, pageId: "00000000-0000-4000-8000-000000000001", blockId: "appel", trackClick: () => {} }
  return (
    <div style={{ minHeight: "100dvh", background: THEME.bg, color: THEME.text }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}><PublicAppelServeur content={content} ctx={ctx} /></div>
    </div>
  )
}
