// middleware.ts — Routing des domaines personnalisés
// Intercepte les requêtes sur des domaines custom et les redirige vers la page QRfolio associée

import { NextRequest, NextResponse } from "next/server"

// Domaines propres à QRfolio (à NE PAS intercepter)
const QRFOLIO_DOMAINS = [
  "qrfolio.app",
  "www.qrfolio.app",
  "localhost",
]

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") ?? ""
  const pathname = req.nextUrl.pathname

  // Ne pas intercepter les domaines QRfolio natifs
  const isQrfolioHost = QRFOLIO_DOMAINS.some(d => hostname === d || hostname.endsWith(".vercel.app"))
  if (isQrfolioHost) return NextResponse.next()

  // Ne pas intercepter les routes API, _next, assets
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

  // Nettoyer le hostname (retirer www. et le port)
  const domain = hostname.replace(/^www\./, "").replace(/:\d+$/, "")

  // Chercher la page associée à ce domaine via Supabase
  // On passe le domaine en header pour que la page [slug] puisse le résoudre
  const url = req.nextUrl.clone()

  // Réécrire vers la route de résolution domaine custom
  url.pathname = `/api/domains/resolve`
  url.searchParams.set("domain", domain)
  url.searchParams.set("path", pathname)

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)",
  ],
}
