// app/api/cron/essai/route.ts
// Les deux relances de l'essai gratuit : J-7, puis J-1. Appelée quotidiennement
// par Vercel Cron, protégée par CRON_SECRET, fail-closed comme les autres.
//
// Pourquoi : le lot précédent a posé les trente jours. Passé l'échéance, la page
// d'un compte gratuit affiche un écran d'attente et la base refuse de publier.
// Sans préavis, le commerçant découvre la coupure par ses clients — et on perd
// la seule conversation qui pouvait finir par un abonnement.
//
// Aucune colonne de suivi : la fenêtre d'éligibilité (voir lib/alerteEssai) fait
// qu'un passage quotidien ne retient un compte qu'une fois par jalon. La garde
// de ce module simule soixante passages et exige exactement deux envois.

import { createAdminClient } from "@/lib/supabase/server"
import { fetchBorne } from "@/lib/appelQuiNAttendPas"
import { NextRequest, NextResponse } from "next/server"
import { serverError } from "@/lib/apiError"
import { EMAIL_FROM } from "@/lib/emailFrom"
import { emailShell, emailH1, emailP, emailButton, texteDeLEmail } from "@/lib/emailLayout"
import { escapeHtml } from "@/lib/escapeHtml"
import { comptesAPrevenir, fenetreDesJalons, MESSAGES, RASSURANCE, type CompteEnEssai, type Jalon } from "@/lib/alerteEssai"
import { prenom } from "@/lib/relance"
import { noterPassage, sansAdresses } from "@/lib/journalCron"
import { gardeCron } from "@/lib/gardeCron"
import { lienDeSortie } from "@/lib/consentementEmail"

export const runtime = "nodejs"

// Le texte vient de lib/alerteEssai, où les gardes le lisent : aucun mot n'est
// réécrit ici. Ce qui est écrit ici, c'est la mise en page.
function alerteHtml(jalon: Jalon, nom: string, appUrl: string): string {
  const m = MESSAGES[jalon]
  const p = prenom(nom)
  const bonjour = p ? `Bonjour ${escapeHtml(p)},` : "Bonjour,"
  const content = `
    ${emailH1(m.titre)}
    ${emailP(bonjour)}
    ${emailP(m.corps)}
    ${emailP(RASSURANCE, 24)}
    ${emailButton(m.bouton, `${appUrl}/upgrade`)}
    ${emailP(`Deux rappels au maximum vous sont envoyés avant l'échéance, et jamais un troisième. Vous pouvez régler ce que QRowg vous envoie depuis vos <a href="${lienDeSortie(appUrl)}" style="color:#C9A84C;">Réglages</a>.`, 24)}
  `
  return emailShell({ preheader: m.objet, content })
}

// Nom de cette tâche dans le journal (lib/journalCron) : sans trace, personne ne
// peut dire si elle s'exécute.
const TACHE = "cron/essai" as const

export async function GET(req: NextRequest) {
  const refus = await gardeCron(req, TACHE, { resendRequis: true })
  if (refus) return refus
  const resendKey = process.env.RESEND_API_KEY as string

  const debut = Date.now()
  try {
    const supabase = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrowg.com"
    const maintenant = new Date()
    const { depuis, jusqua } = fenetreDesJalons(maintenant)

    // On ne ramène que la fenêtre : jamais toute la table des comptes. Une garde
    // vérifie qu'aucun compte éligible ne tombe hors de ces bornes.
    const { data: profs, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan, free_published_since")
      // `gt` et `lte`, pas l'inverse : la borne haute est INCLUSIVE, parce que
      // les jours restants s'arrondissent vers le haut. Voir fenetreDesJalons.
      .gt("free_published_since", depuis)
      .lte("free_published_since", jusqua)
      // Sans ordre, un dépassement du plafond retiendrait des comptes AU HASARD.
      .order("free_published_since", { ascending: true })
      .limit(500)
    if (error) throw new Error(error.message)

    const ids = (profs ?? []).map(p => p.id as string)
    if (ids.length === 0) { await noterPassage(supabase, TACHE, "rien", "aucun compte dans la fenêtre", Date.now() - debut); return NextResponse.json({ examines: 0, envoyes: 0 }) }

    // Prévenir quelqu'un dont rien n'est en ligne, c'est lui annoncer la coupure
    // d'un service qu'il n'utilise pas.
    const { data: pages } = await supabase.from("pages").select("user_id").eq("status", "published").in("user_id", ids)
    const enLigne = new Set((pages ?? []).map(p => p.user_id as string))

    const comptes: CompteEnEssai[] = (profs ?? []).map(p => ({
      id: p.id as string,
      email: (p.email as string | null) ?? null,
      nom: (p.full_name as string | null) ?? null,
      plan: (p.plan as string | null) ?? null,
      premierePublication: (p.free_published_since as string | null) ?? null,
      aUnePagePubliee: enLigne.has(p.id as string),
    }))

    const aPrevenir = comptesAPrevenir(comptes, maintenant)
    let envoyes = 0
    const erreurs: string[] = []

    for (const { compte, jalon } of aPrevenir) {
      try {
        const html = alerteHtml(jalon, compte.nom ?? "", appUrl)
        const res = await fetchBorne("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [compte.email],
            subject: MESSAGES[jalon].objet,
            html,
            text: texteDeLEmail(html),
          }),
        }, "tache")
        if (!res.ok) throw new Error(await res.text())
        envoyes++
      } catch (e: any) {
        erreurs.push(`${compte.email}: ${e?.message ?? "err"}`)
      }
    }

    await noterPassage(supabase, TACHE, erreurs.length ? "erreur" : envoyes > 0 ? "ok" : "rien", sansAdresses(erreurs.join(" · ")) || `${envoyes} envoyé(s)`, Date.now() - debut)
    return NextResponse.json({ examines: comptes.length, envoyes, erreurs: erreurs.length ? erreurs : undefined })
  } catch (e: any) {
    // Une tâche qui plante sans trace est le cas qu'on veut justement voir.
    await noterPassage(createAdminClient(), TACHE, "erreur", e?.message ?? "erreur inconnue", Date.now() - debut)
    return serverError("cron/essai", e)
  }
}
