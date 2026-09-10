"use client"
// announcement — La banniere d'information. Deux ecarts corriges en migrant :
//
//  · l'apercu dessinait un cadre colore avec sa seule icone quand titre ET
//    message etaient vides ; la page, elle, ne rend rien ;
//  · la fenetre de dates n'existait que cote public. Un commercant qui fixait
//    une date de fin passee voyait toujours sa banniere dans le canvas, alors
//    qu'aucun visiteur ne la voyait plus. L'apercu le dit desormais.
//
// C'est aussi le dernier bloc a edition en ligne encore ecrit deux fois.
import { useEffect, useState } from "react"
import { annonce, etatFenetre, mentionFenetre } from "../../models/informationsEtAnnonces"
import { texteFige, texteEditable } from "../../primitives/TexteInline"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type RenduTexte, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c, Texte, blockId }: { u: UnifiedCtx; c: Record<string, any>; Texte: RenduTexte; blockId: string }) {
  const a = annonce(c)!
  const [ferme, setFerme] = useState(false)
  // -1 tant que l'heure n'est pas connue : le serveur et le navigateur rendent
  // alors le meme HTML. La fenetre ne s'applique qu'apres le montage.
  const [maintenant, setMaintenant] = useState(-1)
  useEffect(() => {
    const battre = () => setMaintenant(Date.now())
    battre()
    try { if (a.fermable && localStorage.getItem("qf-ann-" + blockId) === "1") setFerme(true) } catch {}
    if (a.debut || a.fin) { const t = setInterval(battre, 60000); return () => clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.fermable, a.debut, a.fin, blockId])

  const etat = etatFenetre(a.debut, a.fin, maintenant)
  // Hors de sa fenetre : la page ne montre rien, l'apercu montre et explique.
  if (u.mode === "public" && (etat !== "pendant" || ferme)) return null
  const mention = u.mode === "editor" ? mentionFenetre(etat) : null

  const pad = a.compact ? sz(u, 6) : sz(u, 8)
  return (
    <div style={{ padding: `${pad}px ${sz(u, 24)}px`, fontFamily: u.FONT_B }}>
      <div role="status" style={{ background: `${a.couleur}14`, border: `1.5px solid ${a.couleur}44`, borderRadius: 13, padding: a.compact ? `${sz(u, 10)}px ${sz(u, 13)}px` : `${sz(u, 15)}px ${sz(u, 17)}px`, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: sz(u, 11) }}>
          <span aria-hidden style={{ fontSize: a.compact ? sz(u, 18) : sz(u, 23), flexShrink: 0, lineHeight: 1.2 }}>{a.icone}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {a.titre && <Texte valeur={a.titre} cle="title" balise="p" placeholder="Titre de l’annonce"
              style={{ color: a.couleur, fontSize: a.compact ? sz(u, 13) : sz(u, 14), fontWeight: 700, margin: a.message || a.cta ? `0 0 ${sz(u, 4)}px` : 0, fontFamily: u.FONT_B, paddingRight: a.fermable ? sz(u, 20) : 0 }} />}
            {a.message && <Texte valeur={a.message} cle="message" balise="p" multiligne placeholder="Votre message…"
              style={{ color: u.TEXT, fontSize: sz(u, 13), margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: u.FONT_B }} />}
            {a.cta && (u.mode === "public"
              ? <a href={a.cta.href} target="_blank" rel="noopener noreferrer" onClick={() => u.trackClick(a.cta!.href)}
                  style={{ display: "inline-flex", alignItems: "center", gap: sz(u, 5), marginTop: sz(u, 9), color: a.couleur, fontSize: sz(u, 12.5), fontWeight: 700, textDecoration: "none" }}>{a.cta.label} <span aria-hidden>→</span></a>
              : <span aria-disabled="true" style={{ display: "inline-flex", alignItems: "center", gap: sz(u, 5), marginTop: sz(u, 9), color: a.couleur, fontSize: sz(u, 12.5), fontWeight: 700 }}>{a.cta.label} <span aria-hidden>→</span></span>)}
          </div>
          {a.fermable && (u.mode === "public"
            ? <button onClick={() => { setFerme(true); try { localStorage.setItem("qf-ann-" + blockId, "1") } catch {} }} aria-label="Fermer l'annonce"
                style={{ position: "absolute", top: sz(u, 8), right: sz(u, 10), width: sz(u, 22), height: sz(u, 22), display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: a.couleur, opacity: 0.7, fontSize: sz(u, 18), lineHeight: 1, cursor: "pointer" }}>×</button>
            : <span aria-hidden style={{ position: "absolute", top: sz(u, 8), right: sz(u, 10), color: a.couleur, opacity: 0.6, fontSize: sz(u, 18), lineHeight: 1 }}>×</span>)}
        </div>
      </div>
      {mention && <p role="note" style={{ margin: `${sz(u, 6)}px 0 0`, color: u.MUTED, fontSize: sz(u, 11), textAlign: "center", fontFamily: u.FONT_B }}>⚠︎ {mention}</p>}
    </div>
  )
}

export function EditorAnnouncement({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!annonce(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📢" label="Écrivez votre annonce" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} Texte={texteEditable(ctx.canEdit, ctx.edit)} blockId="apercu" />
}
export function PublicAnnouncement({ content, ctx }: PublicAdapterProps) {
  if (!annonce(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} Texte={texteFige} blockId={ctx.blockId} />
}
