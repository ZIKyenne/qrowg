// La génération de page par IA n'existe que si ANTHROPIC_API_KEY est définie sur
// le serveur. next.config.ts en dérive NEXT_PUBLIC_GENERATION_IA au build, pour
// que l'éditeur sache, avant tout appel réseau, s'il doit proposer la fonction.
export const GENERATION_IA_ACTIVE = process.env.NEXT_PUBLIC_GENERATION_IA === "1"

import { canAI, getPlan, minPlanFor } from "./plans"

/**
 * Ce que l'éditeur montre du panneau « Générer ma page avec l'IA ».
 *
 * Revue « client payant » du 17 nov. : le panneau s'affichait à TOUS dès que la
 * clé existe. Un compte Gratuit rédigeait sa description, cliquait, et
 * apprenait APRÈS que la fonction n'est pas dans sa formule (403 de
 * /api/generate-page). La formule se dit avant, pas après l'effort.
 *
 *  · `null`       : rien à montrer (session ou formule pas encore connues) —
 *                   pas de panneau qui apparaît puis se ferme sous les yeux ;
 *  · `ouverte`    : la formule l'inclut, le champ est proposé ;
 *  · `fermee`     : la phrase qui dit dès quelle formule, sans champ à remplir.
 */
export type EtatGenerationIa = null | { etat: "ouverte" } | { etat: "fermee"; phrase: string }

export function etatGenerationIa(session: "unknown" | "guest" | "user", plan: string | null): EtatGenerationIa {
  if (session === "unknown") return null
  if (session === "user" && plan === null) return null
  if (session === "user" && canAI(plan)) return { etat: "ouverte" }
  return { etat: "fermee", phrase: `Incluse dès la formule ${getPlan(minPlanFor("ai")).label}.` }
}
