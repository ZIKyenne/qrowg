// =============================================================================
// mobileContextTools.ts — Moteur PUR de la barre contextuelle mobile (facon Canva).
// "Que veux-tu faire ?" : a partir du type d'objet selectionne, renvoie l'ensemble
// ORDONNE d'actions pertinentes (et rien d'autre). Aucune dependance DOM/Fabric.
// La 1ere entree (hors selection multiple) est toujours "Modifier" -> ouvre le
// panneau complet ; les suivantes sont des actions directes (1 geste).
// =============================================================================

export type SelKind = "qr" | "text" | "image" | "button" | "group" | "shape" | "multi"

export type CtxTool = { id: string; label: string; icon: string }

// Etat de selection minimal necessaire pour deduire le type (sous-ensemble de SelState).
export type SelLike = {
  multi?: boolean
  isQr?: boolean
  isImage?: boolean
  isText?: boolean
  label?: string | null
  isGroupObj?: boolean
}

// Deduit le type de selection, par ordre de priorite (multi l'emporte, puis QR, etc.).
export function selKind(sel: SelLike): SelKind {
  if (sel.multi) return "multi"
  if (sel.isQr) return "qr"
  if (sel.isImage) return "image"
  if (sel.isText) return "text"
  if (sel.label != null) return "button"
  if (sel.isGroupObj) return "group"
  return "shape"
}

const EDIT: CtxTool = { id: "settings", label: "Modifier", icon: "sliders" }
const DUP: CtxTool = { id: "dup", label: "Dupliquer", icon: "copy" }
const ROTATE: CtxTool = { id: "rotate", label: "Pivoter", icon: "rotate" }
const DELETE: CtxTool = { id: "delete", label: "Supprimer", icon: "trash" }
const TAIL: CtxTool[] = [DUP, ROTATE, DELETE]

// Actions contextuelles selon le type. Toujours au moins une action + Supprimer.
export function mobileContextTools(kind: SelKind): CtxTool[] {
  switch (kind) {
    case "qr":
      return [EDIT, { id: "dress", label: "Habiller", icon: "frame" }, ...TAIL]
    case "text":
      return [EDIT, { id: "sizeDown", label: "A−", icon: "minus" }, { id: "sizeUp", label: "A+", icon: "plus" }, ...TAIL]
    case "image":
      return [EDIT, { id: "front", label: "Devant", icon: "up" }, { id: "back", label: "Derrière", icon: "down" }, ...TAIL]
    case "group":
      return [EDIT, { id: "ungroup", label: "Dégrouper", icon: "ungroup" }, ...TAIL]
    case "multi":
      return [{ id: "align", label: "Aligner", icon: "align" }, { id: "group", label: "Grouper", icon: "group" }, DUP, DELETE]
    case "button":
    case "shape":
    default:
      return [EDIT, ...TAIL]
  }
}
