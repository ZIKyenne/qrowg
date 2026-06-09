import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, name, page_title } = await req.json()
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 })

    const { data, error } = await resend.emails.send({
      from: "QRfolio <onboarding@resend.dev>",
      to: email,
      subject: "Ton premier scan QRfolio !",
      html: `<h1>Ton premier scan !</h1><p>Salut ${name || ""},</p><p>Quelqu'un vient de scanner ton QR code sur la page "${page_title}".</p><p><a href="https://qrfolio.app/dashboard/analytics">Voir mes analytics</a></p>`,
    })

    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true, id: data?.id })
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
