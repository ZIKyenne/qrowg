import "server-only"

// Le dépôt des aperçus : la seule porte entre le moteur de croissance et la base.
//
// ── Pourquoi `server-only` en première ligne ───────────────────────────────
//
// Ce module tient la clé de service, qui contourne toute la RLS. Si un import
// malheureux le faisait entrer dans un bundle client, la clé partirait dans le
// navigateur de chaque visiteur. `server-only` transforme cette erreur en échec
// de compilation plutôt qu'en fuite silencieuse.
//
// ── Pourquoi les tables sont fermées ───────────────────────────────────────
//
// `growth_previews` a la RLS activée et AUCUNE politique : ni `anon` ni
// `authenticated` n'en lisent une ligne. Tout passe par ici, et ici vérifie
// trois choses avant de rendre quoi que ce soit — la forme du jeton, son
// condensé, et l'expiration. Un aperçu dont le lien a fuité après trente jours
// ne s'ouvre plus, même avec le bon jeton.

import { createAdminClient } from "@/lib/supabase/server"
import { creerJeton, hacher, expireLe, encoreValide, formeValide, JOURS_DE_VALIDITE } from "./jetonApercu"
import { genererPageRestaurant, type PageGeneree } from "./generateurRestaurant"
import { controler, resumer, type Verdict } from "./controleQualite"
import type { ProfilRestaurant } from "./profilEtablissement"
import { valeurDe } from "./profilEtablissement"

export type ApercuStocke = {
  id: string
  nom: string
  modeleSource: string
  rendu: { theme: unknown; blocs: { type: string; content: Record<string, unknown> }[] }
  faitsUtilises: string[]
  aCompleter: string[]
  expireLe: string
  revendiquePar: string | null
}

/**
 * Enregistre un prospect et fabrique son aperçu.
 *
 * Rend `null` quand le profil est trop pauvre pour produire une page — le
 * générateur refuse, et on ne force pas : mieux vaut aucune proposition qu'un
 * modèle vierge portant une enseigne.
 *
 * Le jeton est rendu EN CLAIR à l'appelant, et une seule fois. La base n'en
 * garde que le condensé ; personne, pas même nous, ne peut le retrouver
 * ensuite.
 */
export async function creerApercu(
  profil: ProfilRestaurant,
  options: { jours?: number; maintenant?: Date } = {},
): Promise<{ jeton: string; apercuId: string; page: PageGeneree; qa: Verdict } | null> {
  const page = genererPageRestaurant(profil)
  if (!page) return null

  // Le contrôle qualité, AVANT l'écriture. Son verdict est enregistré avec
  // l'aperçu — y compris quand il rejette : une proposition refusée laisse une
  // trace, sinon on ne saurait jamais ce qui a été écarté ni pourquoi.
  // Et `lireApercu` refuse de servir ce qui n'a pas passé : c'est ce qui fait
  // du contrôle un verrou plutôt qu'un rapport.
  const qa = controler(page)

  const db = createAdminClient()
  const maintenant = options.maintenant ?? new Date()

  // Le prospect d'abord. `upsert` sur la clé lisible : rejouer la fabrication
  // d'un aperçu ne crée pas un doublon d'établissement.
  const { data: prospect, error: erreurProspect } = await db
    .from("growth_prospects")
    .upsert(
      { cle: profil.id, nom: valeurDe(profil.nom), profil: profil as unknown as Record<string, unknown>, maj_le: maintenant.toISOString() },
      { onConflict: "cle" },
    )
    .select("id")
    .single()
  if (erreurProspect || !prospect) throw new Error(`prospect non enregistré : ${erreurProspect?.message ?? "réponse vide"}`)

  const jeton = creerJeton()
  const { data: apercu, error: erreurApercu } = await db
    .from("growth_previews")
    .insert({
      prospect_id: prospect.id,
      modele_source: page.modeleSource,
      rendu: { theme: page.theme, blocs: page.blocs },
      faits_utilises: page.faitsUtilises,
      a_completer: page.aCompleter,
      jeton_hache: await hacher(jeton),
      expire_le: expireLe(maintenant, options.jours ?? JOURS_DE_VALIDITE).toISOString(),
      qa_statut: qa.statut,
      qa_detail: { resume: resumer(qa), bloquants: qa.bloquants, reserves: qa.reserves },
    })
    .select("id")
    .single()
  if (erreurApercu || !apercu) throw new Error(`aperçu non enregistré : ${erreurApercu?.message ?? "réponse vide"}`)

  return { jeton, apercuId: apercu.id, page, qa }
}

/**
 * Retrouve un aperçu par son jeton.
 *
 * Rend `null` dans TOUS les cas de refus — jeton mal formé, introuvable,
 * expiré — et sans distinguer lequel. Répondre « ce jeton existe mais il a
 * expiré » apprendrait à un balayeur quels jetons sont valides.
 */
export async function lireApercu(
  jeton: string,
  maintenant: Date = new Date(),
): Promise<ApercuStocke | null> {
  // La forme d'abord : un balayage ne doit pas coûter une requête SQL par essai.
  if (!formeValide(jeton)) return null

  const db = createAdminClient()
  const { data, error } = await db
    .from("growth_previews")
    .select("id, modele_source, rendu, faits_utilises, a_completer, expire_le, revendique_par, qa_statut, growth_prospects(nom)")
    .eq("jeton_hache", await hacher(jeton))
    .maybeSingle()

  if (error || !data) return null
  if (!encoreValide(new Date(data.expire_le as string), maintenant)) return null
  // Le verrou. Une proposition qui n'a pas passé le contrôle ne s'affiche pas,
  // et se refuse comme un jeton inexistant — sans dire pourquoi.
  if (data.qa_statut !== "passe") return null

  const prospect = data.growth_prospects as unknown as { nom: string | null } | null
  return {
    id: data.id as string,
    nom: prospect?.nom ?? "Établissement",
    modeleSource: data.modele_source as string,
    rendu: data.rendu as ApercuStocke["rendu"],
    faitsUtilises: (data.faits_utilises as string[]) ?? [],
    aCompleter: (data.a_completer as string[]) ?? [],
    expireLe: data.expire_le as string,
    revendiquePar: (data.revendique_par as string | null) ?? null,
  }
}

/**
 * Marque un aperçu comme revendiqué.
 *
 * Idempotent par construction : la condition `revendique_par is null` fait
 * qu'une seconde tentative ne change rien et rend `false`. Deux clics rapides
 * sur « ce modèle me plaît » ne produisent donc pas deux pages.
 *
 * Et la possession du lien ne suffit pas : `utilisateurId` vient d'une session
 * vérifiée côté serveur, jamais d'un paramètre d'URL.
 */
export async function revendiquerApercu(
  apercuId: string,
  utilisateurId: string,
  maintenant: Date = new Date(),
): Promise<boolean> {
  const db = createAdminClient()
  const { data, error } = await db
    .from("growth_previews")
    .update({ revendique_par: utilisateurId, revendique_le: maintenant.toISOString() })
    .eq("id", apercuId)
    .is("revendique_par", null)
    .select("id")
  return !error && (data?.length ?? 0) > 0
}
