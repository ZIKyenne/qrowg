// Machine a etats du cycle de vie d'un QR (pure, testable). Doit rester
// coherente avec les statuts geres au scan (q/[code]/route.ts).

export type QRStatus = "draft" | "active" | "paused" | "archived" | "expired"
export type QRStatusAction =
  | "activate" | "pause" | "archive" | "restore" | "expire" | "set_pause_message"

// Transitions autorisees depuis chaque statut.
export const ALLOWED_TRANSITIONS: Record<QRStatus, QRStatusAction[]> = {
  active:   ["pause", "archive", "expire"],
  draft:    ["activate", "archive"],
  paused:   ["activate", "archive"],
  archived: ["restore"],
  expired:  ["activate", "archive"],
}

// Statut resultant d'une action de changement (hors set_pause_message).
export const ACTION_TO_STATUS: Record<Exclude<QRStatusAction, "set_pause_message">, QRStatus> = {
  activate: "active",
  pause:    "paused",
  archive:  "archived",
  restore:  "active",
  expire:   "expired",
}

// Une action de changement de statut est-elle autorisee depuis ce statut ?
export function canTransition(status: string, action: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[status as QRStatus] ?? []
  return allowed.includes(action as QRStatusAction)
}
