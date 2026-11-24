// clientsDuService.ts — « combien de clients ce midi, et par quel support ? »
// (vague 3, revue du 23 nov.).
//
// La question d'un restaurateur après le service n'est pas « mes scans sur
// 30 jours » : c'est « ce midi, combien de tables ont scanné, et le chevalet
// marche-t-il mieux que la vitrine ? ». L'écran des statistiques avait tout, sur
// des périodes de jours — jamais le service.
//
// Le service de midi : de 11 h à 15 h, à l'heure DU COMMERCE (lib/jourDuCommerce).
// Avant 11 h, « ce midi » n'a pas encore eu lieu : on montre celui d'hier.
//
// Compter des CLIENTS, honnêtement. Un client qui scanne deux fois son QR est un
// client, pas deux : on compte les empreintes anonymes distinctes (ip_hash,
// lib/empreinteDeScan). Mais l'empreinte n'est écrite que si son sel secret est
// configuré : sans elle, distinguer deux clients est impossible. Alors on ne
// devine pas — on compte des SCANS, et on le dit. Si une partie seulement des
// scans porte une empreinte, on compte aussi des scans : un total mêlé ne
// voudrait rien dire. Les empreintes ne quittent jamais le serveur : seuls des
// nombres partent à l'écran. Module PUR.

import { jourDuCommerce, champsDuCommerce, type CleDeJour } from "./jourDuCommerce"

export const SERVICE_DU_MIDI = { debut: 11 * 60, fin: 15 * 60 } as const

export type ScanLu = { scanned_at: string; qr_code_id?: string | null; ip_hash?: string | null }
export type LigneDuService = { qrId: string; scans: number; clients: number | null }
export type BilanDuService = {
  /** Le jour du service montré, « AAAA-MM-JJ » (aujourd'hui, ou hier avant 11 h). */
  jour: CleDeJour
  quand: "ce_midi" | "hier_midi"
  /** Ce qu'on compte : des clients (empreintes distinctes) ou, faute d'empreinte, des scans. */
  mesure: "clients" | "scans"
  lignes: LigneDuService[]
  total: number
}

const JOUR_MS = 86_400_000

/** Le bilan du service de midi, par QR, trié du plus au moins scanné. */
export function bilanDuMidi(scans: readonly ScanLu[], fuseau: string | null | undefined, now: number = Date.now()): BilanDuService {
  const c = champsDuCommerce(now, fuseau)
  const avant = !!c && c.heure * 60 + c.minute < SERVICE_DU_MIDI.debut
  const jour = jourDuCommerce(avant ? now - JOUR_MS : now, fuseau)
  const dans = scans.filter(s => {
    if (!s.qr_code_id || jourDuCommerce(s.scanned_at, fuseau) !== jour) return false
    const h = champsDuCommerce(s.scanned_at, fuseau)
    if (!h) return false
    const m = h.heure * 60 + h.minute
    return m >= SERVICE_DU_MIDI.debut && m < SERVICE_DU_MIDI.fin
  })
  const mesure: BilanDuService["mesure"] = dans.length > 0 && dans.every(s => !!s.ip_hash) ? "clients" : "scans"
  const parQr = new Map<string, { scans: number; empreintes: Set<string> }>()
  for (const s of dans) {
    const e = parQr.get(s.qr_code_id!) ?? { scans: 0, empreintes: new Set<string>() }
    e.scans++
    if (s.ip_hash) e.empreintes.add(s.ip_hash)
    parQr.set(s.qr_code_id!, e)
  }
  const lignes = [...parQr].map(([qrId, e]) => ({ qrId, scans: e.scans, clients: mesure === "clients" ? e.empreintes.size : null }))
    .sort((a, b) => (b.clients ?? b.scans) - (a.clients ?? a.scans) || b.scans - a.scans)
  // Un même client qui scanne deux supports compte une fois au total.
  const total = mesure === "clients" ? new Set(dans.map(s => s.ip_hash!)).size : dans.length
  return { jour, quand: avant ? "hier_midi" : "ce_midi", mesure, lignes, total }
}

/** La première ligne de la carte, en français. */
export function phraseDuMidi(b: BilanDuService): string {
  const quand = b.quand === "ce_midi" ? "Ce midi" : "Hier midi"
  if (b.total === 0) return `${quand}, entre 11 h et 15 h : aucun scan.`
  const unite = b.mesure === "clients" ? (b.total > 1 ? "clients" : "client") : (b.total > 1 ? "scans" : "scan")
  return `${quand}, entre 11 h et 15 h : ${b.total} ${unite}.`
}
