"use server"

// « Ma carte ce soir » — les deux gestes du comptoir : épuiser un produit (ou le
// remettre), et tout remettre en vente. Même garde que la publication
// (builder/publishActions) : session obligatoire, lecture ET écriture sous RLS
// (propriétaire ou membre d'équipe), écriture confirmée par `.select()`, puis
// revalidation du cache ISR de la page publique — l'effet est immédiat, sans
// republier. La règle vit dans shared-renderer/models/epuises (pure, testée).

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { avecEpuise, toutEnVente, BLOCS_DE_CARTE, CLE_EPUISES } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import { avecPrix, refusDuPrix, PHRASES_REFUS } from "@/app/dashboard/builder/shared-renderer/models/prixDeLaCarte"
import { avecProduit } from "@/app/dashboard/builder/shared-renderer/models/ajoutDeProduit"
import { limite } from "@/lib/limitesDeSaisie"
import { modifierProduit, retirerProduit, remettreProduit, type Retire } from "@/app/dashboard/builder/shared-renderer/models/editionDeProduit"
import { contenuDeGrandeCarte, placeDeLaCarte, SECTIONS_MAX, PRODUITS_PAR_SECTION, type SectionLue } from "@/app/dashboard/builder/shared-renderer/models/lectureDeCarte"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// `phrase` : déjà écrite pour le commerçant (convention de messagesLisibles.test).
type Reponse = { ok: true } | { ok: false; phrase: string }
const REFUS = "La carte n'a pas pu être mise à jour. Vérifiez votre connexion puis réessayez."

function revalider(slug: unknown) {
  if (typeof slug === "string" && /^[a-z0-9-]{1,80}$/i.test(slug)) { try { revalidatePath(`/${slug}`) } catch { /* rendu suivant */ } }
}

export async function basculerEpuise(blocId: string, nom: string, epuise: boolean): Promise<Reponse> {
  if (!UUID_RE.test(blocId) || typeof nom !== "string" || !nom.trim() || nom.length > 600) return { ok: false, phrase: "Produit introuvable." }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, phrase: "Votre session a expiré. Reconnectez-vous puis réessayez." }

  const { data: bloc, error } = await supabase.from("blocks").select("id, type, content, pages(slug)").eq("id", blocId).maybeSingle()
  if (error || !bloc || !(BLOCS_DE_CARTE as readonly string[]).includes((bloc as any).type)) return { ok: false, phrase: "Produit introuvable." }

  const content = avecEpuise(((bloc as any).content ?? {}) as Record<string, unknown>, nom, !!epuise)
  const { data: fait, error: e2 } = await supabase.from("blocks").update({ content }).eq("id", blocId).select("id")
  if (e2 || !fait?.length) return { ok: false, phrase: REFUS }

  const page = (bloc as any).pages
  revalider(Array.isArray(page) ? page[0]?.slug : page?.slug)
  return { ok: true }
}

export async function toutRemettreEnVente(pageId: string): Promise<Reponse> {
  if (!UUID_RE.test(pageId)) return { ok: false, phrase: "Page introuvable." }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, phrase: "Votre session a expiré. Reconnectez-vous puis réessayez." }

  const { data: page } = await supabase.from("pages").select("slug").eq("id", pageId).maybeSingle()
  if (!page) return { ok: false, phrase: "Page introuvable." }
  const { data: blocs, error } = await supabase.from("blocks").select("id, content").eq("page_id", pageId).in("type", [...BLOCS_DE_CARTE]).order("position", { ascending: true })
  if (error) return { ok: false, phrase: REFUS }

  for (const b of (blocs ?? []) as { id: string; content: Record<string, unknown> | null }[]) {
    if (!b.content?.[CLE_EPUISES]) continue
    const { data: fait, error: e2 } = await supabase.from("blocks").update({ content: toutEnVente(b.content) }).eq("id", b.id).select("id")
    if (e2 || !fait?.length) return { ok: false, phrase: REFUS }
  }
  revalider(page.slug)
  return { ok: true }
}

/**
 * Changer un prix. `identite` = « nom · description » (epuises.identiteDuPlat).
 * Le prix est vérifié ICI aussi : l'écran n'est pas une garde.
 */
export async function changerPrix(blocId: string, identite: string, prix: string): Promise<Reponse> {
  if (!UUID_RE.test(blocId) || typeof identite !== "string" || !identite.trim() || identite.length > 600 || typeof prix !== "string") return { ok: false, phrase: "Produit introuvable." }
  const p = prix.trim()
  const refus = refusDuPrix(p)
  if (refus) return { ok: false, phrase: PHRASES_REFUS[refus] }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, phrase: "Votre session a expiré. Reconnectez-vous puis réessayez." }

  const { data: bloc, error } = await supabase.from("blocks").select("id, type, content, pages(slug)").eq("id", blocId).maybeSingle()
  if (error || !bloc || !(BLOCS_DE_CARTE as readonly string[]).includes((bloc as any).type)) return { ok: false, phrase: "Produit introuvable." }

  const { content, changees } = avecPrix((bloc as any).type, ((bloc as any).content ?? {}) as Record<string, any>, identite, p)
  // 0 ligne : le produit a été renommé ou retiré entre-temps (éditeur ouvert ailleurs).
  if (!changees) return { ok: false, phrase: "Ce produit a changé depuis l'ouverture de l'écran. Rechargez la page." }
  const { data: fait, error: e2 } = await supabase.from("blocks").update({ content }).eq("id", blocId).select("id")
  if (e2 || !fait?.length) return { ok: false, phrase: REFUS }

  const page = (bloc as any).pages
  revalider(Array.isArray(page) ? page[0]?.slug : page?.slug)
  return { ok: true }
}

/**
 * Ajouter un produit au bout d'une rubrique. `section` : numéro d'onglet (grande
 * carte), null pour un menu simple. Rend le produit tel qu'il a été écrit
 * (nettoyé), pour que l'écran affiche exactement ce que la page publique lira.
 */
export async function ajouterProduit(
  blocId: string, section: number | null, nom: string, prix: string, desc: string,
): Promise<{ ok: true; produit: { nom: string; prix: string; desc: string } } | { ok: false; phrase: string }> {
  if (!UUID_RE.test(blocId) || [nom, prix, desc].some(v => typeof v !== "string") || (section !== null && !Number.isInteger(section))) return { ok: false, phrase: "Rubrique introuvable." }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, phrase: "Votre session a expiré. Reconnectez-vous puis réessayez." }

  const { data: bloc, error } = await supabase.from("blocks").select("id, type, content, pages(slug)").eq("id", blocId).maybeSingle()
  if (error || !bloc || !(BLOCS_DE_CARTE as readonly string[]).includes((bloc as any).type)) return { ok: false, phrase: "Rubrique introuvable." }

  // Règles (format, doublon, plafond) : dans le module pur, vérifiées ICI.
  const r = avecProduit((bloc as any).type, ((bloc as any).content ?? {}) as Record<string, any>, section, { nom, prix, desc })
  if (!r.ok) return { ok: false, phrase: r.phrase }
  const { data: fait, error: e2 } = await supabase.from("blocks").update({ content: r.content }).eq("id", blocId).select("id")
  if (e2 || !fait?.length) return { ok: false, phrase: REFUS }

  const page = (bloc as any).pages
  revalider(Array.isArray(page) ? page[0]?.slug : page?.slug)
  return { ok: true, produit: r.produit }
}

/**
 * « Coller ma carte » : une grande carte (menu_tabs) rangée juste après les
 * cartes existantes de la page (à la fin s'il n'y en a pas),
 * à partir de ce que l'aperçu a montré (sections éventuellement renommées).
 * Tout est revérifié ici : l'écran n'est pas une garde.
 */
export async function importerCarte(pageId: string, titre: string, sections: SectionLue[]): Promise<{ ok: true } | { ok: false; phrase: string }> {
  if (!UUID_RE.test(pageId) || typeof titre !== "string" || !Array.isArray(sections)) return { ok: false, phrase: "Page introuvable." }
  const propres = sections
    .filter(s => s && typeof s.titre === "string" && Array.isArray(s.produits))
    .map(s => ({
      titre: s.titre,
      produits: s.produits
        .filter(p => p && typeof p.nom === "string" && p.nom.trim() && p.nom.length <= limite("nomDeProduit") && typeof p.prix === "string" && typeof p.desc === "string")
        .map(p => ({ nom: p.nom, prix: refusDuPrix(p.prix.trim().replace(/;/g, ",")) ? "" : p.prix, desc: p.desc })),
    }))
    .filter(s => s.produits.length)
  if (!propres.length) return { ok: false, phrase: "Aucun produit à ajouter." }
  if (propres.length > SECTIONS_MAX || propres.some(s => s.produits.length > PRODUITS_PAR_SECTION)) return { ok: false, phrase: "Cette carte dépasse ce qu'une grande carte peut afficher." }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, phrase: "Votre session a expiré. Reconnectez-vous puis réessayez." }
  const { data: page } = await supabase.from("pages").select("id, slug").eq("id", pageId).maybeSingle()
  if (!page) return { ok: false, phrase: "Page introuvable." }

  // Juste après la dernière carte de la page (placeDeLaCarte) ; les blocs qui
  // suivent descendent d'un cran, du dernier au premier, AVANT l'insertion.
  const { data: blocs, error: e1 } = await supabase.from("blocks").select("id, type, position").eq("page_id", pageId).order("position", { ascending: true })
  if (e1) return { ok: false, phrase: REFUS }
  const { position, decaler } = placeDeLaCarte((blocs ?? []) as { id: string; type: string; position: number }[])
  for (const d of [...decaler].reverse()) {
    const { data: bouge, error: e3 } = await supabase.from("blocks").update({ position: d.position }).eq("id", d.id).select("id")
    if (e3 || !bouge?.length) return { ok: false, phrase: REFUS }
  }
  const { data: cree, error: e2 } = await supabase.from("blocks")
    .insert({ page_id: pageId, type: "menu_tabs", position, is_visible: true, content: contenuDeGrandeCarte(titre, propres) })
    .select("id")
  if (e2 || !cree?.length) return { ok: false, phrase: REFUS }
  revalider(page.slug)
  return { ok: true }
}

// ── Corriger, retirer, remettre (« Annuler ») ────────────────────────────────
// Les règles vivent dans editionDeProduit (pur, testé sur six formats de carte).
async function blocDeCarte(blocId: string): Promise<{ refus: string } | { supabase: any; bloc: any }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { refus: "Votre session a expiré. Reconnectez-vous puis réessayez." }
  const { data: bloc, error } = await supabase.from("blocks").select("id, type, content, pages(slug)").eq("id", blocId).maybeSingle()
  if (error || !bloc || !(BLOCS_DE_CARTE as readonly string[]).includes((bloc as any).type)) return { refus: "Produit introuvable." }
  return { supabase, bloc }
}
async function ecrire(supabase: any, bloc: any, content: Record<string, any>): Promise<string | null> {
  const { data: fait, error } = await supabase.from("blocks").update({ content }).eq("id", bloc.id).select("id")
  if (error || !fait?.length) return REFUS
  const page = bloc.pages
  revalider(Array.isArray(page) ? page[0]?.slug : page?.slug)
  return null
}
const valide = (blocId: string, section: number | null) => UUID_RE.test(blocId) && (section === null || Number.isInteger(section))

export async function modifierUnProduit(blocId: string, section: number | null, identite: string, nom: string, desc: string)
  : Promise<{ ok: true; produit: { nom: string; desc: string } } | { ok: false; phrase: string }> {
  if (!valide(blocId, section) || [identite, nom, desc].some(v => typeof v !== "string") || identite.length > 600) return { ok: false, phrase: "Produit introuvable." }
  const l = await blocDeCarte(blocId)
  if ("refus" in l) return { ok: false, phrase: l.refus }
  const r = modifierProduit(l.bloc.type, l.bloc.content ?? {}, section, identite, { nom, desc })
  if (!r.ok) return r
  const refus = await ecrire(l.supabase, l.bloc, r.content)
  return refus ? { ok: false, phrase: refus } : { ok: true, produit: r.produit }
}

export async function retirerUnProduit(blocId: string, section: number | null, identite: string)
  : Promise<{ ok: true; retire: Retire } | { ok: false; phrase: string }> {
  if (!valide(blocId, section) || typeof identite !== "string" || identite.length > 600) return { ok: false, phrase: "Produit introuvable." }
  const l = await blocDeCarte(blocId)
  if ("refus" in l) return { ok: false, phrase: l.refus }
  const r = retirerProduit(l.bloc.type, l.bloc.content ?? {}, section, identite)
  if (!r.ok) return r
  const refus = await ecrire(l.supabase, l.bloc, r.content)
  return refus ? { ok: false, phrase: refus } : { ok: true, retire: r.retire }
}

export async function remettreUnProduit(blocId: string, section: number | null, retire: Retire): Promise<{ ok: true } | { ok: false; phrase: string }> {
  if (!valide(blocId, section) || !retire || typeof retire.nom !== "string" || !Number.isInteger(retire.index)) return { ok: false, phrase: "Produit introuvable." }
  const l = await blocDeCarte(blocId)
  if ("refus" in l) return { ok: false, phrase: l.refus }
  const r = remettreProduit(l.bloc.type, l.bloc.content ?? {}, section, {
    nom: String(retire.nom).slice(0, limite("nomDeProduit")), prix: String(retire.prix ?? "").slice(0, limite("prixDeProduit")),
    desc: String(retire.desc ?? "").slice(0, limite("descriptionDeProduit")), index: Math.max(0, retire.index),
  })
  if (!r.ok) return r
  const refus = await ecrire(l.supabase, l.bloc, r.content)
  return refus ? { ok: false, phrase: refus } : { ok: true }
}
