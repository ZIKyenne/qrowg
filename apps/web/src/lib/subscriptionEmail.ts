// Email envoye a la souscription (essai ou achat). Construit avec la coquille
// partagee (emailLayout). Utilise par le webhook Stripe + une route de test.
import { escapeHtml } from "@/lib/escapeHtml"
import { emailShell, emailH1, emailP, emailButton } from "@/lib/emailLayout"
import { getPlan, fmtPrice } from "@/lib/plans"

const APP = "https://qrowg.com"

export function buildSubscriptionEmail(opts: {
  name?: string | null
  plan: string
  billing?: string | null   // "monthly" | "annual"
  trialDays?: number | null
}): { subject: string; html: string } {
  const p = getPlan(opts.plan)
  const label = escapeHtml(p.label)
  const clean = opts.name && String(opts.name).trim() ? escapeHtml(String(opts.name).trim()) : ""
  const greeting = clean ? `Bonjour ${clean},` : "Bonjour,"
  const price = opts.billing === "annual" ? fmtPrice(p.priceAnnual) : fmtPrice(p.priceMonthly)
  const trial = Number(opts.trialDays) > 0 ? Number(opts.trialDays) : 0

  const perks = p.features.slice(0, 4).map(f => `
        <tr><td width="22" valign="top" style="padding:0 0 10px;"><span style="display:inline-block;color:#C9A84C;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.4;">✓</span></td>
        <td valign="top" style="padding:0 0 10px 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.45;color:#E4DED0;">${escapeHtml(f)}</td></tr>`).join("")

  const intro = trial
    ? `votre essai gratuit de ${trial}&nbsp;jours du plan <strong style="color:#F5F0E8;">${label}</strong> vient de commencer. Toutes les fonctionnalités sont débloquées dès maintenant.`
    : `votre abonnement <strong style="color:#F5F0E8;">${label}</strong> est actif. Toutes les fonctionnalités sont débloquées.`

  const billingNote = trial
    ? `À l'issue de l'essai, votre abonnement se poursuivra à <strong style="color:#F5F0E8;">${price}&nbsp;€/mois</strong>, sauf annulation — possible à tout moment en un clic.`
    : `Vous êtes facturé <strong style="color:#F5F0E8;">${price}&nbsp;€/mois</strong>. Annulable à tout moment.`

  const content = `
      <div style="display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:5px 14px;color:#C9A84C;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:18px;">Plan ${label}</div>
      ${emailH1(`Bienvenue dans QRowg ${label}`)}
      ${emailP(greeting)}
      ${emailP(intro, 22)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.18);border-radius:12px;margin:0 0 24px;"><tr><td style="padding:20px 22px;">
        <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#C9A84C;">Ce qui est inclus</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${perks}
        </table>
      </td></tr></table>
      ${emailP(billingNote, 26)}
      ${emailButton("Accéder à mon espace →", `${APP}/dashboard`)}
  `

  return {
    subject: trial ? `Votre essai QRowg ${p.label} a commencé` : `Votre abonnement QRowg ${p.label} est actif`,
    html: emailShell({
      preheader: trial ? `Votre essai gratuit de ${trial} jours a commencé.` : `Votre abonnement ${p.label} est actif.`,
      content,
      footer: `QRowg · <a href="${APP}/dashboard/profile" style="color:#8A8478;text-decoration:underline;">Gérer mon abonnement</a>`,
    }),
  }
}
