"use client"
// opening_hours — Les horaires, le bloc que le client scanne debout devant la
// porte pour savoir si c'est ouvert. Deux ecarts corriges en migrant :
//
//  · l'apercu abregeait « Lun — Ven » la ou la page ecrit « Lundi — Vendredi » ;
//  · la note de bas de tableau n'etait publiee QUE s'il restait au moins une
//    ligne d'horaire. Un commercant ferme pour conges — exception saisie, plus
//    aucune plage — perdait sa note en ligne, alors que l'apercu la montrait.
//
// Le surlignage du jour courant n'existait que sur la page publiee : l'auteur ne
// pouvait pas voir cette fonction. Il est desormais rendu des deux cotes.
import { useEffect, useState } from "react"
import { horaires, estAujourdhui, estFerme } from "../../models/horairesGalerieReseaux"
import { openStatus } from "../../../types"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

/** Le badge « Ouvert / Fermé ». L'heure ne se lit qu'APRES le montage : le
 *  serveur rend la page puis la met en cache, son heure serait fausse. */
function Badge({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const [st, setSt] = useState<ReturnType<typeof openStatus>>(null)
  useEffect(() => {
    const maj = () => setSt(openStatus(c, new Date()))
    maj()
    const t = setInterval(maj, 60000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.mon_fri, c.saturday, c.sunday, c.mon, c.tue, c.wed, c.thu, c.fri, c.sat, c.sun, c.mode])
  if (!st) return null
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: sz(u, 6), background: `${st.color}18`, border: `1px solid ${st.color}55`, color: st.color, borderRadius: 20, padding: `${sz(u, 4)}px ${sz(u, 12)}px`, fontSize: sz(u, 12), fontWeight: 700, fontFamily: u.FONT_B }}>
      <span style={{ width: sz(u, 7), height: sz(u, 7), borderRadius: "50%", background: st.color, boxShadow: `0 0 6px ${st.color}` }} />{st.label}
    </span>
  )
}

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const h = horaires(c)!
  // -1 tant que l'heure n'est pas connue : le serveur et le navigateur rendent
  // alors le meme HTML (pas de remplacement complet a l'hydratation).
  const [jour, setJour] = useState(-1)
  useEffect(() => { setJour(new Date().getDay()) }, [])
  const note = h.note && (
    <div style={{ padding: `${sz(u, 9)}px ${sz(u, 16)}px`, background: `${u.G}05` }}>
      <p style={{ color: u.MUTED, fontSize: sz(u, 13.5), margin: 0, fontStyle: "italic", fontFamily: u.FONT_B }}>{h.note}</p>
    </div>
  )
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 16)}px`, fontFamily: u.FONT_B }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: sz(u, 10), margin: `0 0 ${sz(u, 10)}px`, flexWrap: "wrap" }}>
        {h.titre ? <p style={{ color: u.MUTED, fontSize: sz(u, 11), textTransform: "uppercase", letterSpacing: 2, margin: 0, fontFamily: u.FONT_B }}>{h.titre}</p> : <span />}
        <Badge u={u} c={c} />
      </div>
      {h.exception && (
        <div style={{ display: "flex", alignItems: "center", gap: sz(u, 8), background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 11, padding: `${sz(u, 10)}px ${sz(u, 13)}px`, marginBottom: sz(u, 10) }}>
          <span style={{ fontSize: sz(u, 16), flexShrink: 0 }}>📅</span>
          <p style={{ color: "#FBBF24", fontSize: sz(u, 12.5), fontWeight: 600, margin: 0, fontFamily: u.FONT_B }}>{h.exception}</p>
        </div>
      )}
      {h.lignes.length > 0 ? (
        <div style={{ background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 13, overflow: "hidden" }}>
          {h.lignes.map((l, i) => {
            const aujourdhui = estAujourdhui(l.jour, jour)
            const ferme = estFerme(l.heures)
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${sz(u, 11)}px ${sz(u, 16)}px`, background: aujourdhui ? `${u.G}0c` : "transparent", borderBottom: i < h.lignes.length - 1 ? `1px solid ${u.LINE}` : "none" }}>
                <span style={{ color: aujourdhui ? u.TEXT : u.MUTED, fontSize: sz(u, 13), fontWeight: aujourdhui ? 700 : 400, fontFamily: u.FONT_B }}>{l.label}{aujourdhui && <span style={{ color: u.G, fontSize: sz(u, 10), fontWeight: 700, marginLeft: sz(u, 7), textTransform: "uppercase", letterSpacing: 0.5 }}>Aujourd&apos;hui</span>}</span>
                <span style={{ color: ferme ? u.MUTED : u.TEXT, fontSize: sz(u, 13), fontWeight: 600, fontFamily: u.FONT_B, opacity: ferme ? 0.65 : 1 }}>{l.heures}</span>
              </div>
            )
          })}
          {note}
        </div>
      // Une note sans tableau reste publiee : elle etait perdue en ligne.
      ) : note && <div style={{ background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 13, overflow: "hidden" }}>{note}</div>}
    </div>
  )
}

export function EditorOpeningHours({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!horaires(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🕐" label="Saisissez vos horaires" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicOpeningHours({ content, ctx }: PublicAdapterProps) {
  if (!horaires(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
