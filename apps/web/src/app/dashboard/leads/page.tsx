import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LeadsClient from "./LeadsClient"

export const metadata = { title: "Messages — QRfolio" }

export default async function LeadsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug")
    .eq("user_id", user.id)

  const pageIds = (pages || []).map(p => p.id)

  const { data: leads } = pageIds.length
    ? await supabase
        .from("leads")
        .select("id, page_id, block_id, type, name, email, phone, message, data, is_read, status, created_at")
        .in("page_id", pageIds)
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [] }

  return <LeadsClient leads={leads || []} pages={pages || []} />
}
