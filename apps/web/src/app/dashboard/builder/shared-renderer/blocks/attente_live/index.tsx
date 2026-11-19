"use client"
// attente_live — l'attente sans rendez-vous (barbier, 19 nov.). Une lecture.
// Affichée seulement si elle date de moins de 3 h ; son âge se dit (« il y a
// 12 min ») et se recalcule chaque minute. Une attente vieille ne s'affiche pas.

import { useEffect, useState } from "react"
import { attenteActuelle, depuisLisible, type Attente } from "../../models/momentDuSalon"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState } from "../../primitives/BlockEmptyState"

function Vue({ c, u, a }: { c: Record<string, any>; u: UnifiedCtx; a: Attente }) {
  const s = (n: number) => Math.round(n * u.scale)
  const teinte = a.complet ? "#EF4444" : a.libre ? "#39FF8F" : "#FBBF24"
  const t = u.lisible(teinte, 4.5)
  return (
    <section data-attente={a.complet ? "complet" : a.libre ? "libre" : "attente"} style={{ padding: `${s(12)}px 16px` }}>
      <div style={{ background: u.FILL, border: `1px solid color-mix(in srgb, ${teinte} 45%, transparent)`, borderRadius: 16, padding: s(16), display: "flex", flexDirection: "column", gap: s(6) }}>
        <h2 style={{ margin: 0, color: u.MUTED, fontSize: s(12), fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: u.FONT_B }}>{c.title || "Sans rendez-vous"}</h2>
        <p style={{ margin: 0, display: "flex", alignItems: "center", gap: s(10), color: t, fontSize: s(24), fontWeight: 800, fontFamily: u.FONT_D }}>
          <span aria-hidden="true" style={{ width: s(12), height: s(12), borderRadius: "50%", background: t, flexShrink: 0 }} />{a.libelle}
        </p>
        <p suppressHydrationWarning style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>Mis à jour {depuisLisible(a.depuisMin)}</p>
        {c.note && <p style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>{c.note}</p>}
      </div>
    </section>
  )
}

export function EditorAttenteLive({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const a = attenteActuelle(content, Date.now())
  if (!a) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="⏱️" label="Indiquez l'attente du moment" sub="Masquée en ligne si elle date de plus de 3 h" muted={u.MUTED} /></div>
  return <Vue c={content} u={u} a={a} />
}

export function PublicAttenteLive({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  const [a, setA] = useState<Attente | null>(() => attenteActuelle(c, Date.now()))
  useEffect(() => {
    const maj = () => setA(attenteActuelle(c, Date.now()))
    maj()
    const t = setInterval(maj, 60_000)
    return () => clearInterval(t)
  }, [c])
  if (!a) return null
  return <Vue c={c} u={publicCtx(ctx)} a={a} />
}
