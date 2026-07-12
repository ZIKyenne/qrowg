// alignDistribute.ts — Alignement & distribution d'objets (pur, testable).
// Prend des boîtes englobantes ABSOLUES (espace-canvas) et renvoie les translations à appliquer.
// L'adaptateur (PrintStudio) lit les bounding rects, applique {dx,dy} à chaque objet.

export type Box = { left: number; top: number; width: number; height: number }
export type Delta = { dx: number; dy: number }
export type AlignMode = "left" | "centerH" | "right" | "top" | "middleV" | "bottom"

// Alignement sur la boîte englobante commune de la sélection.
// left/right/centerH -> agit en X ; top/bottom/middleV -> agit en Y.
export function alignDeltas(boxes: Box[], mode: AlignMode): Delta[] {
  if (boxes.length === 0) return []
  const minL = Math.min(...boxes.map(b => b.left))
  const maxR = Math.max(...boxes.map(b => b.left + b.width))
  const minT = Math.min(...boxes.map(b => b.top))
  const maxB = Math.max(...boxes.map(b => b.top + b.height))
  const cx = (minL + maxR) / 2
  const cy = (minT + maxB) / 2
  return boxes.map(b => {
    switch (mode) {
      case "left":    return { dx: minL - b.left, dy: 0 }
      case "right":   return { dx: maxR - (b.left + b.width), dy: 0 }
      case "centerH": return { dx: cx - (b.left + b.width / 2), dy: 0 }
      case "top":     return { dx: 0, dy: minT - b.top }
      case "bottom":  return { dx: 0, dy: maxB - (b.top + b.height) }
      case "middleV": return { dx: 0, dy: cy - (b.top + b.height / 2) }
      default:        return { dx: 0, dy: 0 }
    }
  })
}

// Distribution : espacement ÉGAL entre les objets, les extrêmes restant en place.
// Nécessite ≥ 3 objets (sinon aucune translation). axis "h" = horizontal, "v" = vertical.
export function distributeDeltas(boxes: Box[], axis: "h" | "v"): Delta[] {
  const n = boxes.length
  const deltas: Delta[] = boxes.map(() => ({ dx: 0, dy: 0 }))
  if (n < 3) return deltas
  const start = (b: Box) => (axis === "h" ? b.left : b.top)
  const size = (b: Box) => (axis === "h" ? b.width : b.height)
  // Ordre selon la position de départ.
  const order = boxes.map((_, i) => i).sort((a, b) => start(boxes[a]) - start(boxes[b]))
  const first = boxes[order[0]], last = boxes[order[n - 1]]
  const span = (start(last) + size(last)) - start(first)          // du bord de départ du 1er au bord de fin du dernier
  const totalSize = order.reduce((acc, i) => acc + size(boxes[i]), 0)
  const gap = (span - totalSize) / (n - 1)                        // espace libre réparti également
  let cursor = start(first)
  for (const i of order) {
    const d = cursor - start(boxes[i])
    deltas[i] = axis === "h" ? { dx: d, dy: 0 } : { dx: 0, dy: d }
    cursor += size(boxes[i]) + gap
  }
  return deltas
}
