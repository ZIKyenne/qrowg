import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"
import { EMAIL_FROM } from "@/lib/emailFrom"
import { escapeHtml } from "@/lib/escapeHtml"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Service email non configuré" }, { status: 503 })
    const resend = new Resend(apiKey)

    const { email, name, page_title } = await req.json()
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 })

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Ton premier scan QRowg !",
      html: `<h1>Ton premier scan !</h1><p>Salut ${escapeHtml(name)},</p><p>Quelqu'un vient de scanner ton QR code sur la page "${escapeHtml(page_title)}".</p><p><a href="https://qrfolio.app/dashboard/analytics">Voir mes analytics</a></p>`,
    })

    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true, id: data?.id })
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
