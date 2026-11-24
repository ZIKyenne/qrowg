"use client"
// Rangée d'étoiles à remplissage partiel (4,6 → quatre pleines, une aux 60 %).
// Vivait deux fois : `StarRow` dans `[slug]/blocsPublics.tsx` et une copie
// locale dans l'aperçu de l'éditeur. Une seule, ici (rendu unique, lot 4).
// Décorative : la note s'écrit en chiffres à côté, un lecteur d'écran la lit là.
export function Etoiles({ remplissage, taille = 13, couleur = "#FBBF24", vide = "rgba(255,255,255,0.18)" }: { remplissage: number[]; taille?: number; couleur?: string; vide?: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }} aria-hidden="true">
      {remplissage.map((f, i) => (
        <span key={i} style={{ position: "relative", display: "inline-block", color: vide, fontSize: taille, lineHeight: 1 }}>★
          <span style={{ position: "absolute", left: 0, top: 0, overflow: "hidden", width: `${Math.round(f * 100)}%`, color: couleur }}>★</span>
        </span>
      ))}
    </span>
  )
}
