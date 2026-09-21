// verificationDns.ts — le bouton « Vérifier DNS » qui ne vérifiait plus rien.
//
// Relevé du 14 septembre, sur un domaine personnalisé déjà activé. Le
// commerçant a changé de registrar hier ; son site est hors ligne :
//
//     TXT     : (supprimé)
//     CNAME   : www.lecomptoir.fr → parking.registrar.com
//     A       : lecomptoir.fr     → 91.195.240.19  (page de parking)
//     HTTPS   : 403
//
// Ce que l'écran répond quand il clique « Vérifier DNS » :
//
//     ✓ txt      Propriété vérifiée
//     ✓ cname    CNAME configuré
//     ✓ arecord  A record configuré
//     ✓ http     Domaine actif et accessible        allOk = true
//
// Aucune résolution n'est faite : `GET /api/domains/check` court-circuite les
// quatre contrôles dès que `verified` vaut true en base. Le bouton dont c'est
// le seul métier répond depuis un booléen écrit le jour de l'activation.
//
// Et quand il vérifie vraiment, les comparaisons sont des `includes` :
//
//     CNAME « vercel.parking-registrar.com  » → accepté
//     CNAME « cname.vercel-dns.com.evil.net » → accepté
//     A [91.195.240.19, 76.76.21.21]         → refusé  (Vercel est là, en 2e)
//     TXT « v=spf1 include:abc123def.mail.fr ~all » attendu « abc123 » → accepté
//
// Un domaine se vérifie en le résolvant, à chaque fois, et en comparant des
// noms d'hôte, pas des morceaux de chaîne. Module PUR.

import { dateLisible } from "./jourDuCommerce"
/** Les IP publiées par Vercel pour un domaine racine. */
export const VERCEL_IPS = ["76.76.21.21", "76.76.21.22"]

/** La cible CNAME de Vercel, et le domaine dont tout sous-domaine est valide. */
export const VERCEL_CNAME = "cname.vercel-dns.com"
export const DOMAINE_VERCEL_DNS = "vercel-dns.com"

/** Le préfixe de l'enregistrement de propriété écrit par le produit. */
export const PREFIXE_TXT = "qrowg-verify="

const texte = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

/** Un nom d'hôte comparable : minuscules, sans point final, sans guillemets. */
export function hoteNormalise(v: unknown): string {
  return texte(v).replace(/^"|"$/g, "").replace(/\.$/, "").toLowerCase()
}

/** La valeur exacte que le commerçant doit poser dans son DNS. */
export function valeurTxtAttendue(jeton: string | null | undefined): string {
  return `${PREFIXE_TXT}${texte(jeton)}`
}

/** L'enregistrement TXT du produit, s'il existe — pour dire « trouvé, mais faux ». */
export function txtDuProduit(records: string[] | null | undefined): string | null {
  const r = (records ?? []).map(x => texte(x)).find(x => x.toLowerCase().startsWith(PREFIXE_TXT))
  return r ?? null
}

/**
 * La preuve de propriété correspond-elle ?
 *
 * Égalité EXACTE avec `qrowg-verify=<jeton>`. Un `includes` acceptait
 * « v=spf1 include:abc123def.mail.fr ~all » comme preuve dès que le jeton
 * apparaissait quelque part dans un autre enregistrement du domaine.
 */
export function txtCorrespond(records: string[] | null | undefined, jeton: string | null | undefined): boolean {
  const attendu = valeurTxtAttendue(jeton).toLowerCase()
  if (!texte(jeton)) return false
  return (records ?? []).some(r => texte(r).replace(/^"|"$/g, "").toLowerCase() === attendu)
}

/**
 * Le CNAME pointe-t-il vers Vercel ?
 *
 * Comparaison de NOM D'HÔTE : la cible exacte, ou un sous-domaine de
 * `vercel-dns.com`. Un `includes("vercel")` acceptait
 * « vercel.parking-registrar.com » et « cname.vercel-dns.com.evil.net » —
 * c'est-à-dire un domaine que quelqu'un d'autre contrôle.
 */
export function cnameCorrespond(cible: unknown): boolean {
  const h = hoteNormalise(cible)
  if (!h) return false
  return h === VERCEL_CNAME || h === DOMAINE_VERCEL_DNS || h.endsWith(`.${DOMAINE_VERCEL_DNS}`)
}

/**
 * Le domaine racine pointe-t-il vers Vercel ?
 *
 * On regarde TOUS les enregistrements A, pas le premier : un domaine qui en
 * publie plusieurs est parfaitement valide, et l'ordre n'est pas garanti.
 */
export function aRecordCorrespond(records: string[] | null | undefined): boolean {
  return (records ?? []).some(ip => VERCEL_IPS.includes(hoteNormalise(ip)))
}

/** Celui qu'on affiche dans « trouvé : … » — le bon s'il y est, sinon le premier. */
export function ipAffichee(records: string[] | null | undefined): string {
  const liste = (records ?? []).map(hoteNormalise).filter(Boolean)
  return liste.find(ip => VERCEL_IPS.includes(ip)) ?? liste[0] ?? ""
}

export type EtatDomaine = "ok" | "en_attente" | "casse"

/**
 * L'état d'ensemble. « cassé » n'est pas « en attente » : un domaine qui n'a
 * jamais été configuré attend ; un domaine qui répond à côté est en panne, et
 * la nuance décide de ce qu'on dit au commerçant.
 */
export function etatGlobal(checks: { status: string }[] | null | undefined): EtatDomaine {
  const liste = checks ?? []
  if (!liste.length) return "en_attente"
  if (liste.every(c => c.status === "ok")) return "ok"
  return liste.some(c => c.status === "error") ? "casse" : "en_attente"
}

/**
 * La phrase qui manquait à l'écran : un domaine déjà vérifié dont le DNS ne
 * répond plus. On ne le dé-vérifie pas — couper le routage d'un site en ligne
 * sur un incident DNS passager serait pire — mais on cesse de dire que tout va
 * bien.
 */
export function phraseRegression(verifieLe: string | Date | null | undefined, fuseau?: string | null): string | null {
  const d = verifieLe instanceof Date ? verifieLe : (verifieLe ? new Date(verifieLe) : null)
  if (!d || Number.isNaN(d.getTime())) return "Ce domaine avait été vérifié, mais sa configuration DNS ne répond plus."
  // Lue en UTC, cette date pouvait annoncer la veille au commerçant (lot v137).
  const jour = dateLisible(d, { day: "numeric", month: "long", year: "numeric" }, fuseau)
  return `Ce domaine a été vérifié le ${jour}, mais sa configuration DNS ne répond plus aujourd'hui.`
}

/** Et la phrase quand tout va bien : depuis quand on le sait. */
export function phraseDerniereVerification(quand: Date = new Date()): string {
  const heure = dateLisible(quand, { hour: "2-digit", minute: "2-digit" })
  return `Vérifié à l'instant, à ${heure}.`
}
