// Echappement HTML complet (contenu ET valeurs d'attribut) pour l'interpolation
// de donnees non fiables dans les emails. Etait duplique et incomplet (sans les
// guillemets) dans les routes email -> une valeur avec " pouvait sortir d'un
// attribut href="..." et injecter du HTML.
const MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

export function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, ch => MAP[ch])
}
