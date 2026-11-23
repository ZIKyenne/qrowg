"use client"
// carte_boissons — la carte des boissons (19 nov.). Une lecture, aucun contrôle.
// Chaque rubrique est un VRAI tableau (en-têtes de colonnes) : un lecteur d'écran
// annonce « Verre : 7 € », pas un nombre isolé.

import { prixAffiche } from "@/lib/prixAffiche"
import { boissons, rubriques, colonnes, type BadgeBoisson } from "../../models/carteBoissons"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { barre, Mention } from "../../primitives/MenuItemList"

const TEINTE: Record<BadgeBoisson, string> = {
  "Sans alcool": "#38BDF8", "Bio": "#3CCB7F", "Coup de cœur": "#F472B6", "Nouveau": "#5AA9FF", "Maison": "#C9A84C",
}

function Vue({ c, u }: { c: Record<string, any>; u: UnifiedCtx }) {
  const s = (n: number) => Math.round(n * u.scale)
  const [col1, col2] = colonnes(c)
  const groupes = rubriques(boissons(c))
  const cellule: React.CSSProperties = { padding: `${s(9)}px 0`, borderBottom: `1px solid ${u.LINE}`, verticalAlign: "top", fontFamily: u.FONT_B }
  const prix: React.CSSProperties = { ...cellule, textAlign: "end", paddingInlineStart: s(12), whiteSpace: "nowrap", color: u.G, fontSize: s(15), fontWeight: 800 }
  return (
    <section data-carte-boissons="" style={{ padding: `${s(12)}px 16px` }}>
      {(c.title || c.subtitle) && (
        <div style={{ marginBottom: s(10) }}>
          {c.title && <h2 style={{ margin: 0, color: u.TEXT, fontSize: s(22), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title}</h2>}
          {c.subtitle && <p style={{ margin: `${s(4)}px 0 0`, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>{c.subtitle}</p>}
        </div>
      )}
      {groupes.map(g => (
        // Largeurs FIXES des colonnes de prix : elles s'alignent d'une rubrique à
        // l'autre (chaque tableau calculait les siennes, l'œil perdait la colonne).
        <table key={g.nom} style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginTop: s(14) }}>
          <colgroup>
            <col />
            <col style={{ width: s(84) }} />
            {g.deuxPrix && <col style={{ width: s(96) }} />}
          </colgroup>
          <caption style={{ textAlign: "start", captionSide: "top", color: u.TEXT, fontSize: s(17), fontWeight: 800, fontFamily: u.FONT_D, paddingBottom: s(4) }}>{g.nom}</caption>
          <thead>
            <tr style={{ color: u.MUTED, fontSize: s(11), fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: u.FONT_B }}>
              <th scope="col" style={{ textAlign: "start", fontWeight: 800, paddingBottom: s(4) }}><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Boisson</span></th>
              <th scope="col" style={{ textAlign: "end", fontWeight: 800, paddingBottom: s(4) }}>{g.deuxPrix ? col1 : <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Prix</span>}</th>
              {g.deuxPrix && <th scope="col" style={{ textAlign: "end", fontWeight: 800, paddingBottom: s(4), paddingInlineStart: s(12) }}>{col2}</th>}
            </tr>
          </thead>
          <tbody>
            {g.boissons.map(b => (
              <tr key={b.rang}>
                <th scope="row" style={{ ...cellule, textAlign: "start", fontWeight: 400 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ color: u.TEXT, fontSize: s(16), fontWeight: 700, ...barre(b.epuise) }}>{b.nom}</span>
                    {b.epuise && <Mention primary={u.G} fs={s} />}
                    {b.badge && (
                      <span style={{ padding: `1px ${s(8)}px`, borderRadius: 999, fontSize: s(11), fontWeight: 700, color: u.lisible(TEINTE[b.badge], 4.5), border: `1px solid color-mix(in srgb, ${TEINTE[b.badge]} 40%, transparent)`, background: `color-mix(in srgb, ${TEINTE[b.badge]} 12%, transparent)` }}>{b.badge}</span>
                    )}
                  </span>
                  {(b.origine || b.detail) && (
                    <span style={{ display: "block", marginTop: s(2), color: u.MUTED, fontSize: s(13), lineHeight: 1.4 }}>
                      {[b.origine, b.detail].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </th>
                <td style={{ ...prix, ...barre(b.epuise) }}>{b.prix1 && <bdi dir="ltr">{prixAffiche(b.prix1)}</bdi>}</td>
                {g.deuxPrix && <td style={{ ...prix, ...barre(b.epuise) }}>{b.prix2 ? <bdi dir="ltr">{prixAffiche(b.prix2)}</bdi> : <span style={{ color: u.MUTED, fontWeight: 400 }} aria-label="non servi">—</span>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      {c.note && <p style={{ margin: `${s(12)}px 0 0`, color: u.MUTED, fontSize: s(12), fontFamily: u.FONT_B, textAlign: "center" }}>{c.note}</p>}
    </section>
  )
}

export function EditorCarteBoissons({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (boissons(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🍷" label="Ajoutez votre première boisson" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue c={content} u={u} />
}
export function PublicCarteBoissons({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (boissons(c).length === 0) return null
  return <Vue c={c} u={publicCtx(ctx)} />
}
