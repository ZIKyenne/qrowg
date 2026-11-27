"use server"

// « Ma carte ce soir » — les deux gestes du comptoir : épuiser un produit (ou le
// remettre), et tout remettre en vente. Même garde que la publication
// (builder/publishActions) : session obligatoire, lecture ET écriture sous RLS
// (propriétaire ou membre d'équipe), écriture confirmée par `.select()`, puis
// revalidation du cache ISR de la page publique — l'effet est immédiat, sans
// republier. La règle vit dans shared-renderer/models/epuises (pure, testée).

import type { Json } from "@/lib/supabase/database.generated"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { accessibleOwnerIds } from "@/lib/team"
import { avecEpuise, toutEnVente, BLOCS_DE_CARTE, CLE_EPUISES, estEditable, carteDeLaPage, cleDuPlat } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import { avecAllergenes, ALLERGENES } from "@/app/dashboard/builder/shared-renderer/models/allergenes"
import { BLOCS_TRADUISIBLES, repartirLaTraduction, avecLangue, languesDuBloc, couvertureDeLaPage, aTraduireDansLaPage } from "@/app/dashboard/builder/shared-renderer/models/traductionDesCartes"
import { LANGUES_PROPOSEES, type CodeLangue } from "@/app/dashboard/builder/shared-renderer/models/traductionCarte"
import { menuSectionViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuSection"
import { rubriquesDesAutresCartes } from "@/app/dashboard/builder/shared-renderer/models/autresCartes"
import { avecPrix, refusDuPrix, PHRASES_REFUS } from "@/app/dashboard/builder/shared-renderer/models/prixDeLaCarte"
import { avecProduit } from "@/app/dashboard/builder/shared-renderer/models/ajoutDeProduit"
import { limite } from "@/lib/limitesDeSaisie"
import { modifierProduit, retirerProduit, remettreProduit, type Retire } from "@/app/dashboard/builder/shared-renderer/models/editionDeProduit"
import { ardoiseDeLaPage, ardoiseEcrite, ardoiseNeuve, placeDeLArdoise, PLATS_MAX, type ArdoiseVue, type PlatSaisi } from "@/app/dashboard/builder/shared-renderer/models/ardoiseDuJour"
import { TYPE_ARDOISE } from "@/app/dashboard/builder/shared-renderer/models/platDuJour"
import { avecFermeture, sansFermeture, fermetureDeLaPage, TYPE_HORAIRES, type FermetureVue } from "@/app/dashboard/builder/shared-renderer/models/fermetureDuCommerce"
import { menuTabsViewModel } from "@/app/dashboard/builder/shared-renderer/models/menuTabs"
import { contenuDeGrandeCarte, placeDeLaCarte, carteVideARemplir, SECTIONS_MAX, PRODUITS_PAR_SECTION, type SectionLue } from "@/app/dashboard/builder/shared-renderer/models/lectureDeCarte"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// `phrase` : déjà écrite pour le commerçant (convention de messagesLisibles.test).
type Reponse = { ok: true } | { ok: false; phrase: string }
const REFUS = "La carte n'a pas pu être mise à jour. Vérifiez votre connexion puis réessayez."

function revalider(slug: unknown) {
  if (typeof slug === "string" && /^[a-z0-9-]{1,80}$/i.test(slug)) { try { revalidatePath(`/${slug}`) } catch { /* rendu suivant */ } }
}

// La page, parmi celles du compte et de son équipe. Pas une simple lecture par
// identifiant : toute page PUBLIÉE est lisible par tout compte connecté (policy
// « Lecture pages publiées »), mais ses blocs ne le sont pas. Avant v404, sur la
// page en ligne d'un autre, « tout remettre en vente » et la traduction
// répondaient « fait » (zéro bloc lu, zéro écrit) et revalidaient son cache ;
// l'ardoise, l'import et les fermetures répondaient une phrase fausse.
async function pageDuCompte(supabase: any, userId: string, pageId: string): Promise<{ data: { id: string; slug: string } | null }> {
  const proprietaires = await accessibleOwnerIds(supabase, userId)
  const { data } = await supabase.from("pages").select("id, slug").eq("id", pageId).in("user_id", proprietaires).maybeSingle()
  return { data: data ?? null }
}

export async function basculerEpuise(blocId: string, nom: string, epuise: boolean): Promise<Reponse> {
  if (!UUID_RE.test(blocId) || typeof nom !== "string" || !nom.trim() || nom.length > 600) return { ok: false, phrase: "Produit introuvable." }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, phrase: "Votre session a expiré. Reconnectez-vous puis réessayez." }

  const { data: bloc, error } = await supabase.from("blocks").select("id, type, content, pages(slug)").eq("id", blocId).maybeSingle()
  if (error || !bloc || !(BLOCS_DE_CARTE as readonly string[]).includes((bloc as any).type)) return { ok: false, phrase: "Produit introuvable." }

  const content = avecEpuise(((bloc as any).content ?? {}) as Record<string, unknown>, nom, !!epuise)
  const { data: fait, error: e2 } = await supabase.from("blocks").update({ content: content as Json }).eq("id", blocId).select("id")
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

  const { data: page } = await pageDuCompte(supabase, user.id, pageId)
  if (!page) return { ok: false, phrase: "Page introuvable." }
  const { data: blocs, error } = await supabase.from("blocks").select("id, content").eq("page_id", pageId).in("type", [...BLOCS_DE_CARTE]).order("position", { ascending: true })
  if (error) return { ok: false, phrase: REFUS }

  for (const b of (blocs ?? []) as { id: string; content: Record<string, unknown> | null }[]) {
    if (!b.content?.[CLE_EPUISES]) continue
    const { data: fait, error: e2 } = await supabase.from("blocks").update({ content: toutEnVente(b.content) as Json }).eq("id", b.id).select("id")
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
  const { data: fait, error: e2 } = await supabase.from("blocks").update({ content: content as Json }).eq("id", blocId).select("id")
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
  if (error || !bloc || !estEditable((bloc as any).type)) return { ok: false, phrase: "Rubrique introuvable." }

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
  const { data: page } = await pageDuCompte(supabase, user.id, pageId)
  if (!page) return { ok: false, phrase: "Page introuvable." }

  // Juste après la dernière carte de la page (placeDeLaCarte) ; les blocs qui
  // suivent descendent d'un cran, du dernier au premier, AVANT l'insertion.
  const { data: blocs, error: e1 } = await supabase.from("blocks").select("id, type, position, content").eq("page_id", pageId).order("position", { ascending: true })
  if (e1) return { ok: false, phrase: REFUS }
  // La page porte une carte encore vide (création guidée « menu ») : on la remplit.
  const vide = carteVideARemplir((blocs ?? []) as any[], c => menuTabsViewModel(c).totalItems)
  if (vide) {
    const { data: fait, error: e5 } = await supabase.from("blocks").update({ content: contenuDeGrandeCarte(titre, propres) }).eq("id", vide).select("id")
    if (e5 || !fait?.length) return { ok: false, phrase: REFUS }
    revalider(page.slug)
    return { ok: true }
  }
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

// ── L'ardoise du jour ────────────────────────────────────────────────────────
// Vague 1 : écrite depuis Ma carte, datée du jour du commerce, en ligne aussitôt.
// La page n'a pas d'ardoise : on en pose une, juste avant sa carte. Règles
// (plats vides, longueurs, prix, plafond) : ardoiseDuJour, pur et testé.
export async function ecrireArdoise(pageId: string, plats: PlatSaisi[]): Promise<{ ok: true; ardoise: ArdoiseVue } | { ok: false; phrase: string }> {
  if (!UUID_RE.test(pageId) || !Array.isArray(plats) || plats.length > PLATS_MAX * 3) return { ok: false, phrase: "Page introuvable." }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, phrase: "Votre session a expiré. Reconnectez-vous puis réessayez." }
  const { data: page } = await pageDuCompte(supabase, user.id, pageId)
  if (!page) return { ok: false, phrase: "Page introuvable." }
  const { data: blocs, error } = await supabase.from("blocks").select("id, type, content, position, is_visible").eq("page_id", pageId).order("position", { ascending: true })
  if (error) return { ok: false, phrase: REFUS }
  const lus = ((blocs ?? []) as any[]).map(b => ({ id: b.id, type: b.type, content: b.content, position: b.position, visible: b.is_visible !== false }))
  const now = new Date()
  const existante = ardoiseDeLaPage(lus, now)

  if (existante) {
    const bloc = lus.find(b => b.id === existante.blocId)!
    const r = ardoiseEcrite(bloc.content, plats, now)
    if (!r.ok) return r
    const { data: fait, error: e2 } = await supabase.from("blocks").update({ content: r.content }).eq("id", bloc.id).select("id")
    if (e2 || !fait?.length) return { ok: false, phrase: REFUS }
    revalider(page.slug)
    return { ok: true, ardoise: ardoiseDeLaPage([{ ...bloc, content: r.content }], now)! }
  }

  // Le fuseau des horaires de la page, s'il est réglé : la même journée pour les deux.
  const fuseau = lus.find(b => b.type === "opening_hours" && typeof b.content?.fuseau === "string")?.content?.fuseau ?? null
  const r = ardoiseNeuve(plats, now, fuseau)
  if (!r.ok) return r
  const { position, decaler } = placeDeLArdoise(lus.map(b => ({ id: b.id, type: b.type, position: b.position ?? 0 })))
  for (const d of [...decaler].reverse()) {
    const { data: bouge, error: e3 } = await supabase.from("blocks").update({ position: d.position }).eq("id", d.id).select("id")
    if (e3 || !bouge?.length) return { ok: false, phrase: REFUS }
  }
  const { data: cree, error: e4 } = await supabase.from("blocks")
    .insert({ page_id: pageId, type: TYPE_ARDOISE, position, is_visible: true, content: r.content }).select("id")
  if (e4 || !cree?.length) return { ok: false, phrase: REFUS }
  revalider(page.slug)
  return { ok: true, ardoise: ardoiseDeLaPage([{ id: (cree[0] as any).id, type: TYPE_ARDOISE, content: r.content, position, visible: true }], now)! }
}

// ── Traduction de toute la carte (vague 2) ──────────────────────────────────
// Une réponse collée pour toute la page, répartie bloc par bloc dans `tr_<langue>`
// (le format de la carte illustrée). Elle se FUSIONNE avec ce qui était déjà
// traduit : coller la traduction de trois nouveaux produits n'efface pas le reste.
// `texte` vide = retirer la langue.
export async function enregistrerTraduction(pageId: string, langue: string, texte: string): Promise<{ ok: true; traduits: number; total: number } | { ok: false; phrase: string }> {
  if (!UUID_RE.test(pageId) || !(LANGUES_PROPOSEES as readonly string[]).includes(langue) || typeof texte !== "string" || texte.length > 200_000) return { ok: false, phrase: "Traduction illisible." }
  const l = langue as CodeLangue
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, phrase: "Votre session a expiré. Reconnectez-vous puis réessayez." }
  const { data: page } = await pageDuCompte(supabase, user.id, pageId)
  if (!page) return { ok: false, phrase: "Page introuvable." }
  const { data: blocs, error } = await supabase.from("blocks").select("id, type, content, is_visible").eq("page_id", pageId).in("type", [...BLOCS_TRADUISIBLES])
  if (error) return { ok: false, phrase: REFUS }
  const lus = ((blocs ?? []) as any[]).map(b => ({ id: b.id as string, type: b.type as string, content: (b.content ?? {}) as Record<string, any>, visible: b.is_visible !== false }))
  const retirer = !texte.trim()
  // Les lignes déjà enregistrées d'abord, la réponse collée ensuite : elle l'emporte.
  const fusion = retirer ? "" : [...lus.map(b => String(b.content[`tr_${l}`] ?? "")), texte].join("\n")
  const parBloc = repartirLaTraduction(lus, fusion)
  for (const b of lus) {
    const lignes = retirer ? "" : (parBloc.get(b.id) ?? "")
    if (String(b.content[`tr_${l}`] ?? "") === lignes && languesDuBloc(b.content).includes(l) === !!lignes.trim()) continue
    const { data: fait, error: e2 } = await supabase.from("blocks").update({ content: avecLangue(b.content, l, lignes) }).eq("id", b.id).select("id")
    if (e2 || !fait?.length) return { ok: false, phrase: REFUS }
  }
  revalider(page.slug)
  const c = couvertureDeLaPage(aTraduireDansLaPage(lus), fusion)
  return { ok: true, traduits: c.traduits, total: c.total }
}

// ── Allergènes (vague 2) ─────────────────────────────────────────────────────
// Rangés par identité de produit (models/allergenes, comme `epuises`) : valent
// pour les cinq blocs de carte. `codes` vide = « aucun des 14 » ; null = effacer.
export async function changerAllergenes(blocId: string, identite: string, codes: string[] | null): Promise<Reponse> {
  if (!UUID_RE.test(blocId) || typeof identite !== "string" || !identite.trim() || identite.length > 600
    || (codes !== null && (!Array.isArray(codes) || codes.length > ALLERGENES.length || codes.some(c => typeof c !== "string")))) return { ok: false, phrase: "Produit introuvable." }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, phrase: "Votre session a expiré. Reconnectez-vous puis réessayez." }
  const { data: bloc, error } = await supabase.from("blocks").select("id, type, content, pages(slug)").eq("id", blocId).maybeSingle()
  if (error || !bloc || !(BLOCS_DE_CARTE as readonly string[]).includes((bloc as any).type)) return { ok: false, phrase: "Produit introuvable." }
  const content = ((bloc as any).content ?? {}) as Record<string, any>
  // Le produit doit exister dans ce bloc : on n'écrit pas d'allergènes pour un nom inventé.
  const cle = cleDuPlat(identite)
  const existe = carteDeLaPage([{ id: blocId, type: (bloc as any).type, content }], { section: menuSectionViewModel, onglets: menuTabsViewModel, autres: rubriquesDesAutresCartes })
    .some(r => r.plats.some(p => cleDuPlat(p.identite) === cle))
  if (!existe) return { ok: false, phrase: "Ce produit a changé depuis l'ouverture de l'écran. Rechargez la page." }
  const { data: fait, error: e2 } = await supabase.from("blocks").update({ content: avecAllergenes(content, identite, codes) }).eq("id", blocId).select("id")
  if (e2 || !fait?.length) return { ok: false, phrase: REFUS }
  const page = (bloc as any).pages
  revalider(Array.isArray(page) ? page[0]?.slug : page?.slug)
  return { ok: true }
}

// ── Fermetures (« fermé ce soir », congés) ───────────────────────────────────
// Écrites dans le champ « Exception / congés » des horaires de la page, sous une
// forme que lib/congesDates relit à l'identique (fermetureDuCommerce, testé
// aller-retour) : le badge dit « Fermé · réouverture le … », puis s'éteint seul.
type ReponseFermeture = { ok: true; fermeture: FermetureVue } | { ok: false; phrase: string }

async function horairesDeLaPage(pageId: string): Promise<{ refus: string } | { supabase: any; slug: string; bloc: { id: string; type: string; content: any; position: number } }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { refus: "Votre session a expiré. Reconnectez-vous puis réessayez." }
  const { data: page } = await pageDuCompte(supabase, user.id, pageId)
  if (!page) return { refus: "Page introuvable." }
  const { data: blocs, error } = await supabase.from("blocks").select("id, type, content, position, is_visible").eq("page_id", pageId).eq("type", TYPE_HORAIRES).order("position", { ascending: true })
  if (error) return { refus: REFUS }
  const bloc = ((blocs ?? []) as any[]).find(b => b.is_visible !== false)
  if (!bloc) return { refus: "Ajoutez d'abord vos horaires à la page." }
  return { supabase, slug: page.slug, bloc }
}

async function ecrireHoraires(l: { supabase: any; slug: string; bloc: any }, content: Record<string, any>): Promise<ReponseFermeture> {
  const { data: fait, error } = await l.supabase.from("blocks").update({ content }).eq("id", l.bloc.id).select("id")
  if (error || !fait?.length) return { ok: false, phrase: REFUS }
  revalider(l.slug)
  return { ok: true, fermeture: fermetureDeLaPage([{ ...l.bloc, content }], new Date())! }
}

/** `debut`, `fin` : « AAAA-MM-JJ » ; `fin` null = un seul jour. */
export async function annoncerFermeture(pageId: string, debut: string, fin: string | null): Promise<ReponseFermeture> {
  if (!UUID_RE.test(pageId) || typeof debut !== "string" || (fin !== null && typeof fin !== "string")) return { ok: false, phrase: "Page introuvable." }
  const l = await horairesDeLaPage(pageId)
  if ("refus" in l) return { ok: false, phrase: l.refus }
  const r = avecFermeture(l.bloc.content, debut, fin, new Date())
  if (!r.ok) return r
  return ecrireHoraires(l, r.content)
}

export async function rouvrir(pageId: string): Promise<ReponseFermeture> {
  if (!UUID_RE.test(pageId)) return { ok: false, phrase: "Page introuvable." }
  const l = await horairesDeLaPage(pageId)
  if ("refus" in l) return { ok: false, phrase: l.refus }
  return ecrireHoraires(l, sansFermeture(l.bloc.content))
}

// ── Corriger, retirer, remettre (« Annuler ») ────────────────────────────────
// Les règles vivent dans editionDeProduit (pur, testé sur six formats de carte).
async function blocDeCarte(blocId: string): Promise<{ refus: string } | { supabase: any; bloc: any }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { refus: "Votre session a expiré. Reconnectez-vous puis réessayez." }
  const { data: bloc, error } = await supabase.from("blocks").select("id, type, content, pages(slug)").eq("id", blocId).maybeSingle()
  // Corriger / retirer / remettre : les deux menus seulement (les autres cartes se composent dans l'éditeur).
  if (error || !bloc || !estEditable((bloc as any).type)) return { refus: "Produit introuvable." }
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
