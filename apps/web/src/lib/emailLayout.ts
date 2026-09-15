// =============================================================================
// lib/emailLayout.ts — Coquille "bulletproof" partagée pour les emails QRowg.
// Tables + styles 100% inline (Gmail & co strippent le <style>). Palette unique
// noir/or/creme. Rendu identique Gmail / Outlook / Apple Mail / mobile / PC.
// Les valeurs dynamiques (nom, etc.) doivent etre echappees par l'appelant.
// =============================================================================

import { typoFr, FINE, INSECABLE } from "./typographieFr"
import { escapeHtml } from "./escapeHtml"

const APP = "https://qrowg.com"
const GOLD = "#D4AF45"

// En-tete : logo capsule "QR"+"owg" par defaut, ou un nom de marque en serif dore
// (utilise par l'email de confirmation, envoye "de la part" du pro).
//
// Le nom est du TEXTE, et c'est la coquille qui l'echappe. Il l'attendait
// « deja echappe » : un contrat que l'appelant pouvait oublier, et qu'il a
// oublie ailleurs (voir `preheader` plus bas, lot v126).
function brandHeader(brandName?: string): string {
  if (brandName) {
    return `<a href="${APP}" style="text-decoration:none;color:#F5F0E8;font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:700;">${escapeHtml(brandName)}</a>`
  }
  return `<a href="${APP}" style="text-decoration:none;"><span style="display:inline-block;background:${GOLD};color:#0A0A0A;font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:19px;line-height:1;padding:7px 9px;border-radius:8px;">QR</span><span style="color:#F5F0E8;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:23px;">&nbsp;owg</span></a>`
}

// Bouton dore "bulletproof" (table + bgcolor -> rendu correct meme sur Outlook), centre.
export function emailButton(label: string, href: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" bgcolor="${GOLD}" style="border-radius:12px;">
        <a href="${href}" style="display:inline-block;padding:15px 34px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#0A0A0A;text-decoration:none;border-radius:12px;">${typoFr(label)}</a>
      </td></tr></table>
  </td></tr></table>`
}

// Titre + paragraphe reutilisables (styles coherents)
// `typoFr` traverse les balises sans les toucher : le HTML déjà stylisé passe,
// seules les phrases reçoivent leurs espaces insécables (lot v103).
export const emailH1 = (txt: string) =>
  `<h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:27px;font-weight:700;color:#F5F0E8;line-height:1.18;">${typoFr(txt)}</h1>`
export const emailP = (html: string, mb = 18) =>
  `<p style="margin:0 0 ${mb}px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#B8B2A4;">${typoFr(html)}</p>`

// Coquille complete : header + contenu (deja stylise) + footer.
/**
 * La coquille d'un e-mail.
 *
 * Deux de ses quatre entrées sont du TEXTE — l'aperçu de boîte de réception et
 * le nom de la marque — et **c'est elle qui les échappe**. Elle les injectait
 * bruts, en comptant sur l'appelant : deux appelants sur quatre le faisaient.
 * Celui du formulaire de contact, non — et son aperçu porte le nom saisi par
 * n'importe qui sur internet, dans un e-mail que l'équipe reçoit (lot v126).
 *
 * `content` et `footer` restent du HTML : c'est leur raison d'être, et l'appelant
 * les fabrique avec `emailH1`, `emailP`, `emailButton` — qui échappent ce qu'il
 * faut là où il faut.
 */
export function emailShell(opts: {
  preheader?: string   // TEXTE : echappe ici
  brandName?: string   // TEXTE : echappe ici ; sinon capsule QRowg
  content: string      // HTML interne, deja stylise
  footer?: string      // HTML interne du footer ; defaut = lien "Gerer les notifications"
}): string {
  const { brandName, content } = opts
  // Un aperçu tient en une ligne : ni retour à la ligne, ni roman. Les clients
  // en montrent 100 à 140 signes ; au-delà, c'est du poids pour rien.
  const preheader = escapeHtml(String(opts.preheader ?? "").replace(/\s+/g, " ").trim().slice(0, 160))
  const footer = opts.footer ?? `QRowg · <a href="${APP}/dashboard/settings" style="color:#8A8478;text-decoration:underline;">Gérer les notifications</a>`
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light">
<style>@media (max-width:600px){.px{padding-left:24px!important;padding-right:24px!important}.wrap{width:100%!important}}</style>
</head>
<body style="margin:0;padding:0;background:#080808;">
<div style="display:none;font-size:1px;color:#080808;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080808;"><tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#0C0B08;border:1px solid rgba(201,168,76,0.14);border-radius:16px;">
    <tr><td align="center" class="px" style="padding:32px 40px 24px;border-bottom:1px solid rgba(201,168,76,0.14);">${brandHeader(brandName)}</td></tr>
    <tr><td class="px" style="padding:34px 40px;">${content}</td></tr>
    <tr><td align="center" class="px" style="padding:22px 40px 30px;border-top:1px solid rgba(255,255,255,0.06);"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#6E6A60;">${footer}</p></td></tr>
  </table>
</td></tr></table>
</body></html>`
}

// =============================================================================
// La version texte — tirée du MÊME HTML (lot v125).
//
// Relevé du 15 septembre. Le produit envoie **neuf** e-mails : le message reçu
// sur une page, l'accusé au visiteur, le premier scan, le rapport hebdomadaire,
// la bienvenue, l'abonnement (deux fois), l'invitation d'équipe, le contact.
// **Aucun n'avait de version texte.** `html`, et rien d'autre.
//
// Un courriel HTML sans alternative texte est un courriel qui :
//
//  · part avec un point de spam en plus — c'est une règle de filtrage
//    universelle, et le produit vit de ce que le message ARRIVE ;
//  · s'affiche vide, ou en balises brutes, partout où le texte est préféré :
//    montre, client d'entreprise verrouillé, lecteur d'écran en mode texte,
//    connexion qui refuse de charger les images ;
//  · laisse l'aperçu de la boîte de réception se remplir tout seul — souvent
//    avec « QR owg », le premier texte que le gabarit rencontre.
//
// La règle posée : **un e-mail que le produit envoie existe aussi en texte.**
//
// Écrite à partir du HTML, pas à côté de lui : une seconde rédaction dérive, et
// un jour les deux ne disent plus la même chose.
// =============================================================================

// Les deux espaces invisibles viennent de `typographieFr` — le seul endroit du
// produit qui a le droit de les écrire (garde de `typographieFr.test`).
const ENTITES: Record<string, string> = {
  "&nbsp;": INSECABLE, "&#8239;": FINE, "&#160;": INSECABLE,
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
  "&#39;": "'", "&apos;": "'", "&rsquo;": "’", "&laquo;": "«", "&raquo;": "»",
  "&eacute;": "é", "&egrave;": "è", "&agrave;": "à", "&ccedil;": "ç", "&hellip;": "…",
  "&mdash;": "—", "&ndash;": "–", "&euro;": "€", "&times;": "×",
}

/**
 * La version texte d'un e-mail, tirée de son HTML.
 *
 * Un lien devient « libellé (adresse) » : dans un client texte, un libellé seul
 * ne mène nulle part. L'aperçu caché n'est pas repris — il redit le sujet, et il
 * n'était là que pour la boîte de réception.
 */
export function texteDeLEmail(html: string): string {
  if (!html || typeof html !== "string") return ""
  let s = html
  // Ce qui n'est pas du contenu : la tête, les styles, l'aperçu caché.
  s = s.replace(/<head[\s\S]*?<\/head>/gi, "")
  s = s.replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
  s = s.replace(/<div[^>]*display:\s*none[\s\S]*?<\/div>/gi, "")
  // Un lien mène quelque part : on garde où.
  s = s.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, dedans) => {
    const libelle = dedans.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
    if (!libelle) return String(href)
    return libelle.includes(href) ? libelle : `${libelle} (${href})`
  })
  // Ce qui faisait un saut de ligne à l'écran en fait un dans le texte.
  s = s.replace(/<br\s*\/?>/gi, "\n")
  s = s.replace(/<\/(p|h1|h2|h3|div|tr|li|table)>/gi, "\n")
  s = s.replace(/<li\b[^>]*>/gi, "• ")
  s = s.replace(/<\/td>/gi, "  ")
  s = s.replace(/<[^>]*>/g, "")
  for (const [e, c] of Object.entries(ENTITES)) s = s.split(e).join(c)
  s = s.replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
  // Mise au propre : pas d'espaces en fin de ligne, jamais trois sauts d'affilée.
  const finDeLigne = new RegExp(`[ \\t${INSECABLE}${FINE}]+$`, "g")
  s = s.split("\n").map(l => l.replace(finDeLigne, "").replace(/^[ \t]+/, "")).join("\n")
  s = s.replace(/\n{3,}/g, "\n\n")
  return s.trim()
}
