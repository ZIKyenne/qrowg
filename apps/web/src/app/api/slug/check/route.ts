import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { rateLimit } from "@/lib/rateLimit"
// Lot v163 : la liste vivait ici ET dans `api/templates/use`, mot pour mot, et
// il y manquait huit routes réelles. Une seule liste, tenue par le dossier
// `app/` lui-même (voir `lib/adressesReservees`).
import { adresseReservee } from "@/lib/adressesReservees"

export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") || "").trim().toLowerCase()

  if (!slug) {
    return NextResponse.json({ status: "invalid", reason: "Adresse vide." })
  }
  if (!/^[a-z0-9_-]{2,60}$/.test(slug)) {
    return NextResponse.json({ status: "invalid", reason: "2-60 caracteres, lettres minuscules, chiffres et tirets." })
  }
  if (adresseReservee(slug)) {
    return NextResponse.json({ status: "reserved", reason: "Cette adresse est réservée." })
  }

  // Rate-limit par IP (audit sécurité 2026-08 : endpoint public service_role → limiter l'énumération en masse).
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon"
  if (!(await rateLimit("slug-check:" + ip, 60, 60_000))) {
    return NextResponse.json({ status: "error", reason: "Trop de requêtes, reessayez dans un instant." }, { status: 429 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data, error } = await supabase.from("pages").select("id").eq("slug", slug).maybeSingle()

  if (error) {
    return NextResponse.json({ status: "error", reason: "Vérification impossible." }, { status: 500 })
  }

  if (data) {
    const suggestions = [
      `${slug}-1`,
      `${slug}-${Math.random().toString(36).slice(2, 5)}`,
      `${slug}-2026`,
    ]
    return NextResponse.json({ status: "taken", suggestions })
  }

  return NextResponse.json({ status: "available" })
}