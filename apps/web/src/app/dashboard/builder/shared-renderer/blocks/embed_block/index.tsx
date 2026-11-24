"use client"
// embed_block — Un formulaire, un agenda, un document d'un service connu
// (liste `EMBED_HOTES`), intégré dans la page.
//
// L'aperçu de l'éditeur posait l'<iframe> SANS sandbox, sur l'origine du
// tableau de bord — là où le commerçant est connecté. La page publiée, elle,
// la sandboxait. Les deux passent par ce rendu : même sandbox, même politique
// de référent, et un titre pour le lecteur d'écran (une iframe sans titre
// s'annonce « cadre », rien de plus).
import { integration } from "../../models/medias"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

export const SANDBOX_INTEGRATION = "allow-scripts allow-forms allow-popups allow-same-origin"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof integration>> }) {
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={m.titre} marge={9} />
      <iframe src={m.src} title={m.titre || "Contenu intégré"} width="100%" height={sz(u, m.hauteur)} style={{ border: "none", borderRadius: sz(u, 13), display: "block" }}
        loading="lazy" sandbox={SANDBOX_INTEGRATION} referrerPolicy="no-referrer" />
    </div>
  )
}

export function EditorEmbedBlock({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = integration(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🔗" label="Ajoutez l'adresse à intégrer" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicEmbedBlock({ content, ctx }: PublicAdapterProps) {
  const m = integration(content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} m={m} />
}
