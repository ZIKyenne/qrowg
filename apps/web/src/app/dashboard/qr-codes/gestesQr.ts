// gestesQr.ts — ce qu'on peut FAIRE d'un QR (pause, archive, suppression,
// duplication, destination), pour le Studio compact.
//
// Les gestes viennent de l'ancien Studio, qui marchait, mais ne sont plus écrits
// en dur dans un composant : le menu « ⋯ » DÉRIVE ses entrées de la machine à
// états du serveur (`ALLOWED_TRANSITIONS`). Un geste que la route refuserait
// n'est donc jamais proposé — l'ancien menu affichait « Supprimer » grisé sur un
// QR actif, sans dire pourquoi.
//
// Les appels réseau passent par `effetDe` : ils ne lèvent jamais, et l'écran ne
// montre un changement que si le serveur l'a fait (lot v100).

import { ALLOWED_TRANSITIONS, type QRStatus } from "@/app/api/qr-status/qrStatus"
import { effetDe, serveurAFait, refusDuServeur } from "@/lib/effetConfirme"

// ── Le menu ──────────────────────────────────────────────────────────────────

export type GesteDeStatut = "pause" | "activate" | "archive" | "restore"
export type Geste =
  | { cle: GesteDeStatut; libelle: string; confirmer: boolean; ton: "normal" | "attention" }
  | { cle: "supprimer"; libelle: string; confirmer: true; ton: "danger" }

const LIBELLES: Record<GesteDeStatut, string> = {
  activate: "Activer",
  pause: "Mettre en pause",
  archive: "Archiver",
  restore: "Restaurer",
}

/** Les gestes de statut proposés pour un QR, dans l'ordre du menu. */
export function gestesDuMenu(statut: string | null | undefined): Geste[] {
  const s = (statut ?? "active") as QRStatus
  const permis = ALLOWED_TRANSITIONS[s] ?? []
  const ordre: GesteDeStatut[] = ["activate", "pause", "restore", "archive"]
  const gestes: Geste[] = ordre
    .filter(g => permis.includes(g))
    .map(g => ({
      cle: g,
      libelle: LIBELLES[g],
      // Ce qui arrête les scans se confirme ; ce qui les rétablit, non.
      confirmer: g === "pause" || g === "archive",
      ton: g === "pause" || g === "archive" ? "attention" as const : "normal" as const,
    }))
  // La suppression n'existe que pour un QR archivé (la route refuse sinon) :
  // on ne la montre que là, au lieu d'une entrée grisée qui ne dit rien.
  if (s === "archived") gestes.push({ cle: "supprimer", libelle: "Supprimer définitivement", confirmer: true, ton: "danger" })
  return gestes
}

/** Ce que dit la fenêtre de confirmation, avant un geste qui arrête les scans. */
export function confirmationDe(geste: "pause" | "archive" | "supprimer", nom: string): { titre: string; texte: string; verbe: string; destructif: boolean } {
  if (geste === "pause") return {
    titre: "Mettre en pause",
    texte: `« ${nom} » cessera de rediriger : un scan affichera une page « en pause » jusqu'à sa réactivation. Le code imprimé reste valable.`,
    verbe: "Mettre en pause", destructif: false,
  }
  if (geste === "archive") return {
    titre: "Archiver ce QR",
    texte: `« ${nom} » quittera la liste et cessera de rediriger. Vous pourrez le restaurer depuis les archives.`,
    verbe: "Archiver", destructif: false,
  }
  return {
    titre: "Supprimer définitivement ce QR ?",
    texte: `« ${nom} » sera supprimé définitivement, avec toutes ses statistiques. Le code imprimé ne mènera plus nulle part.`,
    verbe: "Supprimer définitivement", destructif: true,
  }
}

/** Phrase de succès, une fois le serveur d'accord. */
export function phraseApres(geste: GesteDeStatut | "supprimer"): string {
  return {
    activate: "QR activé : il redirige de nouveau.",
    pause: "QR en pause.",
    archive: "QR archivé.",
    restore: "QR restauré : il redirige de nouveau.",
    supprimer: "QR supprimé.",
  }[geste]
}

// ── Les appels ───────────────────────────────────────────────────────────────

export type Issue<T = unknown> = ({ ok: true } & T) | { ok: false; refus: string }

const JSON_H = { "Content-Type": "application/json" }

export async function changerStatut(qrId: string, geste: GesteDeStatut): Promise<Issue<{ statut: string }>> {
  const r = await effetDe("/api/qr-status", { method: "POST", headers: JSON_H, body: JSON.stringify({ qr_id: qrId, action: geste }) })
  if (!serveurAFait(r)) return { ok: false, refus: refusDuServeur(r, "Cette action n'a pas pu aboutir.")! }
  const statut = (r.corps as { status?: string } | null)?.status
  return { ok: true, statut: statut ?? "active" }
}

export async function supprimerQr(qrId: string): Promise<Issue> {
  const r = await effetDe("/api/qr-status", { method: "DELETE", headers: JSON_H, body: JSON.stringify({ qr_id: qrId }) })
  if (!serveurAFait(r)) return { ok: false, refus: refusDuServeur(r, "Ce QR code n'a pas pu être supprimé.")! }
  return { ok: true }
}

export async function dupliquerQr<Q>(qrId: string): Promise<Issue<{ qr: Q }>> {
  const r = await effetDe("/api/qr-duplicate", { method: "POST", headers: JSON_H, body: JSON.stringify({ qr_id: qrId }) })
  const qr = (r.corps as { qr?: Q } | null)?.qr
  if (!serveurAFait(r) || !qr) return { ok: false, refus: refusDuServeur(r, "Ce QR code n'a pas pu être dupliqué.") ?? "Ce QR code n'a pas pu être dupliqué." }
  return { ok: true, qr }
}

// ── La destination ───────────────────────────────────────────────────────────

export type DestEntry = { type: string; value: string; url?: string; label?: string | null; set_at?: string | null }
export type EtatDestination = { dest_override: DestEntry | null; dest_history: DestEntry[] }

// « Page QRowg » n'est pas proposé à la saisie : il demandait l'IDENTIFIANT
// interne d'une page, que personne ne connaît. Revenir à sa page = « Revenir à
// la page » (retrait de la redirection).
export const TYPES_DE_DESTINATION = [
  { id: "url", libelle: "Site web", exemple: "https://mon-site.com" },
  { id: "file", libelle: "Fichier", exemple: "https://drive.google.com/…" },
  { id: "email", libelle: "E-mail", exemple: "contact@mon-site.com" },
  { id: "phone", libelle: "Téléphone", exemple: "+33 6 12 34 56 78" },
  { id: "whatsapp", libelle: "WhatsApp", exemple: "+33612345678" },
] as const

export function libelleDeDestination(e: DestEntry): string {
  if (e.label) return e.label
  if (e.type === "page") return "Page QRowg"
  return TYPES_DE_DESTINATION.find(t => t.id === e.type)?.libelle ?? e.type
}

function etatDe(corps: unknown): EtatDestination {
  const c = (corps ?? {}) as Partial<EtatDestination>
  return { dest_override: c.dest_override ?? null, dest_history: Array.isArray(c.dest_history) ? c.dest_history : [] }
}

export async function changerDestination(qrId: string, type: string, valeur: string, note: string): Promise<Issue<EtatDestination>> {
  const r = await effetDe("/api/qr-destination", { method: "POST", headers: JSON_H, body: JSON.stringify({ qr_id: qrId, type, value: valeur.trim(), label: note.trim() || null }) })
  if (!serveurAFait(r)) return { ok: false, refus: refusDuServeur(r, "La redirection n'a pas pu être enregistrée.")! }
  return { ok: true, ...etatDe(r.corps) }
}

/** Retire la redirection : le QR revient à sa page. L'historique est conservé côté serveur. */
export async function revenirALaPage(qrId: string): Promise<Issue> {
  const r = await effetDe("/api/qr-destination", { method: "DELETE", headers: JSON_H, body: JSON.stringify({ qr_id: qrId }) })
  if (!serveurAFait(r)) return { ok: false, refus: refusDuServeur(r, "La redirection n'a pas pu être retirée.")! }
  return { ok: true }
}

export async function retablirDestination(qrId: string, index: number): Promise<Issue<EtatDestination>> {
  const r = await effetDe("/api/qr-destination", { method: "PATCH", headers: JSON_H, body: JSON.stringify({ qr_id: qrId, index }) })
  if (!serveurAFait(r)) return { ok: false, refus: refusDuServeur(r, "Cette redirection n'a pas pu être rétablie.")! }
  // La route PATCH ne renvoie pas l'état : on le relit, et une relecture ratée se dit.
  const l = await effetDe(`/api/qr-destination?qr_id=${encodeURIComponent(qrId)}`)
  if (!serveurAFait(l)) return { ok: false, refus: "La redirection est rétablie, mais l'écran n'a pas pu se rafraîchir. Rechargez la page." }
  return { ok: true, ...etatDe(l.corps) }
}
