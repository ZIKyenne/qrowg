// app/api/redirects/route.ts
// CRUD des redirections domaine (301/302)

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data } = await supabase
    .from("domain_redirects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ redirects: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { from_domain, from_path, to_url, redirect_type, label, enabled } = await req.json()

  if (!from_domain || !to_url) {
    return NextResponse.json({ error: "from_domain et to_url requis" }, { status: 400 })
  }

  if (redirect_type && ![301, 302].includes(redirect_type)) {
    return NextResponse.json({ error: "Type doit être 301 ou 302" }, { status: 400 })
  }

  // Normaliser les chemins
  const cleanPath = (from_path ?? "/").startsWith("/") ? (from_path ?? "/") : "/" + (from_path ?? "")
  const cleanDomain = from_domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "")

  // Éviter les redirections en boucle
  const destDomain = to_url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
  if (destDomain === cleanDomain) {
    return NextResponse.json({ error: "La destination ne peut pas être identique à la source" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("domain_redirects")
    .upsert({
      user_id:       user.id,
      from_domain:   cleanDomain,
      from_path:     cleanPath,
      to_url:        to_url.trim(),
      redirect_type: redirect_type ?? 301,
      label:         label?.trim() || null,
      enabled:       enabled ?? true,
    }, { onConflict: "from_domain,from_path" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ redirect: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const allowed = ["to_url", "redirect_type", "label", "enabled"]
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))

  // Memes validations qu'a la creation (l'entree PATCH est tout aussi non fiable).
  if ("redirect_type" in filtered && ![301, 302].includes(filtered.redirect_type as number)) {
    return NextResponse.json({ error: "Type doit être 301 ou 302" }, { status: 400 })
  }
  if ("to_url" in filtered && !String(filtered.to_url ?? "").trim()) {
    return NextResponse.json({ error: "to_url ne peut pas être vide" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("domain_redirects")
    .update(filtered)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ redirect: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const { error } = await supabase
    .from("domain_redirects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
