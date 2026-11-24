import { createServerSupabaseClient } from "@/lib/supabase/server"
import { bilanDuMidi, type BilanDuService } from "@/lib/clientsDuService"
import { debutDuJourIlYA } from "@/lib/jourDuCommerce"
import { PERIODE_MAX_JOURS } from "./analyticsAgg"
import { redirect } from "next/navigation"
import AnalyticsShell from "./AnalyticsShell"
import { accessibleOwnerIds } from "@/lib/team"
import { APPAREILS_HUMAINS, ligneDeRobot } from "@/lib/robots"
import { PLAFOND_MESURE } from "@/lib/lectureOrdonnee"

export const metadata = { title: "Statistiques — QRowg" }

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Profil + périmètre d'accès en parallèle (indépendants, ne dépendent que du user).
  const [{ data: profileBrut }, ownerIds] = await Promise.all([
    supabase.from("profiles").select(" total_scans, plan, email, full_name, preferences").eq("id", user.id).single(),
    accessibleOwnerIds(supabase, user.id),
  ])

  // Pages accessibles : les siennes + celles des équipes dont il est membre.
  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, total_views, status")
    .in("user_id", ownerIds)
    .order("total_views", { ascending: false })

  const pageIds = (pages || []).map(p => p.id)
  // Le fuseau du commerce vit dans `preferences.timezone` (réglage du profil). L'écran
  // lisait `profile.timezone`, qui n'existe pas : il comptait les jours à l'heure de
  // Paris quoi qu'il arrive (corrigé au lot v357). Seul le fuseau part au client.
  const fuseau: string | null = (profileBrut as any)?.preferences?.timezone ?? null
  const { preferences: _preferences, ...profilSansPreferences } = (profileBrut ?? {}) as any
  const profile = profileBrut ? { ...profilSansPreferences, timezone: fuseau } : null
  // Audit du 14 novembre (B) : `since` valait 30 jours alors que l'écran
  // propose 7, 30 et 90 jours. « 90j » refiltrait donc les 30 mêmes jours, et
  // affichait le même chiffre que « 30j ». La fenêtre chargée couvre désormais
  // la plus longue période proposée ; l'écran découpe la sienne dedans.
  const since = new Date();   since.setDate(since.getDate() - PERIODE_MAX_JOURS)
  const since90 = new Date(); since90.setDate(since90.getDate() - 90)
  // Plafond de lignes par requête : garde-fou contre un payload géant pour un
  // compte très actif (l'agrégation reste côté client -> chantier P5 : vues SQL).
  // Tri décroissant : en cas de plafonnement, on conserve les données récentes.
  // 50 000 lignes AU HASARD n'est pas une mesure : chaque lecture dit aussi
  // lesquelles (lot v106).
  const LIM = PLAFOND_MESURE

  // Requêtes indépendantes (ne dépendent que de pageIds) lancées EN PARALLÈLE
  // (avant : ~6 allers-retours séquentiels -> latence additionnée sur le TTFB).
  // Filtre posé à la main, et non par `sansRobots` : sur cette sélection à huit
  // colonnes, le générique de l'aide dépassait la profondeur d'instanciation de
  // TypeScript. Même filtre, même colonne, même constante.
  const requeteScans = supabase.from("scans")
    .select("scanned_at, device, country, city, os, browser, page_id, qr_code_id")
    .in("page_id", pageIds).gte("scanned_at", since.toISOString())
    .in("device", APPAREILS_HUMAINS)
    .order("scanned_at", { ascending: false }).limit(LIM)

  const [
    { data: recentScans },
    { data: recentClicks },
    { data: recentViews },
    { data: allBlocks },
    { data: baseEventsRaw },
    { data: tapEventsRaw },
  ] = await Promise.all([
    requeteScans,
    supabase.from("block_clicks")
      .select("block_id, click_target, clicked_at, page_id, blocks(type)")
      .in("page_id", pageIds).gte("clicked_at", since90.toISOString())
      .order("clicked_at", { ascending: false }).limit(LIM),
    supabase.from("page_views")
      .select("viewed_at, device, source, country, page_id")
      .in("page_id", pageIds).gte("viewed_at", since.toISOString())
      .in("device", APPAREILS_HUMAINS)
      .order("viewed_at", { ascending: false }).limit(LIM),
    supabase.from("blocks")
      .select("id, type, page_id, position, is_visible")
      .in("page_id", pageIds).eq("is_visible", true).order("position"),
    // Engagement (scroll/impression/dwell) — sans x/y : indépendant de la migration 021.
    supabase.from("page_events")
      .select("kind, ref, value, page_id, created_at")
      .in("kind", ["scroll", "impression", "dwell"]).in("page_id", pageIds)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false }).limit(LIM),
    // Taps (heatmap) — requête séparée : si 021 absente, seule la heatmap dégrade.
    supabase.from("page_events")
      .select("ref, x, y, page_id, created_at")
      .eq("kind", "tap").in("page_id", pageIds)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false }).limit(LIM),
  ])

  // Attribution par support (QR de pages) — colonnes récentes hors types générés -> cast any.
  // Si la migration n'est pas appliquée, ces requêtes renvoient vide (dégradation douce).
  const [
    { data: supportQrs },
    { data: supportViews },
    { data: supportClicks },
    { data: supportLeads },
  ] = (await Promise.all([
    (supabase.from("qr_codes") as any).select("id, short_code, label, page_id").in("page_id", pageIds).order("created_at", { ascending: false }).limit(2000),
    (supabase.from("page_views") as any).select("qr_source").in("page_id", pageIds).gte("viewed_at", since.toISOString()).not("qr_source", "is", null).in("device", APPAREILS_HUMAINS).order("viewed_at", { ascending: false }).limit(LIM),
    (supabase.from("block_clicks") as any).select("qr_source").in("page_id", pageIds).gte("clicked_at", since90.toISOString()).not("qr_source", "is", null).order("clicked_at", { ascending: false }).limit(LIM),
    (supabase.from("leads") as any).select("qr_source").in("page_id", pageIds).gte("created_at", since.toISOString()).not("qr_source", "is", null).order("created_at", { ascending: false }).limit(LIM),
  ])) as any[]

  type PageEvRow = { kind: "scroll" | "impression" | "dwell" | "tap"; ref: string; value: number | null; x: number | null; y: number | null; page_id: string; created_at: string }
  const pageEvents: PageEvRow[] = [
    ...((baseEventsRaw || []) as any[]).map(e => ({ ...e, x: null, y: null })),
    ...((tapEventsRaw || []) as any[]).map(e => ({ ...e, kind: "tap" as const, value: null })),
  ]

  // Normaliser les clics (joindre block_type depuis blocks)
  const clicks = (recentClicks || []).map((c: any) => ({
    block_id:     c.block_id,
    click_target: c.click_target,
    clicked_at:   c.clicked_at,
    page_id:      c.page_id,
    block_type:   c.blocks?.type || "cta_button",
  }))

  // Les cartes « pays » et « appareils » se lisent sur les scans humains : une ligne
  // `device: "bot"` est un aperçu de lien, pas une visite (cf. lib/robots.ts). Le
  // tableau complet part quand même au client, qui dit combien ont été écartés.
  const scansHumains = (recentScans || []).filter((s: any) => !ligneDeRobot(s.device))

  // Données géo normalisées
  const geoScans = scansHumains.map((s: any) => ({
    country:    s.country,
    city:       s.city ?? null,
    page_id:    s.page_id,
    scanned_at: s.scanned_at,
  }))

  // Données device normalisées
  const deviceScans = scansHumains.map((s: any) => ({
    device:     s.device,
    os:         s.os ?? null,
    browser:    s.browser ?? null,
    page_id:    s.page_id,
    scanned_at: s.scanned_at,
  }))

  // ── Ce midi, par support (vague 3) ──────────────────────────────────────
  // Requête à part : les empreintes anonymes (ip_hash) restent ICI ; seuls les
  // bilans (des nombres) partent au client. Deux jours suffisent (avant 11 h, on
  // montre le service d'hier). Un bilan pour toute la carte, un par page (filtre).
  const { data: scansMidi } = await supabase.from("scans")
    .select("scanned_at, qr_code_id, ip_hash, page_id")
    .in("page_id", pageIds).gte("scanned_at", debutDuJourIlYA(1, Date.now(), fuseau))
    .in("device", APPAREILS_HUMAINS).order("scanned_at", { ascending: false }).limit(LIM)
  const lusMidi = (scansMidi || []) as { scanned_at: string; qr_code_id: string | null; ip_hash: string | null; page_id: string }[]
  const bilansDuMidi: Record<string, BilanDuService> = { all: bilanDuMidi(lusMidi, fuseau) }
  for (const id of pageIds) bilansDuMidi[id] = bilanDuMidi(lusMidi.filter(s => s.page_id === id), fuseau)

  return (
    <AnalyticsShell
      profile={profile}
      bilansDuMidi={bilansDuMidi}
      pages={pages || []}
      recentScans={recentScans || []}
      recentViews={recentViews || []}
      clicks={clicks}
      blocks={allBlocks || []}
      geoScans={geoScans}
      deviceScans={deviceScans}
      pageEvents={pageEvents}
      userEmail={profile?.email ?? ""}
      supportQrs={supportQrs || []}
      supportViews={supportViews || []}
      supportClicks={supportClicks || []}
      supportLeads={supportLeads || []}
    />
  )
}
