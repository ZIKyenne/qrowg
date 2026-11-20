"use client"
// arrivage — « Arrivage du jour » (fleuriste, primeur, épicerie — 19 nov.). Une
// liste DATÉE automatiquement ; en ligne seulement pendant la durée choisie
// (aujourd'hui, 3 jours, une semaine) — jamais un arrivage périmé.

import { useALaMinute } from "../../primitives/instantDuRendu"
import { etatArrivage, arriveLisible, type EtatArrivage, type Article } from "../../models/commerceDeProximite"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState } from "../../primitives/BlockEmptyState"

function Vue({ c, u, articles, depuis }: { c: Record<string, any>; u: UnifiedCtx; articles: Article[]; depuis: number | null }) {
  const s = (n: number) => Math.round(n * u.scale)
  return (
    <section data-arrivage="" style={{ padding: `${s(12)}px 16px` }}>
      <div style={{ background: u.FILL, border: `1px solid ${u.LINE_STRONG}`, borderRadius: 16, padding: s(16), display: "flex", flexDirection: "column", gap: s(10) }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: s(10), flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, color: u.TEXT, fontSize: s(20), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Arrivage du jour"}</h2>
          {depuis !== null && depuis >= 0 && <span suppressHydrationWarning style={{ padding: `${s(3)}px ${s(10)}px`, borderRadius: 999, border: `1px solid ${u.lisible(u.G, 3)}`, color: u.lisible(u.G, 4.5), fontSize: s(12), fontWeight: 700, fontFamily: u.FONT_B, whiteSpace: "nowrap" }}>{arriveLisible(depuis)}</span>}
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {articles.map((a, i) => (
            <li key={a.rang} style={{ display: "flex", alignItems: "baseline", gap: s(12), padding: `${s(8)}px 0`, borderTop: i ? `1px solid ${u.LINE}` : "none", fontFamily: u.FONT_B }}>
              <span style={{ flex: 1, minWidth: 0, color: u.TEXT, fontSize: s(15), fontWeight: 600 }}>{a.nom}</span>
              {a.prix && <span style={{ color: u.lisible(u.G, 4.5), fontSize: s(14), fontWeight: 700, whiteSpace: "nowrap" }}>{a.prix}</span>}
            </li>
          ))}
        </ul>
        {c.note && <p style={{ margin: 0, color: u.MUTED, fontSize: s(13), fontFamily: u.FONT_B }}>{c.note}</p>}
      </div>
    </section>
  )
}

/** L'éditeur montre la liste saisie, même hors de sa durée (le bandeau dit pourquoi elle est masquée). */
export function EditorArrivage({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const e = etatArrivage(content, new Date())
  if (!e.articles.length) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🧺" label="Indiquez ce qui vient d'arriver" sub="Masqué en ligne une fois la durée passée" muted={u.MUTED} /></div>
  return <Vue c={content} u={u} articles={e.articles} depuis={e.visible ? e.depuisJours : null} />
}

export function PublicArrivage({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  const e = useALaMinute<EtatArrivage>(now => etatArrivage(c, now), [c])
  if (!e.visible) return null
  return <Vue c={c} u={publicCtx(ctx)} articles={e.articles} depuis={e.depuisJours} />
}
