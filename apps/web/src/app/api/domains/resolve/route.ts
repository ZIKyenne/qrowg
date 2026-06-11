// app/api/domains/resolve/route.ts
// Résout un domaine custom → redirige vers la page QRfolio associée

import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain")
  const path   = req.nextUrl.searchParams.get("path") ?? "/"

  if (!domain) return NextResponse.json({ error: "domain requis" }, { status: 400 })

  try {
    const supabase = createAdminClient()

    // Trouver la page associée au domaine vérifié
    const { data } = await supabase
      .from("domain_verifications")
      .select("page_id, pages(slug)")
      .eq("domain", domain)
      .eq("verified", true)
      .single()

    if (!data?.pages) {
      // Domaine non trouvé ou non vérifié → page 404 friendly
      return new NextResponse(
        `<!DOCTYPE html><html><body style="background:#080808;color:#F5F0E8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><h1 style="font-size:48px;margin:0;color:#C9A84C">404</h1><p>Domaine non configuré</p><a href="https://qrfolio.app" style="color:#C9A84C">QRfolio</a></div></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html" } }
      )
    }

    const page  = data.pages as any
    const slug  = page.slug
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrfolio.app"

    // Réécriture interne vers /{slug}
    return NextResponse.redirect(new URL(`/${slug}`, appUrl), {
      headers: {
        // Indiquer au navigateur que la réponse vient du domaine custom
        "X-Custom-Domain": domain,
      },
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
