"use client"
// bonnes_adresses — les adresses du coin (livret d'accueil, 19 nov.), rangées par
// catégorie : distance, conseil de l'hôte, « Itinéraire » et site. Hors de la
// page publiée, les liens sont DESSINÉS, pas branchés.
import { bonnesAdresses, CATEGORIES_ADRESSE } from "../../models/livretAccueil"
import { directionsLink, destinationUtile } from "../../../types"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"

function Vue({ c, u }: { c: Record<string, any>; u: UnifiedCtx }) {
  const adresses = bonnesAdresses(c)
  const publicMode = u.mode === "public"
  const s = (n: number) => Math.round(n * u.scale)
  const groupes = CATEGORIES_ADRESSE.map(cat => ({ ...cat, adresses: adresses.filter(a => a.categorie === cat.nom) })).filter(g => g.adresses.length)
  const lien = (href: string, texte: string, cible: string) => publicMode
    ? <a className="reseau-bouton" href={href} target="_blank" rel="noopener noreferrer" onClick={() => u.trackClick(cible)}>{texte}</a>
    : <span aria-hidden="true" className="reseau-bouton">{texte}</span>
  return (
    <section data-bonnes-adresses="" style={{
      padding: `${s(12)}px 16px`,
      ["--reseau-texte" as string]: u.TEXT, ["--reseau-ligne" as string]: u.LINE_STRONG, ["--reseau-police" as string]: u.FONT_B, ["--reseau-accent" as string]: u.G,
    }}>
      <h2 style={{ margin: 0, color: u.TEXT, fontSize: s(20), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title || "Nos bonnes adresses"}</h2>
      {groupes.map(g => (
        <div key={g.nom} style={{ marginTop: s(14) }}>
          <h3 style={{ margin: `0 0 ${s(8)}px`, color: u.MUTED, fontSize: s(13), fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", fontFamily: u.FONT_B }}>
            <span aria-hidden="true">{g.icone} </span>{g.nom}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: s(8) }}>
            {g.adresses.map(a => {
              const itineraire = directionsLink(a.adresse || a.nom)
              const site = a.lien ? destinationUtile(a.lien) : null
              return (
                <article key={a.rang} style={{ background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 14, padding: s(12), display: "flex", flexDirection: "column", gap: s(6) }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ color: u.TEXT, fontSize: s(16), fontWeight: 700, fontFamily: u.FONT_D }}>{a.nom}</span>
                    {a.distance && <span style={{ color: u.G, fontSize: s(13), fontWeight: 700, fontFamily: u.FONT_B }}>{a.distance}</span>}
                  </div>
                  {a.conseil && <p style={{ margin: 0, color: u.MUTED, fontSize: s(14), lineHeight: 1.5, fontFamily: u.FONT_B }}>{a.conseil}</p>}
                  {(a.adresse || site) && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {a.adresse && itineraire && lien(itineraire, "Itinéraire", `adresse:${a.rang}:itineraire`)}
                      {site && lien(site, "Site", `adresse:${a.rang}:site`)}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}

export function EditorBonnesAdresses({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (bonnesAdresses(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📍" label="Ajoutez vos bonnes adresses" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue c={content} u={u} />
}
export function PublicBonnesAdresses({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (bonnesAdresses(c).length === 0) return null
  return <Vue c={c} u={publicCtx(ctx)} />
}
