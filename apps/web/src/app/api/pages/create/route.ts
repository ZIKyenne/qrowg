import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { pageLimit } from "@/lib/plans"
import { slugifyUnique } from "@/lib/slug"

// Cree une page VIERGE (brouillon) et renvoie son id. Utilise par le builder
// quand l'URL est /dashboard/builder/new (aucune page en base a ce stade).
// Respecte la contrainte slug_format : ^[a-z0-9_-]{2,60}$

const DEFAULT_THEME = {
  name: "midnight_gold",
  background: "#080808",
  primary: "#C9A84C",
  secondary: "#39FF8F",
  text: "#F5F0E8",
  font_display: "Cormorant Garamond",
  font_body: "DM Sans",
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )

    // Garde-fou plan : limite de pages
    const { data: prof } = await supabaseAdmin.from("profiles").select("plan").eq("id", user.id).single()
    const limit = pageLimit(prof?.plan as string)
    if (limit !== null) {
      const { count } = await supabaseAdmin.from("pages").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      if ((count ?? 0) >= limit) {
        return NextResponse.json({ error: "limit", limit, message: `Votre plan permet ${limit} page${limit > 1 ? "s" : ""}. Passez a un plan superieur pour en creer plus.` }, { status: 403 })
      }
    }

    const body = await req.json().catch(() => ({}))
    const title = (body?.title && typeof body.title === "string" && body.title.trim()) ? body.title.trim().slice(0, 80) : "Ma page"

    // Slug unique : quelques tentatives en cas de collision (23505).
    let newPage: any = null
    let pageError: any = null
    for (let attempt = 0; attempt < 5 && !newPage; attempt++) {
      const cleanSlug = slugifyUnique(title)
      const res = await supabaseAdmin
        .from("pages")
        .insert({ user_id: user.id, title, slug: cleanSlug, status: "draft", theme: DEFAULT_THEME })
        .select()
        .single()
      if (res.data) { newPage = res.data; break }
      pageError = res.error
      if (res.error?.code !== "23505") break // erreur non liee a l'unicite -> on arrete
    }

    if (!newPage) {
      return NextResponse.json({ error: pageError?.message || "Erreur creation page" }, { status: 500 })
    }

    // QR code associe (comme le flux template)
    const shortCode = Math.random().toString(36).slice(2, 10)
    await supabaseAdmin.from("qr_codes").insert({ page_id: newPage.id, user_id: user.id, short_code: shortCode })

    return NextResponse.json({ pageId: newPage.id, slug: newPage.slug, success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erreur serveur" }, { status: 500 })
  }
}
