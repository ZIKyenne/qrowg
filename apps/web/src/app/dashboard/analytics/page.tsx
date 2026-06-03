import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AnalyticsClient from "./AnalyticsClient"

export const metadata = { title: "Analytics — QRfolio" }

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_pages, total_scans, plan")
    .eq("id", user.id)
    .single()

  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, total_views, unique_views, status")
    .eq("user_id", user.id)
    .order("total_views", { ascending: false })

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const pageIds = (pages || []).map(p => p.id)

  const { data: recentScans } = pageIds.length > 0
    ? await supabase.from("scans").select("scanned_at, device, country, page_id")
        .in("page_id", pageIds).gte("scanned_at", since.toISOString()).order("scanned_at", { ascending: true })
    : { data: [] }

  const { data: recentViews } = pageIds.length > 0
    ? await supabase.from("page_views").select("viewed_at, device, source, country, page_id")
        .in("page_id", pageIds).gte("viewed_at", since.toISOString()).order("viewed_at", { ascending: true })
    : { data: [] }

  return (
    <AnalyticsClient
      profile={profile}
      pages={pages || []}
      recentScans={recentScans || []}
      recentViews={recentViews || []}
    />
  )
}
