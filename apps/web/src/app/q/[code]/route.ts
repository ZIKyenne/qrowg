// app/q/[code]/route.ts v2
// Résolution QR avec gestion des statuts

import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

function pausedHtml(message: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QR Code temporairement indisponible</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:#080808;color:#F5F0E8;font-family:'DM Sans',Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#0F0E0B;border:1px solid rgba(249,115,22,0.3);border-radius:20px;padding:40px 32px;max-width:400px;width:100%;text-align:center}
.icon{font-size:48px;margin-bottom:16px}
.badge{display:inline-flex;align-items:center;gap:6px;background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.25);border-radius:20px;padding:4px 14px;font-size:12px;color:#F97316;font-weight:600;margin-bottom:20px}
.dot{width:6px;height:6px;border-radius:50%;background:#F97316;animation:pulse 1.5s infinite}
h1{font-size:22px;font-weight:700;margin-bottom:10px;color:#F5F0E8}
p{font-size:14px;line-height:1.7;color:#8A8478;margin-bottom:28px}
.link{color:#C9A84C;text-decoration:none;font-size:13px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
</style>
</head>
<body>
<div class="card">
  <div class="icon">⏸</div>
  <div class="badge"><div class="dot"></div>En pause</div>
  <h1>QR Code temporairement indisponible</h1>
  <p>${message || "Ce QR Code est temporairement désactivé. Réessayez plus tard."}</p>
  <a class="link" href="${appUrl}">Créer votre propre QR Code →</a>
</div>
</body></html>`
}

function expiredHtml(appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QR Code expiré</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:#080808;color:#F5F0E8;font-family:'DM Sans',Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#0F0E0B;border:1px solid rgba(255,107,107,0.3);border-radius:20px;padding:40px 32px;max-width:400px;width:100%;text-align:center}
.icon{font-size:48px;margin-bottom:16px}
.badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.25);border-radius:20px;padding:4px 14px;font-size:12px;color:#FF6B6B;font-weight:600;margin-bottom:20px}
h1{font-size:22px;font-weight:700;margin-bottom:10px;color:#F5F0E8}
p{font-size:14px;line-height:1.7;color:#8A8478;margin-bottom:28px}
.link{color:#C9A84C;text-decoration:none;font-size:13px}
</style>
</head>
<body>
<div class="card">
  <div class="icon">⌛</div>
  <div class="badge">Expiré</div>
  <h1>Ce QR Code a expiré</h1>
  <p>La durée de validité de ce QR Code est dépassée. Contactez l'émetteur pour en obtenir un nouveau.</p>
  <a class="link" href="${appUrl}">Créer votre propre QR Code →</a>
</div>
</body></html>`
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!code) return NextResponse.redirect(new URL("/", req.url))

  const supabase = createAdminClient()
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrfolio.app"

  try {
    const { data: qr } = await supabase
      .from("qr_codes")
      .select("id, page_id, status, dest_override, pause_message, expires_at, pages(slug, status)")
      .eq("short_code", code)
      .single()

    if (!qr) return NextResponse.redirect(new URL("/?qr=notfound", appUrl))

    const qrStatus = qr.status ?? "active"

    // ── Vérifier expiration automatique ───────────────────────────────────
    if (qr.expires_at && new Date(qr.expires_at) < new Date() && qrStatus === "active") {
      // Auto-expirer
      supabase.from("qr_codes").update({ status: "expired" }).eq("id", qr.id).then(() => {})
      return new NextResponse(expiredHtml(appUrl), {
        status: 410, headers: { "Content-Type": "text/html;charset=utf-8" }
      })
    }

    // ── Bloquer selon statut ───────────────────────────────────────────────
    switch (qrStatus) {
      case "paused":
        return new NextResponse(pausedHtml(qr.pause_message ?? "", appUrl), {
          status: 503, headers: { "Content-Type": "text/html;charset=utf-8" }
        })
      case "archived":
        return new NextResponse(expiredHtml(appUrl), {
          status: 410, headers: { "Content-Type": "text/html;charset=utf-8" }
        })
      case "expired":
        return new NextResponse(expiredHtml(appUrl), {
          status: 410, headers: { "Content-Type": "text/html;charset=utf-8" }
        })
      case "draft":
        // Draft accessible uniquement si paramètre preview (pour le dashboard)
        if (!req.nextUrl.searchParams.has("preview")) {
          return NextResponse.redirect(new URL("/?qr=draft", appUrl))
        }
        break
    }

    // ── Enregistrer le scan (fire-and-forget) ─────────────────────────────
    const ua     = req.headers.get("user-agent") ?? ""
    const device = /Mobile|Android|iPhone/i.test(ua) ? "mobile"
      : /Tablet|iPad/i.test(ua) ? "tablet" : "desktop"

    supabase.from("qr_codes").update({
      total_scans: supabase.rpc("increment_qr_scans", { qr_id: qr.id }) as any,
      last_scan_at: new Date().toISOString(),
    }).eq("id", qr.id).then(() => {}).catch(() => {})

    supabase.from("scans").insert({
      qr_code_id: qr.id, page_id: qr.page_id, device,
    }).then(() => {}).catch(() => {})

    // ── Résolution destination (override ou page) ─────────────────────────
    const override = qr.dest_override as any
    if (override) {
      const dest = override.url || override.value
      switch (override.type) {
        case "url": case "file":
          return NextResponse.redirect(dest.startsWith("http") ? dest : `https://${dest}`, { status: 302 })
        case "email":
          return NextResponse.redirect(dest.startsWith("mailto:") ? dest : `mailto:${dest}`, { status: 302 })
        case "phone":
          return NextResponse.redirect(dest.startsWith("tel:") ? dest : `tel:${dest}`, { status: 302 })
        case "whatsapp":
          return NextResponse.redirect(dest, { status: 302 })
        case "page": {
          const { data: pg } = await supabase.from("pages").select("slug").eq("id", override.value).single()
          if (pg) return NextResponse.redirect(`${appUrl}/${pg.slug}`, { status: 302 })
          break
        }
      }
    }

    const page = qr.pages as any
    if (page?.slug) return NextResponse.redirect(`${appUrl}/${page.slug}`, { status: 302 })

    return NextResponse.redirect(new URL("/?qr=error", appUrl))
  } catch (e) {
    console.error("[qr-redirect]", e)
    return NextResponse.redirect(new URL("/?qr=error", appUrl))
  }
}
