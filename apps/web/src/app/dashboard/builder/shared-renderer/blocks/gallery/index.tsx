"use client"
// gallery — La grille de photos. Deux ecarts corriges en migrant :
//
//  · l'apercu rendait des <img src={…}> bruts. Pour douze photos televersees,
//    le telephone de l'auteur retelechargeait douze originaux pleine taille a
//    chaque ouverture du canvas — pour des vignettes de quelques dizaines de
//    pixels. La page publiee, elle, passait deja par SmartImage et `sizes`.
//
//  · l'apercu ignorait les descriptions de photos. Le champ existe, il est lu a
//    voix haute par les lecteurs d'ecran et affiche si l'image ne charge pas :
//    l'auteur ne pouvait pas verifier ce qu'il avait ecrit.
//
// La visionneuse (clic pour agrandir) reste PUBLIQUE : dans le canvas, cliquer
// une photo doit selectionner le bloc, pas ouvrir une lightbox par-dessus
// l'editeur.
import { useEffect, useState } from "react"
import { galerie, sizesGrille } from "../../models/horairesGalerieReseaux"
import { altGalerie } from "@/lib/texteAlternatif"
import SmartImage from "@/components/SmartImage"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const g = galerie(c)!
  const [ouverte, setOuverte] = useState<number | null>(null)
  const agrandissable = u.mode === "public"
  const total = g.photos.length
  useEffect(() => {
    if (ouverte === null) return
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuverte(null)
      else if (e.key === "ArrowRight") setOuverte(i => (i === null ? i : (i + 1) % total))
      else if (e.key === "ArrowLeft") setOuverte(i => (i === null ? i : (i - 1 + total) % total))
    }
    window.addEventListener("keydown", touche)
    return () => window.removeEventListener("keydown", touche)
  }, [ouverte, total])

  const titre = g.titre && <p style={{ color: u.MUTED, fontSize: sz(u, 11), textTransform: "uppercase", letterSpacing: 2, margin: `0 0 ${sz(u, 10)}px`, fontFamily: u.FONT_B }}>{g.titre}</p>
  const alt = (i: number) => altGalerie(g.photos[i].legende, g.titre, i, total)
  const ouvrir = agrandissable ? (i: number) => () => setOuverte(i) : () => undefined

  const visionneuse = agrandissable && ouverte !== null && (
    <div onClick={() => setOuverte(null)} role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <button onClick={e => { e.stopPropagation(); setOuverte(null) }} aria-label="Fermer" style={{ position: "absolute", top: 14, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
      {total > 1 && <>
        <button onClick={e => { e.stopPropagation(); setOuverte(i => i === null ? i : (i - 1 + total) % total) }} aria-label="Précédente" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>‹</button>
        <button onClick={e => { e.stopPropagation(); setOuverte(i => i === null ? i : (i + 1) % total) }} aria-label="Suivante" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>›</button>
      </>}
      <SmartImage src={g.photos[ouverte].src} alt={alt(ouverte)} width={1600} height={1200} sizes="100vw" onClick={e => e.stopPropagation()} onError={e => { e.currentTarget.style.display = "none" }} style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
      {total > 1 && <span style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.8)", fontSize: 12, background: "rgba(0,0,0,0.4)", borderRadius: 20, padding: "4px 12px" }}>{ouverte + 1} / {total}</span>}
    </div>
  )

  if (g.layout === "masonry") return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 16)}px`, fontFamily: u.FONT_B }}>
      {titre}
      <div className={`qf-cm-${g.colonnesMobile}`} style={{ columnCount: g.colonnes, columnGap: sz(u, 8) }}>
        {g.photos.map((p, i) => <SmartImage key={i} src={p.src} alt={alt(i)} width={1200} height={1600} sizes={sizesGrille(g.colonnesMobile, g.colonnes)} onClick={ouvrir(i)} onError={e => { e.currentTarget.style.display = "none" }} style={{ width: "100%", borderRadius: 10, marginBottom: sz(u, 8), display: "block", breakInside: "avoid", cursor: agrandissable ? "zoom-in" : "default" }} />)}
      </div>
      {visionneuse}
    </div>
  )
  const ecart = g.layout === "compact" ? 5 : 7
  const rayon = g.layout === "compact" ? 8 : 10
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 16)}px`, fontFamily: u.FONT_B }}>
      {titre}
      <div className={`qf-gm-${g.colonnesMobile}`} style={{ display: "grid", gridTemplateColumns: `repeat(${g.colonnes},1fr)`, gap: sz(u, ecart) }}>
        {g.photos.map((p, i) => (
          <div key={i} onClick={ouvrir(i)} style={{ overflow: "hidden", borderRadius: rayon, aspectRatio: "1", cursor: agrandissable ? "zoom-in" : "default" }}>
            <SmartImage src={p.src} alt={alt(i)} width={1200} height={1200} sizes={sizesGrille(g.colonnesMobile, g.colonnes)} onError={e => { const p2 = e.currentTarget.parentElement; if (p2) p2.style.display = "none" }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
      {visionneuse}
    </div>
  )
}

export function EditorGallery({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Il dessinait six cases « 🖼️ » factices : une galerie de six photos, sur un
  // bloc que la page publiee ne rend pas du tout.
  if (!galerie(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎨" label="Ajoutez vos photos" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicGallery({ content, ctx }: PublicAdapterProps) {
  if (!galerie(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
