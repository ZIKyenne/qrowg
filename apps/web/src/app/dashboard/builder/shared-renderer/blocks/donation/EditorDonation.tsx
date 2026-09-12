"use client"
import { donationViewModel } from "../../models/donation"
import { hasMeaningfulText } from "../../../blockEmptyState"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { EditorCtaShell } from "../../primitives/BlockCtaLink"
import { IconLabelCta } from "../../views/IconLabelCta"
import type { EditorAdapterProps } from "../../renderTypes"

export function EditorDonation({ content, ctx }: EditorAdapterProps) {
  // Lot v72 : sans url, la page publiée ne rend RIEN. L'éditeur le dit
  // au lieu de dessiner un bouton que le visiteur n'aura jamais.
  if (!hasMeaningfulText((content as any)?.url)) {
    return <div style={{ padding: "10px 16px", ...ctx.surfaceStyle }}><BlockEmptyState icon="☕" label="Ajoutez le lien de votre cagnotte" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={ctx.muted} /></div>
  }
  const { label, color } = donationViewModel(content)
  return (
    <div style={{ padding: "4px 16px 10px", ...ctx.surfaceStyle }}>
      <EditorCtaShell style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: color + "12", border: `1.5px solid ${color}30`, borderRadius: 12, padding: "13px 18px" }}>
        <IconLabelCta icon="☕" label={label} color={color} iconSize={18} labelSize={13} labelTag="p" />
      </EditorCtaShell>
    </div>
  )
}
