import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { EMAIL_FROM } from "@/lib/emailFrom"
import { escapeHtml as esc } from "@/lib/escapeHtml"

const TYPE_LABELS: Record<string, string> = {
  quote: "Demande de devis", reservation: "Réservation", booking: "Réservation événement",
  register: "Inscription événement", rsvp: "Réponse RSVP", form: "Nouveau message",
}

export async function POST(req: NextRequest) {
  try {
    const { pageId, type, name, email, phone, message, data } = await req.json()
    if (!pageId) return NextResponse.json({ error: "pageId requis" }, { status: 400 })

    const admin = createAdminClient()

    // Propriétaire de la page + préférences
    const { data: page } = await admin
      .from("pages")
      .select("title, user_id")
      .eq("id", pageId)
      .single()
    if (!page) return NextResponse.json({ error: "Page introuvable" }, { status: 404 })

    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name, preferences")
      .eq("id", page.user_id)
      .single()

    const to = profile?.email
    if (!to) return NextResponse.json({ error: "Pas d'email destinataire" }, { status: 200 })
    // Respecte l'opt-out si défini
    if (profile?.preferences?.email_leads === false) return NextResponse.json({ success: true, skipped: true })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Service email non configuré" }, { status: 503 })
    const resend = new Resend(apiKey)

    const label = TYPE_LABELS[type] || "Nouveau message"
    const rows: string[] = []
    if (name) rows.push(`<tr><td style="color:#8A8478;padding:4px 0">Nom</td><td style="color:#F5F0E8;text-align:right;font-weight:600">${esc(name)}</td></tr>`)
    if (email) rows.push(`<tr><td style="color:#8A8478;padding:4px 0">Email</td><td style="text-align:right"><a href="mailto:${esc(email)}" style="color:#C9A84C;font-weight:600">${esc(email)}</a></td></tr>`)
    if (phone) rows.push(`<tr><td style="color:#8A8478;padding:4px 0">Téléphone</td><td style="text-align:right"><a href="tel:${esc(phone)}" style="color:#C9A84C;font-weight:600">${esc(phone)}</a></td></tr>`)
    Object.entries(data || {}).forEach(([k, v]) => {
      if (["nom", "email", "telephone"].includes(k.toLowerCase())) return
      rows.push(`<tr><td style="color:#8A8478;padding:4px 0">${esc(k)}</td><td style="color:#F5F0E8;text-align:right;font-weight:500">${esc(String(v))}</td></tr>`)
    })

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#080808;font-family:'DM Sans',Arial,sans-serif;color:#F5F0E8">
<div style="max-width:560px;margin:0 auto;background:#080808">
  <div style="padding:28px 40px 20px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.15)">
    <span style="font-size:24px;font-weight:700;color:#C9A84C;font-family:Georgia,serif">QRowg</span>
  </div>
  <div style="padding:28px 40px">
    <div style="display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:5px 14px;color:#C9A84C;font-size:12px;font-weight:700;margin-bottom:14px">${esc(label)}</div>
    <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#F5F0E8;margin:0 0 6px">Nouveau message reçu</h1>
    <p style="font-size:14px;color:#8A8478;margin:0 0 20px">Depuis votre page « ${esc(page.title)} »</p>
    ${message ? `<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:14px 16px;margin-bottom:16px"><p style="font-size:14px;color:#F5F0E8;margin:0;line-height:1.6;white-space:pre-wrap">${esc(message)}</p></div>` : ""}
    <table style="width:100%;border-collapse:collapse;font-size:13px">${rows.join("")}</table>
    <p style="text-align:center;margin:26px 0 0">
      <a href="https://qrowg.com/dashboard/leads" style="display:inline-block;background:linear-gradient(90deg,#C9A84C,#b8953f);color:#080808;text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:12px">Voir dans mes messages →</a>
    </p>
  </div>
  <div style="padding:18px 40px 30px;text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
    <p style="font-size:12px;color:#4A4640;margin:0">QRowg · <a href="https://qrowg.com/dashboard/settings" style="color:#4A4640">Gérer les notifications</a></p>
  </div>
</div></body></html>`

    const { data: sent, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: email || undefined,
      subject: `${label} — ${name || "nouveau contact"}`,
      html,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true, id: sent?.id })
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
