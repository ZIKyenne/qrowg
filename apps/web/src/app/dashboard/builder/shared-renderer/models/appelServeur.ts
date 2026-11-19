// appelServeur.ts — le modèle PUR du bloc « Appel en salle » (lot fast-food 2, 19 nov.).
//
// Le client, à table, touche « L'addition » : la demande part par /api/leads
// (le même chemin que les formulaires : anti-spam par IP, attribution au QR
// scanné) et arrive dans Messages, « Appel en salle · Table 12 ».
//
// Ce que le bloc ne promet PAS : un bipeur. La demande arrive dans Messages et
// par e-mail ; elle n'est pas instantanée. La confirmation dit « envoyé à
// l'équipe », jamais « un serveur arrive ».

import { texteUtile } from "./repeaterExtract"

export const TYPE_APPEL = "serveur"

export const DEMANDES = [
  { cle: "serveur", reglage: "show_serveur", libelle: "Appeler un serveur", icone: "🙋" },
  { cle: "addition", reglage: "show_addition", libelle: "L'addition, s'il vous plaît", icone: "🧾" },
  { cle: "commande", reglage: "show_commande", libelle: "Je suis prêt à commander", icone: "📝" },
] as const
export type Demande = typeof DEMANDES[number]

/**
 * Les demandes proposées : celles qui sont ACTIVÉES (« Oui »). Un bloc neuf les a
 * toutes, par son contenu par défaut ; un contenu vide n'en a aucune — la règle
 * du produit : un bloc vide ne publie pas de coquille.
 */
export function demandesActives(c: Record<string, any>): Demande[] {
  return DEMANDES.filter(d => String((c ? c[d.reglage] : "") ?? "").trim() === "Oui")
}

/** Un numéro de table : chiffres et lettres (« 12 », « T4 », « B12 »), 6 au plus. */
export function normaliserTable(v: unknown): string {
  return texteUtile(v).replace(/[^0-9a-zA-Z]/g, "").slice(0, 6).toUpperCase()
}

/** `?table=12` dans l'adresse du QR collé sur la table : le numéro est prérempli. */
export function tableDepuisAdresse(recherche: string): string {
  try { return normaliserTable(new URLSearchParams(recherche).get("table")) } catch { return "" }
}

/** Ce que Messages affiche : le nom = la table, le message = la demande. */
export function contenuDeLAppel(d: Demande, table: string): { name: string; message: string; data: Record<string, string> } {
  const t = normaliserTable(table)
  return {
    name: t ? `Table ${t}` : "Table non précisée",
    message: d.libelle,
    data: { demande: d.cle, ...(t ? { table: t } : {}) },
  }
}

/** Entre deux envois depuis le même téléphone : contre le doigt qui insiste. */
export const PAUSE_ENTRE_APPELS_S = 60
export function secondesRestantes(dernierEnvoi: number | null, maintenant: number): number {
  if (dernierEnvoi == null) return 0
  return Math.max(0, Math.ceil(PAUSE_ENTRE_APPELS_S - (maintenant - dernierEnvoi) / 1000))
}
