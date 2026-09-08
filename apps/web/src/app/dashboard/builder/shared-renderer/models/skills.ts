// Modèle pur du bloc `skills` (étiquettes séparées par virgules). Aucun React/Supabase.
// Vague 25 — « visible: true » sans condition : posé vide, ce bloc publiait son
// décor et rien d'autre. Un cadre vide sur la page du client.
export type SkillsViewModel = { visible: boolean; title?: string; tags: string[] }
export function skillsViewModel(content: Record<string, any> | null | undefined): SkillsViewModel {
  const c = content || {}
  const tags = (typeof c.tags === "string" ? c.tags : "").split(",").map((t: string) => t.trim()).filter(Boolean)
  return { visible: tags.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined, tags }
}
