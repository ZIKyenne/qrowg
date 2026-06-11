// middleware.ts — Routing domaines custom + sous-domaines *.qrfolio.app

import { NextRequest, NextResponse } from "next/server"

const APP_DOMAIN     = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "qrfolio.app"
const QRFOLIO_HOSTS  = new Set(["qrfolio.app", "www.qrfolio.app", "localhost"])

export async function middleware(req: NextRequest) {
  const hostname = (req.headers.get("host") ?? "").replace(/:\d+$/, "")
  const pathname  = req.nextUrl.pathname

  // Exclure les routes système
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // ── Cas 1 : sous-domaine *.qrfolio.app ────────────────────────────────────
  const isSubdomain = hostname.endsWith(`.${APP_DOMAIN}`) && !QRFOLIO_HOSTS.has(hostname)

  if (isSubdomain) {
    const subdomain = hostname.replace(`.${APP_DOMAIN}`, "")
    if (!subdomain || subdomain === "www") return NextResponse.next()

    const url      = req.nextUrl.clone()
    url.pathname   = "/api/subdomain/resolve"
    url.searchParams.set("username", subdomain)
    url.searchParams.set("path",     pathname)
    return NextResponse.rewrite(url)
  }

  // ── Cas 2 : domaine racine QRfolio ────────────────────────────────────────
  if (QRFOLIO_HOSTS.has(hostname) || hostname.endsWith(".vercel.app")) {
    return NextResponse.next()
  }

  // ── Cas 3 : domaine custom ────────────────────────────────────────────────
  const url      = req.nextUrl.clone()
  url.pathname   = "/api/domains/resolve"
  url.searchParams.set("domain", hostname)
  url.searchParams.set("path",   pathname)
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)" ],
}
