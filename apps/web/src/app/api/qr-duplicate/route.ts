// app/api/qr-duplicate/route.ts
// Duplique un QR code et sa page liee (nouvelle page + nouveau short_code)

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

function randCode(len = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let s = ""
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { qr_id } = await req.json()
  if (!qr_id) return NextResponse.json({ error: "qr_id requis" }, { status: 400 })

  // 1. Recuperer le QR original (verif proprietaire)
  const { data: orig, error: e1 } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", qr_id)
    .eq("user_id", user.id)
    .single()
  if (e1 || !orig) return NextResponse.json({ error: "QR introuvable" }, { status: 404 })

  // 2. Dupliquer la page liee (si elle existe)
  let newPageId: string | null = orig.page_id ?? null
  if (orig.page_id) {
    const { data: page } = await supabase
      .from("pages")
      .select("*")
      .eq("id", orig.page_id)
      .single()
    if (page) {
      const p = page as any
      delete p.id
      delete p.created_at
      delete p.updated_at
      const newPage = {
        ...p,
        title: `${page.title ?? "Sans titre"} (copie)`,
        slug:  `${(page.slug ?? "page")}-${randCode(5)}`,
        status: "draft",
        total_views: 0,
      }
      const { data: insertedPage, error: e2 } = await supabase
        .from("pages")
        .insert(newPage)
        .select("id")
        .single()
      if (e2 || !insertedPage) {
        return NextResponse.json({ error: e2?.message || "Echec copie de la page" }, { status: 500 })
      }
      newPageId = insertedPage.id
    }
  }

  // 3. Creer le nouveau QR (copie du style, compteurs remis a zero)
  const q = orig as any
  delete q.id
  delete q.created_at
  delete q.updated_at
  const newQr = {
    ...q,
    page_id:       newPageId,
    short_code:    randCode(8),
    total_scans:   0,
    last_scan_at:  null,
    dest_override: null,
    dest_history:  [],
    status:        "active",
  }
  const { data: insertedQr, error: e3 } = await supabase
    .from("qr_codes")
    .insert(newQr)
    .select("*, pages(id, title, slug, status, total_views, updated_at)")
    .single()
  if (e3 || !insertedQr) {
    return NextResponse.json({ error: e3?.message || "Echec copie du QR" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, qr: insertedQr })
}
