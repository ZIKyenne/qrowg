import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server"
import { accessibleOwnerIds } from "@/lib/team"
import { NextResponse } from "next/server"
import { serverError } from "@/lib/apiError"
import { refusDeFormule } from "@/app/dashboard/qr-codes/droitsDuStudio"
import { objetBorne } from "@/lib/bornes"

// Avant v409, la route écrivait en base ce qu'on lui envoyait, sans type ni taille :
// une « couleur » de plusieurs Mo, un coin inconnu, un style_config illimité. Un
// champ ABSENT reste permis (il ne touche pas la colonne) ; un champ PRÉSENT doit
// être ce que le QR Studio envoie.
const COULEUR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const COINS = new Set<unknown>(["square", "rounded", "dot"])
const CORRECTIONS = new Set<unknown>(["L", "M", "Q", "H"])
// Le logo voyage DANS style_config (data URI, 2 Mo de fichier au plus à l'écran,
// soit ~2,7 Mo encodé) : 3 Mo le contiennent, pas davantage.
const STYLE_MAX = 3_000_000

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Corps invalide" }, { status: 400 })
    const { qr_id, all, foreground_color, background_color, corner_style, error_correction, style_config } = body as Record<string, any>
    const present = (v: unknown) => v !== undefined
    if ((present(foreground_color) && !(typeof foreground_color === "string" && COULEUR.test(foreground_color)))
      || (present(background_color) && !(typeof background_color === "string" && COULEUR.test(background_color)))
      || (present(corner_style) && !COINS.has(corner_style))
      || (present(error_correction) && !CORRECTIONS.has(error_correction))
      || (present(qr_id) && typeof qr_id !== "string")) {
      return NextResponse.json({ error: "Style invalide." }, { status: 400 })
    }
    if (present(style_config) && !objetBorne(style_config, STYLE_MAX)) {
      return NextResponse.json({ error: "Style trop volumineux (logo de 2 Mo au plus)." }, { status: 413 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }

    // Un QR du compte OU de son équipe (v409) : le QR Studio montre au membre les QR
    // du propriétaire, mais la route n'écrivait que sur les siens — « Aucune ligne
    // modifiée » pour un éditeur qui restylait le QR qu'il voyait.
    const nouveau = { dotStyle: style_config?.dotStyle, cornerStyle: style_config?.cornerStyle, ecc: error_correction }
    let ancien: typeof nouveau | null = null
    let proprietaire = user.id
    if (all !== true && qr_id) {
      const proprietaires = await accessibleOwnerIds(supabase as any, user.id)
      const { data: avant } = await supabase.from("qr_codes").select("user_id, error_correction, style_config").eq("id", qr_id).in("user_id", proprietaires).maybeSingle()
      if (!avant) return NextResponse.json({ error: "QR introuvable" }, { status: 404 })
      proprietaire = avant.user_id
      ancien = { dotStyle: (avant.style_config as any)?.dotStyle, cornerStyle: (avant.style_config as any)?.cornerStyle, ecc: avant.error_correction }
    }
    // La formule décide, ici aussi : l'écran verrouille, mais un appel direct passait
    // outre. C'est celle du PROPRIÉTAIRE du QR (la RLS ne laisse lire que son profil :
    // service role pour le sien, sur un QR que la RLS vient de montrer).
    const lecteur = proprietaire === user.id ? supabase : createAdminClient()
    const { data: profil } = await lecteur.from("profiles").select("plan").eq("id", proprietaire).maybeSingle()
    const refus = refusDeFormule(profil?.plan, nouveau, ancien)
    if (refus) return NextResponse.json({ error: refus }, { status: 403 })

    const fields = {
      foreground_color,
      background_color,
      corner_style,
      error_correction,
      style_config,
      updated_at: new Date().toISOString(),
    }

    // Mode "appliquer a tous mes QR"
    if (all === true) {
      const { data, error } = await supabase
        .from("qr_codes")
        .update(fields)
        .eq("user_id", user.id)
        .select("id")
      if (error) {
        return serverError("qr-style", error)
      }
      return NextResponse.json({ ok: true, count: data?.length ?? 0 })
    }

    // Mode "un seul QR"
    if (!qr_id) {
      return NextResponse.json({ error: "qr_id manquant" }, { status: 400 })
    }
    const { data, error } = await supabase
      .from("qr_codes")
      .update(fields)
      .eq("id", qr_id)
      .eq("user_id", proprietaire)
      .select()

    if (error) {
      return serverError("qr-style", error)
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Aucune ligne modifiée (QR introuvable ou non autorisé)" },
        { status: 404 },
      )
    }

    return NextResponse.json({ ok: true, qr: data[0] })
  } catch (e: any) {
    return serverError("qr-style", e)
  }
}
