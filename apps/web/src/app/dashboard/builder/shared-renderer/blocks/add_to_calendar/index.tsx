"use client"
// add_to_calendar — L'apercu dessinait TROIS boutons (Google, Apple, Outlook),
// la page en publie DEUX. Le troisieme n'a jamais existe : il n'y a que deux
// liens, l'un vers Google Agenda, l'autre un fichier .ics qu'Apple ET Outlook
// ouvrent tous les deux. Et sans date saisie, l'apercu dessinait quand meme un
// bouton rose « Ajouter a mon agenda » sur un bloc que la page ne publie pas.
//
// La date etait aussi affichee brute cote apercu — « 2026-08-15T20:30 » — la ou
// la page ecrit « 2026-08-15 a 20:30 ».
import { agenda } from "../../models/evenement"
import { avecCibleTactile } from "../../primitives/BlockCtaLink"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const ROSE = "#EC4899"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const a = agenda(c)!
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      <div style={{ background: `${ROSE}0f`, border: `1px solid ${ROSE}33`, borderRadius: 15, padding: sz(u, 15) }}>
        <div style={{ display: "flex", alignItems: "center", gap: sz(u, 11), marginBottom: a.liens.length ? sz(u, 13) : 0 }}>
          <div aria-hidden style={{ width: sz(u, 44), height: sz(u, 44), borderRadius: 11, background: `${ROSE}1f`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 23), flexShrink: 0 }}>📅</div>
          <div>
            {a.nom && <p style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 700, margin: `0 0 ${sz(u, 2)}px`, fontFamily: u.FONT_B }}>{a.nom}</p>}
            {a.debut && <p style={{ color: u.MUTED, fontSize: sz(u, 12), margin: 0, fontFamily: u.FONT_B }}>🕐 {a.debut}</p>}
            {a.lieu && <p style={{ color: u.MUTED, fontSize: sz(u, 12), margin: 0, fontFamily: u.FONT_B }}>📍 {a.lieu}</p>}
          </div>
        </div>
        <div style={{ display: "flex", gap: sz(u, 8), flexWrap: "wrap" }}>
          {a.liens.map((l, i) => {
            const style = avecCibleTactile({
              flex: 1, minWidth: sz(u, 130), gap: sz(u, 7),
              background: l.fond || u.FILL, border: `1px solid ${l.bordure || u.LINE}`, borderRadius: 10,
              padding: `${sz(u, 13)}px`, fontSize: sz(u, 12.5), fontWeight: 700,
              color: l.couleur || u.TEXT, textDecoration: "none", fontFamily: u.FONT_B, textAlign: "center",
            })
            return u.mode === "public"
              ? <a key={i} href={l.href} {...(l.fichier ? { download: l.fichier } : { target: "_blank", rel: "noopener noreferrer" })}
                  onClick={() => u.trackClick(l.fichier ? "calendar:ics" : "calendar:google")} style={style}>{l.label}</a>
              : <div key={i} aria-disabled="true" style={style}>{l.label}</div>
          })}
        </div>
      </div>
    </div>
  )
}

export function EditorAddToCalendar({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!agenda(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📅" label="Nommez l’événement et donnez sa date" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicAddToCalendar({ content, ctx }: PublicAdapterProps) {
  if (!agenda(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
