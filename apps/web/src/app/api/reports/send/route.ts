// app/api/reports/send/route.ts
// Génération et envoi des rapports — appelé par cron (Vercel Cron ou pg_cron)
// Protégé par CRON_SECRET

import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { serverError } from "@/lib/apiError"
import { escapeHtml as esc } from "@/lib/escapeHtml"
import { emailShell, emailH1, emailP, emailButton, texteDeLEmail } from "@/lib/emailLayout"
import { EMAIL_FROM } from "@/lib/emailFrom"
import { noterPassage, sansAdresses } from "@/lib/journalCron"
import { gardeCron } from "@/lib/gardeCron"
import { estDuPourEnvoi } from "@/lib/abonnementsRapport"
import { APPAREIL_ROBOT } from "@/lib/robots"
import { accessibleOwnerIds } from "@/lib/team"
import { raisonDuRapportAbonne, pagesDuRapport, detailDuPassage, type RaisonNonEnvoi } from "@/lib/rapportHebdo"
import { evolution, nombreFr } from "@/lib/chiffresLisibles"
import { dateLisible } from "@/lib/jourDuCommerce"


function buildEmailHtml(params: {
  userName:   string
  period:     string
  totalViews: number
  prevViews:  number
  totalScans: number
  prevScans:  number
  topLinks:   { target: string; clicks: number }[]
  topPages:   { title: string; views: number }[]
  unsubUrl:   string
}): string {
  // « +0 % » sur 1000 → 1002 vues : stable, alors que ça avait bougé. L'écart
  // réel descend d'une décimale plutôt que d'être arrondi à rien (lot v102).
  const g = (curr: number, prev: number) => {
    const e = evolution(curr, prev)
    return e.sens === "hausse" || e.sens === "baisse" ? { texte: e.texte, up: e.sens === "hausse" } : null
  }

  const viewGrowth  = g(params.totalViews, params.prevViews)
  const scanGrowth  = g(params.totalScans, params.prevScans)

  const growthBadge = (g: { texte: string; up: boolean } | null) => {
    if (!g) return ""
    const color = g.up ? "#39FF8F" : "#FF6B6B"
    const arrow = g.up ? "↑" : "↓"
    // Le signe est porté par la flèche : le texte du module le porte déjà, on
    // ne le répète pas.
    return `<span style="color:${color};font-size:13px;font-weight:700;margin-left:6px;">${arrow} ${esc(g.texte.replace(/^[+−-]/, ""))}</span>`
  }

  // Carte KPI (chiffre dore + libelle), coherente avec l'email hebdo. valueHtml peut
  // contenir le badge de croissance (deja stylise).
  const statCard = (valueHtml: string, label: string, side: "left" | "right") => {
    const pad = side === "left" ? "0 6px 0 0" : "0 0 0 6px"
    return `<td width="50%" valign="top" style="padding:${pad};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.18);border-radius:12px;"><tr><td align="center" style="padding:20px 12px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#C9A84C;line-height:1;">${valueHtml}</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8A8478;text-transform:uppercase;letter-spacing:1px;margin-top:7px;">${label}</div>
      </td></tr></table>
    </td>`
  }

  // Tableau "Top" (liens / pages) reutilisable, palette de la coquille partagee.
  const topTable = (title: string, rows: { label: string; value: number; accent: string }[]) => {
    if (!rows.length) return ""
    const body = rows.slice(0, 5).map((r, i) =>
      `<tr>
        <td style="padding:8px 12px;color:#8A8478;font-family:Arial,Helvetica,sans-serif;font-size:12px;">#${i + 1}</td>
        <td style="padding:8px 12px;color:#F5F0E8;font-family:Arial,Helvetica,sans-serif;font-size:12px;word-break:break-all;">${esc(r.label)}</td>
        <td style="padding:8px 12px;color:${r.accent};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;text-align:right;">${nombreFr(r.value)}</td>
      </tr>`
    ).join("")
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin:0 0 20px;overflow:hidden;">
      <tr><td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#F5F0E8;">${title}</td></tr>
      <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table></td></tr>
    </table>`
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrowg.com"

  const content = `
    ${emailH1(`Bonjour ${esc(params.userName)} 👋`)}
    ${emailP(`Voici vos performances · ${esc(params.period)}`, 22)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr>
      ${statCard(`${nombreFr(params.totalViews)}${growthBadge(viewGrowth)}`, "Vues de page", "left")}
      ${statCard(`${nombreFr(params.totalScans)}${growthBadge(scanGrowth)}`, "Scans QR", "right")}
    </tr></table>
    ${topTable("🔗 Top liens cliqués", params.topLinks.map(l => ({ label: l.target.slice(0, 60), value: l.clicks, accent: "#C9A84C" })))}
    ${topTable("📄 Top pages", params.topPages.map(p => ({ label: p.title, value: p.views, accent: "#39FF8F" })))}
    ${emailButton("Voir le tableau de bord complet →", `${appUrl}/dashboard/analytics`)}
  `

  const footer = `Vous recevez ce rapport car vous êtes abonné aux notifications QRowg.<br><a href="${params.unsubUrl}" style="color:#8A8478;text-decoration:underline;">Se désabonner</a> · <a href="${appUrl}/dashboard/settings" style="color:#8A8478;text-decoration:underline;">Gérer les notifications</a>`

  return emailShell({ preheader: `Vos performances QRowg · ${esc(params.period)}`, content, footer })
}

// Nom de cette tâche dans le journal (lib/journalCron) : sans trace, personne ne
// pouvait dire si elle s'exécutait.
const TACHE = "reports/send" as const

export async function GET(req: NextRequest) {
  // Vérifier le secret cron
  // Contrôle d'entrée commun aux cinq tâches (lib/gardeCron) : un refus laisse
  // une trace dans le journal.
  const refus = await gardeCron(req, TACHE, { resendRequis: true })
  if (refus) return refus

  // Sans paramètre, on traite les deux fréquences : c'est le filtre `last_sent_at`
  // ci-dessous qui décide qui est dû. La tâche planifiée passait `?frequency=monthly`
  // et tournait le 1er du mois — l'abonnement HEBDOMADAIRE, proposé et vendu dans
  // l'écran Analytics, n'était donc jamais envoyé à personne.
  const frequencyParam = req.nextUrl.searchParams.get("frequency") as "weekly" | "monthly" | null

  const debut = Date.now()
  try {
    const supabase = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrowg.com"

    // 1. Récupérer les abonnements actifs à traiter
    const now = new Date()
    const { data: subs } = await supabase
      .from("report_subscriptions")
      .select("id, user_id, email, frequency, last_sent_at")
      .eq("enabled", true)
      .in("frequency", frequencyParam ? [frequencyParam] : ["weekly", "monthly"])

    if (!subs?.length) {
      await noterPassage(supabase, TACHE, "rien", "aucun abonnement actif", Date.now() - debut)
      return NextResponse.json({ sent: 0, message: "Aucun abonnement actif" })
    }

    // Qui est dû aujourd'hui (lib/abonnementsRapport) : c'est ce filtre, et non
    // l'horaire de la tâche, qui espace les envois.
    const due = subs.filter(sub => estDuPourEnvoi(sub.frequency, sub.last_sent_at, now))

    let sent = 0
    const errors: string[] = []
    // Un destinataire écarté doit apparaître dans le journal : « 0 envoyé(s) »
    // ne distinguait pas « personne à servir » de « tout le monde sauté en
    // silence » (lot v91).
    const ignores: Partial<Record<Exclude<RaisonNonEnvoi, null>, number>> = {}
    const ignorer = (r: Exclude<RaisonNonEnvoi, null>) => { ignores[r] = (ignores[r] ?? 0) + 1 }

    for (const sub of due) {
      try {
        // 2. Récupérer les données de l'utilisateur
        const days = sub.frequency === "weekly" ? 7 : 30
        const prevDays = days * 2
        const since = new Date(now); since.setDate(since.getDate() - days)
        const prevSince = new Date(now); prevSince.setDate(prevSince.getDate() - prevDays)

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, preferences")
          .eq("id", sub.user_id)
          .single()

        // L'interrupteur « Rapport hebdomadaire » des Réglages gouverne les deux
        // tâches : sans cela l'écran Réglages ment à qui le coupe (lot v91).
        const refus = raisonDuRapportAbonne({ email: sub.email, preferences: (profile as any)?.preferences, frequence: sub.frequency })
        if (refus) { ignorer(refus); continue }

        // Périmètre : les pages du compte ET celles des équipes dont il est
        // membre, tous statuts confondus. Une visite enregistrée pendant la
        // semaine reste un fait si la page repasse en brouillon le lundi.
        const ownerIds = await accessibleOwnerIds(supabase, sub.user_id)
        const { data: pages } = await supabase
          .from("pages")
          .select("id, title, total_views")
          .in("user_id", ownerIds)

        // Aucune page : le rapport part quand même, avec ses zéros. Sauter en
        // silence laissait `last_sent_at` intact — l'abonnement était re-tenté
        // tous les jours, indéfiniment, sans jamais rien envoyer.
        const pageIds = pagesDuRapport(pages)

        const vide = pageIds.length === 0
        const { count: totalViews } = vide ? { count: 0 } : await supabase
          .from("page_views")
          .select("id", { count: "exact", head: true })
          .in("page_id", pageIds)
          .gte("viewed_at", since.toISOString()).neq("device", APPAREIL_ROBOT)

        const { count: prevViews } = vide ? { count: 0 } : await supabase
          .from("page_views")
          .select("id", { count: "exact", head: true })
          .in("page_id", pageIds)
          .gte("viewed_at", prevSince.toISOString())
          .lt("viewed_at", since.toISOString()).neq("device", APPAREIL_ROBOT)

        const { count: totalScans } = vide ? { count: 0 } : await supabase
          .from("scans")
          .select("id", { count: "exact", head: true })
          .in("page_id", pageIds)
          .gte("scanned_at", since.toISOString()).neq("device", APPAREIL_ROBOT)

        const { count: prevScans } = vide ? { count: 0 } : await supabase
          .from("scans")
          .select("id", { count: "exact", head: true })
          .in("page_id", pageIds)
          .gte("scanned_at", prevSince.toISOString())
          .lt("scanned_at", since.toISOString()).neq("device", APPAREIL_ROBOT)

        const { data: clicksRaw } = vide ? { data: [] } : await supabase
          .from("block_clicks")
          .select("click_target")
          .in("page_id", pageIds)
          .gte("clicked_at", since.toISOString())
          .not("click_target", "is", null)

        // Agréger top liens
        const linkMap: Record<string, number> = {}
        ;(clicksRaw ?? []).forEach(c => {
          if (c.click_target) linkMap[c.click_target] = (linkMap[c.click_target] || 0) + 1
        })
        const topLinks = Object.entries(linkMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([target, clicks]) => ({ target, clicks }))

        // Top pages SUR LA PÉRIODE. `pages.total_views` est le cumul depuis la
        // création de la page : le tableau annonçait « Menu — 5 400 » sous un titre
        // « Mois de … » où la carte « Vues » affichait 0. Deux chiffres contradictoires
        // dans le même email.
        const { data: vuesPeriode } = vide ? { data: [] } : await supabase
          .from("page_views").select("page_id")
          .in("page_id", pageIds).gte("viewed_at", since.toISOString()).neq("device", APPAREIL_ROBOT)
        const parPage: Record<string, number> = {}
        for (const v of (vuesPeriode ?? [])) if (v.page_id) parPage[v.page_id] = (parPage[v.page_id] || 0) + 1
        const titreDe = new Map((pages ?? []).map(p => [p.id as string, p.title as string]))
        const topPages = Object.entries(parPage)
          .sort((a, b) => b[1] - a[1]).slice(0, 5)
          .map(([id, views]) => ({ title: titreDe.get(id) ?? "Page", views }))

        // Le libellé mensuel nommait le mois de `since` : un rapport envoyé le 1er mars
        // couvre le 30 janvier au 1er mars et s'intitulait « Mois de janvier ».
        // On annonce la période réellement mesurée.
        const jour = (d: Date) => dateLisible(d)
        const periodLabel = sub.frequency === "weekly"
          ? `Semaine du ${jour(since)}`
          : `Du ${jour(since)} au ${jour(now)}`

        const unsubUrl = `${appUrl}/api/reports/unsubscribe?user=${sub.user_id}&freq=${sub.frequency}&token=${Buffer.from(sub.id).toString("base64url")}`

        const html = buildEmailHtml({
          userName:   profile?.full_name ?? "là",
          period:     periodLabel,
          totalViews: totalViews ?? 0,
          prevViews:  prevViews ?? 0,
          totalScans: totalScans ?? 0,
          prevScans:  prevScans ?? 0,
          topLinks,
          topPages,
          unsubUrl,
        })

        // 3. Envoyer via Resend (ou autre provider configuré)
        // Le garde d'entrée refuse déjà l'appel sans clé d'envoi : arriver ici sans
        // elle est impossible. L'ancienne version passait au suivant en silence, et
        // la tâche se journalisait « rien » — un état trompeusement sain.
        const resendKey = process.env.RESEND_API_KEY as string

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    EMAIL_FROM,
            to:      [sub.email],
            subject: `📊 Votre rapport ${sub.frequency === "weekly" ? "hebdomadaire" : "mensuel"} QRowg`,
            html,
            text: texteDeLEmail(html),
          }),
        })

        if (!res.ok) {
          const err = await res.text()
          throw new Error(`Resend error: ${err}`)
        }

        // 4. Mettre à jour last_sent_at
        await supabase
          .from("report_subscriptions")
          .update({ last_sent_at: now.toISOString() })
          .eq("id", sub.id)

        sent++
      } catch (e: any) {
        errors.push(sansAdresses(`${sub.email}: ${e.message}`))
      }
    }

    await noterPassage(supabase, TACHE, errors.length ? "erreur" : sent > 0 ? "ok" : "rien",
      sansAdresses(detailDuPassage(sent, ignores, errors)), Date.now() - debut)
    return NextResponse.json({ sent, total: due.length, ignores, errors })
  } catch (err: any) {
    // Une tâche qui plante ne laissait AUCUNE trace : c'est justement le cas
    // qu'on veut voir dans le journal.
    await noterPassage(createAdminClient(), TACHE, "erreur", err?.message ?? "erreur inconnue", Date.now() - debut)
    return serverError("reports/send", err)
  }
}
