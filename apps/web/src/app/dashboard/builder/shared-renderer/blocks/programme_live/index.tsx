"use client"
// programme_live — le programme d'un événement (soirée, festival, mariage — 20 nov.).
// Le jour J, ce qui se passe EN CE MOMENT est mis en avant, recalculé chaque
// minute ; une fois l'événement terminé, le programme ne s'affiche plus en ligne.

import { useALaMinute } from "../../primitives/instantDuRendu"
import { etatProgramme, dateLisible, type EtatProgramme } from "../../models/planningEtProgramme"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState } from "../../primitives/BlockEmptyState"

function Vue({ c, u, e }: { c: Record<string, any>; u: UnifiedCtx; e: EtatProgramme }) {
  const s = (n: number) => Math.round(n * u.scale)
  const accent = u.lisible(u.G, 4.5)
  const enCours = e.moments.find(m => m.etat === "en_cours")
  return (
    <section data-programme="" data-phase={e.phase} style={{ padding: `${s(12)}px 16px` }}>
      <div style={{ background: u.FILL, border: `1px solid ${u.LINE_STRONG}`, borderRadius: 16, padding: s(16), display: "flex", flexDirection: "column", gap: s(10) }}>
        <h2 style={{ margin: 0, color: u.TEXT, fontSize: s(20), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Programme"}</h2>
        {e.date && <p style={{ margin: 0, color: u.MUTED, fontSize: s(14), fontWeight: 600, fontFamily: u.FONT_B, textTransform: "capitalize" }}>{dateLisible(e.date)}</p>}
        {enCours && (
          <p data-en-ce-moment="" suppressHydrationWarning style={{ margin: 0, color: accent, fontSize: s(16), fontWeight: 800, fontFamily: u.FONT_B }}>
            En ce moment : {enCours.quoi || enCours.heure}
          </p>
        )}
        {e.phase === "apres" && u.mode !== "public" && (
          <p style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>Événement terminé : le programme n'apparaît plus sur la page publiée.</p>
        )}
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {e.moments.map((m, i) => {
            const passe = m.etat === "passe", actuel = m.etat === "en_cours"
            return (
              <li key={m.rang} data-etat={m.etat} suppressHydrationWarning style={{
                display: "flex", alignItems: "baseline", gap: s(12), padding: `${s(8)}px ${actuel ? s(10) : 0}px`,
                borderTop: i && !actuel ? `1px solid ${u.LINE}` : "none", borderRadius: actuel ? 10 : 0,
                background: actuel ? `color-mix(in srgb, ${u.G} 14%, transparent)` : "transparent", fontFamily: u.FONT_B,
              }}>
                <span style={{ minWidth: s(52), color: passe ? u.MUTED : u.TEXT, fontSize: s(15), fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{m.heure}</span>
                <span style={{ flex: 1, minWidth: 0, color: passe ? u.MUTED : u.TEXT, fontSize: s(15), fontWeight: actuel ? 700 : 500, textDecoration: passe ? "line-through" : "none", textDecorationColor: u.LINE_STRONG }}>{m.quoi}</span>
                {actuel && <span style={{ color: accent, fontSize: s(12), fontWeight: 800, whiteSpace: "nowrap" }}>En cours</span>}
              </li>
            )
          })}
        </ol>
        {c.note && <p style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>{c.note}</p>}
      </div>
    </section>
  )
}

export function EditorProgrammeLive({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const e = etatProgramme(content, new Date())
  if (!e.moments.length) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎤" label="Indiquez le programme heure par heure" sub="Une ligne par moment : « 21h Concert »" muted={u.MUTED} /></div>
  return <Vue c={content} u={u} e={e} />
}

export function PublicProgrammeLive({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  const e = useALaMinute<EtatProgramme>(now => etatProgramme(c, now), [c])
  if (!e.moments.length || e.phase === "apres") return null
  return <Vue c={c} u={publicCtx(ctx)} e={e} />
}
