// middleware.ts — Routing domaines custom + sous-domaines *.qrowg.com

import { NextRequest, NextResponse } from "next/server"
import { adresseReservee } from "@/lib/adressesReservees"

const APP_DOMAIN     = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "qrowg.com"
const QROWG_HOSTS  = new Set(["qrowg.com", "www.qrowg.com", "localhost"])

// Extension de fichier en fin de chemin (2 à 5 caractères alphanumériques).
export function estFichierStatique(pathname: string): boolean {
  return /\.[a-z0-9]{2,5}$/i.test(pathname)
}

// ── Le nonce de la page publiée (lot v164) ─────────────────────────────────
//
// Le lot v162 a posé `script-src 'self' 'unsafe-inline'`. `'unsafe-inline'` y
// reste parce que les quatre-vingt-dix pages PRÉ-RENDUES du produit portent
// leurs scripts en ligne, écrits une fois pour toutes : un nonce, qui change à
// chaque requête, ne peut pas figurer dans un HTML déjà écrit.
//
// La page qui rend le contenu d'un commerçant, elle, est rendue à la demande.
// Un nonce n'y coûte rien — et c'est la seule page où du contenu saisi par un
// tiers est affiché. C'est donc exactement là qu'il faut fermer la porte.
//
// Ce qui manquait n'était pas le nonce : c'était de savoir reconnaître cette
// page. Le lot v163 a posé la liste des adresses que le produit occupe ; une
// adresse d'un seul segment qui n'y figure pas est une page de commerçant.
export function estUnePagePubliee(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length !== 1) return false
  if (estFichierStatique(segments[0])) return false
  return !adresseReservee(segments[0])
}

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
    // Fichiers statiques seulement : une vraie extension en fin de chemin.
    // `includes(".")` laissait client.com/foo.bar servir le contenu de qrowg.com
    // sous l'hôte du client, sans passer par la résolution du domaine.
    estFichierStatique(pathname)
  ) {
    return NextResponse.next()
  }

  // ── Cas 1 : sous-domaine *.qrowg.com ────────────────────────────────────
  const isSubdomain = hostname.endsWith(`.${APP_DOMAIN}`) && !QROWG_HOSTS.has(hostname)

  if (isSubdomain) {
    const subdomain = hostname.replace(`.${APP_DOMAIN}`, "")
    if (!subdomain || subdomain === "www") return NextResponse.next()

    const url      = req.nextUrl.clone()
    url.pathname   = "/api/subdomain/resolve"
    url.searchParams.set("username", subdomain)
    url.searchParams.set("path",     pathname)
    return NextResponse.rewrite(url)
  }

  // ── Cas 2 : domaine racine QRowg ────────────────────────────────────────
  // www sert exactement le même site que l'apex : sans redirection permanente,
  // Google voit deux sites identiques et partage l'autorité entre les deux.
  if (hostname === `www.${APP_DOMAIN}`) {
    const url = req.nextUrl.clone()
    url.host = APP_DOMAIN
    url.protocol = "https:"
    url.port = ""
    return NextResponse.redirect(url, 308)
  }
  if (QROWG_HOSTS.has(hostname) || hostname.endsWith(".vercel.app")) {
    return suite(req, pathname)
  }

  // ── Cas 3 : domaine custom ────────────────────────────────────────────────
  const url      = req.nextUrl.clone()
  url.pathname   = "/api/domains/resolve"
  url.searchParams.set("domain", hostname)
  url.searchParams.set("path",   pathname)
  return NextResponse.rewrite(url)
}

/**
 * La réponse, avec son nonce quand la page en mérite un.
 *
 * Next lit la politique posée sur la REQUÊTE : il en tire le nonce et le pose
 * sur chacun de ses propres scripts. La politique posée sur la RÉPONSE est celle
 * que le navigateur applique. Les deux doivent porter le même nonce.
 *
 * `'strict-dynamic'` accompagne le nonce : un script porteur du nonce peut
 * charger les morceaux dont il a besoin, et `'unsafe-inline'` cesse d'être lu —
 * c'est ce qui referme la porte qu'il laissait ouverte.
 */
export function suite(req: NextRequest, pathname: string): NextResponse {
  if (!estUnePagePubliee(pathname)) return NextResponse.next()
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const politique = `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https:`
  const entetes = new Headers(req.headers)
  entetes.set("x-nonce", nonce)
  entetes.set("Content-Security-Policy", politique)
  const res = NextResponse.next({ request: { headers: entetes } })
  res.headers.set("Content-Security-Policy", politique)
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)" ],
}
