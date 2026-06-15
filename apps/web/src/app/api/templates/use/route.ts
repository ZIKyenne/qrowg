import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Transforme un texte en slug valide : minuscules, accents retires,
// tout ce qui n'est pas lettre/chiffre devient "-", + suffixe aleatoire.
// Respecte la contrainte slug_format : ^[a-z0-9_-]{2,60}$
function slugify(input: string): string {
  const base = (input || "page")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")        // tout le reste -> "-"
    .replace(/^-+|-+$/g, "")            // pas de "-" au debut/fin
    .slice(0, 50)                       // garde de la place pour le suffixe

  const safeBase = base.length >= 2 ? base : "page"
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${safeBase}-${suffix}`
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

    const body = await req.json()
    const { templateId, templateName, theme, blocks } = body

    // On IGNORE le slug recu du navigateur et on le fabrique proprement.
    const cleanSlug = slugify(templateName || templateId || "page")

    const { data: newPage, error: pageError } = await supabaseAdmin
      .from("pages")
      .insert({
        user_id: user.id,
        title: templateName || "Ma page",
        slug: cleanSlug,
        status: "draft",
        template_id: templateId,
        theme: theme || {},
      })
      .select()
      .single()

    if (pageError || !newPage) {
      return NextResponse.json(
        { error: pageError?.message || "Erreur creation page" },
        { status: 500 }
      )
    }

    // Insertion des blocs AVEC verification d'erreur (plus de page vide silencieuse).
    if (Array.isArray(blocks) && blocks.length > 0) {
      const { error: blocksError } = await supabaseAdmin.from("blocks").insert(
        blocks.map((b: any, i: number) => ({
          page_id: newPage.id,
          type: b.type,
          position: i,
          content: b.content || {},
          is_visible: true,
          styles: {},
        }))
      )

      if (blocksError) {
        // On nettoie la page creee pour ne pas laisser de page vide.
        await supabaseAdmin.from("pages").delete().eq("id", newPage.id)
        return NextResponse.json(
          { error: "Erreur creation blocs : " + blocksError.message },
          { status: 500 }
        )
      }
    }

    const shortCode = Math.random().toString(36).slice(2, 10)
    await supabaseAdmin.from("qr_codes").insert({
      page_id: newPage.id,
      user_id: user.id,
      short_code: shortCode,
    })

    return NextResponse.json({ pageId: newPage.id, success: true })

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}
