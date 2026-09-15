// app/api/qr-stats/[id]/route.ts
// Stats performance d'un QR code : totaux, évolution, top device/pays, sparkline

import { SCANS_MESURES, phraseScansPartiels } from "@/lib/perimetreDeMesure"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { APPAREIL_ROBOT } from "@/lib/robots"
import { evolution as evolutionDe } from "@/lib/chiffresLisibles"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { id } = await params
  const period  = req.nextUrl.searchParams.get("period") ?? "7"  // "7" | "30"
  const days    = period === "30" ? 30 : 7

  // Vérifier ownership
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, total_scans, last_scan_at, created_at")
    .eq("id", id)
    .single()

  // QR introuvable (ou pas encore en base / sans stats) : on renvoie un état vide
  // en 200 plutôt qu'un 404 -> pas d'erreur rouge en console, le client affiche 0.
  if (!qr) return NextResponse.json({
    total: 0, current: 0, prev: 0, evolution: "—", evolutionSens: "stable", last_scan: null,
    top_device: null, top_country: null, sparkline: [], period: days, created_at: null, empty: true,
  })

  const now      = new Date()
  const fromDate = new Date(now); fromDate.setDate(fromDate.getDate() - days)
  const prevFrom = new Date(fromDate); prevFrom.setDate(prevFrom.getDate() - days)

  // Scans période courante
  const { count: scansCurrent } = await supabase
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("qr_code_id", id)
    .gte("scanned_at", fromDate.toISOString()).neq("device", APPAREIL_ROBOT)

  // Scans période précédente (pour évolution)
  const { count: scansPrev } = await supabase
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("qr_code_id", id)
    .gte("scanned_at", prevFrom.toISOString())
    .lt("scanned_at", fromDate.toISOString()).neq("device", APPAREIL_ROBOT)

  // Top device — compté DANS LA BASE, une fois par valeur de l'énumération
  // `scan_device`. Il n'y en a que quatre : quatre comptages exacts coûtent
  // moins qu'un rapatriement de toutes les lignes, et surtout ils ne peuvent
  // pas être tronqués en silence (lot v128).
  const APPAREILS = ["mobile", "tablet", "desktop", "unknown"] as const
  const parAppareil = await Promise.all(APPAREILS.map(async d => {
    const { count } = await supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("qr_code_id", id).eq("device", d)
      .gte("scanned_at", fromDate.toISOString())
    return [d, count ?? 0] as const
  }))
  const meilleur = parAppareil.filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0]
  const topDevice = meilleur ? meilleur[0] : null

  // Top pays
  // Un pays ne se compte pas dans la base sans regroupement SQL : on lit donc
  // des lignes — mais avec un plafond ÉCRIT, et on dit quand on l'atteint.
  const { data: countryRows } = await supabase
    .from("scans")
    .select("country")
    .eq("qr_code_id", id)
    .gte("scanned_at", fromDate.toISOString())
    .not("country", "is", null).neq("device", APPAREIL_ROBOT)
    .order("scanned_at", { ascending: false })
    .limit(SCANS_MESURES)

  const countryMap: Record<string, number> = {}
  for (const r of countryRows ?? []) {
    const c = r.country ?? "—"
    countryMap[c] = (countryMap[c] ?? 0) + 1
  }
  const topCountry = Object.entries(countryMap).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null

  // Sparkline : scans par jour
  const { data: scanRows } = await supabase
    .from("scans")
    .select("scanned_at")
    .eq("qr_code_id", id)
    .gte("scanned_at", fromDate.toISOString()).neq("device", APPAREIL_ROBOT)
    .order("scanned_at", { ascending: false })
    .limit(SCANS_MESURES)

  // Construire tableau jours
  const sparkline: number[] = []
  for (let i = 0; i < days; i++) {
    const day = new Date(fromDate); day.setDate(day.getDate() + i)
    const next = new Date(day); next.setDate(next.getDate() + 1)
    const count = (scanRows ?? []).filter(r => {
      const d = new Date(r.scanned_at)
      return d >= day && d < next
    }).length
    sparkline.push(count)
  }

  // 2000 → 7 scans s'arrondissait en « -100 % » : tout perdu, alors qu'il en
  // restait. Et sans période précédente, « +100 % » était une invention : c'est
  // « nouveau » (lot v102).
  const evol = evolutionDe(scansCurrent ?? 0, scansPrev ?? 0)

  // Ce que la mesure n'a pas lu, dit — plutôt que deviné par le lecteur.
  const lus = Math.max(countryRows?.length ?? 0, scanRows?.length ?? 0)
  const partiel = phraseScansPartiels(lus)

  return NextResponse.json({
    total:       qr.total_scans ?? 0,
    current:     scansCurrent ?? 0,
    prev:        scansPrev ?? 0,
    evolution: evol.texte,
    evolutionSens: evol.sens,
    last_scan:   qr.last_scan_at,
    mesure_partielle: partiel,
    top_device:  topDevice,
    top_country: topCountry,
    sparkline,
    period:      days,
    created_at:  qr.created_at,
  })
}
