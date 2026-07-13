// =============================================================================
// touchGestures.ts — Moteur PUR de reconnaissance de gestes (critique #8).
// Le long-press (appui maintenu -> dupliquer) n'a pas d'equivalent natif Fabric :
// on le detecte via un timer + un suivi de deplacement, dont les SEUILS et la
// decision sont ici, purs et testables. (Le double-tap reste gere par l'event
// natif mouse:dblclick de Fabric.) Aucune dependance DOM.
// =============================================================================

export type Pt = { x: number; y: number }

// Duree minimale d'appui pour un "long press" (ms).
export const LONG_PRESS_MS = 500
// Deplacement max tolere pendant l'appui (px) : au-dela, c'est un glisser, pas un appui.
export const MOVE_TOLERANCE = 12

// Distance euclidienne entre deux points.
export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

// Appui maintenu (assez long) ET quasi immobile => long press.
export function isLongPress(
  durationMs: number,
  movedPx: number,
  msMin: number = LONG_PRESS_MS,
  moveTol: number = MOVE_TOLERANCE,
): boolean {
  return durationMs >= msMin && movedPx <= moveTol
}

// Le deplacement depuis le point de depart depasse-t-il la tolerance ?
// (utilise pour annuler le long-press des que le doigt glisse).
export function exceedsMove(start: Pt, current: Pt, moveTol: number = MOVE_TOLERANCE): boolean {
  return dist(start, current) > moveTol
}
