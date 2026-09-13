// pauseDeQuota.ts — le QR imprimé qui s'arrête quand on arrête de payer.
//
// Relevé du 13 septembre, en suivant un retour au plan gratuit dans le code.
// Le webhook Stripe, sur `customer.subscription.deleted` :
//
//     await reconcileDynamicLinks(outcome.userId, "free")
//     // « Retour au gratuit : les QR modifiables au-delà du quota passent en pause. »
//
// et `planDynamicReconcile`, au-delà du quota :
//
//     ops.push({ id: l.id, patch: { status: "paused", paused_reason: "quota" } })
//
// Le plan gratuit autorise UN QR modifiable (`limits.dyn: 1`). Un commerçant qui
// en avait six — un sur la vitrine, un sur chaque table, un sur les flyers —
// en voit donc cinq passer en pause. Ces cinq-là sont IMPRIMÉS : ils sont collés
// sur du mobilier et distribués dans le quartier. Le lendemain, cinq clients sur
// six tombent sur « QR Code temporairement indisponible ».
//
// Ce que le produit affiche alors au commerçant, dans sa liste de QR :
//
//     etatLien → { badge: "En pause", phrase: "En pause — ne redirige plus" }
//
// Exactement la même phrase que pour une pause qu'il aurait décidée lui-même.
// `paused_reason` existe dans le type, vaut « quota », et n'est lu NULLE PART.
// Il ne peut donc pas savoir que c'est son changement de plan qui a coupé ses
// supports — ni comment les rallumer.
//
// Et pendant ce temps la grille tarifaire promet, sur le plan gratuit :
//
//     « Vues illimitées — un QR imprimé ne s'arrête jamais »
//
// Ce module tient les deux bouts : dire vrai au commerçant quand c'est arrivé,
// et le prévenir AVANT que ça arrive. Module PUR.

/** Les motifs de pause que le produit écrit en base. */
export const PAUSE_QUOTA = "quota"
export const PAUSE_MANUELLE = "manual"

export type EtatDePause = {
  /** Pastille courte, pour une liste. */
  badge: string
  /** Phrase complète : ce qui se passe pour le CLIENT, pas pour la base. */
  phrase: string
  /** Ce que le commerçant peut faire, quand il peut faire quelque chose. */
  action: string | null
}

/**
 * Une pause n'est pas l'autre. Celle que le commerçant a décidée se dit
 * sobrement ; celle que son plan a imposée doit dire qu'un support imprimé ne
 * mène plus nulle part — c'est la seule information qui compte.
 */
export function etatDePause(raison: string | null | undefined): EtatDePause {
  if ((raison || "").toLowerCase() === PAUSE_QUOTA) {
    return {
      badge: "Coupé par le plan",
      phrase: "Votre plan ne couvre plus ce QR : imprimé ou non, il ne mène plus nulle part.",
      action: "Reprenez un plan qui le couvre pour le rallumer — le code imprimé reste valable.",
    }
  }
  return {
    badge: "En pause",
    phrase: "En pause — ne redirige plus",
    action: null,
  }
}

export type LienDynamique = {
  id: string
  status?: string | null
  expires_at?: string | null
  paused_reason?: string | null
  label?: string | null
  short_code?: string | null
}

/**
 * Les QR modifiables qui S'ARRÊTERAIENT si le quota tombait à `limite`.
 *
 * Même ordre et mêmes règles que `planDynamicReconcile`, qui exécute la bascule :
 * du plus ancien au plus récent, les essais expirés ne comptent pas, une pause
 * manuelle ne compte pas, et seuls les liens permanents ACTIFS au-delà du quota
 * sont coupés. On ne prévient donc jamais pour rien.
 */
export function qrQuiSArretent(liens: LienDynamique[] | null | undefined, limite: number | null, maintenant: number = Date.now()): LienDynamique[] {
  const cap = limite === null ? Infinity : limite
  const coupes: LienDynamique[] = []
  let utilises = 0
  for (const l of liens ?? []) {
    const exp = l.expires_at ? Date.parse(l.expires_at) : null
    if (exp !== null && !Number.isNaN(exp) && exp <= maintenant) continue
    if ((l.status || "") === "paused" && (l.paused_reason || "") === PAUSE_MANUELLE) continue
    if (utilises < cap) { utilises++; continue }
    if ((l.status || "") === "active" && !l.expires_at) coupes.push(l)
  }
  return coupes
}

/**
 * L'avertissement AVANT un retour en arrière. Null quand rien ne s'arrête : on
 * n'inquiète pas quelqu'un qui ne risque rien.
 */
export function phraseAvantDeRetomber(nb: number): string | null {
  if (nb <= 0) return null
  return nb === 1
    ? "1 de vos QR modifiables cesserait de fonctionner, y compris s'il est déjà imprimé : vos clients tomberaient sur un écran d'indisponibilité."
    : `${nb} de vos QR modifiables cesseraient de fonctionner, y compris ceux déjà imprimés : vos clients tomberaient sur un écran d'indisponibilité.`
}

/**
 * Ce qu'on écrit au commerçant APRÈS la bascule. Le chiffre est celui des QR
 * réellement coupés, et la limite celle de son nouveau plan — pas une
 * estimation, pas une formule générale.
 */
export function phraseApresLaBascule(nb: number, limite: number | null): string | null {
  if (nb <= 0) return null
  const couverts = limite === null ? "tous" : limite === 1 ? "un seul" : `${limite}`
  return nb === 1
    ? `1 de vos QR modifiables a été mis en pause : votre plan n'en couvre plus que ${couverts}. Il ne mène plus nulle part, même imprimé.`
    : `${nb} de vos QR modifiables ont été mis en pause : votre plan n'en couvre plus que ${couverts}. Ils ne mènent plus nulle part, même imprimés.`
}
