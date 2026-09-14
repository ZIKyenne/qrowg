// Contrat AVANT/APRÈS partagé (B09.11) — couvre le niveau STATIQUE (before_after, déjà shared,
// inchangé) et prépare le futur niveau SLIDER (media_before_after, NON migré ici). Pur (aucun
// React). Images sécurisées via le contrat d'image partagé ; position bornée [0..100].
import { sharedImageModel, type SharedImageModel } from "./sharedImage"
import { entierDuContenu } from "@/lib/nombreDuContenu"

export type BeforeAfterMode = "static" | "slider"
export type BeforeAfterModel = {
  visible: boolean
  before: SharedImageModel | null
  after: SharedImageModel | null
  beforeLabel: string
  afterLabel: string
  mode: BeforeAfterMode
  initialPosition: number
}

export function beforeAfterModel(content: Record<string, any> | null | undefined): BeforeAfterModel {
  const c = content || {}
  const before = c.before_img ? sharedImageModel(c.before_img, { alt: "Avant" }) : null
  const after = c.after_img ? sharedImageModel(c.after_img, { alt: "Après" }) : null
  const initialPosition = entierDuContenu(c.initial_position, 50, 0, 100)
  return {
    visible: !!(c.before_img || c.after_img), before, after,
    beforeLabel: c.before_label || "Avant", afterLabel: c.after_label || "Après",
    mode: c.mode === "slider" ? "slider" : "static", initialPosition,
  }
}
