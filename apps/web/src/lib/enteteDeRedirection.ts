// enteteDeRedirection.ts — la leçon apprise sur /q, et les écrans où elle ne
// l'était pas.
//
// Relevé du 14 septembre. Là où le produit envoie une redirection :
//
//   app/q/[code]/route.ts               l.21    302            no-store
//   app/api/domains/resolve/route.ts    l.57    301            AUCUN en-tête
//   app/api/domains/resolve/route.ts    l.87    301 (au choix) AUCUN en-tête
//   app/api/domains/resolve/route.ts    l.105   301 (au choix) AUCUN en-tête
//   app/api/domains/resolve/route.ts    l.142   302            AUCUN en-tête
//   app/api/domains/resolve/route.ts    l.157   302            AUCUN en-tête
//   app/api/subdomain/resolve/route.ts  l.64    302            AUCUN en-tête
//
// La redirection du QR — le cœur du produit, dont la destination se change à
// tout moment — porte `Cache-Control: no-store, must-revalidate`. Les six
// autres, dont les destinations sont tout aussi modifiables par le commerçant,
// n'en portent aucun.
//
// Un 301 est mis en cache par le NAVIGATEUR du visiteur, souvent sans date de
// péremption : celui qui l'a suivie une fois ne redemande plus. Conséquences :
//
//   · le commerçant se trompe de destination, corrige cinq minutes plus tard —
//     ses clients déjà passés restent sur la mauvaise adresse ;
//   · il supprime la règle, et l'écran lui promet qu'elle « cessera
//     immédiatement » — c'est faux pour tous ceux qui l'ont déjà suivie ;
//   · il change de domaine principal, et l'ancien continue de renvoyer vers le
//     précédent.
//
// `no-store` n'enlève rien au SEO : Google recrawle et obéit au 301 comme
// avant. Il rend seulement la correction possible. Module PUR.

/** Exactement ce que `/q/[code]` envoie déjà — une seule formulation. */
export const CACHE_REDIRECTION = "no-store, must-revalidate"

/**
 * Les en-têtes d'une redirection dont la destination peut changer. Tout ce que
 * le commerçant peut modifier depuis son tableau de bord en fait partie.
 */
export function entetesDeRedirection(extra?: Record<string, string>): Record<string, string> {
  return { ...(extra ?? {}), "Cache-Control": CACHE_REDIRECTION }
}

/** 301 et 308 : le navigateur a le droit de ne plus jamais redemander. */
export function estPermanente(type: number | null | undefined): boolean {
  return type === 301 || type === 308
}

/**
 * Ce que l'aide « 301 vs 302 » ne disait pas : le SEO n'est pas le seul en jeu.
 * Renvoie `null` pour un 302 — il n'y a rien à signaler.
 */
export function phraseCacheNavigateur(type: number | null | undefined): string | null {
  if (!estPermanente(type)) return null
  return "Le navigateur de vos visiteurs retient une redirection permanente : ceux qui l'ont déjà suivie continueront d'y aller quelque temps, même après une modification."
}

type Regle = {
  from_domain?: string | null
  from_path?: string | null
  to_url?: string | null
  redirect_type?: number | null
  hit_count?: number | null
}

const texte = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

/**
 * Ce qu'on dit avant de supprimer une règle. L'écran promettait qu'elle
 * « cessera immédiatement » : vrai pour les visiteurs à venir, faux pour ceux
 * qui l'ont déjà suivie quand elle était permanente.
 */
export function phraseSuppression(r: Regle | null | undefined): string {
  const source = `${texte(r?.from_domain)}${texte(r?.from_path)}`
  const base = source && texte(r?.to_url)
    ? `${source} ne redirigera plus vers ${texte(r?.to_url)}.`
    : "Cette redirection ne s'appliquera plus."
  const passages = Number(r?.hit_count ?? 0)
  if (!estPermanente(r?.redirect_type)) return `${base} Les prochains visiteurs arriveront directement sur la source.`
  const deja = passages > 0
    ? `Les ${passages.toLocaleString("fr-FR")} visiteurs déjà passés`
    : "Les visiteurs qui l'ont déjà suivie"
  return `${base} ${deja} peuvent continuer d'être redirigés quelque temps : leur navigateur retient une redirection permanente.`
}

/** Même vérité quand on se contente de la désactiver. */
export function phraseDesactivation(type: number | null | undefined): string {
  return estPermanente(type)
    ? "Désactivée pour les nouveaux visiteurs. Ceux qui l'ont déjà suivie peuvent continuer d'être redirigés quelque temps."
    : "Désactivée : plus personne n'est redirigé."
}
