// =============================================================================
// stackedObjects.ts — Moteur PUR du "selecteur d'objets superposes" (critique #10).
// Quand plusieurs elements se chevauchent, dit LESQUELS se trouvent sous un point
// donne, du plus haut (devant) au plus bas (derriere). Aucune dependance Fabric/DOM.
// L'appelant fournit les boites englobantes (getBoundingRect cote Fabric).
// =============================================================================

export type LayerBox = {
  id: string
  left: number
  top: number
  width: number
  height: number
}

// Le point (px,py) est-il dans la boite englobante (bords inclus) ?
export function pointInBox(px: number, py: number, b: LayerBox): boolean {
  return px >= b.left && px <= b.left + b.width && py >= b.top && py <= b.top + b.height
}

// Ids des boites contenant le point, du plus HAUT au plus BAS.
// `boxes` est fourni dans l'ordre de dessin de Fabric (arriere -> avant) ;
// on renvoie donc l'ordre inverse (devant d'abord), comme une pile.
export function stackedAt(px: number, py: number, boxes: LayerBox[]): string[] {
  const hits: string[] = []
  for (const b of boxes) {
    if (pointInBox(px, py, b)) hits.push(b.id)
  }
  return hits.reverse()
}

// Centre d'une boite (utile pour tester "ce qui est empile sous l'objet courant").
export function boxCenter(b: LayerBox): { x: number; y: number } {
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 }
}
