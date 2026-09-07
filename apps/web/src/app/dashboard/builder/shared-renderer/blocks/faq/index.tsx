"use client"
// faq — Questions et reponses. Deux ecarts corriges en migrant :
//
//  · sans aucune question, la page ne publie rien — mais l'apercu dessinait le
//    titre, le sous-titre, la barre de recherche et les onglets de categories.
//    Un en-tete de FAQ qui n'existerait jamais ;
//  · « Cartes » etait propose comme troisieme style et rendait EXACTEMENT la
//    meme chose que « Compact », des deux cotes. Le commercant choisissait un
//    affichage qu'il n'obtenait pas. Il a desormais son dessin propre : des
//    cartes posees sur une surface, plus aeree que le mode compact.
import { useState } from "react"
import { faq, filtrer, type Question } from "../../models/informationsEtAnnonces"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { avecCibleTactile } from "../../primitives/BlockCtaLink"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Item({ u, it, compact, cartes }: { u: UnifiedCtx; it: Question; compact: boolean; cartes: boolean }) {
  const [ouvert, setOuvert] = useState(false)
  const pad = compact ? `${sz(u, 10)}px ${sz(u, 14)}px` : `${sz(u, 13)}px ${sz(u, 16)}px`
  return (
    <div style={{
      border: `1px solid ${ouvert ? u.G + "30" : u.LINE}`, borderRadius: compact ? 10 : cartes ? 14 : 12,
      overflow: "hidden", marginBottom: compact ? sz(u, 6) : sz(u, 8),
      background: cartes ? u.FILL : "transparent",
      boxShadow: cartes ? `0 1px 0 ${u.LINE}` : undefined,
    }}>
      <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} style={avecCibleTactile({
        width: "100%", justifyContent: "space-between", padding: pad,
        background: ouvert ? `${u.G}06` : "transparent", border: "none", color: u.TEXT,
        fontSize: compact ? sz(u, 13) : sz(u, 14), fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: u.FONT_B,
      })}>
        {it.q}<span aria-hidden style={{ color: u.G, fontSize: sz(u, 20), flexShrink: 0, marginLeft: sz(u, 12), transform: ouvert ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.2s" }}>+</span>
      </button>
      <div style={{ maxHeight: ouvert ? 1500 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
        <div style={{ padding: compact ? `0 ${sz(u, 14)}px ${sz(u, 12)}px` : `0 ${sz(u, 16)}px ${sz(u, 14)}px` }}>
          {it.a && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: u.FONT_B }}>{it.a}</p>}
          {it.lien && (u.mode === "public"
            ? <a href={it.lien.href} target="_blank" rel="noopener noreferrer" onClick={() => u.trackClick(it.lien!.href)}
                style={{ display: "inline-flex", alignItems: "center", gap: sz(u, 5), marginTop: it.a ? sz(u, 10) : 0, color: u.G, fontSize: sz(u, 12.5), fontWeight: 700, textDecoration: "none" }}>{it.lien.label} <span aria-hidden>→</span></a>
            : <span aria-disabled="true" style={{ display: "inline-flex", alignItems: "center", gap: sz(u, 5), marginTop: it.a ? sz(u, 10) : 0, color: u.G, fontSize: sz(u, 12.5), fontWeight: 700 }}>{it.lien.label} <span aria-hidden>→</span></span>)}
        </div>
      </div>
    </div>
  )
}

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const f = faq(c)!
  const [recherche, setRecherche] = useState("")
  const [categorie, setCategorie] = useState("")
  const compact = f.style === "Compact"
  const cartes = f.style === "Cartes"
  const visibles = filtrer(f.items, recherche, categorie)
  const pastille = (actif: boolean) => ({
    padding: `${sz(u, 6)}px ${sz(u, 12)}px`, borderRadius: 999, fontSize: sz(u, 12), fontWeight: 600,
    cursor: u.mode === "public" ? "pointer" : "default",
    border: `1px solid ${actif ? u.G + "60" : u.LINE}`, background: actif ? `${u.G}14` : "transparent",
    color: actif ? u.G : u.MUTED, whiteSpace: "nowrap" as const, fontFamily: u.FONT_B,
  })
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 16)}px`, fontFamily: u.FONT_B }}>
      {f.titre && <p style={{ color: u.MUTED, fontSize: sz(u, 11), textTransform: "uppercase", letterSpacing: 2, margin: `0 0 ${sz(u, 4)}px`, fontFamily: u.FONT_B }}>{f.titre}</p>}
      {f.sousTitre && <p style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 600, margin: `0 0 ${sz(u, 12)}px`, fontFamily: u.FONT_B }}>{f.sousTitre}</p>}
      {/* Le MEME champ des deux cotes, inerte dans le canvas : un <div> portant
          le texte en clair aurait donne un aperçu qui ne ressemble pas a la
          page — l'ecart exact que ce renderer existe pour supprimer. */}
      {f.recherche && (
        <input
          value={u.mode === "public" ? recherche : ""} onChange={e => setRecherche(e.target.value)}
          readOnly={u.mode !== "public"} tabIndex={u.mode === "public" ? undefined : -1}
          type="search" inputMode="search" placeholder="Rechercher une question…" aria-label="Rechercher dans la FAQ"
          style={{ width: "100%", boxSizing: "border-box", padding: `${sz(u, 11)}px ${sz(u, 14)}px`, marginBottom: f.categories.length ? sz(u, 10) : sz(u, 12), borderRadius: 11, border: `1px solid ${u.LINE}`, background: u.FILL, color: u.TEXT, fontSize: sz(u, 13.5), outline: "none", fontFamily: u.FONT_B, pointerEvents: u.mode === "public" ? undefined : "none" }} />
      )}
      {f.categories.length > 0 && (
        <div style={{ display: "flex", gap: sz(u, 7), overflowX: "auto", padding: `2px 0 ${sz(u, 12)}px` }}>
          <button type="button" onClick={() => u.mode === "public" && setCategorie("")} style={pastille(!categorie)}>Tout</button>
          {f.categories.map(cn => <button key={cn} type="button" onClick={() => u.mode === "public" && setCategorie(cn)} style={pastille(categorie === cn)}>{cn}</button>)}
        </div>
      )}
      {visibles.length > 0
        ? visibles.map((it, i) => <Item key={i} u={u} it={it} compact={compact} cartes={cartes} />)
        : <p style={{ color: u.MUTED, fontSize: sz(u, 13), textAlign: "center", padding: `${sz(u, 18)}px 0`, margin: 0, fontFamily: u.FONT_B }}>Aucune question ne correspond à votre recherche.</p>}
    </div>
  )
}

export function EditorFaq({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Sans question, plus d'en-tete non plus : la page n'en publierait pas.
  if (!faq(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="❓" label="Ajoutez une question" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicFaq({ content, ctx }: PublicAdapterProps) {
  if (!faq(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
