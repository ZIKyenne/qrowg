// app/q/[code]/route.ts
// Résolution QR Code : override → page QRfolio par défaut
// Ce fichier REMPLACE la logique de redirection QR existante

import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params
  if (!code) return NextResponse.redirect(new URL("/", req.url))

  const supabase   = createAdminClient()
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrfolio.app"

  try {
    // Récupérer le QR avec son éventuel override
    const { data: qr } = await supabase
      .from("qr_codes")
      .select("id, page_id, dest_override, pages(slug, status)")
      .eq("short_code", code)
      .single()

    if (!qr) {
      return NextResponse.redirect(new URL("/?qr=notfound", appUrl))
    }

    // Incrémenter total_scans (fire-and-forget)
    supabase
      .from("qr_codes")
      .update({ total_scans: supabase.rpc("increment_qr_scans", { qr_id: qr.id }) as any, last_scan_at: new Date().toISOString() })
      .eq("id", qr.id)
      .then(() => {})
      .catch(() => {})

    // Enregistrer le scan (fire-and-forget)
    const ua       = req.headers.get("user-agent") ?? ""
    const device   = /Mobile|Android|iPhone/i.test(ua) ? "mobile"
      : /Tablet|iPad/i.test(ua) ? "tablet" : "desktop"
    supabase.from("scans").insert({
      qr_code_id: qr.id,
      page_id:    qr.page_id,
      device,
    }).then(() => {}).catch(() => {})

    // ── Résolution de la destination ──────────────────────────────────────
    const override = qr.dest_override as any

    if (override) {
      const dest = override.url || override.value
      switch (override.type) {
        case "url":
        case "file":
          return NextResponse.redirect(dest.startsWith("http") ? dest : `https://${dest}`, { status: 302 })
        case "email":
          return NextResponse.redirect(dest.startsWith("mailto:") ? dest : `mailto:${dest}`, { status: 302 })
        case "phone":
          return NextResponse.redirect(dest.startsWith("tel:") ? dest : `tel:${dest}`, { status: 302 })
        case "whatsapp":
          return NextResponse.redirect(dest, { status: 302 })
        case "page":
          // Override vers une autre page QRfolio
          const { data: targetPage } = await supabase
            .from("pages")
            .select("slug")
            .eq("id", override.value)
            .single()
          if (targetPage) return NextResponse.redirect(`${appUrl}/${targetPage.slug}`, { status: 302 })
          break
      }
    }

    // ── Destination par défaut : page QRfolio ─────────────────────────────
    const page = qr.pages as any
    if (page?.slug) {
      return NextResponse.redirect(`${appUrl}/${page.slug}`, { status: 302 })
    }

    return NextResponse.redirect(new URL("/?qr=error", appUrl))
  } catch (e) {
    console.error("[qr-redirect]", e)
    return NextResponse.redirect(new URL("/?qr=error", appUrl))
  }
}
