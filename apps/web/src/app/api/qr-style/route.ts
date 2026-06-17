import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { qr_id, foreground_color, background_color, corner_style, error_correction, style_config } = body

    if (!qr_id) {
      return NextResponse.json({ error: "qr_id manquant" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("qr_codes")
      .update({
        foreground_color,
        background_color,
        corner_style,
        error_correction,
        style_config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", qr_id)
      .eq("user_id", user.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Aucune ligne modifiee (QR introuvable ou non autorise)" },
        { status: 404 },
      )
    }

    return NextResponse.json({ ok: true, qr: data[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 })
  }
}
