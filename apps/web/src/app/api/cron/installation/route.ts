// app/api/cron/installation/route.ts
// « Votre page est en ligne, son QR n'a pas encore été scanné. » Un seul e-mail,
// le 3e jour civil après la publication (lib/verifierInstallation). Appelé
// quotidiennement par Vercel Cron, protégé par CRON_SECRET (lib/gardeCron),
// commandé par l'interrupteur « Alertes de scans » des Réglages.

import { createAdminClient } from "@/lib/supabase/server"
import { fetchBorne } from "@/lib/appelQuiNAttendPas"
import { NextRequest, NextResponse } from "next/server"
import { serverError } from "@/lib/apiError"
import { EMAIL_FROM } from "@/lib/emailFrom"
import { noterPassage, sansAdresses } from "@/lib/journalCron"
import { gardeCron } from "@/lib/gardeCron"
import { APPAREILS_HUMAINS } from "@/lib/robots"
import { fenetrePublication, installationsAVerifier } from "@/lib/verifierInstallation"
import { installationHtml } from "@/lib/emailInstallation"
import { texteDeLEmail } from "@/lib/emailLayout"

export const runtime = "nodejs"

const TACHE = "cron/installation" as const

export async function GET(req: NextRequest) {
  const refus = await gardeCron(req, TACHE, { resendRequis: true })
  if (refus) return refus
  const resendKey = process.env.RESEND_API_KEY as string

  const debut = Date.now()
  try {
    const supabase = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrowg.com"
    const maintenant = new Date()
    const { depuis, jusqua } = fenetrePublication(maintenant)

    // Seulement la fenêtre du jour : jamais toutes les pages.
    const { data: pages, error } = await supabase
      .from("pages").select("id, user_id, title, slug, status, published_at")
      .eq("status", "published").gte("published_at", depuis).lt("published_at", jusqua)
      .order("created_at", { ascending: true }).limit(500)
    if (error) throw new Error(error.message)
    if (!pages?.length) { await noterPassage(supabase, TACHE, "rien", "aucune page publiée dans la fenêtre", Date.now() - debut); return NextResponse.json({ examinees: 0, envoyes: 0 }) }

    const ids = pages.map(p => p.id as string)
    // Un scan humain, n'importe quand : une page déjà scannée n'est pas à vérifier.
    const { data: scans, error: e2 } = await supabase
      .from("scans").select("page_id").in("page_id", ids).in("device", APPAREILS_HUMAINS)
      .order("scanned_at", { ascending: false }).limit(5000)
    if (e2) throw new Error(e2.message)   // sans les scans, on enverrait à tort : on s'arrête
    const scannees = new Set((scans ?? []).map(s => s.page_id as string))

    const proprios = [...new Set(pages.map(p => p.user_id as string))]
    const { data: profs, error: e3 } = await supabase
      .from("profiles").select("id, email, full_name, preferences").in("id", proprios)
      .order("created_at", { ascending: true }).limit(500)
    if (e3) throw new Error(e3.message)

    const aVerifier = installationsAVerifier(
      pages.map(p => ({ ...(p as any), scans: scannees.has(p.id as string) ? 1 : 0 })),
      (profs ?? []).map(p => ({ id: p.id as string, email: (p.email as string | null) ?? null, nom: (p.full_name as string | null) ?? null, preferences: p.preferences })),
      maintenant,
    )

    let envoyes = 0
    const erreurs: string[] = []
    for (const v of aVerifier) {
      try {
        const html = installationHtml(v, appUrl)
        const res = await fetchBorne("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json",
            // Un rejeu le même jour ne double pas l'envoi.
            "Idempotency-Key": `installation/${v.proprietaire.id}/${depuis.slice(0, 10)}`,
          },
          body: JSON.stringify({
            from: EMAIL_FROM, to: [v.proprietaire.email],
            subject: v.pages.length === 1 ? "Votre QR n'a pas encore été scanné" : "Vos QR n'ont pas encore été scannés",
            html, text: texteDeLEmail(html),
          }),
        }, "tache")
        if (!res.ok) throw new Error(await res.text())
        envoyes++
      } catch (e: any) {
        erreurs.push(`${v.proprietaire.email}: ${e?.message ?? "err"}`)
      }
    }

    await noterPassage(supabase, TACHE, erreurs.length ? "erreur" : envoyes > 0 ? "ok" : "rien", sansAdresses(erreurs.join(" · ")) || `${envoyes} envoyé(s) sur ${pages.length} page(s) examinée(s)`, Date.now() - debut)
    return NextResponse.json({ examinees: pages.length, envoyes, erreurs: erreurs.length ? erreurs.length : undefined })
  } catch (e: any) {
    await noterPassage(createAdminClient(), TACHE, "erreur", e?.message ?? "erreur inconnue", Date.now() - debut)
    return serverError("cron/installation", e)
  }
}
