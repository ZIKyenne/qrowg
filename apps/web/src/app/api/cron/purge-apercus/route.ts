// app/api/cron/purge-apercus/route.ts
//
// Purge des propositions du moteur de croissance. Appelée par Vercel Cron,
// protégée par CRON_SECRET comme les autres, tracée dans le journal.
//
// ⚠️ DESTRUCTIF — et volontairement MINCE. Cette route ne décide rien :
//
//   • la règle de rétention est dans `lib/growth/retentionApercus.ts` (pur, testé) ;
//   • son exécution est dans `lib/growth/purgeApercus.ts` (`purger`), que le
//     banc `/e2e-harness/growth-purge` joue contre une vraie base.
//
// Cette séparation n'est pas de l'élégance : une route de cron ne s'exécute
// jamais sous les yeux de personne, et c'est le seul endroit du dépôt où du
// code efface des lignes sans qu'un humain l'ait demandé. Ce qui efface doit
// donc être appelable depuis un test. Ici, il ne reste que le garde, l'appel,
// et la trace.

import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { gardeCron } from "@/lib/gardeCron"
import { noterPassage, sansAdresses } from "@/lib/journalCron"
import { purger } from "@/lib/growth/purgeApercus"

const TACHE = "cron/purge-apercus" as const

export async function GET(req: NextRequest) {
  const debut = Date.now()
  const refus = await gardeCron(req, TACHE)
  if (refus) return refus

  const admin = createAdminClient()
  try {
    const bilan = await purger(admin, new Date())
    const total = bilan.vides + bilan.effaces + bilan.prospectsEffaces

    // Le détail passe par `sansAdresses`, et sur LA MÊME LIGNE que la
    // jointure : la garde de `crons.test` lit ligne par ligne, et un filtre
    // posé deux lignes plus haut la laisserait muette. Ce détail n'est
    // aujourd'hui fait que de compteurs — mais la purge côtoie des fiches
    // d'établissements tiers, et le jour où une main ajoutera un nom ou une
    // URL à cette ligne, le filtre sera déjà en place.
    const details = [
      `coupure ${bilan.coupure}`,
      `${bilan.examines} examiné(s)`,
      `${bilan.vides} vidé(s)`,
      `${bilan.effaces} effacé(s)`,
      `${bilan.prospectsEffaces} prospect(s)`,
      bilan.reste ? "lot incomplet : reprise au prochain passage" : null,
      bilan.echecs.length ? `échecs : ${bilan.echecs.join(", ")}` : null,
    ].filter(Boolean)

    await noterPassage(
      admin, TACHE,
      bilan.echecs.length ? "erreur" : total > 0 ? "ok" : "rien",
      sansAdresses(details.join(" · ")),
      Date.now() - debut,
    )

    // La réponse ne nomme ni table ni contrainte : le détail part au journal.
    return NextResponse.json({
      ok: !bilan.echecs.length,
      coupure: bilan.coupure,
      graceJours: bilan.graceJours,
      examines: bilan.examines,
      vides: bilan.vides,
      effaces: bilan.effaces,
      prospectsEffaces: bilan.prospectsEffaces,
      reste: bilan.reste,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "erreur inconnue"
    await noterPassage(admin, TACHE, "erreur", message, Date.now() - debut)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
