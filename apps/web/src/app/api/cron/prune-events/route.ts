// app/api/cron/prune-events/route.ts
// Purge des tables d'events brutes au-delà de la fenêtre de rétention (voir
// lib/eventRetention). Appelé par cron (Vercel Cron). Protégé par CRON_SECRET.
//
// ⚠️ DESTRUCTIF : supprime définitivement les lignes brutes anciennes. Les
// compteurs cumulés ne sont pas touchés (cf. lib/eventRetention).
//
// Q14 — cette route existait, complète et protégée, mais n'était PAS planifiée.
// Pendant ce temps, /privacy promettait que les données de mesure sont
// « conservées 400 jours puis supprimées automatiquement ». Rien ne les
// supprimait. Une durée de conservation qu'on annonce sans l'appliquer n'est pas
// une durée de conservation.
//
// Elle est donc planifiée dans vercel.json, le dimanche à 4 h — la cadence que
// ce fichier recommandait lui-même. Attention : la PREMIÈRE exécution effacera
// d'un coup tout l'historique brut antérieur à la fenêtre.

import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { EVENT_TABLES, RETENTION_DAYS, retentionCutoffISO } from "@/lib/eventRetention"
import { gardeCron } from "@/lib/gardeCron"
import { noterPassage } from "@/lib/journalCron"

// Maintenant qu'elle est planifiée, elle doit laisser une trace comme les autres —
// et une tâche DESTRUCTIVE plus que les autres : sans journal, personne ne peut
// dire ce qu'elle a effacé, ni même si elle est passée.
const TACHE = "cron/prune-events" as const

export async function GET(req: NextRequest) {
  // La seule route qui efface était la seule à avoir gardé la porte que le
  // produit a fermée partout ailleurs : le secret accepté en clair dans l'URL,
  // donc dans les journaux d'accès et l'historique. Elle comparait aussi avec
  // `!==`, qui s'arrête au premier octet différent, et refusait sans laisser de
  // trace. Elle passe par le contrôle d'entrée commun (lot v131).
  const debut = Date.now()
  const refus = await gardeCron(req, TACHE)
  if (refus) return refus

  const admin = createAdminClient()
  try {
    const cutoff = retentionCutoffISO(new Date())
    const deleted: Record<string, number | string> = {}
    let effacees = 0
    let echecs = 0

    for (const { table, column } of EVENT_TABLES) {
      const { error, count } = await admin
        .from(table)
        .delete({ count: "exact" })
        .lt(column, cutoff)
      // Le message de Postgres nommait la table et la contrainte dans une réponse
      // JSON. Il part au journal ; la réponse dit seulement que ça a échoué (v134).
      if (error) { console.error("[cron/prune-events]", table, error.code ?? "", error.message); echecs++ }
      else effacees += count ?? 0
      deleted[table] = error ? "erreur" : (count ?? 0)
    }

    // « rien » quand il n'y avait rien à effacer : c'est le cas normal, et le
    // distinguer d'un passage qui a supprimé permet de lire l'historique.
    await noterPassage(admin, TACHE,
      echecs ? "erreur" : effacees > 0 ? "ok" : "rien",
      `coupure ${cutoff} · ${effacees} ligne(s)${echecs ? ` · ${echecs} table(s) en erreur` : ""}`,
      Date.now() - debut)

    return NextResponse.json({ ok: true, cutoff, retentionDays: RETENTION_DAYS, deleted })
  } catch (e: any) {
    await noterPassage(admin, TACHE, "erreur", e?.message ?? "erreur inconnue", Date.now() - debut)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
