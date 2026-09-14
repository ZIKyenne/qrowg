import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"
import GoalsShell from "./goals/GoalsShell"
import { accessibleOwnerIds } from "@/lib/team"
import { destinationApresConnexion, ECHAPPE } from "./atterrissage"
import { APPAREIL_ROBOT } from "@/lib/robots"
import { PAGES_LISTE, PAGES_MESUREES, FENETRE_OBJECTIFS_JOURS } from "@/lib/perimetreDeMesure"
import { debutDuMois, debutDuJour, debutDuJourIlYA, serieDeJours, jourDuCommerce } from "@/lib/jourDuCommerce"

// Rendu SERVEUR des données initiales du dashboard : évite le 2e getUser() côté
// client + le waterfall de requêtes + le spinner. DashboardClient garde son
// load() pour rafraîchir après une mutation (suppression / publication).
export default async function DashboardPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const ownerIds = await accessibleOwnerIds(supabase, user.id)
  const [{ data: prof }, { data: pgs }] = await Promise.all([
    supabase.from("profiles").select("full_name,plan,total_scans,avatar_url").eq("id", user.id).single(),
    supabase.from("pages").select("id,title,slug,status,total_views,created_at").in("user_id", ownerIds).order("created_at", { ascending: false }).limit(PAGES_LISTE),
  ])

  // Un compte qui n'a jamais rien créé n'a rien à administrer : on l'emmène
  // créer sa page au lieu de lui montrer un écran vide. Voir atterrissage.ts.
  const params = (await searchParams) ?? {}
  const lu = (k: string) => { const v = params[k]; return Array.isArray(v) ? v[0] : v }
  const versCreation = destinationApresConnexion({
    nbPages: (pgs ?? []).length,
    demande: lu("next"),
    dejaOriente: lu(ECHAPPE) === "1",
  })
  if (versCreation) redirect(versCreation)

  // Les vingt pages ci-dessus sont la LISTE de cartes : c'est la bonne taille
  // pour un écran, ce n'est pas un périmètre de mesure. Tout ce qui se COMPTE
  // ensuite — vues du mois, courbe de la semaine, objectifs de conversion — part
  // de la totalité des pages. Relevé du 14 septembre, compte à 26 pages : un
  // objectif « Toutes les pages » affichait 90 conversions pour 360, et un taux
  // de 20 % pour 8,9 % réels.
  const [{ data: pagesMesurees }, { count: pagesTotal }] = await Promise.all([
    supabase.from("pages").select("id,title,slug").in("user_id", ownerIds).order("created_at", { ascending: false }).limit(PAGES_MESUREES),
    supabase.from("pages").select("id", { count: "exact", head: true }).in("user_id", ownerIds),
  ])
  const ids = (pagesMesurees ?? []).map((p: any) => p.id)

  let monthViews = 0, todayViews = 0, weekViews: number[] = []
  if (ids.length) {
    // Le pendant SERVEUR de DashboardClient : sur Vercel il tourne en UTC, donc
    // il bornait le mois et le jour ailleurs que le navigateur du commerçant. Les
    // deux comptaient « ce mois-ci » sur deux mois différents (lot v108).
    const monthStart = debutDuMois()
    const todayStart = debutDuJour()
    const weekStart = debutDuJourIlYA(6)
    const [{ count: mCount }, { count: tCount }, { data: wRows }] = await Promise.all([
      supabase.from("page_views").select("id", { count: "exact", head: true }).in("page_id", ids).gte("viewed_at", monthStart).neq("device", APPAREIL_ROBOT),
      supabase.from("page_views").select("id", { count: "exact", head: true }).in("page_id", ids).gte("viewed_at", todayStart).neq("device", APPAREIL_ROBOT),
      supabase.from("page_views").select("viewed_at").in("page_id", ids).gte("viewed_at", weekStart).neq("device", APPAREIL_ROBOT),
    ])
    monthViews = mCount ?? 0
    todayViews = tCount ?? 0
    // Le rang se lit sur le JOUR, pas sur un écart de 24 h (lot v108).
    const jours = serieDeJours(7)
    const buckets = Array(jours.length).fill(0)
    for (const r of (wRows ?? [])) {
      const idx = jours.indexOf(jourDuCommerce((r as any).viewed_at))
      if (idx >= 0) buckets[idx]++
    }
    weekViews = buckets
  }

  // Objectifs : la section vit désormais EN BAS du Dashboard (#objectifs), plus de page dédiée.
  const since90 = new Date(); since90.setDate(since90.getDate() - FENETRE_OBJECTIFS_JOURS)
  let goalClicks: any[] = [], goalViews: any[] = []
  if (ids.length) {
    const [gc, gv] = await Promise.all([
      supabase.from("block_clicks").select("block_id, click_target, clicked_at, page_id, blocks(type)").in("page_id", ids).gte("clicked_at", since90.toISOString()).order("clicked_at", { ascending: false }),
      supabase.from("page_views").select("viewed_at, page_id").in("page_id", ids).gte("viewed_at", since90.toISOString()).neq("device", APPAREIL_ROBOT),
    ])
    goalClicks = (gc.data || []).map((c: any) => ({ block_id: c.block_id, click_target: c.click_target, clicked_at: c.clicked_at, page_id: c.page_id, block_type: c.blocks?.type || "cta_button" }))
    goalViews = gv.data || []
  }

  return (
    <>
      <DashboardClient
        initialProfile={(prof as any) ?? null}
        initialPages={(pgs as any) ?? []}
        initialMonthViews={monthViews}
        initialTodayViews={todayViews}
        initialWeekViews={weekViews}
      />
      <section id="objectifs" style={{ scrollMarginTop: 20, maxWidth: 1180, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px) 60px" }}>
        <GoalsShell clicks={goalClicks} pageViews={goalViews as any}
          pages={(pagesMesurees ?? []).map((p: any) => ({ id: p.id, title: p.title, slug: p.slug }))}
          pagesTotal={pagesTotal ?? null} />
      </section>
    </>
  )
}
