// invitationsEquipe.ts — l'invitation morte qui occupe un siège payant.
//
// Relevé du 14 septembre. Depuis la migration `20260728160000`, une invitation
// d'équipe expire :
//
//     add column if not exists expires_at timestamptz not null
//       default (now() + interval '7 days')
//
// et `api/team/accept` refuse au-delà : « Invitation expirée. Demandez-en une
// nouvelle. » C'est la bonne décision — un lien transféré ne doit pas rester
// acceptable indéfiniment.
//
// Mais `expires_at` n'est lu QUE là. Ni la liste, ni le compteur de sièges, ni
// l'e-mail d'invitation ne le connaissent :
//
//   · `GET /api/team` : .select("id, email, role, created_at")  ← pas demandé ;
//     l'écran range donc une invitation morte depuis trois mois sous
//     « Invitations en attente », à côté de celle d'hier, sans rien distinguer ;
//   · le garde de sièges compte `accepted_at is null` sans regarder la date :
//     un lien mort occupe un siège Business pour toujours ;
//   · l'e-mail reçu par l'invité ne dit nulle part que le lien a une date limite.
//
// Relevé sur une équipe Business (limite 5), cinq invitations, aucune acceptée,
// trois expirées :
//
//     Membres  5 / 5
//     inviter quelqu'un → « Limite de 5 membres atteinte pour votre plan. »
//
// Zéro personne dans l'équipe, deux invitations vivantes, et le plan payant est
// « plein ». Module PUR.

/** Le délai de la migration `team_invitation_expiry` et de `api/team`. */
export const DUREE_INVITATION_JOURS = 7

/** En deçà, on prévient le propriétaire pendant que la relance est encore utile. */
export const SEUIL_BIENTOT_JOURS = 2

export type InvitationEquipe = {
  email?: string | null
  role?: string | null
  created_at?: string | null
  expires_at?: string | null
  accepted_at?: string | null
}

export type EtatInvitation = "active" | "bientot" | "expiree"

const MS_JOUR = 86_400_000

function date(v: string | null | undefined): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * La date à laquelle le lien cesse de fonctionner.
 *
 * `expires_at` d'abord — c'est ce que `api/team/accept` compare. À défaut (ligne
 * écrite avant la migration, colonne non demandée), on la reconstitue depuis la
 * création : c'est la règle du produit, pas une invention. Sans rien des deux,
 * on ne sait pas, et on ne fait pas semblant de savoir : `null`.
 */
export function expirationDe(inv: InvitationEquipe | null | undefined): Date | null {
  const exp = date(inv?.expires_at)
  if (exp) return exp
  const cree = date(inv?.created_at)
  return cree ? new Date(cree.getTime() + DUREE_INVITATION_JOURS * MS_JOUR) : null
}

/** Millisecondes restantes avant expiration ; `null` si la date est inconnue. */
export function resteAvantExpiration(inv: InvitationEquipe | null | undefined, maintenant: Date = new Date()): number | null {
  const exp = expirationDe(inv)
  return exp ? exp.getTime() - maintenant.getTime() : null
}

/**
 * L'état d'une invitation. Une invitation déjà acceptée n'est plus en attente —
 * elle n'apparaît pas dans la liste, mais la fonction ne ment pas si on la lui
 * donne : elle reste « active ».
 */
export function etatInvitation(inv: InvitationEquipe | null | undefined, maintenant: Date = new Date()): EtatInvitation {
  if (inv?.accepted_at) return "active"
  const reste = resteAvantExpiration(inv, maintenant)
  if (reste === null) return "active"
  if (reste <= 0) return "expiree"
  return reste <= SEUIL_BIENTOT_JOURS * MS_JOUR ? "bientot" : "active"
}

/** Le lien fonctionne-t-il encore, à cette seconde ? */
export function invitationVivante(inv: InvitationEquipe | null | undefined, maintenant: Date = new Date()): boolean {
  return etatInvitation(inv, maintenant) !== "expiree"
}

/** Les invitations qui mènent encore quelque part. */
export function invitationsVivantes<T extends InvitationEquipe>(liste: T[] | null | undefined, maintenant: Date = new Date()): T[] {
  return (liste ?? []).filter(i => invitationVivante(i, maintenant))
}

/** Celles qui n'y mènent plus — ce sont elles qu'il faut relancer ou annuler. */
export function invitationsExpirees<T extends InvitationEquipe>(liste: T[] | null | undefined, maintenant: Date = new Date()): T[] {
  return (liste ?? []).filter(i => !invitationVivante(i, maintenant))
}

/**
 * Les sièges réellement occupés : les membres, plus les invitations qui peuvent
 * encore être acceptées. Un lien mort ne prend la place de personne.
 */
export function siegesOccupes(
  nbMembres: number,
  invitations: InvitationEquipe[] | null | undefined,
  maintenant: Date = new Date(),
): number {
  const m = Number.isFinite(nbMembres) && nbMembres > 0 ? Math.floor(nbMembres) : 0
  return m + invitationsVivantes(invitations, maintenant).length
}

function jours(ms: number): number {
  return Math.floor(ms / MS_JOUR)
}

/**
 * Ce qu'on affiche à côté d'une invitation en attente — la seule information qui
 * manquait : jusqu'à quand ce lien fonctionne.
 */
export function phraseInvitation(inv: InvitationEquipe | null | undefined, maintenant: Date = new Date()): string | null {
  const reste = resteAvantExpiration(inv, maintenant)
  if (reste === null) return null
  if (reste <= 0) {
    const d = jours(-reste)
    return d < 1
      ? "Expirée — le lien ne fonctionne plus"
      : `Expirée depuis ${d} jour${d > 1 ? "s" : ""} — le lien ne fonctionne plus`
  }
  if (reste < MS_JOUR) return "Expire dans moins de 24 heures"
  const d = jours(reste)
  return `Expire dans ${d} jour${d > 1 ? "s" : ""}`
}

/** La couleur de l'état, dans les jetons du produit. */
export const COULEUR_ETAT: Record<EtatInvitation, string> = {
  active: "var(--muted)",
  bientot: "#FBBF24",
  expiree: "var(--danger)",
}

/**
 * La ligne qui explique le compteur : ces invitations-là ne comptent plus, et
 * elles ne partiront pas toutes seules.
 */
export function phraseSiegesMorts(nbExpirees: number): string | null {
  if (!Number.isFinite(nbExpirees) || nbExpirees < 1) return null
  return nbExpirees === 1
    ? "1 invitation a expiré : elle n'occupe plus de siège. Renvoyez-la ou annulez-la."
    : `${Math.floor(nbExpirees)} invitations ont expiré : elles n'occupent plus de siège. Renvoyez-les ou annulez-les.`
}

/** Le refus quand la limite est vraiment atteinte — avec ce qu'il reste à faire. */
export function phraseLimiteAtteinte(limite: number, nbExpirees = 0): string {
  const base = `Limite de ${limite} membre${limite > 1 ? "s" : ""} atteinte pour votre plan.`
  return nbExpirees > 0
    ? `${base} Les invitations expirées ne comptent plus : retirez un membre ou attendez une place.`
    : base
}

/** Affichage français d'une date : « 21 septembre 2026 ». */
function enFrancais(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
}

/**
 * La phrase que l'e-mail d'invitation ne disait pas. Sans elle, l'invité qui
 * ouvre son courrier le huitième jour tombe sur « Invitation indisponible »
 * sans avoir jamais su qu'il y avait un délai.
 */
export function mentionDelaiEmail(expiresAt: string | Date | null | undefined, maintenant: Date = new Date()): string {
  const exp = expiresAt instanceof Date ? expiresAt : date(expiresAt)
  if (!exp) return `Ce lien est valable ${DUREE_INVITATION_JOURS} jours.`
  const reste = exp.getTime() - maintenant.getTime()
  const d = reste > 0 ? Math.max(1, Math.round(reste / MS_JOUR)) : 0
  return d > 0
    ? `Ce lien expire le ${enFrancais(exp)} — dans ${d} jour${d > 1 ? "s" : ""}. Passé ce délai, demandez une nouvelle invitation.`
    : `Ce lien expire le ${enFrancais(exp)}. Passé ce délai, demandez une nouvelle invitation.`
}
