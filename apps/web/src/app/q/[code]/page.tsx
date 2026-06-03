import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { headers } from "next/headers"

interface Props {
  params: { code: string }
}

export default async function QRRedirect({ params }: Props) {
  const supabase = await createServerSupabaseClient()

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("*, pages(slug, status)")
    .eq("short_code", params.code)
    .single()

  if (!qr) notFound()

  const page = qr.pages as any
  if (!page || page.status !== "published") notFound()

  // Get device info
  const headersList = await headers()
  const ua = headersList.get("user-agent") || ""
  const device = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : /tablet|ipad/i.test(ua) ? "tablet" : "desktop"

  // Track scan
  await supabase.from("scans").insert({
    qr_code_id: qr.id,
    page_id: qr.page_id,
    device,
    scanned_at: new Date().toISOString(),
  })

  redirect(`/${page.slug}`)
}
