import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AnalyticsClient from "./AnalyticsClient"

export const metadata = { title: "Analytics — QRfolio" }

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Stats globales du profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_pages, total_scans, plan")
    .eq("id", user.id)
    .single()

  // Pages de l'utilisateur
  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, total_views, unique_views, status")
    .eq("user_id", user.id)
    .order("total_views", { ascending: false })

  // Scans des 30 derniers jours
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: recentScans } = await supabase
    .from("scans")
    .select("scanned_at, device, country, page_id")
    .in("page_id", (pages || []).map(p => p.id))
    .gte("scanned_at", since.toISOString())
    .order("scanned_at", { ascending: true })

  // Clics liens des 90 derniers jours
  const since90 = new Date()
  since90.setDate(since90.getDate() - 90)

  const { data: recentClicks } = await supabase
    .from("block_clicks")
    .select("block_id, click_target, clicked_at, page_id, blocks(type)")
    .in("page_id", (pages || []).map(p => p.id))
    .gte("clicked_at", since90.toISOString())
    .order("clicked_at", { ascending: false })

  // Vues des 30 derniers jours
  const { data: recentViews } = await supabase
    .from("page_views")
    .select("viewed_at, device, source, country, page_id")
    .in("page_id", (pages || []).map(p => p.id))
    .gte("viewed_at", since.toISOString())
    .order("viewed_at", { ascending: true })

  // Normaliser les clics (joindre block_type depuis blocks)
  const clicks = (recentClicks || []).map((c: any) => ({
    block_id:     c.block_id,
    click_target: c.click_target,
    clicked_at:   c.clicked_at,
    page_id:      c.page_id,
    block_type:   c.blocks?.type || "cta_button",
  }))

  return (
    <AnalyticsClient
      profile={profile}
      pages={pages || []}
      recentScans={recentScans || []}
      recentViews={recentViews || []}
      clicks={clicks}
    />
  )
}
