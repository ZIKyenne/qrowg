import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Anti-spam simple: max 3 messages par IP par heure
const ipCache = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipCache.get(ip)
  if (!entry || now > entry.reset) {
    ipCache.set(ip, { count: 1, reset: now + 3600_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Trop de messages envoy\u00e9s. Veuillez r\u00e9essayer plus tard." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { name, email, subject, message } = body

    // Validation serveur
    if (!name?.trim() || name.trim().length < 2) {
      return NextResponse.json({ error: "Nom invalide." }, { status: 400 })
    }
    if (!email?.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 })
    }
    if (!subject?.trim() || subject.trim().length < 3) {
      return NextResponse.json({ error: "Sujet trop court." }, { status: 400 })
    }
    if (!message?.trim() || message.trim().length < 10) {
      return NextResponse.json({ error: "Message trop court (min. 10 caract\u00e8res)." }, { status: 400 })
    }
    if (message.trim().length > 2000) {
      return NextResponse.json({ error: "Message trop long (max. 2000 caract\u00e8res)." }, { status: 400 })
    }

    // Honeypot anti-bot (champ caché)
    if (body.website) {
      return NextResponse.json({ success: true }) // Silently drop
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.from("contact_messages").insert({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      ip_hash: ip.slice(0, 8) + "****", // Anonymisation partielle
    })

    if (error) {
      // Table inexistante = on log et on renvoie success quand même
      console.error("Contact insert error:", error.message)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 })
  }
}
