// app/api/domains/resolve/route.ts v2
// Résolution hiérarchique: exact > sous-domaine > wildcard > domaine racine

import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { escapeHtml } from "@/lib/escapeHtml"
import { candidats, proprietaire } from "@/lib/proprietaireDomaine"
import { entetesDeRedirection } from "@/lib/enteteDeRedirection"
import { routePourHote } from "@/lib/routesDeDomaine"

export async function GET(req: NextRequest) {
  const rawDomain = req.nextUrl.searchParams.get("domain")
  if (!rawDomain) return NextResponse.json({ error: "domain requis" }, { status: 400 })

  const domain = rawDomain.replace(/^www\./, "").toLowerCase()

  try {
    const supabase = createAdminClient()
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrowg.com"

    // ── Étape -2 : à qui appartient ce domaine ? ─────────────────────────────
    // Tout ce qui suit (redirections, routes, page) est filtré par ce
    // propriétaire VÉRIFIÉ. Sans propriétaire, rien n'est résolu : un domaine
    // inconnu n'est ni redirigé ni servi (plus de redirection ouverte).
    const { data: verifs } = await supabase
      .from("domain_verifications")
      .select("user_id, domain, verified")
      .in("domain", candidats(domain))
      .eq("verified", true)
    const owner = proprietaire(domain, verifs ?? [])
    if (!owner) {
      return new NextResponse(notFoundHtml(domain, appUrl), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } })
    }

    // ── Étape -1: domaine secondaire → redirection vers principal ──────────────
    // Si ce domaine n'est pas principal et qu'un principal existe, rediriger
    const { data: domainVerif } = await supabase
      .from("domain_verifications")
      .select("is_primary, user_id")
      .eq("domain", domain)
      .eq("verified", true)
      .maybeSingle()

    if (domainVerif && !domainVerif.is_primary) {
      // Chercher le domaine principal de cet user
      const { data: primaryDomain } = await supabase
        .from("domain_verifications")
        .select("domain")
        .eq("user_id", domainVerif.user_id)
        .eq("is_primary", true)
        .maybeSingle()

      if (primaryDomain) {
        const rawPath = req.nextUrl.searchParams.get("path") ?? "/"
        // Forcer un chemin (leading "/") : sinon `path=@evil.com` construirait
        // `https://primary.com@evil.com` (host = evil.com) = open-redirect.
        const path = rawPath.startsWith("/") ? rawPath : "/" + rawPath
        const dest = `https://${primaryDomain.domain}${path !== "/" ? path : ""}`
        // Sans en-tête, ce 301 reste dans le navigateur du visiteur : changer
        // de domaine principal ne changeait rien pour lui (lot v95).
        return NextResponse.redirect(dest, { status: 301, headers: entetesDeRedirection() })
      }
    }

    // ── Étape 0: vérifier les redirections ──────────────────────────────────────
    const rawPath = req.nextUrl.searchParams.get("path") ?? "/"
    const path = rawPath.startsWith("/") ? rawPath : "/" + rawPath

    // Chercher une redirection exacte (domaine + chemin)
    const { data: redirect } = await supabase
      .from("domain_redirects")
      .select("to_url, redirect_type, id")
      .eq("user_id", owner.user_id)
      .eq("from_domain", domain)
      .eq("from_path", path)
      .eq("enabled", true)
      .maybeSingle()

    if (redirect) {
      // Incrémenter hit_count de façon ATOMIQUE (fire-and-forget) via la fonction
      // SQL dédiée : `hit_count = hit_count + 1` côté Postgres, sans perte sous
      // trafic concurrent (le read-then-write applicatif perdait des incréments).
      supabase
        .rpc("increment_redirect_hit", { p_id: redirect.id })
        .then(() => {}, () => {})

      const dest = redirect.to_url.startsWith("http")
        ? redirect.to_url
        : new URL(redirect.to_url.startsWith("/") ? redirect.to_url : "/" + redirect.to_url, appUrl).toString()

      return NextResponse.redirect(dest, { status: redirect.redirect_type, headers: entetesDeRedirection() })
    }

    // Redirection wildcard (domaine seul, chemin "/" par défaut)
    if (path !== "/") {
      const { data: wildcardRedir } = await supabase
        .from("domain_redirects")
        .select("to_url, redirect_type")
        .eq("user_id", owner.user_id)
        .eq("from_domain", domain)
        .eq("from_path", "/")
        .eq("enabled", true)
        .maybeSingle()

      if (wildcardRedir) {
        const dest = wildcardRedir.to_url.startsWith("http")
          ? wildcardRedir.to_url
          : new URL(wildcardRedir.to_url, appUrl).toString()
        return NextResponse.redirect(dest, { status: wildcardRedir.redirect_type, headers: entetesDeRedirection() })
      }
    }

    // ── Étape 1: domain_routes (une page par sous-domaine) ───────────────────
    // Les routes des racines candidates de CE propriétaire ; laquelle sert cet
    // hôte : `lib/routesDeDomaine` (v412 — racine « deux étiquettes » et www
    // retiré avant la recherche ne servaient ni les .co.uk ni la route www).
    const { data: routes } = await supabase
      .from("domain_routes")
      .select("root_domain, subdomain, page_id, priority, pages(slug)")
      .eq("user_id", owner.user_id)
      .in("root_domain", candidats(domain))
      .eq("enabled", true)
      .order("priority", { ascending: false })

    const route = routePourHote(rawDomain, routes ?? [])
    if (route) {
      return NextResponse.redirect(new URL(`/${(route.pages as any).slug}`, appUrl), { headers: entetesDeRedirection() })
    }

    // ── Étape 2: fallback domain_verifications (ancien système, 1 domaine = 1 page) ──
    const { data: verif } = await supabase
      .from("domain_verifications")
      .select("page_id, pages(slug)")
      .eq("user_id", owner.user_id)
      .eq("domain", domain)
      .eq("verified", true)
      .maybeSingle()

    if (verif?.pages) {
      const page = verif.pages as any
      return NextResponse.redirect(new URL(`/${page.slug}`, appUrl), { headers: entetesDeRedirection() })
    }

    // ── 404 ────────────────────────────────────────────────────────────────────
    return new NextResponse(notFoundHtml(domain, appUrl), {
      status: 404,
      headers: { "Content-Type": "text/html;charset=utf-8" },
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

function notFoundHtml(domain: string, appUrl: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Page introuvable — ${escapeHtml(domain)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="background:#080808;color:#F5F0E8;font-family:DM Sans,Arial,sans-serif;
  display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center">
<div>
  <div style="font-size:48px;margin-bottom:16px">🔍</div>
  <h1 style="color:#C9A84C;font-size:28px;margin:0 0 8px;font-weight:300">Domaine non configuré</h1>
  <p style="color:#8A8478;margin:0 0 24px;font-size:14px">${escapeHtml(domain)} n'est associé à aucune page QRowg</p>
  <a href="${appUrl}" style="display:inline-block;background:linear-gradient(90deg,#C9A84C,#b8953f);
    color:#080808;text-decoration:none;padding:11px 24px;border-radius:10px;font-weight:700;font-size:14px">
    Créer ma page sur QRowg
  </a>
</div>
</body></html>`
}
