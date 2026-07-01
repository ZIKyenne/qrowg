import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { EMAIL_FROM } from "@/lib/emailFrom"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Service email non configuré" }, { status: 503 })
    const resend = new Resend(apiKey)

    // Verifier secret pour cron job
    const { secret } = await req.json()
    if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

    const supabase = await createServerSupabaseClient()
    
    // Recuperer tous les users actifs
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, total_scans, total_pages")
      .gt("total_pages", 0)

    if (!profiles?.length) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const profile of profiles) {
      const html = `<h1>Rapport hebdo</h1><p>Salut ${profile.full_name || ""},</p><p>Tu as ${profile.total_scans} scans et ${profile.total_pages} pages.</p><p><a href="https://qrfolio.app/dashboard/analytics">Voir mes analytics</a></p>`
      
      await resend.emails.send({
        from: EMAIL_FROM,
        to: profile.email,
        subject: `Ton rapport QRfolio — ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
        html,
      })
      sent++
    }

    return NextResponse.json({ success: true, sent })
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
