import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

const TYPE_INTRO: Record<string, string> = {
  quote: "Votre demande de devis a bien été reçue.",
  reservation: "Votre demande de réservation a bien été reçue.",
  booking: "Votre demande de réservation a bien été reçue.",
  register: "Votre inscription a bien été enregistrée.",
  rsvp: "Votre réponse a bien été enregistrée.",
  form: "Votre message a bien été reçu.",
}

function esc(s: string) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || "")
}

export async function POST(req: NextRequest) {
  try {
    const { pageId, email, name, type } = await req.json()
    if (!pageId || !isEmail(email)) return NextResponse.json({ error: "Paramètres invalides" }, { status: 200 })

    const admin = createAdminClient()
    const { data: page } = await admin.from("pages").select("title, user_id").eq("id", pageId).single()
    if (!page) return NextResponse.json({ error: "Page introuvable" }, { status: 404 })

    const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", page.user_id).single()
    const replyTo = profile?.email
    const sender = page.title || profile?.full_name || "QRfolio"

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Service email non configuré" }, { status: 503 })
    const resend = new Resend(apiKey)

    const intro = TYPE_INTRO[type] || TYPE_INTRO.form

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#080808;font-family:'DM Sans',Arial,sans-serif;color:#F5F0E8">
<div style="max-width:560px;margin:0 auto;background:#080808">
  <div style="padding:28px 40px 20px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.15)">
    <span style="font-size:24px;font-weight:700;color:#C9A84C;font-family:Georgia,serif">${esc(sender)}</span>
  </div>
  <div style="padding:30px 40px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:rgba(57,255,143,0.12);border:1px solid rgba(57,255,143,0.35);font-size:28px">✅</div>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:23px;font-weight:700;color:#F5F0E8;margin:0 0 10px;text-align:center">Merci${name ? `, ${esc(name)}` : ""} !</h1>
    <p style="font-size:15px;line-height:1.7;color:#8A8478;margin:0 0 16px;text-align:center">${intro}<br>Nous revenons vers vous dans les plus brefs délais.</p>
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent);margin:24px 0"></div>
    <p style="font-size:13px;color:#8A8478;margin:0;text-align:center">Cet e-mail confirme la bonne réception de votre demande auprès de <strong style="color:#F5F0E8">${esc(sender)}</strong>.${replyTo ? " Vous pouvez répondre directement à cet e-mail." : ""}</p>
  </div>
  <div style="padding:18px 40px 30px;text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
    <p style="font-size:12px;color:#4A4640;margin:0">Propulsé par <a href="https://qrfolio.app" style="color:#4A4640">QRfolio</a></p>
  </div>
</div></body></html>`

    const { data: sent, error } = await resend.emails.send({
      from: "QRfolio <onboarding@resend.dev>",
      to: email,
      replyTo: replyTo || undefined,
      subject: `Nous avons bien reçu votre demande — ${sender}`,
      html,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true, id: sent?.id })
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
