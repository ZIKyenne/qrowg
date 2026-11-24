"use client"
// media_before_after — Deux photos, avant et après : côte à côte, ou sous un
// curseur à glisser. L'aperçu montrait toujours la grille, même réglé en
// curseur ; il montre maintenant ce que verra le visiteur.
import SmartImage from "@/components/SmartImage"
import { avantApres } from "../../models/medias"
import { CurseurAvantApres } from "../../primitives/CurseurAvantApres"
import { pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const SIZES_DEMI = "(max-width: 520px) 50vw, 260px"

function Volet({ u, src, label, teinte, couleur, vide }: { u: UnifiedCtx; src: string; label: string; teinte: string; couleur: string; vide: string }) {
  const h = sz(u, 150)
  return (
    <figure style={{ margin: 0, borderRadius: sz(u, 11), overflow: "hidden" }}>
      {src
        ? <SmartImage width={1200} height={900} sizes={SIZES_DEMI} onError={e => { e.currentTarget.style.display = "none" }} src={src} alt={label} style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} />
        : <div aria-hidden style={{ height: h, background: `${teinte}0f`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 30) }}>{vide}</div>}
      <figcaption style={{ background: `${teinte}26`, padding: sz(u, 7), textAlign: "center", color: couleur, fontSize: sz(u, 12), fontWeight: 700 }}>{label}</figcaption>
    </figure>
  )
}

function Vue({ u, m }: { u: UnifiedCtx; m: NonNullable<ReturnType<typeof avantApres>> }) {
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      {m.titre && <h2 style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 700, margin: `0 0 ${sz(u, 11)}px`, textAlign: "center", fontFamily: u.FONT_B }}>{m.titre}</h2>}
      {m.curseur
        ? <CurseurAvantApres avant={m.avant} apres={m.apres} labelAvant={m.labelAvant} labelApres={m.labelApres} hauteur={sz(u, 260)} />
        : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: sz(u, 9) }}>
            <Volet u={u} src={m.avant} label={m.labelAvant} teinte="#EF4444" couleur={u.lisible("#EF4444")} vide="📸" />
            <Volet u={u} src={m.apres} label={m.labelApres} teinte="#39FF8F" couleur={u.lisible("#39FF8F")} vide="✨" />
          </div>}
      {m.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13.5), textAlign: "center", margin: `${sz(u, 9)}px 0 0` }}>{m.description}</p>}
    </div>
  )
}

export function EditorMediaBeforeAfter({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = avantApres(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🪞" label="Ajoutez la photo avant ou après" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicMediaBeforeAfter({ content, ctx }: PublicAdapterProps) {
  const m = avantApres(content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} m={m} />
}
