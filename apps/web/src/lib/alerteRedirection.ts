// alerteRedirection.ts — être prévenu quand les QR imprimés ne répondent plus
// (vague 3, revue du 23 nov.).
//
// `/q/<code>` est l'adresse que portent tous les QR imprimés de tous les clients.
// Quand la base ne répond pas, rien ne le disait à personne : une ligne perdue
// dans les journaux de l'hébergeur, qui ne remontent que quelques heures.
//
// Ici : une ligne reconnaissable dans les journaux, TOUJOURS (« [ALERTE /q] »,
// pour un filtre ou un drain), et un e-mail aux administrateurs (ADMIN_EMAILS),
// au plus un par heure — une panne ne doit pas devenir mille e-mails. L'e-mail
// passe par la coquille commune. Rien ici ne jette : une alerte ratée ne doit
// jamais faire échouer la réponse au client qui scanne.

import { administrateurs } from "@/lib/admin"
import { rateLimit } from "@/lib/rateLimit"
import { emailShell, emailH1, emailP, texteDeLEmail } from "@/lib/emailLayout"
import { EMAIL_FROM } from "@/lib/emailFrom"
import { escapeHtml } from "@/lib/escapeHtml"
import { fetchBorne } from "@/lib/appelQuiNAttendPas"

export type PanneDuQr = { code: string; cause: string; secours: boolean }

/** Le texte de l'alerte (pur, testé). */
export function sujetDeLAlerte(p: PanneDuQr): string {
  return p.secours
    ? "QRowg — la base ne répond pas : les QR passent par leur destination de secours"
    : "QRowg — la base ne répond pas : des QR affichent « Indisponible »"
}
export function corpsDeLAlerte(p: PanneDuQr, quand: Date): string {
  return emailShell({
    preheader: sujetDeLAlerte(p),
    content: [
      emailH1("Les QR imprimés ne joignent plus la base"),
      emailP(`Le ${escapeHtml(quand.toISOString())}, la lecture du code <b>${escapeHtml(p.code)}</b> a échoué : ${escapeHtml(p.cause.slice(0, 300))}.`),
      emailP(p.secours
        ? "Ce scan a été envoyé vers la dernière destination connue de ce QR. Les QR jamais scannés depuis le dernier démarrage n'en ont pas."
        : "Aucune destination de secours n'était connue pour ce code : le client a vu l'écran « Indisponible »."),
      emailP("Au plus une alerte par heure. Les journaux de l'hébergeur portent chaque occurrence, sous « [ALERTE /q] »."),
    ].join(""),
  })
}

export async function signalerPanneDuQr(p: PanneDuQr): Promise<void> {
  try {
    console.error(`[ALERTE /q] base injoignable — code=${p.code} secours=${p.secours ? "oui" : "non"} cause=${p.cause.slice(0, 200)}`)
    const a = administrateurs()
    const cle = process.env.RESEND_API_KEY
    if (!a.length || !cle) return
    if (!(await rateLimit("alerte:q-panne", 1, 60 * 60_000))) return
    const html = corpsDeLAlerte(p, new Date())
    await fetchBorne("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: a, subject: sujetDeLAlerte(p), html, text: texteDeLEmail(html) }),
    }, "visiteur")
  } catch { /* une alerte ratée n'empêche rien */ }
}
