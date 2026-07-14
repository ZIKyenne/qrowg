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
const STACK: CtxTool = { id: "stack", label: "Empilement", icon: "stack" }
const DUP: CtxTool = { id: "dup", label: "Dupliquer", icon: "copy" }
const ROTATE: CtxTool = { id: "rotate", label: "Pivoter", icon: "rotate" }
const DELETE: CtxTool = { id: "delete", label: "Supprimer", icon: "trash" }
// Fin commune des barres mono-objet : gerer l'empilement, dupliquer, pivoter, supprimer.
const TAIL: CtxTool[] = [STACK, DUP, ROTATE, DELETE]

// Actions contextuelles selon le type. Toujours au moins une action + Supprimer.
export function mobileContextTools(kind: SelKind): CtxTool[] {
  switch (kind) {
    case "qr":
      // Barre QR = intentions d'edition DIRECTES (chacune ouvre un sheet focalise),
      // pas un "Modifier" fourre-tout (critique #4/#5/#20).
      return [
        { id: "colors", label: "Couleurs", icon: "colors" },
        { id: "modules", label: "Modules", icon: "modules" },
        { id: "corners", label: "Coins", icon: "corners" },
        { id: "ecc", label: "Correction", icon: "ecc" },
        { id: "dress", label: "Habiller", icon: "frame" },
        STACK, DUP, DELETE,
      ]
    case "text":
      // Intentions texte directes -> sheets focalises (Police/Couleur/Taille/Effets/Aligner).
      return [
        { id: "font", label: "Police", icon: "font" },
        { id: "textcolor", label: "Couleur", icon: "colors" },
        { id: "textsize", label: "Taille", icon: "size" },
        { id: "effects", label: "Effets", icon: "effects" },
        { id: "textalign", label: "Aligner", icon: "align" },
        STACK, DUP, DELETE,
      ]
    case "image":
      // Intentions image directes -> sheets focalises (Filtres/Opacite) + Pivoter direct.
      return [
        { id: "filters", label: "Filtres", icon: "filters" },
        { id: "opacity", label: "Opacité", icon: "opacity" },
        ROTATE,
        STACK, DUP, DELETE,
      ]
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
