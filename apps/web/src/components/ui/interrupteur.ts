// interrupteur — ce qu'un interrupteur doit dire de lui-même.
//
// Relevé du 15 septembre. `components/ui/Switch.tsx` existe, et son propre
// commentaire dit pourquoi : « interrupteur ACCESSIBLE (role="switch" +
// aria-checked, clavier natif) — corrige les toggles maison sans sémantique ».
//
// Il est utilisé dans **un seul écran** : les Réglages. (Plus la page de démo
// des composants, qui ne compte pas.)
//
// Pendant ce temps, **dix-huit interrupteurs sont refaits à la main** dans le
// produit, chacun avec sa piste, sa pastille et sa transition. Deux le font
// bien — la bascule mensuel/annuel des tarifs, et la même sur la page
// d'abonnement. **Seize ne disent rien du tout** :
//
//   profile/page.tsx                      2   préférences du compte
//   builder/builderPanels.tsx             6   effets de thème, animation d'entrée
//   qr-codes/QRStudio.tsx                 3   fond transparent, options d'export
//   builder/BuilderV4.tsx                 1   réglage d'un bloc
//   analytics/ReportSubscriptionPanel.tsx 1   rapport programmé
//   … et trois autres
//
// Un lecteur d'écran annonce « bouton ». Pas « interrupteur », pas « activé »,
// pas « désactivé». La personne ne sait donc **ni ce que le bouton commande, ni
// dans quel état il est** — et l'appuyer ne lui apprend rien, puisque rien n'est
// annoncé après non plus.
//
// La règle posée : **un interrupteur dit ce qu'il commande, et s'il est allumé.**
//
// Ce module ne touche pas au dessin. Chaque écran garde sa piste et sa pastille
// — 36×20 ici, 44×32 là, ce sont des choix de mise en page, pas des gestes. Il
// ne réunit que ce qui doit être dit, une fois pour toutes.

export type PropsInterrupteur = {
  type: "button"
  role: "switch"
  "aria-checked": boolean
  "aria-label": string
  "aria-disabled"?: true
}

/**
 * Ce qu'un interrupteur annonce.
 *
 * @param nom      ce qu'il commande, dit au propriétaire — « Fond transparent »,
 *                 pas « transparent ».
 * @param allume   son état, celui qu'un lecteur d'écran lit à voix haute.
 * @param bloque   verrouillé par le plan : il reste annoncé, mais inactif.
 */
export function propsInterrupteur(nom: string, allume: boolean, bloque = false): PropsInterrupteur {
  return {
    type: "button",
    role: "switch",
    "aria-checked": !!allume,
    "aria-label": nom,
    ...(bloque ? { "aria-disabled": true as const } : {}),
  }
}
