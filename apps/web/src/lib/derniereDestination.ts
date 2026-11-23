// derniereDestination.ts — le secours d'un QR imprimé quand la base ne répond pas
// (vague 3, revue du 23 nov.).
//
// Un QR est collé sur une vitrine pour des années. Si la base tombe dix minutes un
// samedi soir, chaque scan affichait « Code inconnu » : le client conclut que le
// QR est mort, et ne le rescanne jamais. Or la destination de ce code était
// connue une seconde plus tôt.
//
// On retient donc, à chaque scan RÉUSSI, la destination servie ; en cas de panne,
// on y renvoie. Deux étages :
//  · la mémoire de l'instance (gratuite, mais propre à chaque instance) ;
//  · Upstash Redis si ses deux variables sont posées (le même service que le
//    limiteur de débit, lib/rateLimit) : partagé, et qui survit aux redémarrages.
// Sans Upstash, le secours vaut pour les instances déjà chaudes — c'est déjà ça.
//
// Ce qui n'est JAMAIS retenu : une destination derrière un mot de passe (le
// secours contournerait la protection), un QR qui n'est plus actif (on l'oublie
// dès qu'un scan le voit en pause, expiré ou en brouillon), un schéma autre que
// http(s), tel:, mailto:. Rien ici ne jette : un secours raté n'empêche rien.

import { fetchBorne } from "@/lib/appelQuiNAttendPas"

const TTL_S = 90 * 24 * 3600
const SCHEMAS = /^(https?:\/\/|tel:|mailto:)/i
const CODE = /^[A-Za-z0-9_-]{1,64}$/
const cle = (code: string) => `qrdest:${code}`

export type Magasin = {
  lire: (k: string) => Promise<string | null>
  ecrire: (k: string, v: string) => Promise<void>
  effacer: (k: string) => Promise<void>
}

const memoire = new Map<string, string>()
const MAX_MEMOIRE = 5000

function upstash(): Magasin | null {
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const appel = async (cmd: (string | number)[]) => {
    const r = await fetchBorne(`${url}/pipeline`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([cmd]), cache: "no-store",
    }, "visiteur")
    if (!r.ok) throw new Error(`upstash ${r.status}`)
    const d = (await r.json()) as { result?: unknown; error?: string }[]
    if (d?.[0]?.error) throw new Error(d[0].error)
    return d?.[0]?.result
  }
  return {
    lire: async k => { const v = await appel(["GET", k]); return typeof v === "string" ? v : null },
    ecrire: async (k, v) => { await appel(["SET", k, v, "EX", TTL_S]) },
    effacer: async k => { await appel(["DEL", k]) },
  }
}

/** Retient la destination servie (à appeler après un scan réussi). N'écrit que si elle a changé. */
export async function retenirDestination(code: string, dest: string, distant: Magasin | null = upstash()): Promise<void> {
  if (!CODE.test(code) || typeof dest !== "string" || dest.length > 2000 || !SCHEMAS.test(dest)) return
  if (memoire.get(code) === dest) return
  if (memoire.size >= MAX_MEMOIRE) memoire.delete(memoire.keys().next().value as string)
  memoire.set(code, dest)
  try { await distant?.ecrire(cle(code), dest) } catch { /* secours raté : rien n'est empêché */ }
}

/** Oublie un code (QR plus actif, ou protégé par mot de passe). */
export async function oublierDestination(code: string, distant: Magasin | null = upstash()): Promise<void> {
  if (!CODE.test(code)) return
  memoire.delete(code)
  // Côté distant, toujours : une AUTRE instance a pu retenir ce code. Un appel par
  // scan d'un QR inactif — un cas rare, et sans attente (appelé dans after()).
  try { await distant?.effacer(cle(code)) } catch { /* rien */ }
}

/** La dernière destination connue, en cas de panne de la base. */
export async function destinationDeSecours(code: string, distant: Magasin | null = upstash()): Promise<string | null> {
  if (!CODE.test(code)) return null
  const local = memoire.get(code)
  if (local) return local
  try {
    const v = await distant?.lire(cle(code))
    return v && SCHEMAS.test(v) ? v : null
  } catch { return null }
}

/** Pour les tests : vide la mémoire de l'instance. */
export function _viderLaMemoire() { memoire.clear() }
