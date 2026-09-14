// Ce que la suppression du compte emporte — lecture, extraite de `settings/page.tsx`.
//
// L'écran n'annonçait qu'une phrase générique, sans un chiffre, là où la
// suppression d'UNE page en annonce cinq (lot v84). On lit d'abord, on affiche
// ensuite : `lib/suppressionDeCompte` met les phrases dessus (lot v96).
import { APPAREIL_ROBOT } from "@/lib/robots"
import type { CeQuiDisparaitDuCompte } from "@/lib/suppressionDeCompte"

type Client = { from: (t: string) => any }

export async function lireCeQuiDisparait(
  supabase: Client,
  userId: string,
  profil: { plan?: string | null; username?: string | null } | null,
): Promise<CeQuiDisparaitDuCompte> {
  const compte = async (table: string, filtre: (q: any) => any) => {
    try { const { count } = await filtre(supabase.from(table).select("id", { count: "exact", head: true })); return count ?? 0 }
    catch { return 0 }
  }
  const { data: pages } = await supabase.from("pages").select("id").eq("user_id", userId)
  const ids = (pages ?? []).map((p: any) => p.id)
  const parPage = (q: any) => (ids.length ? q.in("page_id", ids) : q.eq("page_id", "00000000-0000-0000-0000-000000000000"))

  const [qrs, scans, vues, messages, domaines] = await Promise.all([
    compte("qr_codes", q => q.eq("user_id", userId)),
    compte("scans", q => parPage(q).neq("device", APPAREIL_ROBOT)),
    compte("page_views", q => parPage(q).neq("device", APPAREIL_ROBOT)),
    compte("leads", q => q.eq("user_id", userId)),
    compte("domain_verifications", q => q.eq("user_id", userId).eq("verified", true)),
  ])

  // Membres : on passe par les équipes possédées (la route supprime
  // `teams.owner_id = uid`, et `team_members` casse en cascade).
  let nbMembres = 0
  try {
    const { data: equipes } = await supabase.from("teams").select("id").eq("owner_id", userId)
    const idsEquipes = (equipes ?? []).map((t: any) => t.id)
    if (idsEquipes.length) {
      const { count } = await supabase.from("team_members").select("id", { count: "exact", head: true }).in("team_id", idsEquipes)
      nbMembres = count ?? 0
    }
  } catch { nbMembres = 0 }

  let finDePeriode: string | null = null
  try {
    const { data: abo } = await supabase.from("subscriptions").select("current_period_end, status").eq("user_id", userId).maybeSingle()
    if (abo?.status === "active" || abo?.status === "trialing") finDePeriode = abo?.current_period_end ?? null
  } catch { /* pas d'abonnement lisible : on n'invente pas de date */ }

  return {
    pages: ids.length, qrs, scans, vues, messages,
    membres: nbMembres, domaines,
    sousDomaine: profil?.username ?? null,
    plan: profil?.plan ?? null,
    finDePeriode,
  }
}

// Rien n'est lu des équipes dont ce compte est seulement MEMBRE : sa suppression
// n'emporte que ce qu'il possède.
