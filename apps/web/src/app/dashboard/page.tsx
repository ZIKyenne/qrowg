import type { Metadata } from "next"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export const metadata: Metadata = { title: "Dashboard — QRfolio" }

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: pages } = await supabase
    .from("pages")
    .select("*, qr_codes(short_code, total_scans)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <DashboardClient profile={profile} pages={pages || []} />
}
