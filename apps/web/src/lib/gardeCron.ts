// gardeCron.ts — Le contrôle d'entrée des cinq tâches planifiées, au même endroit.
//
// Les cinq routes recopiaient le même bloc de six lignes, avec des différences qui
// n'étaient voulues nulle part : « Non autorise », « Non autorisé », « Unauthorized »,
// et une clé Resend manquante qui donnait 503 ici, 500 là.
//
// Surtout, toutes refusaient AVANT d'écrire dans le journal. Le journal existe pour
// répondre à « est-ce que mes emails partent ? » ; il ne pouvait pas distinguer
// « jamais déclenchée » de « déclenchée et refusée », alors que le second cas est
// la panne la plus probable : un CRON_SECRET absent des variables d'environnement.
// Un refus laisse maintenant une trace.

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { noterRefus, type Tache } from "@/lib/journalCron"
import { secretPresente, secretsEgaux } from "@/lib/secretQuiSeCompare"

// Les deux règles écrites ici — une seule porte (l'en-tête `Authorization`) et
// une comparaison à temps constant — vivent maintenant dans
// `lib/secretQuiSeCompare`, d'où trois autres endroits les prennent aussi : la
// purge des événements, le jeton interne des e-mails, et le lien de
// désabonnement (lot v131). Réexportée : les appelants d'avant ne changent pas.
export { secretsEgaux }

/**
 * Vérifie l'appel d'une tâche planifiée. Renvoie la réponse à retourner tel quel
 * si l'appel est refusé, ou `null` si la tâche peut travailler.
 *
 * `resendRequis` : la tâche envoie des emails et ne sert à rien sans clé d'envoi.
 */
export async function gardeCron(
  req: NextRequest,
  tache: Tache,
  opts: { resendRequis?: boolean } = {},
): Promise<NextResponse | null> {
  const attendu = process.env.CRON_SECRET ?? ""
  const donne = secretPresente(req)

  if (attendu === "") {
    await tracer(tache, "CRON_SECRET absent des variables d'environnement")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  if (donne === null || !secretsEgaux(donne, attendu)) {
    await tracer(tache, donne !== null ? "secret invalide" : "appel sans secret")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  if (opts.resendRequis && !process.env.RESEND_API_KEY) {
    await tracer(tache, "RESEND_API_KEY absente : aucun email ne peut partir")
    return NextResponse.json({ error: "Service email non configuré", sent: 0 }, { status: 503 })
  }
  return null
}

async function tracer(tache: Tache, motif: string): Promise<void> {
  try { await noterRefus(createAdminClient(), tache, motif) } catch { /* jamais bloquant */ }
}
