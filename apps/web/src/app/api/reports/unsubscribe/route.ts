// app/api/reports/unsubscribe/route.ts
// Désabonnement one-click depuis le lien email

import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { jetonValide } from "@/lib/secretQuiSeCompare"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user")
  const freq   = req.nextUrl.searchParams.get("freq")
  const token  = req.nextUrl.searchParams.get("token")

  if (!userId || !freq || !token) {
    return new NextResponse("Lien invalide", { status: 400 })
  }

  try {
    const supabase = createAdminClient()

    // Vérifier que le token correspond bien à l'ID de l'abonnement
    const { data: sub } = await supabase
      .from("report_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("frequency", freq)
      .single()

    if (!sub) {
      return new NextResponse("Abonnement introuvable", { status: 404 })
    }

    // Le jeton était `base64url(sub.id)` — l'identifiant de la ligne, écrit
    // autrement — comparé avec `!==`, qui s'arrête au premier octet différent.
    // Il voyage pourtant dans une boîte de réception : partagée, transférée,
    // ouverte par un filtre. `jetonValide` accepte le signé ET l'historique, en
    // temps constant : les liens déjà partis continuent de fonctionner, et un
    // lien de désabonnement qui cesse de marcher est une promesse rompue (v131).
    if (!jetonValide(token, sub.id)) {
      return new NextResponse("Token invalide", { status: 401 })
    }

    await supabase
      .from("report_subscriptions")
      .update({ enabled: false })
      .eq("id", sub.id)

    // Rediriger vers une page de confirmation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrowg.com"
    return NextResponse.redirect(`${appUrl}/unsubscribed?type=report`)
  } catch (err: any) {
    return new NextResponse("Erreur serveur", { status: 500 })
  }
}
