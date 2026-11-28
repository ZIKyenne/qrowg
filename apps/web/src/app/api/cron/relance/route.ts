// app/api/cron/relance/route.ts
// Rappel à qui s'est inscrit et n'a rien créé. Appelé quotidiennement par Vercel
// Cron, protégé par CRON_SECRET, fail-closed comme les autres crons.
//
// Pourquoi : l'email de bienvenue part à la minute zéro, quand la personne est
// déjà devant l'écran. Il ne rattrape personne. Deux jours plus tard, plus rien
// n'était jamais envoyé — c'est exactement ce qui est arrivé au seul vrai
// inscrit qu'a eu QRowg.
//
// Aucune colonne de suivi : la décision porte sur UN jour civil (le 2e après
// l'inscription), donc un passage quotidien ne peut retenir un compte qu'une
// seule fois — et ne peut pas non plus le rater, ce qui arrivait quand
// l'éligibilité se mesurait en heures. Voir lib/relance.ts, lib/jourCivil.ts
// et leurs tests.

import { createAdminClient } from "@/lib/supabase/server"
import { fetchBorne } from "@/lib/appelQuiNAttendPas"
import { NextRequest, NextResponse } from "next/server"
import { serverError } from "@/lib/apiError"
import { EMAIL_FROM } from "@/lib/emailFrom"
import { emailShell, emailH1, emailP, emailButton, texteDeLEmail } from "@/lib/emailLayout"
import { escapeHtml } from "@/lib/escapeHtml"
import { comptesARelancer, fenetreInscription, prenom, type Compte } from "@/lib/relance"
import { noterPassage, sansAdresses } from "@/lib/journalCron"
import { gardeCron } from "@/lib/gardeCron"
import { toutesLesLignes, idsPresents } from "@/lib/lectureParPages"
import { LIGNES_AGREGEES } from "@/lib/perimetreDeMesure"
import { lienDeSortie } from "@/lib/consentementEmail"

export const runtime = "nodejs"


// Un email court. Il ne redit pas la bienvenue : il propose UN geste, et rappelle
// que la page peut être faite avant même d'y réfléchir longtemps.
function relanceHtml(nom: string, appUrl: string): string {
  const p = prenom(nom)
  const bonjour = p ? `Bonjour ${escapeHtml(p)},` : "Bonjour,"
  const content = `
    ${emailH1("Votre page vous attend")}
    ${emailP(bonjour)}
    ${emailP("Vous avez créé votre compte QRowg il y a deux jours, et votre première page n'est pas encore là. C'est trois minutes, et vous n'avez rien à rédiger : choisissez ce que la page doit faire, elle arrive déjà remplie.")}
    ${emailP("Une carte de restaurant, une page d'avis Google, une carte de visite : vous n'aurez plus qu'à changer les textes.", 24)}
    ${emailButton("Créer ma page →", `${appUrl}/dashboard/onboarding`)}
    ${emailP("Si vous préférez voir avant de vous lancer, le <a href=\"${APP}/examples\" style=\"color:#C9A84C;\">catalogue d'exemples</a> montre ce que ça donne.".replace("${APP}", appUrl), 0)}
    ${emailP(`Un seul rappel est envoyé, et jamais un deuxième. Vous pouvez régler ce que QRowg vous envoie depuis vos <a href="${lienDeSortie(appUrl)}" style="color:#C9A84C;">Réglages</a>.`, 24)}
  `
  return emailShell({
    preheader: "Votre première page QRowg en trois minutes, sans rien rédiger.",
    content,
  })
}

// Nom de cette tâche dans le journal (lib/journalCron) : sans trace, personne ne
// pouvait dire si elle s'exécutait.
const TACHE = "cron/relance" as const

export async function GET(req: NextRequest) {
  // Contrôle d'entrée commun aux cinq tâches (lib/gardeCron) : un refus laisse
  // une trace dans le journal. (Cette route renvoyait un 500 pour une clé d'envoi
  // absente — une panne du serveur pour un défaut de configuration.)
  const refus = await gardeCron(req, TACHE, { resendRequis: true })
  if (refus) return refus
  const resendKey = process.env.RESEND_API_KEY as string

  const debut = Date.now()
  try {
    const supabase = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrowg.com"
    const maintenant = new Date()
    const { depuis, jusqua } = fenetreInscription(maintenant)

    // On ne ramène que la fenêtre : jamais toute la table des comptes. Lue par
    // tranches, dans un ordre stable (v414) : le plafond de 500 laissait les
    // suivants hors de LEUR seul jour de relance — ils n'en recevaient jamais.
    const profs = await toutesLesLignes<{ id: string; email: string | null; full_name: string | null; created_at: string | null }>((de, a) => supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .gte("created_at", depuis)
      .lt("created_at", jusqua)
      .order("created_at", { ascending: true }).order("id")
      .range(de, a))

    const ids = (profs ?? []).map(p => p.id as string)
    if (ids.length === 0) { await noterPassage(supabase, TACHE, "rien", "aucun compte dans la fenêtre", Date.now() - debut); return NextResponse.json({ examines: 0, envoyes: 0 }) }

    // Qui a déjà créé quelque chose (v414) : une lecture refusée laissait
    // l'ensemble VIDE, et « votre première page n'est pas encore là » partait
    // chez tout le monde. Elle lève désormais. Et un membre d'équipe travaille
    // sur les pages de l'équipe : on ne lui dit pas qu'il n'a rien fait.
    const avecPage = await idsPresents(ids, restants => supabase.from("pages").select("user_id").in("user_id", restants).order("created_at", { ascending: false }).limit(LIGNES_AGREGEES), "user_id")
    const enEquipe = await idsPresents(ids, restants => supabase.from("team_members").select("user_id").in("user_id", restants).order("joined_at", { ascending: true }).limit(LIGNES_AGREGEES), "user_id")

    const comptes: Compte[] = (profs ?? []).map(p => ({
      id: p.id as string,
      email: (p.email as string | null) ?? null,
      nom: (p.full_name as string | null) ?? null,
      inscritLe: (p.created_at as string | null) ?? null,
      nbPages: avecPage.has(p.id as string) || enEquipe.has(p.id as string) ? 1 : 0,
    }))

    const aRelancer = comptesARelancer(comptes, maintenant)
    let envoyes = 0
    const erreurs: string[] = []

    for (const c of aRelancer) {
      try {
        const html = relanceHtml(c.nom ?? "", appUrl)
        const res = await fetchBorne("https://api.resend.com/emails", {
          method: "POST",
          // Un seul rappel par compte, même si le passage est rejoué (v414).
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", "Idempotency-Key": `relance/${c.id}` },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [c.email],
            subject: "Votre page QRowg vous attend",
            html,
            text: texteDeLEmail(html),
          }),
        }, "tache")
        if (!res.ok) throw new Error(await res.text())
        envoyes++
      } catch (e: any) {
        erreurs.push(`${c.email}: ${e?.message ?? "err"}`)
      }
    }

    await noterPassage(supabase, TACHE, erreurs.length ? "erreur" : envoyes > 0 ? "ok" : "rien", sansAdresses(erreurs.join(" · ")) || `${envoyes} envoyé(s)`, Date.now() - debut)
    return NextResponse.json({ examines: comptes.length, envoyes, erreurs: erreurs.length ? erreurs : undefined })
  } catch (e: any) {
    // Une tâche qui plante ne laissait AUCUNE trace : c'est justement le cas
    // qu'on veut voir dans le journal.
    await noterPassage(createAdminClient(), TACHE, "erreur", e?.message ?? "erreur inconnue", Date.now() - debut)
    return serverError("cron/relance", e)
  }
}
