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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// `phrase` : déjà écrite pour le commerçant (convention de messagesLisibles.test).
type Reponse = { ok: true } | { ok: false; phrase: string }
const REFUS = "La carte n'a pas pu être mise à jour. Vérifiez votre connexion puis réessayez."

function revalider(slug: unknown) {
  if (typeof slug === "string" && /^[a-z0-9-]{1,80}$/i.test(slug)) { try { revalidatePath(`/${slug}`) } catch { /* rendu suivant */ } }
}

export async function basculerEpuise(blocId: string, nom: string, epuise: boolean): Promise<Reponse> {
  if (!UUID_RE.test(blocId) || typeof nom !== "string" || !nom.trim() || nom.length > 200) return { ok: false, phrase: "Produit introuvable." }
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
