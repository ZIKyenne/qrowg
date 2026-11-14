// app/api/reports/subscribe/route.ts
// Abonnement / désabonnement aux rapports automatiques

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { serverError } from "@/lib/apiError"
import { canDynStats, minPlanFor, PLANS } from "@/lib/plans"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const body = await req.json()
    const { frequency, enabled } = body as {
      frequency: "weekly" | "monthly"
      enabled: boolean
    }

    if (!["weekly", "monthly"].includes(frequency)) {
      return NextResponse.json({ error: "Fréquence invalide" }, { status: 400 })
    }

    // L'adresse est TOUJOURS celle du compte. Avant, `email` était accepté tel
    // quel dans le corps : un rapport hebdomadaire signé QRowg pouvait être
    // adressé à n'importe qui.
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, plan")
      .eq("id", user.id)
      .single()
    const targetEmail = profile?.email

    // Audit du 14 novembre 2026 (E) : seul l'écran vérifiait le plan. Un appel
    // direct abonnait n'importe quel compte. Se DÉSABONNER reste toujours permis.
    if (enabled && !canDynStats((profile as any)?.plan)) {
      return NextResponse.json({ error: `Les rapports automatiques sont inclus dès le plan ${PLANS[minPlanFor("dynStatsDetaillees")].label}.` }, { status: 403 })
    }

    if (!targetEmail) {
      return NextResponse.json({ error: "Email introuvable" }, { status: 400 })
    }

    // Upsert l'abonnement
    const { data, error } = await supabase
      .from("report_subscriptions")
      .upsert({
        user_id:   user.id,
        email:     targetEmail,
        frequency,
        enabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,frequency" })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, subscription: data })
  } catch (err: any) {
    console.error("[reports/subscribe]", err)
    return serverError("reports/subscribe", err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { data } = await supabase
      .from("report_subscriptions")
      .select("id, frequency, enabled, email, last_sent_at, created_at")
      .eq("user_id", user.id)

    return NextResponse.json({ subscriptions: data ?? [] })
  } catch (err: any) {
    return serverError("reports/subscribe", err)
  }
}
