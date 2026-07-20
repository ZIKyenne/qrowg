import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import BusinessDashboard from "../analytics/BusinessDashboard"

export const metadata = { title: "Dashboard — QRowg" }

export default async function OverviewPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, total_scans")
    .eq("id", user.id)
    .single()

  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, total_views")
    .eq("user_id", user.id)
    .order("total_views", { ascending: false })

  const since90 = new Date()
  since90.setDate(since90.getDate() - 90)
  const pageIds = (pages || []).map(p => p.id)

  const [views, scans, clicks, blocks, geoScans] = await Promise.all([
    supabase.from("page_views")
      .select("viewed_at, device, source, country, page_id")
      .in("page_id", pageIds)
      .gte("viewed_at", since90.toISOString())
      .order("viewed_at", { ascending: true }),

    supabase.from("scans")
      .select("scanned_at, device, country, page_id")
      .in("page_id", pageIds)
      .gte("scanned_at", since90.toISOString())
      .order("scanned_at", { ascending: true }),

    supabase.from("block_clicks")
      .select("block_id, click_target, clicked_at, page_id, blocks(type)")
      .in("page_id", pageIds)
      .gte("clicked_at", since90.toISOString())
      .order("clicked_at", { ascending: false }),

    supabase.from("blocks")
      .select("id, type, page_id")
      .in("page_id", pageIds)
      .eq("is_visible", true),

    supabase.from("scans")
      .select("country, page_id, scanned_at")
      .in("page_id", pageIds)
      .gte("scanned_at", since90.toISOString()),
  ])

  const normalizedClicks = (clicks.data || []).map((c: any) => ({
    block_id:     c.block_id,
    click_target: c.click_target,
    clicked_at:   c.clicked_at,
    page_id:      c.page_id,
    block_type:   c.blocks?.type || "cta_button",
  }))

  return (
    <BusinessDashboard
      profile={profile}
      pages={pages || []}
      views={views.data || []}
      scans={scans.data || []}
      clicks={normalizedClicks}
      blocks={blocks.data || []}
      geoScans={geoScans.data || []}
    />
  )
}
