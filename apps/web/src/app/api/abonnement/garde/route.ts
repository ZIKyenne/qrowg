// /api/abonnement/garde — ce que l'abonné garde actif s'il repasse au gratuit (D3).
//
// GET : les QR qui peuvent être gardés, et le choix déjà fait.
// PUT : enregistre le choix { liens: id[], pages: id[] }, borné à ce que le
//       plan gratuit couvre. Le webhook Stripe le lit à la bascule.
// Sécurité : client de session + RLS, et `user_id` filtré explicitement.
import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { choixNettoye, colonneGardeAbsente, placesAuRetour } from "@/lib/gardeAuRetour"
import { serverError } from "@/lib/apiError"

const INDISPONIBLE = { disponible: false, liens: [], pages: [], places: placesAuRetour() }

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const [liens, pages] = await Promise.all([
    (supabase.from("instant_qrs") as any)
      .select("id, label, dest_url, status, expires_at, keep_on_downgrade")
      .eq("user_id", user.id).eq("dynamic", true).order("created_at", { ascending: true }),
    (supabase.from("qr_codes") as any)
      .select("id, label, status, keep_on_downgrade, pages(title)")
      .eq("user_id", user.id).order("created_at", { ascending: true }),
  ])
  if (colonneGardeAbsente(liens.error) || colonneGardeAbsente(pages.error)) return NextResponse.json(INDISPONIBLE)
  if (liens.error) return serverError("abonnement-garde", liens.error)
  if (pages.error) return serverError("abonnement-garde", pages.error)

  // Seul ce qui tourne aujourd'hui peut être gardé : un QR actif et permanent
  // (un essai expire de lui-même, une pause choisie reste une pause).
  return NextResponse.json({
    disponible: true,
    places: placesAuRetour(),
    liens: (liens.data ?? [])
      .filter((l: any) => l.status === "active" && !l.expires_at)
      .map((l: any) => ({ id: l.id, nom: l.label || null, detail: l.dest_url || null, garde: !!l.keep_on_downgrade })),
    pages: (pages.data ?? [])
      .filter((q: any) => q.status === "active" || q.status == null)
      .map((q: any) => ({ id: q.id, nom: q.pages?.title || q.label || null, detail: q.label && q.pages?.title ? q.label : null, garde: !!q.keep_on_downgrade })),
  })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json().catch(() => ({} as any))
  const places = placesAuRetour()
  const choix = { instant_qrs: choixNettoye(body?.liens, places.liens), qr_codes: choixNettoye(body?.pages, places.pages) }

  for (const table of ["instant_qrs", "qr_codes"] as const) {
    // 1) On efface l'ancien choix, 2) on pose le nouveau, sur les seules lignes du compte.
    const efface = await (supabase.from(table) as any)
      .update({ keep_on_downgrade: false }).eq("user_id", user.id).eq("keep_on_downgrade", true)
    if (colonneGardeAbsente(efface.error)) {
      return NextResponse.json({ error: "Ce réglage n'est pas encore disponible. Réessayez un peu plus tard." }, { status: 503 })
    }
    if (efface.error) return serverError("abonnement-garde", efface.error)
    const ids = choix[table]
    if (!ids.length) continue
    // `.select("id")` : une écriture refusée par la RLS ne lève pas d'erreur,
    // elle ne touche aucune ligne. On vérifie donc ce qui a vraiment été écrit.
    const pose = await (supabase.from(table) as any)
      .update({ keep_on_downgrade: true }).eq("user_id", user.id).in("id", ids).select("id")
    if (pose.error) return serverError("abonnement-garde", pose.error)
    if ((pose.data ?? []).length !== ids.length) return NextResponse.json({ error: "QR introuvable" }, { status: 404 })
  }
  return NextResponse.json({ ok: true, liens: choix.instant_qrs, pages: choix.qr_codes })
}
