// emailsAbonnement.ts — les e-mails de la vie d'un abonnement qui manquaient.
//
// Revue « client payant » du 17 novembre : seuls partaient la bienvenue et,
// APRÈS coup, « des pages / des QR ont été mis en pause ». Un paiement refusé,
// une résiliation programmée, un changement de formule : rien. Le client
// découvrait la coupure, au lieu d'être prévenu à temps pour agir.
// Module PUR (construit le sujet et le HTML) ; le webhook Stripe envoie.

import { escapeHtml } from "@/lib/escapeHtml"
import { emailShell, emailH1, emailP, emailButton } from "@/lib/emailLayout"
import { getPlan, PLAN_RANK } from "@/lib/plans"
import { dateLisible } from "@/lib/jourDuCommerce"
import { avantagesEnPlus } from "@/app/dashboard/offreUtile"

const APP = "https://qrowg.com"
const FACTURATION = `${APP}/dashboard/settings`
const pied = `QRowg · <a href="${FACTURATION}" style="color:#8A8478;text-decoration:underline;">Gérer mon abonnement</a>`
const bonjour = (nom?: string | null) => {
  const n = nom && String(nom).trim() ? escapeHtml(String(nom).trim()) : ""
  return n ? `Bonjour ${n},` : "Bonjour,"
}
const liste = (lignes: string[]) => lignes.length === 0 ? "" : `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">${lignes.map(l => `
    <tr><td width="22" valign="top" style="padding:0 0 8px;color:#C9A84C;font-family:Arial,Helvetica,sans-serif;font-size:15px;">✓</td>
    <td valign="top" style="padding:0 0 8px 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.45;color:#E4DED0;">${escapeHtml(l)}</td></tr>`).join("")}
  </table>`

export type EmailAbonnement = { subject: string; html: string }

/** Paiement refusé : la carte à mettre à jour, avant que le compte ne repasse au gratuit. */
export function emailPaiementRefuse(o: { nom?: string | null; plan: string }): EmailAbonnement {
  const label = escapeHtml(getPlan(o.plan).label)
  const content = `
    ${emailH1("Votre paiement n'est pas passé")}
    ${emailP(bonjour(o.nom))}
    ${emailP(`Le dernier prélèvement de votre formule <strong style="color:#F5F0E8;">${label}</strong> a été refusé par votre banque. Il sera retenté automatiquement pendant quelques jours.`)}
    ${emailP("Sans carte valide, votre compte repassera au plan gratuit : ce qui dépasse ses limites sera mis en pause, y compris des QR déjà imprimés. Mettre à jour la carte suffit, rien d'autre à faire.", 24)}
    ${emailButton("Mettre à jour ma carte →", FACTURATION)}
  `
  return {
    subject: "Votre paiement QRowg n'est pas passé",
    html: emailShell({ preheader: "Mettez à jour votre carte pour garder votre formule.", content, footer: pied }),
  }
}

/** Résiliation demandée : la date, ce qui s'arrêtera, et comment revenir dessus. */
export function emailResiliationProgrammee(o: { nom?: string | null; plan: string; finIso?: string | null }): EmailAbonnement {
  const label = escapeHtml(getPlan(o.plan).label)
  const fin = o.finIso && Number.isFinite(Date.parse(o.finIso))
    ? dateLisible(Date.parse(o.finIso), { day: "numeric", month: "long", year: "numeric" })
    : null
  const quand = fin ? `le ${escapeHtml(fin)}` : "à la fin de la période payée"
  const content = `
    ${emailH1("Résiliation enregistrée")}
    ${emailP(bonjour(o.nom))}
    ${emailP(`Votre formule <strong style="color:#F5F0E8;">${label}</strong> reste active jusqu'à son terme, puis s'arrête ${quand}. Aucun autre prélèvement ne sera fait.`)}
    ${emailP("À cette date, votre compte passera au plan gratuit : ce qui dépasse ses limites sera mis en pause (rien n'est supprimé). Vous pouvez choisir dès maintenant ce qui reste actif.", 24)}
    ${emailButton("Annuler la résiliation →", FACTURATION)}
    ${emailP('<span style="font-size:13px;color:#8A8478;">Vous avez changé d\'avis ? Annuler la résiliation garde votre formule, sans rien ressaisir.</span>', 0)}
  `
  return {
    subject: fin ? `Votre formule QRowg ${getPlan(o.plan).label} s'arrête le ${fin}` : `Votre formule QRowg ${getPlan(o.plan).label} s'arrêtera en fin de période`,
    html: emailShell({ preheader: `Votre formule reste active jusqu'à son terme.`, content, footer: pied }),
  }
}

/** Changement de formule : ce qui change vraiment. Null si rien ne change. */
export function emailChangementDeFormule(o: { nom?: string | null; avant: string; apres: string }): EmailAbonnement | null {
  const a = getPlan(o.avant), b = getPlan(o.apres)
  if (a.id === b.id) return null
  const monte = (PLAN_RANK[b.id] ?? 0) > (PLAN_RANK[a.id] ?? 0)
  const content = monte
    ? `
    ${emailH1(`Vous êtes passé à ${b.label}`)}
    ${emailP(bonjour(o.nom))}
    ${emailP(`Votre formule passe de <strong style="color:#F5F0E8;">${escapeHtml(a.label)}</strong> à <strong style="color:#F5F0E8;">${escapeHtml(b.label)}</strong>. Ce qui est débloqué dès maintenant :`)}
    ${liste(avantagesEnPlus(a.id, b.id))}
    ${emailButton("Accéder à mon espace →", `${APP}/dashboard`)}
  `
    : `
    ${emailH1(`Votre formule est maintenant ${b.label}`)}
    ${emailP(bonjour(o.nom))}
    ${emailP(`Votre formule passe de <strong style="color:#F5F0E8;">${escapeHtml(a.label)}</strong> à <strong style="color:#F5F0E8;">${escapeHtml(b.label)}</strong>. Si des pages ou des QR dépassent ses limites, ils sont mis en pause et un autre message vous le précise — rien n'est supprimé.`, 24)}
    ${emailButton("Voir mon abonnement →", FACTURATION)}
  `
  return {
    subject: monte ? `Bienvenue dans QRowg ${b.label}` : `Votre formule QRowg est maintenant ${b.label}`,
    html: emailShell({ preheader: `Votre formule passe de ${a.label} à ${b.label}.`, content, footer: pied }),
  }
}
