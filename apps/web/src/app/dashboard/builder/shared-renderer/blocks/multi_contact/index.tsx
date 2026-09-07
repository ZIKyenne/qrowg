"use client"
// multi_contact — « Vos interlocuteurs ». L'apercu remplissait la carte de DEUX
// fausses fiches « Prenom Nom / Poste » quand le bloc etait vide, pour un bloc
// que la page publiee n'affichait pas.
import { interlocuteurs } from "../../models/equipeEtContacts"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { Avatar, BoutonsJointure, styleCarte } from "../../views/CarteMembre"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c, accent }: { u: UnifiedCtx; c: Record<string, any>; accent: string }) {
  const gens = interlocuteurs(c)
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={c?.title} marge={12} />
      <div style={{ display: "flex", flexDirection: "column", gap: sz(u, 10) }}>
        {gens.map(p => (
          <div key={p.i} style={styleCarte(u)}>
            <div style={{ display: "flex", alignItems: "center", gap: sz(u, 11), marginBottom: p.jointures.length ? sz(u, 11) : 0 }}>
              <Avatar u={u} photo={p.photo} nom={p.nom} taille={44} accent={accent} />
              <div style={{ minWidth: 0 }}>
                <p style={{ color: u.TEXT, fontSize: sz(u, 13), fontWeight: 700, margin: "0 0 2px", fontFamily: u.FONT_B }}>{p.nom}</p>
                {p.role && <p style={{ color: u.G, fontSize: sz(u, 13), margin: 0 }}>{p.role}</p>}
              </div>
            </div>
            <BoutonsJointure u={u} jointures={p.jointures} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function EditorMultiContact({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (interlocuteurs(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📇" label="Ajoutez un interlocuteur" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} accent={ctx.accent} />
}
export function PublicMultiContact({ content, ctx }: PublicAdapterProps) {
  if (interlocuteurs(content).length === 0) return null
  return <Vue u={publicCtx(ctx)} c={content} accent={(ctx.theme as any)?.accent || "var(--success)"} />
}
