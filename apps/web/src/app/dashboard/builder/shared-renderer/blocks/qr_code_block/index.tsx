"use client"
// qr_code_block — Retiré de la bibliothèque (BLOCS_MASQUES) : un QR vers la
// page, affiché SUR cette page, ne sert à rien à qui vient de la scanner, et
// la page publiée ne l'a jamais rendu. Les pages qui le portent encore le
// gardent ; l'aperçu le dit, au lieu de dessiner un faux QR tiré au hasard
// (`Math.random()`, à chaque rendu) sous une fausse adresse « /q/... ».
import { BlockEmptyState } from "../../primitives/BlockEmptyState"
import { editorCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

export function EditorQrCodeBlock({ ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  return (
    <div style={{ padding: "10px 16px" }}>
      <BlockEmptyState icon="🔳" label="Ce bloc n'apparaît pas sur la page publiée" sub="Le QR de votre page s'imprime depuis le Studio QR. Vous pouvez retirer ce bloc." muted={u.MUTED} />
    </div>
  )
}
export function PublicQrCodeBlock(_: PublicAdapterProps) {
  return null
}
