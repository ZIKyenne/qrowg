"use client"
// free_gift — Un cadeau à récupérer (guide, bon, fichier). Le lien EST le
// bloc : sans destination utile, il n'y a rien à recevoir, donc rien à publier.
import { cadeauOffert } from "../../models/affichagesSimples"
import { SmartCta } from "../../primitives/LayoutSurface"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof cadeauOffert>> }) {
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 12)}px` }}>
      <div style={{ background: "rgba(236,72,153,0.08)", border: "1.5px solid rgba(236,72,153,0.25)", borderRadius: sz(u, 13), padding: sz(u, 16), textAlign: "center" }}>
        <span aria-hidden style={{ fontSize: sz(u, 32), display: "block", marginBottom: sz(u, 8) }}>{m.emoji}</span>
        {m.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: `0 0 ${sz(u, 11)}px`, fontFamily: u.FONT_B }}>{m.description}</p>}
        <SmartCta u={u} href={m.href} external={m.externe} label={m.label}
          style={{ display: "block", background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: sz(u, 10), padding: sz(u, 12), fontSize: sz(u, 14), fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: u.FONT_B }} />
      </div>
    </div>
  )
}

export function EditorFreeGift({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = cadeauOffert(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎁" label="Ajoutez le lien du cadeau" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicFreeGift({ content, ctx }: PublicAdapterProps) {
  const m = cadeauOffert(content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} m={m} />
}
