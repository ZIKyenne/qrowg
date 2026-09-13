"use client"
// Le bloc « quelle taille ça fait une fois imprimé » de l'écran d'export.
//
// Sorti de QRStudio.tsx, tenu sous 3 000 lignes par `testsDeterministes` : la
// conversion vit dans ./taillePourImpression, l'affichage ici, et l'écran ne
// garde que l'état.
import { phraseTaille, verdictImpression, tailleConseillee } from "./taillePourImpression"

export function TaillePhysique({ px, mm, onMm, onTaille, MUTED }: {
  px: number
  mm: number
  onMm: (mm: number) => void
  onTaille: (px: number) => void
  MUTED: string
}) {
  const conseil = mm > 0 ? tailleConseillee(mm) : null
  const v = mm > 0 ? verdictImpression(px, mm) : null
  const couleur = !v ? MUTED : v.qualite === "imprimeur" ? "var(--success)" : v.qualite === "rapide" ? "#FBBF24" : "#FF6B6B"
  return (
    <>
      <p style={{ color: MUTED, fontSize: 11, margin: "3px 0 0", lineHeight: 1.5 }}>{phraseTaille(px)}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <label htmlFor="exp-mm" style={{ color: MUTED, fontSize: 11 }}>Je l&apos;imprime en</label>
        <input id="exp-mm" type="number" min={0} max={1000} value={mm || ""} placeholder="—"
          onChange={e => onMm(Math.max(0, Math.min(1000, Number(e.target.value))))}
          style={{ width: 72, background: "var(--surface)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 9px", color: "var(--ink)", fontSize: 12, outline: "none" }} />
        <span style={{ color: MUTED, fontSize: 11 }}>mm de côté</span>
        {conseil && conseil !== px && (
          <button type="button" onClick={() => onTaille(conseil)}
            style={{ padding: "5px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "var(--ink)", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
            Prendre {conseil}px
          </button>
        )}
      </div>
      {v && <p style={{ color: couleur, fontSize: 11, margin: "6px 0 0", lineHeight: 1.5 }}>{v.phrase}</p>}
    </>
  )
}
