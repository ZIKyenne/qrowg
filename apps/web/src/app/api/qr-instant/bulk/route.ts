// /api/qr-instant/bulk — création EN MASSE de QR modifiables (plan Business).
// Reçoit des lignes {label, dest} (déjà parsées côté client via lib/bulkCsv), re-valide,
// crée des QR modifiables (Business = quota illimité). Propriétaire uniquement.

import { NextRequest, NextResponse } from "next/server"
import { serverError } from "@/lib/apiError"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { canDynMasse, dynLimit, getPlan, minPlanFor, PLANS } from "@/lib/plans"
import { countDynamicQrs } from "@/lib/quota"
import { normalizeBulkUrl } from "@/lib/bulkCsv"
import { uniqueShortCode } from "@/lib/shortCode"
import { champBorne } from "@/lib/limitesDeSaisie"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrowg.com"
const MAX_BULK = 100 // borne par requête (anti-abus)
const OUT_COLS = "id, kind, label, payload, inputs, style, created_at, dynamic, short_code, dest_url, status, expires_at, total_scans, last_scan_at, paused_reason"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  // Gating : création en masse réservée au plan Business.
  const { data: prof } = await supabase.from("profiles").select("plan").eq("id", user.id).single()
  if (!canDynMasse(prof?.plan)) {
    return NextResponse.json({ error: `La création en masse est incluse dans la formule ${getPlan(minPlanFor("dynEnMasse")).label}.`, upgrade: true }, { status: 403 })
  }

  const body = await req.json().catch(() => ({} as any))
  const input = Array.isArray(body?.items) ? body.items : []
  if (input.length === 0) return NextResponse.json({ error: "Aucune ligne à importer." }, { status: 400 })

  const truncated = Math.max(0, input.length - MAX_BULK)
  const seen = new Set<string>()
  const toInsert: any[] = []
  let skipped = 0
  for (const r of input.slice(0, MAX_BULK)) {
    const dest = normalizeBulkUrl(String(r?.dest || ""))
    if (!dest) { skipped++; continue }
    const label = champBorne(r?.label, "nomDeQr")
    let code: string
    try { code = await uniqueShortCode(supabase, seen) } catch { skipped++; continue }
    // Business = quota illimité ; aucun QR ne porte d'expiration à la création.
    toInsert.push({
      user_id: user.id, kind: "link", label, payload: `${APP_URL}/q/${code}`, inputs: {}, style: {},
      dynamic: true, short_code: code, dest_url: dest, status: "active", expires_at: null,
    })
  }

  if (toInsert.length === 0) return NextResponse.json({ error: "Aucun lien valide à créer.", skipped }, { status: 400 })

  // Le sous-quota des QR modifiables vaut aussi en masse. Aujourd'hui seul un plan
  // illimité a l'import ; le jour où un plan borné l'aurait, l'import ne passerait
  // pas au-delà sans qu'on le voie (v408).
  const lim = dynLimit(prof?.plan)
  if (lim !== null && (await countDynamicQrs(supabase, user.id)) + toInsert.length > lim) {
    return NextResponse.json({ error: `Limite de ${lim} QR modifiables : cet import la dépasserait.`, upgrade: true }, { status: 403 })
  }

  const { data, error } = await supabase.from("instant_qrs").insert(toInsert).select(OUT_COLS)
  if (error) return serverError("qr-instant/bulk", error)

  // OUT_COLS n'inclut pas password_hash -> rien de sensible à masquer ; on ajoute has_password=false.
  const items = (data || []).map((row: any) => ({ ...row, has_password: false }))
  return NextResponse.json({ ok: true, created: items.length, skipped, truncated, items })
}
