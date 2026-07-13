// =============================================================================
// uiComplexity.ts — Moteur PUR du mode Simple / Expert (critique #3).
// Le mode Simple masque les reglages "avances" pour ne montrer que l'essentiel ;
// le mode Expert revele tout. La classification (quelle section est avancee) est
// ici, pure et testable. Aucune dependance DOM.
// =============================================================================

export type UiMode = "simple" | "expert"

// Identifiants de sections consideres "avances" -> masques en mode Simple.
const ADVANCED = new Set<string>([
  "qr-corners",      // QR : style des coins / yeux
  "qr-ecc",          // QR : niveau de correction d'erreur
  "text-effects",    // Texte : ombre / contour
  "text-spacing",    // Texte : espacement / interligne
  "shape-border",    // Formes : contour
  "shape-shadow",    // Formes : ombre portee
  "align-distribute",// Alignement / distribution fine
])

// La section est-elle classee "avancee" ?
export function isAdvancedSection(id: string): boolean {
  return ADVANCED.has(id)
}

// Doit-on afficher cette section dans le mode courant ?
// Essentiel : toujours. Avance : seulement en Expert.
export function showSection(id: string, mode: UiMode): boolean {
  return mode === "expert" || !ADVANCED.has(id)
}

// Bascule Simple <-> Expert.
export function nextMode(m: UiMode): UiMode {
  return m === "simple" ? "expert" : "simple"
}

// Normalise une valeur inconnue (ex. localStorage) vers un mode valide.
export function coerceMode(v: unknown): UiMode {
  return v === "expert" ? "expert" : "simple"
}
