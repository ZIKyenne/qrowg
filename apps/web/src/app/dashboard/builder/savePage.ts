// savePage.ts — persistance PURE d'un snapshot de page vers Supabase.
// Extrait de BuilderV4 pour deux raisons :
//   1) vérifier CHAQUE erreur Supabase (aucun échec silencieux → aucun faux succès) ;
//   2) rendre la persistance testable avec un client mocké (voir savePage.test.ts).
// Ce module ne lit AUCUN état React : il reçoit un snapshot IMMUABLE + un client.
// La stratégie « conserve les IDs » (upsert onConflict id, puis delete des absents)
// est préservée à l'identique — seule la vérification d'erreurs est renforcée.

// Forme minimale d'un bloc côté éditeur (compatible avec le type Block du builder).
export type SaveBlock = {
  id: string
  type: string
  content: Record<string, any>
  visible: boolean
  draft?: boolean
  locked?: boolean
}

// Snapshot immuable d'une page à persister. Construit AVANT le premier appel réseau,
// puis passé tel quel : une sauvegarde ne relit jamais d'état mouvant en cours de route.
export type PageSnapshot = {
  liveId: string
  pageName: string
  theme: unknown
  blocks: SaveBlock[]
}

// Interface minimale du client Supabase réellement utilisée ici. Permet un mock
// lisible en test sans dépendre du type complet @supabase/supabase-js.
export type SupabaseLike = { from(table: string): any }

// ── Contrôle de version (16 novembre) ───────────────────────────────────────
// La sauvegarde réécrit TOUS les blocs puis supprime ceux qu'elle ne connaît
// pas. « Ma carte » écrit les mêmes blocs depuis le téléphone (épuisé, prix,
// produit ajouté, carte importée) : un éditeur resté ouvert sur l'ordinateur
// les aurait écrasés — ou supprimés — à sa prochaine sauvegarde, sans un mot.
// La base date chaque écriture (`updated_at`, déclencheur, heure du SERVEUR) :
// l'éditeur retient la plus récente qu'il connaît (le « repère ») et refuse
// d'écrire si un bloc a changé depuis. Rien n'est écrit, rien n'est perdu.
export type GardeDeVersion = { repere: string | null; onRepere?: (repere: string | null) => void }

/** Un horodatage PostgREST en microsecondes (la milliseconde ne suffit pas à départager). */
export function microsDe(s: string | null | undefined): number {
  if (!s) return -Infinity
  const m = /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})(?:\.(\d+))?(.*)$/.exec(s)
  if (!m) return -Infinity
  const base = Date.parse(m[1] + m[3])
  if (Number.isNaN(base)) return -Infinity
  return base * 1000 + Number(((m[2] ?? "") + "000000").slice(0, 6))
}

/** Le plus récent horodatage d'une liste de blocs ; un « avant tout » pour une page sans bloc. */
export const REPERE_PAGE_VIDE = "1970-01-01T00:00:00+00:00"
export function repereDe(lignes: readonly { updated_at?: string | null }[]): string | null {
  let max: string | null = null
  for (const l of lignes) if (l.updated_at && microsDe(l.updated_at) > microsDe(max)) max = l.updated_at
  return max ?? REPERE_PAGE_VIDE
}

/** Un bloc a-t-il été écrit (ou créé) après le repère ? */
export function modifieDepuis(lignes: readonly { updated_at?: string | null }[], repere: string): boolean {
  const r = microsDe(repere)
  return lignes.some(l => microsDe(l.updated_at) > r)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

import { CODE_CONFLIT } from "./builderErrors"

// Relance une erreur Supabase comme Error en PRÉSERVANT `code`/`status` : le coordinateur
// la garde telle quelle (instanceof Error), et l'UI peut la classer finement (réseau,
// RLS, validation…) au lieu d'afficher le message brut. `stage` situe l'étape échouée.
function asError(e: any, stage: string): Error {
  const err = new Error(typeof e?.message === "string" ? e.message : "Erreur de sauvegarde")
  ;(err as any).code = e?.code
  ;(err as any).status = e?.status
  ;(err as any).stage = stage
  return err
}

// Ligne `blocks` pour le chemin moderne (conserve l'UUID). draft/locked/visible n'ont
// PAS de colonne dédiée → persistés dans content sous des clés réservées « __ ».
export function blockToRow(b: SaveBlock, i: number, pageId: string) {
  return {
    id: b.id,
    page_id: pageId,
    type: b.type,
    position: i,
    content: { ...b.content, __draft: b.draft || false, __locked: b.locked || false, __visible: b.visible !== false },
    is_visible: b.visible && !b.draft,
    styles: {},
  }
}

// Persiste le snapshot. Rejette (throw) à la MOINDRE erreur Supabase : l'appelant
// (contrôleur de sauvegarde) considère alors la sauvegarde entière comme échouée et
// garde l'état « non enregistré » — jamais de succès partiel présenté comme complet.
export async function persistSnapshot(supabase: SupabaseLike, snap: PageSnapshot, garde?: GardeDeVersion): Promise<void> {
  // 0) Contrôle de version : AVANT toute écriture.
  if (garde?.repere) {
    const { data: actuels, error: verErr } = await supabase.from("blocks").select("id, updated_at").eq("page_id", snap.liveId)
    if (verErr) throw asError(verErr, "version_read")
    if (modifieDepuis(actuels || [], garde.repere)) {
      const err = new Error("conflit de version") as any
      err.code = CODE_CONFLIT; err.stage = "version"
      throw err
    }
  }

  // 1) Page (titre + thème). L'erreur DOIT être vérifiée (l'ancien code l'ignorait).
  // .select() confirme la ligne écrite (v405) : une page qu'on peut LIRE sans pouvoir
  // l'écrire (toute page publiée est lisible par tout compte connecté, un membre
  // retiré de l'équipe…) passait sans erreur — titre et thème perdus en silence.
  const { data: pageEcrite, error: pageErr } = await supabase.from("pages").update({ title: snap.pageName, theme: snap.theme }).eq("id", snap.liveId).select("id")
  if (pageErr) throw asError(pageErr, "page_update")
  if (!pageEcrite?.length) throw asError({ code: "42501", message: "aucune ligne écrite (droits)" }, "page_update")

  const allUuid = snap.blocks.every(b => UUID_RE.test(b.id))
  if (allUuid) {
    // Chemin moderne : upsert D'ABORD (le contenu est toujours écrit), PUIS suppression
    // des blocs absents du snapshot via une liste d'IDs explicite.
    const rows = snap.blocks.map((b, i) => blockToRow(b, i, snap.liveId))
    const keep = new Set(snap.blocks.map(b => b.id))
    if (rows.length) {
      const { error } = await supabase.from("blocks").upsert(rows, { onConflict: "id" })
      if (error) throw asError(error, "block_upsert")
    }
    const { data: existing, error: readErr } = await supabase.from("blocks").select("id").eq("page_id", snap.liveId)
    if (readErr) throw asError(readErr, "block_read")
    const toDelete = (existing || []).map((r: any) => r.id).filter((id: string) => !keep.has(id))
    // Suppression ciblée par liste d'IDs. Le "purge par page_id" n'est autorisé QUE si le
    // snapshot est réellement vide (l'utilisateur a tout supprimé) — jamais par défaut.
    if (toDelete.length) {
      const { error } = await supabase.from("blocks").delete().in("id", toDelete)
      if (error) throw asError(error, "block_delete")
    } else if (!rows.length) {
      const { error } = await supabase.from("blocks").delete().eq("page_id", snap.liveId)
      if (error) throw asError(error, "block_delete_all")
    }
  } else {
    // Repli (IDs legacy non-UUID) : delete-all + insert. Les IDs deviennent UUID au
    // prochain chargement. On vérifie désormais aussi l'erreur du delete.
    const { error: delErr } = await supabase.from("blocks").delete().eq("page_id", snap.liveId)
    if (delErr) throw asError(delErr, "legacy_delete")
    if (snap.blocks.length > 0) {
      const rows = snap.blocks.map((b, i) => ({
        page_id: snap.liveId, type: b.type, position: i,
        content: { ...b.content, __draft: b.draft || false, __locked: b.locked || false, __visible: b.visible !== false },
        is_visible: b.visible && !b.draft, styles: {},
      }))
      const { error } = await supabase.from("blocks").insert(rows)
      if (error) throw asError(error, "legacy_insert")
    }
  }
  // Le repère avance avec NOS écritures (le déclencheur vient de les dater) :
  // sans cela, la sauvegarde suivante se prendrait elle-même pour un conflit.
  // Lecture refusée → repère effacé (contrôle suspendu) plutôt que bloquer à tort.
  if (garde?.onRepere) {
    const { data: apres, error: repErr } = await supabase.from("blocks").select("updated_at").eq("page_id", snap.liveId)
    garde.onRepere(repErr ? null : repereDe(apres || []))
  }
}
