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
// "Plus" : ouvre un sheet avec les actions secondaires (empilement, calques, dupliquer,
// pivoter, verrouiller, supprimer...). Garde la barre a ~5 intentions max (audit iOS).
const MORE: CtxTool = { id: "more", label: "Plus", icon: "more" }

// Actions contextuelles VISIBLES selon le type : max 5 intentions directes + "Plus".
export function mobileContextTools(kind: SelKind): CtxTool[] {
  switch (kind) {
    case "qr":
      return [
        { id: "colors", label: "Couleurs", icon: "colors" },
        { id: "modules", label: "Modules", icon: "modules" },
        { id: "corners", label: "Coins", icon: "corners" },
        { id: "ecc", label: "Correction", icon: "ecc" },
        { id: "frame", label: "Cadre", icon: "frame" },
        MORE,
      ]
    case "text":
      return [
        { id: "font", label: "Police", icon: "font" },
        { id: "textcolor", label: "Couleur", icon: "colors" },
        { id: "textsize", label: "Taille", icon: "size" },
        { id: "effects", label: "Effets", icon: "effects" },
        { id: "textalign", label: "Aligner", icon: "align" },
        MORE,
      ]
    case "image":
      return [
        { id: "filters", label: "Filtres", icon: "filters" },
        { id: "opacity", label: "Opacité", icon: "opacity" },
        { id: "replace", label: "Remplacer", icon: "replace" },
        ROTATE,
        MORE,
      ]
    case "group":
      return [EDIT, { id: "ungroup", label: "Dégrouper", icon: "ungroup" }, MORE]
    case "multi":
      return [{ id: "align", label: "Aligner", icon: "align" }, { id: "group", label: "Grouper", icon: "group" }, DUP, DELETE]
    case "shape":
      return [
        { id: "shapecolor", label: "Couleur", icon: "colors" },
        { id: "border", label: "Bordure", icon: "border" },
        { id: "shadow", label: "Ombre", icon: "shadow" },
        ROTATE,
        MORE,
      ]
    case "button":
      return [
        { id: "btntext", label: "Texte", icon: "font" },
        { id: "btncolor", label: "Couleur", icon: "colors" },
        MORE,
      ]
    default:
      return [EDIT, MORE]
  }
}
