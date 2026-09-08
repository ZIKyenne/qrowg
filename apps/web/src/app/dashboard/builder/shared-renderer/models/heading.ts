// Modèle de vue PUR du bloc `heading`. Aucun React, aucun Supabase, aucun tracking.
// Source unique consommée par les adapters éditeur ET public (parité par construction).

export type HeadingViewModel = {
  // Un titre vide n'est plus « toujours rendu » : la page publiait le mot
  // « Titre » en gros caractères, en haut d'une section, à la place du
  // commerçant. Un bloc titre neuf naît avec `text: ""` — il suffisait donc de
  // le poser et de publier. (Vague 24.)
  visible: boolean
  text: string
  subtitle?: string
  align: string              // left | center | right (défaut center)
  size: string               // small | medium | large | xl (défaut medium)
  color: string              // default | primary | accent | muted (défaut default)
}

export function headingViewModel(content: Record<string, any> | null | undefined): HeadingViewModel {
  const c = content || {}
  const text = typeof c.text === "string" ? c.text.trim() : ""
  const subtitle = typeof c.subtitle === "string" && c.subtitle.trim() ? c.subtitle.trim() : undefined
  return {
    visible: !!(text || subtitle),
    text,
    subtitle,
    align: typeof c.align === "string" && c.align ? c.align : "center",
    size: typeof c.size === "string" && c.size ? c.size : "medium",
    color: typeof c.color === "string" && c.color ? c.color : "default",
  }
}
