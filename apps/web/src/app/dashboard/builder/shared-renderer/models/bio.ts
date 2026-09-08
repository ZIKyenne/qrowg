// Modèle pur du bloc `bio` (texte de présentation). Aucun React/Supabase.
// Vague 25 — « visible: true » sans condition : posé vide, ce bloc publiait son
// décor et rien d'autre. Un cadre vide sur la page du client.
export type BioViewModel = { visible: boolean; text: string; align: string }
export function bioViewModel(content: Record<string, any> | null | undefined): BioViewModel {
  const c = content || {}
  const text = typeof c.text === "string" ? c.text : ""
  return { visible: !!text.trim(), text, align: typeof c.align === "string" && c.align ? c.align : "left" }
}
