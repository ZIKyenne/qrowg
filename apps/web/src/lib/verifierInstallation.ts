// verifierInstallation.ts — la page est en ligne, mais personne ne la scanne.
//
// Audit du 14 novembre 2026 (F, « automatiser par comportement ») : « Export
// sans scan externe → vérification de l'installation. » L'export n'arrive pas en
// base (impression par le navigateur, voir lib/pilotage) ; ce qui s'observe,
// c'est une page PUBLIÉE dont aucun QR n'a été scanné. Trois jours après la
// publication, un seul e-mail : tester le QR, vérifier où il est posé.
// Décision du 16 novembre : accordé, commandé par l'interrupteur « Alertes de
// scans » (lib/consentementEmail, type `installation`).
//
// Même mécanique que lib/relance : la décision porte sur un JOUR CIVIL — le 3e
// après la publication. Un passage quotidien ne peut retenir une page qu'une
// fois, sans colonne de suivi ; un passage manqué n'envoie rien plutôt que
// deux fois. Module PUR.

import { joursCivilsEntre, minuitDecale } from "./jourCivil"
import { peutRecevoir } from "./consentementEmail"

export const JOUR_DE_VERIFICATION = 3

/** Bornes SQL : les pages publiées le 3e jour civil avant aujourd'hui. */
export function fenetrePublication(maintenant: Date): { depuis: string; jusqua: string } {
  return { depuis: minuitDecale(maintenant, -JOUR_DE_VERIFICATION), jusqua: minuitDecale(maintenant, -JOUR_DE_VERIFICATION + 1) }
}

export type PagePubliee = { id: string; user_id: string; title: string | null; slug: string; status: string | null; published_at: string | null; scans: number }
export type Proprietaire = { id: string; email: string | null; nom: string | null; preferences: unknown }
export type AVerifier = { proprietaire: Proprietaire; pages: PagePubliee[] }

/** Un e-mail par propriétaire, listant ses pages publiées il y a 3 jours et jamais scannées. */
export function installationsAVerifier(pages: readonly PagePubliee[], proprietaires: readonly Proprietaire[], maintenant: Date): AVerifier[] {
  const parId = new Map(proprietaires.map(p => [p.id, p]))
  const groupes = new Map<string, PagePubliee[]>()
  for (const pg of pages) {
    if (pg.status !== "published" || !pg.published_at || pg.scans > 0) continue
    const t = Date.parse(pg.published_at)
    if (Number.isNaN(t) || joursCivilsEntre(new Date(t), maintenant) !== JOUR_DE_VERIFICATION) continue
    const p = parId.get(pg.user_id)
    if (!p?.email || !peutRecevoir("installation", p.preferences)) continue
    groupes.set(p.id, [...(groupes.get(p.id) ?? []), pg])
  }
  return [...groupes].map(([id, pgs]) => ({ proprietaire: parId.get(id)!, pages: pgs }))
}
