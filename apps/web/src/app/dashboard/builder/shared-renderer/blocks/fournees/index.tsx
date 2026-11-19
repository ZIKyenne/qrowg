"use client"
// fournees — « Sorties du four » (boulangerie, 19 nov.). L'horaire HABITUEL des
// fournées ; la prochaine est mise en avant, recalculée chaque minute à l'heure
// du commerce. Une fournée passée dit « sortie à 7 h » — l'horaire, pas le stock.

import { useEffect, useState } from "react"
import { etatFournees, dansLisible, type EtatFournees } from "../../models/commerceDeProximite"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState } from "../../primitives/BlockEmptyState"

function Vue({ c, u, e }: { c: Record<string, any>; u: UnifiedCtx; e: EtatFournees }) {
  const s = (n: number) => Math.round(n * u.scale)
  return (
    <section data-fournees="" style={{ padding: `${s(12)}px 16px` }}>
      <div style={{ background: u.FILL, border: `1px solid ${u.LINE_STRONG}`, borderRadius: 16, padding: s(16), display: "flex", flexDirection: "column", gap: s(10) }}>
        <h2 style={{ margin: 0, color: u.TEXT, fontSize: s(20), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Sorties du four"}</h2>
        <p data-prochaine={e.prochaine ? "oui" : "non"} suppressHydrationWarning style={{ margin: 0, color: e.prochaine ? u.lisible(u.G, 4.5) : u.MUTED, fontSize: s(15), fontWeight: 700, fontFamily: u.FONT_B }}>
          {e.prochaine
            ? <>Prochaine fournée à {e.prochaine.heure}{e.prochaine.quoi ? ` · ${e.prochaine.quoi}` : ""} — {dansLisible(e.dansMin ?? 0)}</>
            : "Toutes les fournées du jour sont sorties."}
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
          {e.fournees.map((f, i) => (
            <li key={i} data-sortie={f.sortie ? "oui" : "non"} suppressHydrationWarning style={{ display: "flex", alignItems: "baseline", gap: s(12), padding: `${s(8)}px 0`, borderTop: i ? `1px solid ${u.LINE}` : "none", fontFamily: u.FONT_B }}>
              <span style={{ minWidth: s(54), color: f.sortie ? u.MUTED : u.TEXT, fontSize: s(15), fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{f.heure}</span>
              <span style={{ flex: 1, minWidth: 0, color: f.sortie ? u.MUTED : u.TEXT, fontSize: s(15) }}>{f.quoi}</span>
              {f.sortie && <span style={{ color: u.MUTED, fontSize: s(12), fontWeight: 600, whiteSpace: "nowrap" }}>✓ sortie</span>}
            </li>
          ))}
        </ul>
        {c.note && <p style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>{c.note}</p>}
      </div>
    </section>
  )
}

export function EditorFournees({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const e = etatFournees(content, new Date())
  if (!e.fournees.length) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🥖" label="Indiquez vos heures de fournée" sub="Une par ligne : « 7h Baguettes tradition »" muted={u.MUTED} /></div>
  return <Vue c={content} u={u} e={e} />
}

export function PublicFournees({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  const [e, setE] = useState<EtatFournees>(() => etatFournees(c, new Date()))
  useEffect(() => {
    const maj = () => setE(etatFournees(c, new Date()))
    maj()
    const t = setInterval(maj, 60_000)
    return () => clearInterval(t)
  }, [c])
  if (!e.fournees.length) return null
  return <Vue c={c} u={publicCtx(ctx)} e={e} />
}
