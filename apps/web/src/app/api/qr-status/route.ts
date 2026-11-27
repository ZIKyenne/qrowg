// app/api/qr-status/route.ts
// Gestion des statuts QR: activer, pause, archive, restore, delete

import type { Json, TablesInsert, TablesUpdate } from "@/lib/supabase/database.generated"
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { ALLOWED_TRANSITIONS, ACTION_TO_STATUS, canTransition, type QRStatus } from "./qrStatus"
import { pageLimit } from "@/lib/plans"
import { countActiveQrs } from "@/lib/quota"
import { serverError } from "@/lib/apiError"
import { texte, uuidOuNull } from "@/lib/bornes"
import { colonneMotifAbsente } from "@/lib/pauseDesPages"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const qr_id = uuidOuNull(body?.qr_id)
  const action = typeof body?.action === "string" ? body.action : null
  // pause_message arrivait sans type ni taille : n'importe quoi finissait en base.
  const pause_message = texte(body?.pause_message, 300)
  if (!qr_id || !action) {
    return NextResponse.json({ error: "qr_id et action requis" }, { status: 400 })
  }

  // Récupérer le QR actuel
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, status, user_id")
    .eq("id", qr_id)
    .single()

  if (!qr) return NextResponse.json({ error: "QR introuvable" }, { status: 404 })

  const currentStatus = qr.status ?? "active"

  // Cas spécial: set_pause_message ne change pas le statut. Comme pour le statut,
  // .select() confirme que l'écriture a porté : avant v400, une erreur ou une RLS
  // qui refusait répondait quand même { ok: true }.
  if (action === "set_pause_message") {
    const { data: fait, error: e } = await supabase
      .from("qr_codes")
      .update({ pause_message: pause_message ?? null, updated_at: new Date().toISOString() })
      .eq("id", qr_id)
      .select("id")
      .maybeSingle()
    if (e) return serverError("qr-status", e)
    if (!fait) return NextResponse.json({ error: "Modification impossible (droits insuffisants ou QR introuvable)" }, { status: 403 })
    return NextResponse.json({ ok: true })
  }

  // Vérifier la transition
  if (!canTransition(currentStatus, action)) {
    return NextResponse.json({
      error: `Transition "${action}" non autorisée depuis "${currentStatus}"`,
      allowed: ALLOWED_TRANSITIONS[currentStatus as QRStatus] ?? [],
    }, { status: 400 })
  }

  // Quota du plan : activer un QR (activate/restore -> "active") est refusé si on
  // est déjà au plafond de QR actifs. On peut créer autant de pages qu'on veut,
  // mais seul le nombre d'ACTIFS (visitables) est limité par le plan.
  if (ACTION_TO_STATUS[action as keyof typeof ACTION_TO_STATUS] === "active") {
    // Le quota est celui du PROPRIÉTAIRE du QR, pas de qui clique. Avant v400, un
    // membre d'équipe qui rallumait le QR du propriétaire était compté sur SON
    // forfait et SES QR : le compte du propriétaire dépassait son plan sans limite.
    // La RLS ne laisse lire que son propre profil : le plan du propriétaire se lit
    // en service role, sur un QR que la RLS vient de montrer à l'utilisateur.
    const proprietaire = (qr as { user_id?: string | null }).user_id ?? user.id
    const lecteur = proprietaire === user.id ? supabase : createAdminClient()
    const { data: prof } = await lecteur.from("profiles").select("plan").eq("id", proprietaire).single()
    const limit = pageLimit(prof?.plan as string)
    if (limit !== null) {
      // Le QR courant n'est pas encore actif (sinon la transition ne serait pas
      // autorisée), donc l'activer porterait le total à (actifs + 1).
      const active = await countActiveQrs(lecteur, proprietaire)
      if (active >= limit) {
        return NextResponse.json({
          error: `Limite de ${limit} QR actif${limit > 1 ? "s" : ""} atteinte sur votre plan. Mettez-en un autre en pause (ou passez à un plan supérieur) pour activer celui-ci.`,
        }, { status: 403 })
      }
    }
  }

  // On ne met à jour que les colonnes ESSENTIELLES et sûres : `status` (pilote la
  // résolution au scan) et `pause_message`. Les timestamps paused_at/archived_at
  // ne sont lus nulle part ; les inclure faisait ÉCHOUER TOUT l'update s'ils
  // manquaient en base (SQL partiel) -> la pause échouait en silence.
  const updates: TablesUpdate<"qr_codes"> = {
    updated_at: new Date().toISOString(),
    status: ACTION_TO_STATUS[action as keyof typeof ACTION_TO_STATUS],
  }
  if (action === "pause" && pause_message !== undefined) updates.pause_message = pause_message
  // Le motif distingue la pause CHOISIE de celle imposée par le plan (audit A1) :
  // le webhook ne rallume que la seconde. Le client qui échange une page active
  // contre une page « en pause par le plan » fait donc un choix qui tient.
  if (action === "pause") updates.paused_reason = "manual"
  if (updates.status === "active") updates.paused_reason = null

  // .select() confirme que l'update a bien porté (proprio OU membre d'équipe via
  // RLS) : sinon on remonte une VRAIE erreur au lieu d'un faux succès silencieux.
  let { data: updated, error } = await supabase
    .from("qr_codes")
    .update(updates)
    .eq("id", qr_id)
    .select("id, status")
    .maybeSingle()
  // Colonne `paused_reason` absente (migration non appliquée) : on refait la
  // mise à jour sans le motif — la pause et l'activation marchent comme avant.
  if (error && colonneMotifAbsente(error) && "paused_reason" in updates) {
    delete updates.paused_reason
    ;({ data: updated, error } = await supabase.from("qr_codes").update(updates).eq("id", qr_id).select("id, status").maybeSingle())
  }

  if (error) return serverError("qr-status", error)
  if (!updated) return NextResponse.json({ error: "Modification impossible (droits insuffisants ou QR introuvable)" }, { status: 403 })

  return NextResponse.json({ ok: true, status: updated.status })
}

// DELETE définitif (préserve les scans via ON DELETE CASCADE → non, on garde)
// On supprime le QR mais les scans sont gardés en DB pour historique
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  // Un corps illisible répondait 500 (req.json() levait) : c'est un 400.
  const corps = await req.json().catch(() => null)
  const qr_id = uuidOuNull(corps?.qr_id)
  if (!qr_id) return NextResponse.json({ error: "qr_id requis" }, { status: 400 })

  // Vérifier que le QR est archivé avant suppression définitive
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("status")
    .eq("id", qr_id)
    .single()

  if (!qr) return NextResponse.json({ error: "QR introuvable" }, { status: 404 })
  if (qr.status !== "archived") {
    return NextResponse.json({
      error: "Archivez le QR avant de le supprimer définitivement"
    }, { status: 400 })
  }

  // .select() confirme qu'une ligne a bien été supprimée (proprio OU équipe via
  // RLS) : sinon la RLS bloque en silence et on renverrait un faux { ok:true }.
  const { data: deleted, error } = await supabase
    .from("qr_codes")
    .delete()
    .eq("id", qr_id)
    .select("id")

  if (error) return serverError("qr-status", error)
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "Suppression impossible (droits insuffisants ou QR introuvable)" }, { status: 403 })
  }
  return NextResponse.json({ ok: true })
}
