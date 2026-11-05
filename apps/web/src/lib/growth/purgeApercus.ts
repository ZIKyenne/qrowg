import "server-only"

// L'exécution de la purge. La DÉCISION est ailleurs : `retentionApercus.sortDe`.
//
// ── Pourquoi ce module existe ──────────────────────────────────────────────
//
// La première version de la route de purge traduisait la règle de rétention en
// filtres PostgREST : « expire_le < coupure et revendique_par is null » pour
// l'effacement, la condition inverse pour le vidage. La règle vivait donc deux
// fois — une fois dans un moteur pur et testé, une fois recopiée en filtres —
// et c'est la copie qui effaçait. Les treize tests de `retentionApercus` ne
// prouvaient alors rien de ce qui se passait vraiment en base.
//
// Ici, la base sert uniquement à RAMENER les candidats. C'est `sortDe()` qui
// répartit, ligne par ligne, et l'ordre des suppressions découle de son verdict.
// Un changement de règle de rétention se fait donc à un seul endroit, et les
// tests du moteur portent sur le code qui agit.
//
// ── Pourquoi un plafond par passage ────────────────────────────────────────
//
// On ne ramène pas une table entière dans la mémoire d'une fonction serverless.
// `PAR_PASSAGE` borne le travail ; le bilan dit s'il en reste, et la tâche
// tourne chaque jour. Un retard se résorbe en quelques passages au lieu de
// faire tomber la fonction sur un délai dépassé.

import type { SupabaseClient } from "@supabase/supabase-js"
import { coupureDePurge, sortDe, prospectDevenuInutile, JOURS_DE_GRACE } from "./retentionApercus"

/** Nombre d'aperçus examinés par passage. */
export const PAR_PASSAGE = 500

export type Bilan = {
  coupure: string
  graceJours: number
  examines: number
  vides: number
  effaces: number
  prospectsEffaces: number
  /** Vrai s'il restait des candidats au-delà du plafond : le prochain passage finira. */
  reste: boolean
  /** Étapes en échec, nommées. Vide quand tout s'est bien passé. */
  echecs: string[]
}

/**
 * Purge les propositions dont la rétention est écoulée.
 *
 * Trois gestes, dans cet ordre, et chacun a sa raison :
 *
 *   1. **vider** les aperçus revendiqués. Ils ont produit une vraie page ; leur
 *      ligne reste comme mesure — elle relie un relevé à une activation — mais
 *      son contenu (`rendu`) ne sert plus et pèse. On garde la trace, on jette
 *      le dossier.
 *
 *   2. **effacer** les aperçus jamais revendiqués. Ce n'est pas une question de
 *      place : ces lignes décrivent des établissements TIERS relevés sur leurs
 *      sites. Les garder « au cas où » reviendrait à constituer un fichier
 *      d'entreprises qu'on n'a jamais décidé de constituer.
 *
 *   3. **effacer les prospects orphelins**, ceux dont plus aucun aperçu ne
 *      subsiste. Même raison, appliquée à la fiche elle-même.
 *
 * Ne lève pas : une étape en échec est nommée dans `echecs` et les autres
 * s'exécutent. Un passage qui plante entièrement parce qu'une seule requête a
 * échoué laisserait la purge à l'arrêt sans qu'on sache laquelle.
 */
export async function purger(db: SupabaseClient, maintenant: Date = new Date()): Promise<Bilan> {
  const coupure = coupureDePurge(maintenant)
  const bilan: Bilan = {
    coupure, graceJours: JOURS_DE_GRACE,
    examines: 0, vides: 0, effaces: 0, prospectsEffaces: 0,
    reste: false, echecs: [],
  }

  // Les candidats : tout ce qui a expiré avant la coupure. On ne ramène PAS la
  // colonne `rendu` — c'est la page entière, et on n'a besoin que de décider.
  // Les plus anciens d'abord, pour qu'un retard se résorbe dans l'ordre.
  const { data: candidats, error: erreurLecture } = await db
    .from("growth_previews")
    .select("id, expire_le, revendique_par")
    .lt("expire_le", coupure)
    .order("expire_le", { ascending: true })
    .limit(PAR_PASSAGE + 1)

  if (erreurLecture) {
    bilan.echecs.push("lecture")
    return bilan
  }

  const lignes = candidats ?? []
  bilan.reste = lignes.length > PAR_PASSAGE
  const lot = lignes.slice(0, PAR_PASSAGE)
  bilan.examines = lot.length

  // Le verdict vient du moteur pur, ligne par ligne. `garder` est possible même
  // ici : la lecture filtre sur la coupure, mais c'est `sortDe` qui tranche —
  // notamment pour une date illisible, qu'on ne touche pas.
  const aVider: string[] = []
  const aEffacer: string[] = []
  for (const l of lot) {
    const sort = sortDe(
      { expireLe: l.expire_le as string, revendiquePar: (l.revendique_par as string | null) ?? null },
      maintenant,
    )
    if (sort === "vider") aVider.push(l.id as string)
    else if (sort === "effacer") aEffacer.push(l.id as string)
  }

  // 1. Vider. Le filtre `neq` sur `rendu` évite de réécrire ce qui est déjà
  //    vide : sans lui, le compte repartirait à chaque passage et le journal
  //    annoncerait éternellement du travail accompli.
  if (aVider.length) {
    const { data, error } = await db
      .from("growth_previews")
      .update({ rendu: {} })
      .in("id", aVider)
      .neq("rendu", "{}")
      .select("id")
    if (error) { console.error("[purge-apercus] vider", error.code ?? "", error.message); bilan.echecs.push("vider") }
    else bilan.vides = data?.length ?? 0
  }

  // 2. Effacer.
  if (aEffacer.length) {
    const { data, error } = await db
      .from("growth_previews")
      .delete()
      .in("id", aEffacer)
      .select("id")
    if (error) { console.error("[purge-apercus] effacer", error.code ?? "", error.message); bilan.echecs.push("effacer") }
    else bilan.effaces = data?.length ?? 0
  }

  // 3. Les prospects orphelins.
  //
  // On ne les cherche QUE si rien n'a échoué : après une suppression partielle,
  // « plus aucun aperçu » peut vouloir dire « la suppression des aperçus a
  // raté », et on effacerait une fiche encore référencée.
  //
  // On lit les identifiants encore référencés, puis on efface le reste. Une
  // sous-requête SQL serait plus courte ; ce client ne la propose pas, et la
  // quantité en jeu ne justifie pas d'écrire du SQL brut dans un chemin qui
  // efface.
  if (!bilan.echecs.length) {
    const { data: references, error: erreurRef } = await db.from("growth_previews").select("prospect_id")
    const { data: tous, error: erreurTous } = await db.from("growth_prospects").select("id")
    if (erreurRef || erreurTous) {
      bilan.echecs.push("prospects (lecture)")
    } else {
      const vivants = new Set((references ?? []).map(r => r.prospect_id as string))
      const orphelins = (tous ?? [])
        .map(p => p.id as string)
        .filter(id => prospectDevenuInutile(vivants.has(id) ? 1 : 0))
      if (orphelins.length) {
        const { data, error } = await db.from("growth_prospects").delete().in("id", orphelins).select("id")
        if (error) { console.error("[purge-apercus] prospects", error.code ?? "", error.message); bilan.echecs.push("prospects") }
        else bilan.prospectsEffaces = data?.length ?? 0
      }
    }
  }

  return bilan
}
