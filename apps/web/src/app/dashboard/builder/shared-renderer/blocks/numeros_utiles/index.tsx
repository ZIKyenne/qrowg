"use client"
// numeros_utiles — les numéros à portée de pouce (livret d'accueil, 19 nov.) :
// ceux du commerçant, puis les VRAIS numéros d'urgence s'il les active. Chaque
// ligne s'appelle d'un geste. Hors de la page publiée, rien n'est branché.
import { numerosUtiles } from "../../models/livretAccueil"
import { telLink } from "../../../types"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"

function Vue({ c, u }: { c: Record<string, any>; u: UnifiedCtx }) {
  const liste = numerosUtiles(c)
  const publicMode = u.mode === "public"
  const s = (n: number) => Math.round(n * u.scale)
  return (
    <section data-numeros-utiles="" style={{
      padding: `${s(12)}px 16px`,
      ["--reseau-texte" as string]: u.TEXT, ["--reseau-ligne" as string]: u.LINE_STRONG, ["--reseau-police" as string]: u.FONT_B, ["--reseau-accent" as string]: u.G,
    }}>
      <h2 style={{ margin: `0 0 ${s(10)}px`, color: u.TEXT, fontSize: s(20), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Numéros utiles"}</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: s(8) }}>
        {liste.map((n, k) => {
          const href = n.sms ? `sms:${n.numero}` : telLink(n.numero)
          const action = n.sms ? "Envoyer un SMS" : "Appeler"
          return (
            <li key={k} style={{ display: "flex", alignItems: "center", gap: s(10), background: u.FILL, border: `1px solid ${n.urgence ? "color-mix(in srgb, #EF4444 40%, transparent)" : u.LINE}`, borderRadius: 14, padding: `${s(10)}px ${s(12)}px` }}>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <span style={{ color: u.TEXT, fontSize: s(15), fontWeight: 700, fontFamily: u.FONT_B }}>{n.nom}</span>
                <bdi dir="ltr" style={{ color: n.urgence ? u.lisible("#EF4444", 4.5) : u.MUTED, fontSize: s(14), fontWeight: 700, fontFamily: u.FONT_B }}>{n.numero}</bdi>
              </span>
              {publicMode && href
                ? <a className="reseau-bouton" href={href} aria-label={`${action} : ${n.nom} (${n.numero})`}>{action}</a>
                : <span aria-hidden="true" className="reseau-bouton">{action}</span>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function EditorNumerosUtiles({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (numerosUtiles(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="☎️" label="Ajoutez un numéro, ou activez les urgences" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue c={content} u={u} />
}
export function PublicNumerosUtiles({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (numerosUtiles(c).length === 0) return null
  return <Vue c={c} u={publicCtx(ctx)} />
}
