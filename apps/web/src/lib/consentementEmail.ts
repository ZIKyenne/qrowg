// consentementEmail — ce qu'on a le droit d'envoyer, et à qui.
//
// Relevé du 15 septembre. L'écran Réglages propose **six** interrupteurs de
// notification. J'ai cherché, pour chacun, l'envoi qui le consulte :
//
//   email_leads         lib/notifierProprietaireLead.ts    ✓
//   lead_confirmation   lib/accuseReceptionLead.ts         ✓
//   scan_alert          lib/premierScan.ts                 ✓
//   weekly_report       lib/rapportHebdo.ts                ✓
//   product_updates     — personne
//   marketing           — personne
//
// Deux interrupteurs sur six ne commandent rien. Le commerçant coche
// « Nouveautés produit », l'écran dit « Préférences enregistrées », la colonne
// `preferences` garde la valeur — et aucun envoi ne la lira jamais. Ce n'est pas
// une case qui ne marche pas : c'est une case qui ment.
//
// Et les quatre qui fonctionnent le font chacune à sa façon, écrite sur place :
// trois `!== false` recopiés, un `PREFERENCE_HEBDO` nommé. Quatre endroits où
// se tromper de sens — et se tromper de sens sur un consentement, c'est envoyer
// à quelqu'un qui a dit non.
//
// Troisième point : `cron/relance` part 48 h après l'inscription, ne consulte
// rien, et ne porte **aucun lien de sortie**. Le rapport périodique en a un
// (`unsubUrl`), l'hebdomadaire aussi. Celui-là, non.
//
// La règle posée : **un envoi demande la permission au même endroit, et un
// interrupteur qui ne commande rien est nommé comme tel.**
//
// Ce module ne remplace pas les quatre vérifications : il les réunit. Chacune
// garde son nom d'origine et délègue — aucun appelant ne bouge.

/** Les envois du produit, par ce qu'ils sont pour la personne qui les reçoit. */
export type TypeDEmail =
  // Commandés par un interrupteur des Réglages.
  | "lead"            // un message reçu sur une page
  | "accuseLead"      // l'accusé de réception envoyé au visiteur
  | "premierScan"     // « votre QR vient d'être scanné pour la première fois »
  | "rapportHebdo"    // le résumé de la semaine
  | "nouveautes"      // nouveautés produit
  | "marketing"       // communication commerciale
  // Transactionnels : la personne les reçoit parce qu'elle a agi, ou parce que
  // quelque chose de son compte le demande. Aucun interrupteur ne les coupe —
  // couper « votre QR expire demain » ne rendrait service à personne.
  | "bienvenue" | "abonnement" | "equipe" | "expiration" | "quota" | "contact" | "relance"

/** L'interrupteur qui commande un envoi, et ce qu'il vaut quand rien n'est écrit. */
export type Interrupteur = { cle: string; parDefaut: boolean }

export const INTERRUPTEURS: Record<TypeDEmail, Interrupteur | null> = {
  // Opt-out : on envoie tant que la personne n'a pas dit non.
  lead:         { cle: "email_leads",        parDefaut: true },
  accuseLead:   { cle: "lead_confirmation",  parDefaut: true },
  premierScan:  { cle: "scan_alert",         parDefaut: true },
  rapportHebdo: { cle: "weekly_report",      parDefaut: true },
  // Opt-in : on n'envoie que si la personne a dit oui.
  nouveautes:   { cle: "product_updates",    parDefaut: false },
  marketing:    { cle: "marketing",          parDefaut: false },
  // Transactionnels.
  bienvenue: null, abonnement: null, equipe: null,
  expiration: null, quota: null, contact: null, relance: null,
}

/**
 * Les interrupteurs que l'écran propose et qu'aucun envoi ne consulte encore,
 * avec la raison.
 *
 * `nouveautes` et `marketing` sont **opt-in** : par défaut personne ne les a
 * cochés, donc rien ne part — la case ne cause aucun envoi indu. Mais celui qui
 * la coche attend quelque chose qui n'existe pas. Elles sont nommées ici plutôt
 * que tolérées en silence : le jour où un envoi de ce type est écrit, il devra
 * passer par `peutRecevoir`, et la garde le vérifie.
 */
export const SANS_ENVOI_POUR_L_INSTANT: TypeDEmail[] = ["nouveautes", "marketing"]

/**
 * Cette personne accepte-t-elle ce type d'e-mail ?
 *
 * Un type transactionnel passe toujours. Un type commandé lit son interrupteur,
 * dans le sens que la table lui donne — et c'est le seul endroit du produit où
 * ce sens est décidé.
 */
export function peutRecevoir(type: TypeDEmail, preferences: unknown): boolean {
  const i = INTERRUPTEURS[type]
  if (!i) return true
  const p = preferences && typeof preferences === "object" ? (preferences as Record<string, unknown>) : null
  const v = p?.[i.cle]
  if (typeof v === "boolean") return v
  return i.parDefaut          // absent, nul, ou d'un autre type : le défaut décide
}

/** Où l'on va pour ne plus recevoir. Tout envoi commandé doit pouvoir y mener. */
export function lienDeSortie(appUrl: string): string {
  return `${(appUrl || "").replace(/\/+$/, "")}/dashboard/settings`
}
