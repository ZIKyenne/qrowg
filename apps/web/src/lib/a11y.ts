import type { KeyboardEvent } from "react"

// Rend un <div onClick> activable au clavier : à combiner avec role="button"
// tabIndex={0}. Déclenche `fn` sur Entrée / Espace (comme un vrai bouton).
export const onEnterSpace = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    fn()
  }
}
