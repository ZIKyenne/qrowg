// app/api/qr-status/route.ts
// Gestion des statuts QR: activer, pause, archive, restore, delete

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type QRStatusAction =
  | "activate"
  | "pause"
  | "archive"
  | "restore"
  | "expire"
  | "set_pause_message"

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  active:   ["pause", "archive", "expire"],
  draft:    ["activate", "archive"],
  paused:   ["activate", "archive"],
  archived: ["restore"],
  expired:  ["activate", "archive"],
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { qr_id, action, pause_message } = await req.json()
  if (!qr_id || !action) {
    return NextResponse.json({ error: "qr_id et action requis" }, { status: 400 })
  }

  // Récupérer le QR actuel
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, status")
    .eq("id", qr_id)
    .eq("user_id", user.id)
    .single()

  if (!qr) return NextResponse.json({ error: "QR introuvable" }, { status: 404 })

  const currentStatus = qr.status ?? "active"

  // Cas spécial: set_pause_message ne change pas le statut
  if (action === "set_pause_message") {
    await supabase
      .from("qr_codes")
      .update({ pause_message: pause_message ?? null, updated_at: new Date().toISOString() })
      .eq("id", qr_id)
      .eq("user_id", user.id)
    return NextResponse.json({ ok: true })
  }

  // Vérifier la transition
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []
  if (!allowed.includes(action)) {
    return NextResponse.json({
      error: `Transition "${action}" non autorisée depuis "${currentStatus}"`,
      allowed,
    }, { status: 400 })
  }

  // Calculer le nouveau statut et les timestamps
  const now = new Date().toISOString()
  const updates: Record<string, any> = { updated_at: now }

  switch (action) {
    case "activate":
      updates.status     = "active"
      updates.paused_at  = null
      break
    case "pause":
      updates.status     = "paused"
      updates.paused_at  = now
      if (pause_message !== undefined) updates.pause_message = pause_message
      break
    case "archive":
      updates.status      = "archived"
      updates.archived_at = now
      break
    case "restore":
      updates.status      = "active"
      updates.archived_at = null
      updates.paused_at   = null
      break
    case "expire":
      updates.status = "expired"
      break
  }

  const { error } = await supabase
    .from("qr_codes")
    .update(updates)
    .eq("id", qr_id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, status: updates.status })
}

// DELETE définitif (préserve les scans via ON DELETE CASCADE → non, on garde)
// On supprime le QR mais les scans sont gardés en DB pour historique
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { qr_id } = await req.json()
  if (!qr_id) return NextResponse.json({ error: "qr_id requis" }, { status: 400 })

  // Vérifier que le QR est archivé avant suppression définitive
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("status")
    .eq("id", qr_id)
    .eq("user_id", user.id)
    .single()

  if (!qr) return NextResponse.json({ error: "QR introuvable" }, { status: 404 })
  if (qr.status !== "archived") {
    return NextResponse.json({
      error: "Archivez le QR avant de le supprimer définitivement"
    }, { status: 400 })
  }

  const { error } = await supabase
    .from("qr_codes")
    .delete()
    .eq("id", qr_id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
