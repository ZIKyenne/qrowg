// gardeAuRetour.ts — ce que l'abonné garde actif s'il repasse au gratuit (D3).
//
// Audit UX v2, 23 nov. 2026. Les CGU promettaient « l'utilisateur choisissant
// celles à conserver actives » ; à l'échéance, le webhook éteignait les QR les
// plus récents au-delà du quota, sans préavis ni choix. Le commerçant
// découvrait après coup que le QR de sa vitrine ne menait plus nulle part.
//
// Règle : l'abonné marque À L'AVANCE ce qu'il garde (colonne
// `keep_on_downgrade`). Au moment de la bascule, ce qui est marqué passe en
// premier ; le reste suit l'ordre habituel (du plus ancien au plus récent).
// Sans choix, rien ne change. Les réconciliations (dynamicReconcile,
// pauseDesPages) restent intactes : on ne fait que réordonner leur entrée.
// Module PUR.

import { dynLimit, pageLimit } from "./plans"

export type Gardable = { id: string; keep_on_downgrade?: boolean | null }

/**
 * Partition STABLE : les éléments marqués d'abord, chacun dans son ordre
 * d'origine. L'entrée est déjà triée du plus ancien au plus récent.
 */
export function gardesDAbord<T extends Gardable>(items: readonly T[]): T[] {
  return [...items.filter(i => i.keep_on_downgrade === true), ...items.filter(i => i.keep_on_downgrade !== true)]
}

/** Combien l'abonné peut en garder : ce que couvre le plan gratuit. */
export function placesAuRetour(): { liens: number; pages: number } {
  return { liens: dynLimit("free") ?? 0, pages: pageLimit("free") ?? 0 }
}

/**
 * Nettoie le choix envoyé par le navigateur : des identifiants (chaînes non
 * vides, sans doublon), pas plus que le plan gratuit n'en couvre. Le reste est
 * ignoré, pas refusé : la sélection la plus ancienne gagne, comme à la bascule.
 */
export function choixNettoye(brut: unknown, places: number): string[] {
  if (!Array.isArray(brut)) return []
  const ids = brut.filter((v): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v))
  return [...new Set(ids)].slice(0, Math.max(0, places))
}

/** La colonne manque-t-elle encore ? (migration 20261123120000 non appliquée) */
export function colonneGardeAbsente(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false
  return err.code === "42703" || err.code === "PGRST204" || /keep_on_downgrade/.test(err.message ?? "")
}
