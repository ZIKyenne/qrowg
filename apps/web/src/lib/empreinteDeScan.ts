// empreinteDeScan.ts — l'empreinte d'appareil d'un scan, et le sel qui la protège.
//
// ── Ce qui a été trouvé le 29 septembre ────────────────────────────────────
//
// La redirection écrit, pour chaque scan, `ip_hash = SHA-256(ip | navigateur |
// sel)`. Le commentaire d'origine disait, à juste titre, que l'adresse n'est
// « JAMAIS stockée en clair ». Mais le sel valait
// `process.env.SCAN_IP_SALT ?? "qrowg-scan-v1"` — et la variable n'est pas
// définie en production (vérifié dans les variables du projet). Le sel était
// donc celui écrit en clair dans ce dépôt.
//
// Pourquoi ça compte. La politique RLS `Lecture scans propres` laisse chaque
// propriétaire de page lire SES scans, `ip_hash` compris. Avec un sel connu,
// retrouver l'adresse revient à essayer les quatre milliards d'adresses IPv4 —
// quelques minutes sur une machine ordinaire. Et le navigateur, qui devrait
// ajouter de l'entropie, est lui-même rangé en clair dans les colonnes `os` et
// `browser` de la même ligne : les candidats se comptent alors par dizaines.
// Autrement dit : un client pouvait dés-anonymiser les visiteurs de son propre
// QR code. C'est exactement ce que la CNIL distingue — une pseudonymisation dont
// le secret est public n'en est plus une.
//
// ── La règle posée ─────────────────────────────────────────────────────────
//
// **On n'écrit jamais une empreinte qu'on ne sait pas protéger.** Sans sel
// secret, on n'écrit rien : le compte de visiteurs uniques devient approximatif,
// ce qui est un moindre mal comparé à une adresse retrouvable.
//
// Module PUR : il reçoit l'environnement, ne lit rien, ne hache rien lui-même
// (la fonction de hachage est injectée). Testable sans Node ni requête.

/** Longueur minimale d'un sel pour valoir quelque chose contre une attaque exhaustive. */
export const LONGUEUR_MIN_SEL = 16

/**
 * Le sel réellement utilisable, ou `null`.
 *
 * `SCAN_IP_SALT` est le réglage prévu. À défaut, on se rabat sur un secret
 * serveur qui existe déjà et ne sort jamais de la machine — mieux qu'une
 * constante publique, et sans rien demander à personne. Ce repli est un
 * dépannage, pas une cible : `SCAN_IP_SALT` reste la bonne réponse, parce qu'un
 * sel dédié se change sans toucher à l'accès à la base.
 */
export function selDeHachage(env: Record<string, string | undefined>): string | null {
  const dedie = (env.SCAN_IP_SALT || "").trim()
  if (dedie.length >= LONGUEUR_MIN_SEL) return dedie
  const repli = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
  if (repli.length >= LONGUEUR_MIN_SEL) return `repli:${repli}`
  return null
}

/** Le sel est-il celui qu'on a choisi, ou le dépannage ? Sert au diagnostic. */
export function selEstDedie(env: Record<string, string | undefined>): boolean {
  return (env.SCAN_IP_SALT || "").trim().length >= LONGUEUR_MIN_SEL
}

/**
 * L'empreinte d'un appareil, ou `null` quand on ne peut pas la protéger.
 *
 * `hacher` est injectée pour que ce module reste pur — la redirection lui passe
 * SHA-256. Une adresse absente rend `null` : on n'invente pas d'empreinte.
 */
export function empreinteAppareil(
  ip: string | null | undefined,
  navigateur: string | null | undefined,
  sel: string | null,
  hacher: (entree: string) => string,
): string | null {
  const adresse = (ip || "").trim()
  if (!adresse || !sel) return null
  return hacher(`${adresse}|${navigateur || ""}|${sel}`)
}
