// Aller chercher la page d'accueil d'un établissement — poliment, et sans se
// faire mener ailleurs.
//
// Le relevé lui-même vit dans `releveDeSite.ts`, qui est pur. Ici, seule la
// partie qui sort sur le réseau, avec ses gardes. Les règles sont des fonctions
// PURES, exportées et testées ; `allerChercher` ne fait que les appliquer.
//
// ── Les quatre gardes, et ce que chacune empêche ──────────────────────────
//
// 1. **L'adresse est publique** (`lib/safeUrl.isPublicHttpUrl`). Sans elle, une
//    URL fournie de l'extérieur ferait lire au serveur `http://127.0.0.1:…` ou
//    `http://169.254.169.254/` — les métadonnées de l'hébergeur, donc ses
//    identifiants.
//
// 2. **Chaque REDIRECTION est revérifiée.** C'est la garde que l'on oublie :
//    une adresse publique parfaitement légitime peut répondre `302` vers
//    `http://localhost/`. Contrôler seulement l'URL de départ ne protège de
//    rien. On suit donc les redirections à la main, une par une, et chaque
//    étape repasse le même examen.
//
// 3. **`robots.txt` est lu et respecté.** Un site qui écrit qu'il ne veut pas
//    être parcouru ne doit pas l'être, même pour lui proposer quelque chose.
//    Cela ne coûte qu'une requête, et c'est la différence entre un outil et un
//    aspirateur.
//
// 4. **Un délai et une taille maximale.** Une page qui ne répond pas bloquerait
//    la fonction jusqu'à son propre délai ; une page de 80 Mo la ferait tomber.
//
// ── Ce que ce module ne fait pas ──────────────────────────────────────────
//
// Il ne parcourt RIEN : une seule page, celle qu'on lui donne, et `robots.txt`.
// Pas de suivi de liens, pas de plan de site, pas de seconde page. Le besoin est
// de relever un établissement, pas de copier son site.

import "server-only"
import { isPublicHttpUrl } from "@/lib/safeUrl"
import { fetchBorne } from "@/lib/appelQuiNAttendPas"

/** Qui nous sommes. Un agent anonyme est un agent qu'on ne peut pas bloquer. */
export const AGENT = "QRowgBot/1.0 (+https://qrowg.com/robots)"

/** Le nom court, celui que `robots.txt` peut nommer. */
export const NOM_AGENT = "qrowgbot"

/** Le temps qu'on accepte de passer sur UN établissement, robots.txt compris. */
export const DELAI_MS = 8_000
export const TAILLE_MAX = 2 * 1024 * 1024   // 2 Mo : au-delà, ce n'est plus une page d'accueil
export const REDIRECTIONS_MAX = 4

export type Refus =
  | "adresse non publique"
  | "redirection vers une adresse non publique"
  | "trop de redirections"
  | "interdit par robots.txt"
  | "injoignable"
  | "réponse en erreur"
  | "ce n'est pas une page HTML"
  | "page trop lourde"

export type Resultat =
  | { ok: true; html: string; url: string }
  | { ok: false; refus: Refus }

/* ─────────────────────────── robots.txt, en pur ───────────────────────── */

type Groupe = { agents: string[]; autorise: string[]; interdit: string[] }

/**
 * Découpe un `robots.txt` en groupes.
 *
 * Un groupe est une suite de `User-agent` suivie de ses règles. Les lignes
 * inconnues (`Sitemap`, `Crawl-delay`, commentaires) sont ignorées sans faire
 * échouer la lecture : un fichier mal formé est la norme, pas l'exception.
 */
export function groupesRobots(texte: string): Groupe[] {
  const groupes: Groupe[] = []
  let courant: Groupe | null = null
  let attendDesAgents = false

  for (const brute of (texte ?? "").split(/\r?\n/)) {
    const ligne = brute.split("#")[0].trim()
    if (!ligne) continue
    const sep = ligne.indexOf(":")
    if (sep < 0) continue
    const champ = ligne.slice(0, sep).trim().toLowerCase()
    const valeur = ligne.slice(sep + 1).trim()

    if (champ === "user-agent") {
      // Plusieurs `User-agent` d'affilée partagent le même jeu de règles.
      if (!courant || !attendDesAgents) { courant = { agents: [], autorise: [], interdit: [] }; groupes.push(courant) }
      courant.agents.push(valeur.toLowerCase())
      attendDesAgents = true
      continue
    }
    if (!courant) continue
    if (champ === "allow") { courant.autorise.push(valeur); attendDesAgents = false }
    else if (champ === "disallow") { courant.interdit.push(valeur); attendDesAgents = false }
  }
  return groupes
}

/** Le motif correspond-il au chemin ? Gère `*` et l'ancrage `$`. */
function motifColle(motif: string, chemin: string): boolean {
  if (motif === "") return false   // `Disallow:` vide n'interdit rien
  const ancre = motif.endsWith("$")
  const corps = ancre ? motif.slice(0, -1) : motif
  const re = new RegExp(
    "^" + corps.split("*").map(p => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + (ancre ? "$" : ""),
  )
  return re.test(chemin)
}

/**
 * Le chemin est-il autorisé pour notre agent ?
 *
 * Deux règles de la norme, souvent oubliées, et qui changent le verdict :
 *
 *   · le groupe qui NOUS nomme l'emporte entièrement sur le groupe `*` — on ne
 *     fusionne pas les deux ;
 *   · à égalité de motif, c'est le plus LONG qui gagne, et `Allow` l'emporte
 *     sur `Disallow` de même longueur. Sans cela, un site qui interdit `/` puis
 *     autorise `/menu` serait lu comme interdisant tout.
 *
 * Un `robots.txt` absent ou illisible vaut autorisation : c'est le
 * comportement attendu, et refuser sur un fichier manquant reviendrait à ne
 * jamais rien relever.
 */
export function robotsAutorise(texte: string, chemin: string, agent = NOM_AGENT): boolean {
  const groupes = groupesRobots(texte)
  if (groupes.length === 0) return true

  const nous = groupes.filter(g => g.agents.includes(agent.toLowerCase()))
  const etoile = groupes.filter(g => g.agents.includes("*"))
  const retenus = nous.length ? nous : etoile
  if (retenus.length === 0) return true

  let meilleur: { longueur: number; autorise: boolean } | null = null
  const examiner = (motifs: string[], autorise: boolean) => {
    for (const m of motifs) {
      if (!motifColle(m, chemin)) continue
      const longueur = m.length
      // `Allow` l'emporte à longueur égale.
      if (!meilleur || longueur > meilleur.longueur || (longueur === meilleur.longueur && autorise)) {
        meilleur = { longueur, autorise }
      }
    }
  }
  for (const g of retenus) { examiner(g.interdit, false); examiner(g.autorise, true) }

  return meilleur ? (meilleur as { autorise: boolean }).autorise : true
}

/* ──────────────────────────── le type de contenu ──────────────────────── */

/** Seul du HTML nous intéresse. Un PDF ou une image n'ont rien à relever. */
export function estDuHtml(contentType: string | null): boolean {
  if (!contentType) return false
  const t = contentType.toLowerCase()
  return t.includes("text/html") || t.includes("application/xhtml+xml")
}

/* ────────────────────────────── l'exécution ───────────────────────────── */

/**
 * Un appel borné, qui ne suit AUCUNE redirection tout seul.
 *
 * Passe par `fetchBorne` : le dépôt a déjà son vocabulaire de délais
 * (`visiteur`, `ecran`, `tache`) et sa garde `appelQuiRenonce`, qui a
 * d'ailleurs attrapé la première version de ce module — elle appelait `fetch`
 * directement, avec son propre minuteur.
 *
 * Deux bornes se superposent, et c'est voulu : `signal` porte le budget TOTAL
 * accordé à un établissement (robots.txt + page), `DELAI_MS` borne chaque
 * requête prise séparément. `signalBorne` les combine ; là où
 * `AbortSignal.any` manque, c'est la borne par requête qui s'applique — une
 * protection de moins, jamais zéro.
 */
async function requete(url: string, signal: AbortSignal): Promise<Response | null> {
  try {
    return await fetchBorne(url, {
      redirect: "manual",          // c'est nous qui décidons de suivre, et où
      signal,
      headers: { "User-Agent": AGENT, "Accept": "text/html,application/xhtml+xml" },
    }, DELAI_MS)
  } catch { return null }
}

/**
 * Suit les redirections À LA MAIN, en revérifiant chaque étape.
 *
 * `redirect: "follow"` suivrait jusqu'à une adresse privée sans rien dire :
 * c'est le contournement classique d'une garde anti-SSRF posée seulement sur
 * l'URL de départ.
 */
async function suivre(depart: string, signal: AbortSignal): Promise<{ reponse: Response; url: string } | Refus> {
  let url = depart
  for (let saut = 0; saut <= REDIRECTIONS_MAX; saut++) {
    if (!isPublicHttpUrl(url)) return saut === 0 ? "adresse non publique" : "redirection vers une adresse non publique"
    const reponse = await requete(url, signal)
    if (!reponse) return "injoignable"
    if (reponse.status >= 300 && reponse.status < 400) {
      const vers = reponse.headers.get("location")
      if (!vers) return "réponse en erreur"
      try { url = new URL(vers, url).toString() } catch { return "réponse en erreur" }
      continue
    }
    return { reponse, url }
  }
  return "trop de redirections"
}

/** Lit le corps sans dépasser le plafond, même si l'en-tête de taille ment. */
async function lireBorne(reponse: Response): Promise<string | null> {
  const annonce = Number(reponse.headers.get("content-length") ?? "")
  if (Number.isFinite(annonce) && annonce > TAILLE_MAX) return null
  const corps = reponse.body
  if (!corps) return await reponse.text().then(t => (t.length > TAILLE_MAX ? null : t)).catch(() => null)

  const lecteur = corps.getReader()
  const morceaux: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await lecteur.read()
      if (done) break
      total += value.byteLength
      // On s'arrête DÈS le dépassement : un serveur qui annonce 10 ko et en
      // envoie 80 Mo ne doit pas nous remplir la mémoire.
      if (total > TAILLE_MAX) { await lecteur.cancel().catch(() => {}); return null }
      morceaux.push(value)
    }
  } catch { return null }

  const tout = new Uint8Array(total)
  let i = 0
  for (const m of morceaux) { tout.set(m, i); i += m.byteLength }
  return new TextDecoder("utf-8").decode(tout)
}

/**
 * Va chercher une page d'accueil, si tout l'autorise.
 *
 * Un seul délai couvre `robots.txt` ET la page : c'est le temps total qu'on
 * accepte de passer sur un établissement, pas le temps par requête.
 */
export async function allerChercher(url: string): Promise<Resultat> {
  if (!isPublicHttpUrl(url)) return { ok: false, refus: "adresse non publique" }

  const minuteur = AbortSignal.timeout(DELAI_MS)

  // 1. robots.txt d'abord. Absent ou illisible : on considère que c'est permis.
  let robots = ""
  try {
    const base = new URL(url)
    const r = await requete(new URL("/robots.txt", base).toString(), minuteur)
    if (r && r.ok && (r.headers.get("content-type") ?? "").includes("text/plain")) {
      robots = (await r.text().catch(() => "")).slice(0, 100_000)
    }
  } catch { /* pas de robots.txt : permis */ }

  const chemin = (() => { try { return new URL(url).pathname || "/" } catch { return "/" } })()
  if (!robotsAutorise(robots, chemin)) return { ok: false, refus: "interdit par robots.txt" }

  // 2. La page, redirections revérifiées une à une.
  const suite = await suivre(url, minuteur)
  if (typeof suite === "string") return { ok: false, refus: suite }
  const { reponse, url: finale } = suite

  if (!reponse.ok) return { ok: false, refus: "réponse en erreur" }
  if (!estDuHtml(reponse.headers.get("content-type"))) return { ok: false, refus: "ce n'est pas une page HTML" }

  const html = await lireBorne(reponse)
  if (html === null) return { ok: false, refus: "page trop lourde" }

  return { ok: true, html, url: finale }
}
