// qrQuiAboutit.ts — avant d'imprimer, ce QR mène-t-il quelque part ? (U6, revue du 23 nov.)
//
// Le Print Studio mettait en scène n'importe quel QR de la liste, sans lire son
// statut ni celui de sa page. Un QR en brouillon ou en pause s'imprimait sans un
// mot ; le client qui le scanne tombe sur l'écran d'attente de /q/<code>.
//
// On n'EMPÊCHE pas l'impression : préparer ses supports avant d'ouvrir est
// légitime, et le QR imprimé reste valable une fois réactivé. On le DIT, avec le
// geste qui répare. Mêmes règles que la redirection (app/q/[code]/route.ts) :
// pause, brouillon, expiration, page non publiée. Module PUR.

export type EtatDuQr = {
  /** qr_codes.status ou instant_qrs.status ; absent = actif (comme la redirection). */
  statut?: string | null
  expireLe?: string | null
  /** pages.status pour un QR de page ; absent pour un QR de lien. */
  statutPage?: string | null
}

export type AlerteImpression = { texte: string; lien: string; action: string }

export function alerteAvantImpression(e: EtatDuQr, deLaPage: boolean, now: number = Date.now()): AlerteImpression | null {
  const statut = (e.statut || "active").toLowerCase()
  const lien = deLaPage ? "/dashboard/pages" : "/dashboard/qr-link"
  const expire = statut === "expired" || (!!e.expireLe && Date.parse(e.expireLe) < now)
  if (statut === "paused")
    return { texte: "Ce QR est en pause : imprimé tel quel, il mène à un écran d'attente. Réactivez-le avant de poser le support.", lien, action: "Réactiver ce QR" }
  if (statut === "draft")
    return { texte: "Ce QR est en brouillon : il ne mène encore nulle part. Activez-le avant de poser le support.", lien, action: "Activer ce QR" }
  if (expire)
    return { texte: "Ce QR a expiré : imprimé tel quel, il mène à un écran d'attente.", lien, action: "Voir ce QR" }
  if (deLaPage && e.statutPage && e.statutPage !== "published")
    return { texte: "Sa page n'est pas encore publiée : le client tomberait sur un écran d'attente. Publiez-la avant de poser le support.", lien, action: "Publier la page" }
  return null
}
