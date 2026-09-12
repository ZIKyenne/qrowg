"use client"
import { emailButtonViewModel } from "../../models/emailButton"
import { hasMeaningfulText } from "../../../blockEmptyState"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { EditorCtaShell } from "../../primitives/BlockCtaLink"
import { IconLabelCta } from "../../views/IconLabelCta"
import type { EditorAdapterProps } from "../../renderTypes"

export function EditorEmailButton({ content, ctx }: EditorAdapterProps) {
  // Lot v72 : sans email, la page publiée ne rend RIEN. L'éditeur le dit
  // au lieu de dessiner un bouton que le visiteur n'aura jamais.
  if (!hasMeaningfulText((content as any)?.email)) {
    return <div style={{ padding: "10px 16px", ...ctx.surfaceStyle }}><BlockEmptyState icon="✉️" label="Ajoutez l'adresse e-mail" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={ctx.muted} /></div>
  }
  const { label } = emailButtonViewModel(content)
  return (
    <div style={{ padding: "4px 16px 10px", ...ctx.surfaceStyle }}>
      <EditorCtaShell style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", borderRadius: 12, padding: "13px 18px" }}>
        <IconLabelCta icon="✉️" label={label} color="var(--action)" iconSize={16} labelSize={13} />
      </EditorCtaShell>
    </div>
  )
}
