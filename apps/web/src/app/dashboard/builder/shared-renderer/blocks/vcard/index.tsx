"use client"
// vcard — « Ajouter à mes contacts » : un fichier .vcf construit sur place.
// Le lien est un `data:` téléchargé, pas une destination : il ne passe pas par
// SmartCta (qui juge les adresses de navigation) mais il n'existe qu'en ligne.
import { ficheContact } from "../../models/actionsExternes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof ficheContact>> }) {
  const bouton = { display: "block", background: `linear-gradient(90deg,${u.G},${u.G}cc)`, borderRadius: sz(u, 9), padding: sz(u, 12), minHeight: 44, boxSizing: "border-box", textAlign: "center", fontSize: sz(u, 13), fontWeight: 700, color: "#080808", textDecoration: "none", fontFamily: u.FONT_B } as const
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 12)}px`, fontFamily: u.FONT_B }}>
      <div style={{ background: `${u.G}08`, border: `1.5px solid ${u.G}25`, borderRadius: sz(u, 13), padding: `${sz(u, 13)}px ${sz(u, 15)}px` }}>
        {(m.nom || m.entreprise) && (
          <div style={{ display: "flex", alignItems: "center", gap: sz(u, 11), marginBottom: sz(u, 10) }}>
            <div aria-hidden style={{ width: sz(u, 40), height: sz(u, 40), borderRadius: "50%", background: `linear-gradient(135deg,${u.G},${u.G}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 18), flexShrink: 0 }}>👤</div>
            <div>
              {/* Le nom EST le titre de la fiche : un lecteur d'écran y saute. */}
              {m.nom && <h2 style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 700, margin: 0, fontFamily: u.FONT_B }}>{m.nom}</h2>}
              {m.entreprise && <p style={{ color: u.MUTED, fontSize: sz(u, 11), margin: 0 }}>{m.entreprise}</p>}
            </div>
          </div>
        )}
        {u.mode === "public"
          ? <a href={m.href} download={m.fichier} onClick={() => { try { u.trackClick("vcard") } catch {} }} style={bouton}>{m.label}</a>
          : <div aria-disabled="true" style={bouton}>{m.label}</div>}
      </div>
    </div>
  )
}

export function EditorVcard({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = ficheContact(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="👤" label="Ajoutez un nom, un téléphone ou un e-mail" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicVcard({ content, ctx }: PublicAdapterProps) {
  const m = ficheContact(content)
  return m ? <Vue u={publicCtx(ctx)} m={m} /> : null
}
