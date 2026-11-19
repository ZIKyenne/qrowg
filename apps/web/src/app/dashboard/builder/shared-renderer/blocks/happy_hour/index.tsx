"use client"
// happy_hour — le happy hour (19 nov.). Une lecture, aucun contrôle.
// Le statut (« En cours · jusqu'à 20h ») se lit APRÈS le montage, à l'heure du
// commerce, et se recalcule chaque minute : le HTML mis en cache ne connaît pas
// l'heure qu'il est chez le client.

import { useEffect, useState } from "react"
import { offresHappy, happyHourRempli, statutHappy, joursDuHappy, type StatutHappy } from "../../models/happyHour"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"

function Statut({ c, u }: { c: Record<string, any>; u: UnifiedCtx }) {
  const [st, setSt] = useState<StatutHappy | null>(null)
  useEffect(() => {
    const maj = () => setSt(statutHappy(c, new Date()))
    maj()
    const t = setInterval(maj, 60_000)
    return () => clearInterval(t)
  }, [c])
  if (!st) return null
  const teinte = st.enCours ? u.lisible("#39FF8F", 4.5) : u.G
  return (
    <span data-statut-happy={st.enCours ? "en-cours" : "a-venir"} style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, whiteSpace: "nowrap",
      border: `1px solid color-mix(in srgb, ${teinte} 45%, transparent)`, background: `color-mix(in srgb, ${teinte} 14%, transparent)`,
      color: teinte, fontSize: 13, fontWeight: 800, fontFamily: u.FONT_B,
    }}>
      {st.enCours && <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: teinte }} />}{st.libelle}
    </span>
  )
}

function Vue({ c, u }: { c: Record<string, any>; u: UnifiedCtx }) {
  const offres = offresHappy(c)
  const s = (n: number) => Math.round(n * u.scale)
  const quand = [joursDuHappy(c).length === 7 ? "Tous les jours" : String(c.jours || ""), String(c.creneau || "").trim()].filter(Boolean).join(" · ")
  return (
    <section data-happy-hour="" style={{ padding: `${s(12)}px 16px` }}>
      <div style={{ background: u.FILL, border: `1px solid ${u.LINE_STRONG}`, borderRadius: 16, padding: `${s(16)}px ${s(18)}px`, display: "flex", flexDirection: "column", gap: s(10) }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, color: u.TEXT, fontSize: s(22), fontWeight: 800, fontFamily: u.FONT_D }}>
            <span aria-hidden="true">🍻 </span>{c.title || "Happy hour"}
          </h2>
          <Statut c={c} u={u} />
        </div>
        {quand && <p style={{ margin: 0, color: u.MUTED, fontSize: s(14), fontWeight: 600, fontFamily: u.FONT_B }}>{quand}</p>}
        {c.offre && <p style={{ margin: 0, color: u.G, fontSize: s(18), fontWeight: 800, fontFamily: u.FONT_D }}>{c.offre}</p>}
        {offres.length > 0 && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: s(8) }}>
            {offres.map(o => (
              <li key={o.rang} style={{ display: "flex", alignItems: "baseline", gap: 10, paddingBottom: s(8), borderBottom: `1px solid ${u.LINE}` }}>
                <span style={{ flex: 1, color: u.TEXT, fontSize: s(16), fontWeight: 700, fontFamily: u.FONT_B }}>{o.nom}</span>
                {o.prixNormal && o.prixHappy && (
                  <bdi dir="ltr" style={{ color: u.MUTED, fontSize: s(14), textDecoration: "line-through", fontFamily: u.FONT_B }}>
                    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>au lieu de </span>{o.prixNormal}
                  </bdi>
                )}
                {(o.prixHappy || o.prixNormal) && <bdi dir="ltr" style={{ color: u.G, fontSize: s(17), fontWeight: 800, fontFamily: u.FONT_B }}>{o.prixHappy || o.prixNormal}</bdi>}
              </li>
            ))}
          </ul>
        )}
        {c.note && <p style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontStyle: "italic", fontFamily: u.FONT_B }}>{c.note}</p>}
      </div>
    </section>
  )
}

export function EditorHappyHour({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!happyHourRempli(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🍻" label="Décrivez votre happy hour" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue c={content} u={u} />
}
export function PublicHappyHour({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (!happyHourRempli(c)) return null
  return <Vue c={c} u={publicCtx(ctx)} />
}
