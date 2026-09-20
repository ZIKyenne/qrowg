// app/api/cron/prune-events/route.ts
// Purge des tables d'events brutes au-delà de la fenêtre de rétention (voir
// lib/eventRetention). Appelé par cron (Vercel Cron). Protégé par CRON_SECRET.
//
// ⚠️ DESTRUCTIF : supprime définitivement les lignes brutes anciennes. Les
// compteurs cumulés ne sont pas touchés (cf. lib/eventRetention). N'est PAS
// planifié par défaut — pour l'activer, ajouter dans vercel.json :
//   { "path": "/api/cron/prune-events", "schedule": "0 4 * * 0" }   (dim. 4h)

import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { EVENT_TABLES, RETENTION_DAYS, retentionCutoffISO } from "@/lib/eventRetention"
import { gardeCron } from "@/lib/gardeCron"

export async function GET(req: NextRequest) {
  // La seule route qui efface était la seule à avoir gardé la porte que le
  // produit a fermée partout ailleurs : le secret accepté en clair dans l'URL,
  // donc dans les journaux d'accès et l'historique. Elle comparait aussi avec
  // `!==`, qui s'arrête au premier octet différent, et refusait sans laisser de
  // trace. Elle passe par le contrôle d'entrée commun (lot v131).
  const refus = await gardeCron(req, "cron/prune-events")
  if (refus) return refus

  const cutoff = retentionCutoffISO(new Date())
  const admin = createAdminClient()
  const deleted: Record<string, number | string> = {}

  for (const { table, column } of EVENT_TABLES) {
    const { error, count } = await admin
      .from(table)
      .delete({ count: "exact" })
      .lt(column, cutoff)
    // Le message de Postgres nommait la table et la contrainte dans une réponse
    // JSON. Il part au journal ; la réponse dit seulement que ça a échoué (v134).
    if (error) console.error("[cron/prune-events]", table, error.code ?? "", error.message)
    deleted[table] = error ? "erreur" : (count ?? 0)
  }

  return NextResponse.json({ ok: true, cutoff, retentionDays: RETENTION_DAYS, deleted })
}
