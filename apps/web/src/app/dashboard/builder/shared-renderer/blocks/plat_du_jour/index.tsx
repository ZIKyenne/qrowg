"use client"
// plat_du_jour — l'ardoise du jour (19 nov.). Aucun contrôle : une lecture.
//
// En ligne, elle ne s'affiche qu'APRÈS avoir vérifié le jour sur le téléphone :
// la page publiée est mise en cache, le serveur montrerait l'ardoise d'hier.
// Dans l'éditeur, elle se montre toujours — avec un bandeau si elle est périmée.

import { useALaMinute } from "../../primitives/instantDuRendu"
import { platsDuJour, etatArdoise, jourLisible, jourDuCommerce, type EtatArdoise } from "../../models/platDuJour"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"

function aujourdhuiLisible(c: Record<string, any>): string {
  const j = jourLisible(jourDuCommerce(new Date(), c))
  return j.charAt(0).toUpperCase() + j.slice(1)
}

function Ardoise({ c, u, etat }: { c: Record<string, any>; u: UnifiedCtx; etat: EtatArdoise }) {
  const plats = platsDuJour(c)
  const s = (n: number) => Math.round(n * u.scale)
  return (
    <section data-ardoise={etat} style={{ padding: `${s(12)}px 16px` }}>
      {u.mode === "editor" && etat === "perimee" && (
        <p style={{ margin: "0 0 8px", padding: "8px 12px", borderRadius: 10, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", color: "#FBBF24", fontSize: 12, fontWeight: 700, fontFamily: u.FONT_B }}>
          Invisible en ligne : c&apos;est l&apos;ardoise du {jourLisible(String(c.date || ""))}. Modifiez-la pour la remettre à aujourd&apos;hui.
        </p>
      )}
      <div style={{ background: `color-mix(in srgb, ${u.FILL} 70%, #10120f)`, border: `1px solid ${u.LINE_STRONG}`, borderRadius: 16, padding: `${s(16)}px ${s(18)}px` }}>
        {/* La date en surtitre, seulement pour l'ardoise DU JOUR ; le titre, toujours. */}
        {etat !== "permanente" && (
          <p style={{ margin: 0, color: u.G, fontSize: s(12), fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", fontFamily: u.FONT_B }}>
            {aujourdhuiLisible(c)}
          </p>
        )}
        <h2 style={{ margin: `${s(etat === "permanente" ? 0 : 4)}px 0 ${s(12)}px`, color: u.TEXT, fontSize: s(22), fontWeight: 800, fontFamily: u.FONT_D }}>
          {c.title || "L'ardoise du jour"}
        </h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: s(12) }}>
          {plats.map(p => (
            <li key={p.rang}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ color: u.TEXT, fontSize: s(17), fontWeight: 700, fontFamily: u.FONT_D }}>{p.nom}</span>
                <span aria-hidden="true" style={{ flex: 1, borderBottom: `1px dotted ${u.LINE_STRONG}`, transform: "translateY(-4px)" }} />
                {p.prix && <bdi dir="ltr" style={{ color: u.G, fontSize: s(16), fontWeight: 800, fontFamily: u.FONT_B, whiteSpace: "nowrap" }}>{p.prix}</bdi>}
              </div>
              {p.description && <p style={{ margin: `${s(3)}px 0 0`, color: u.MUTED, fontSize: s(14), lineHeight: 1.45, fontFamily: u.FONT_B }}>{p.description}</p>}
            </li>
          ))}
        </ul>
        {c.note && <p style={{ margin: `${s(14)}px 0 0`, color: u.MUTED, fontSize: s(13), fontStyle: "italic", fontFamily: u.FONT_B }}>{c.note}</p>}
      </div>
    </section>
  )
}

export function EditorPlatDuJour({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (platsDuJour(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🧑‍🍳" label="Écrivez le plat du jour" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Ardoise c={content} u={u} etat={etatArdoise(content, new Date())} />
}

export function PublicPlatDuJour({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  // Décidé à l'instant du rendu serveur (le HTML montre l'ardoise si elle est du
  // jour), puis REVÉRIFIÉ sur le téléphone : une ardoise devenue périmée
  // disparaît au montage — sans mismatch (voir primitives/instantDuRendu).
  const etat = useALaMinute<EtatArdoise>(now => etatArdoise(c, now), [c])
  if (etat === "perimee" || etat === "vide") return null
  return <Ardoise c={c} u={publicCtx(ctx)} etat={etat} />
}
