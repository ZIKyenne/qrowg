// app/api/domains/routes/route.ts
// CRUD des routes domaine → page (multi-page par domaine)

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { serverError } from "@/lib/apiError"
import { entier, uuidOuNull } from "@/lib/bornes"
import { sousDomaineValide } from "@/lib/routesDeDomaine"

// GET ?root_domain=xxx — liste les routes d'un domaine
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const root = req.nextUrl.searchParams.get("root_domain")

  let query = supabase
    .from("domain_routes")
    .select("*, pages(id, title, slug, status)")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })

  if (root) query = query.eq("root_domain", root)

  const { data, error } = await query
  if (error) return serverError("domains/routes", error)
  return NextResponse.json({ routes: data ?? [] })
}

// POST — créer une route, ou changer la page d'une route existante
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const corps = await req.json().catch(() => null)
  const root_domain = typeof corps?.root_domain === "string" ? corps.root_domain.trim().toLowerCase() : ""
  const page_id = uuidOuNull(corps?.page_id)
  if (!root_domain || !page_id) {
    return NextResponse.json({ error: "root_domain et page_id requis" }, { status: 400 })
  }
  const cleanSub = sousDomaineValide(corps?.subdomain)
  if (cleanSub === false) {
    return NextResponse.json({ error: "Sous-domaine invalide : lettres, chiffres et tirets, ou « * »." }, { status: 400 })
  }

  // Vérifier que le domaine racine est vérifié et appartient à l'user
  const { data: verified } = await supabase
    .from("domain_verifications")
    .select("id")
    .eq("domain", root_domain)
    .eq("user_id", user.id)
    .eq("verified", true)
    .maybeSingle()

  if (!verified) {
    return NextResponse.json({
      error: "Le domaine racine doit être vérifié avant d'y ajouter des routes"
    }, { status: 403 })
  }

  // Vérifier que la page appartient à l'user
  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("id", page_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!page) return NextResponse.json({ error: "Page introuvable" }, { status: 404 })

  // Priorité : racine basse, joker minimale, sous-domaine exact haute.
  const autoPriority = cleanSub === null ? 5 : cleanSub === "*" ? 1 : entier(corps?.priority, 0, 100, 10)

  // Mise à jour de LA route existante, sinon création (v412). L'upsert sur
  // (root_domain, subdomain) ne voit jamais la racine : NULL n'est égal à rien,
  // et chaque changement de page de la racine AJOUTAIT une route — la résolution
  // servait alors l'une ou l'autre.
  let existante = supabase
    .from("domain_routes")
    .select("id")
    .eq("user_id", user.id)
    .eq("root_domain", root_domain)
  existante = cleanSub === null ? existante.is("subdomain", null) : existante.eq("subdomain", cleanSub)
  const { data: deja } = await existante.limit(1).maybeSingle()

  const champs = { page_id, priority: autoPriority, enabled: true }
  const ecrit = deja
    ? supabase.from("domain_routes").update(champs).eq("id", deja.id).eq("user_id", user.id)
    : supabase.from("domain_routes").insert({ user_id: user.id, root_domain, subdomain: cleanSub, ...champs })
  const { data, error } = await ecrit.select("*, pages(id, title, slug, status)").maybeSingle()

  if (error?.code === "23505") {
    return NextResponse.json({ error: "Cette adresse est déjà routée par un autre compte." }, { status: 409 })
  }
  if (error) return serverError("domains/routes", error)
  if (!data) return NextResponse.json({ error: "Cette route n'a pas pu être enregistrée." }, { status: 500 })
  return NextResponse.json({ route: data })
}

// DELETE — supprimer une route (confirmée : zéro ligne n'est pas un succès)
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const corps = await req.json().catch(() => null)
  const id = uuidOuNull(corps?.id)
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const { data, error } = await supabase
    .from("domain_routes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")

  if (error) return serverError("domains/routes", error)
  if (!data?.length) return NextResponse.json({ error: "Route introuvable" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
