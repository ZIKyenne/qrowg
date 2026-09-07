"use client"
// team — « Notre equipe ». Le seul bloc migre jusqu'ici qui laisse corriger un
// nom, un role ou une bio directement dans l'apercu : la vue partagee recoit le
// rendu du texte en parametre (voir RenduTexte), pour garder cette capacite sans
// ecrire deux vues qui se recopient.
import { equipe, enGrille, type Membre } from "../../models/equipeEtContacts"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { Avatar, BoutonsJointure, styleCarte } from "../../views/CarteMembre"
import { texteFige, texteEditable } from "../../primitives/TexteInline"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type RenduTexte, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Fiche({ u, m, grille, accent, Texte }: { u: UnifiedCtx; m: Membre; grille: boolean; accent: string; Texte: RenduTexte }) {
  const centre = grille
  return (
    <div style={{
      ...styleCarte(u, 13, grille ? "15px 12px" : "13px 15px"),
      display: "flex",
      ...(grille
        ? { flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const, gap: sz(u, 4) }
        : { alignItems: "flex-start", gap: sz(u, 13) }),
    }}>
      <Avatar u={u} photo={m.photo} nom={m.nom} taille={grille ? 60 : 48} accent={accent} />
      <div style={grille ? { minWidth: 0 } : { flex: 1, minWidth: 0 }}>
        <Texte valeur={m.nom} cle={`m${m.i}_name`} balise="p"
          style={{ color: u.TEXT, fontSize: sz(u, grille ? 13.5 : 14), fontWeight: 700, margin: grille ? `${sz(u, 6)}px 0 0` : "0 0 2px", fontFamily: u.FONT_B }} />
        {m.role && <Texte valeur={m.role} cle={`m${m.i}_role`} balise="p"
          style={{ color: u.G, fontSize: sz(u, 13), margin: grille ? 0 : "0 0 1px" }} />}
        {m.bio && <Texte valeur={m.bio} cle={`m${m.i}_bio`} balise="p" multiligne
          style={{ color: u.MUTED, fontSize: sz(u, 11), margin: grille ? `${sz(u, 2)}px 0 0` : 0, lineHeight: 1.4 }} />}
        <BoutonsJointure u={u} jointures={m.jointures} centre={centre} />
      </div>
    </div>
  )
}

function Vue({ u, c, accent, Texte }: { u: UnifiedCtx; c: Record<string, any>; accent: string; Texte: RenduTexte }) {
  const membres = equipe(c)
  const grille = enGrille(c)
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={c?.title} marge={12} />
      <div style={grille
        ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: sz(u, 9) }
        : { display: "flex", flexDirection: "column", gap: sz(u, 10) }}>
        {membres.map(m => <Fiche key={m.i} u={u} m={m} grille={grille} accent={accent} Texte={Texte} />)}
      </div>
    </div>
  )
}

export function EditorTeam({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (equipe(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="👥" label="Ajoutez un membre de l'équipe" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} accent={ctx.accent} Texte={texteEditable(ctx.canEdit, ctx.edit)} />
}
export function PublicTeam({ content, ctx }: PublicAdapterProps) {
  if (equipe(content).length === 0) return null
  return <Vue u={publicCtx(ctx)} c={content} accent={(ctx.theme as any)?.accent || "var(--success)"} Texte={texteFige} />
}
