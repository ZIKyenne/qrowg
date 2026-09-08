// Primitive d'état vide (éditeur). Reproduit EXACTEMENT `emptyHint` de builderPreview.
// Aucune dépendance éditeur/Supabase → réutilisable par les adapters éditeur partagés.

export const HIDDEN_WHEN_EMPTY_NOTE = "Invisible en ligne tant qu'il est vide"

export function BlockEmptyState({ icon, label, sub, muted }: { icon: string; label: string; sub?: string; muted: string }) {
  return (
    <div role="note" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "18px 12px", border: `1.5px dashed ${muted}40`, borderRadius: 12, color: muted, textAlign: "center" }}>
      <span style={{ fontSize: 22, opacity: 0.7 }} aria-hidden>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
      {sub && <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.75 }}>{sub}</span>}
    </div>
  )
}

// Mention discrète pour les blocs qui s'éditent DIRECTEMENT dans le canvas
// (titre, bio) : leur remplacer le champ par un état vide leur retirerait la
// saisie en place. On garde le champ, on ajoute la vérité sous lui.
export function NoteInvisibleEnLigne({ muted }: { muted: string }) {
  return <p role="note" style={{ margin: "6px 0 0", fontSize: 10, color: muted, opacity: 0.8 }}>{HIDDEN_WHEN_EMPTY_NOTE}</p>
}
