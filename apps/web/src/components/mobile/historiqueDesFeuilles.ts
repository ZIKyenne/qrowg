// historiqueDesFeuilles.ts — le bouton retour du téléphone ferme la feuille du
// dessus, il ne quitte pas l'écran. UN gestionnaire pour toutes les feuilles.
//
// Relevé du 16 novembre (« Ma carte », confirmation sur téléphone). Chaque
// feuille poussait et retirait sa propre entrée d'historique, et la
// reconnaissait à une marque dans `history.state`. Trois défauts mesurés :
//  1. Next.js réécrit `history.state` après coup (il n'y garde que `__NA` et son
//     arbre) : la marque disparaissait, l'entrée n'était jamais retirée — chaque
//     ouverture en laissait une de plus, un retour sans effet, puis un retour
//     qui quittait le site ;
//  2. `history.back()` est asynchrone : son `popstate` arrivait APRÈS
//     l'ouverture de la feuille suivante et la refermait aussitôt (en
//     développement, React ouvre-ferme-rouvre chaque effet : la confirmation ne
//     s'ouvrait jamais) ;
//  3. un `popstate` qui retombe sur une entrée sans `__NA` fait recharger la
//     page par Next.
//
// Règles : une seule entrée tant qu'au moins une feuille est ouverte ; retirée
// après la dernière fermeture, au tour suivant (une réouverture immédiate la
// garde) ; les retours qu'on déclenche soi-même sont COMPTÉS, et ignorés ;
// l'état de Next est recopié dans l'entrée poussée. Le navigateur est injecté :
// le module se teste sans DOM.

export type Navigateur = {
  pousser: () => void                 // history.pushState({...history.state}, "")
  reculer: () => void                 // history.back()
  ecouter: (f: () => void) => void    // window.addEventListener("popstate", f)
  plusTard: (f: () => void) => void   // setTimeout(f, 0)
  /**
   * L'adresse courante (location.href). Facultative pour les bancs anciens.
   *
   * Relevé du 18 nov. : une feuille qui contient un LIEN (« Voir la formule »
   * dans la fenêtre d'offre) se ferme parce qu'on a changé de page. Retirer
   * alors notre entrée par `history.back()` ramenait sur la page qu'on venait
   * de quitter. Si l'adresse a changé depuis la pose, on ne recule pas.
   */
  adresse?: () => string
}

export function creerHistoriqueDesFeuilles(nav: Navigateur) {
  const pile: (() => void)[] = []     // fermetures, la dernière = la feuille du dessus
  let entree = false                  // notre entrée est-elle dans l'historique ?
  let retoursInternes = 0             // `history.back()` lancés par nous, pas encore arrivés
  let ecoute = false
  let retraitPrevu = false

  let adressePosee: string | undefined  // où l'on était quand l'entrée a été posée
  // Un lien vient d'être suivi depuis une feuille (lot 5 « appli », 18 nov.) :
  // la prochaine fermeture est une navigation, pas un « retour ».
  let lienEnRoute = false
  const poserEntree = () => { if (!entree && retoursInternes === 0) { nav.pousser(); entree = true; adressePosee = nav.adresse?.() } }

  function surRetour() {
    if (retoursInternes > 0) {
      retoursInternes--
      // Une feuille s'est ouverte pendant que notre retour était en route : son
      // entrée attendait que l'historique soit retombé.
      if (retoursInternes === 0 && pile.length > 0) poserEntree()
      return
    }
    if (!entree) return
    entree = false                    // le retour de l'utilisateur l'a consommée
    lienEnRoute = false
    pile[pile.length - 1]?.()
    // Une couche qui se ferme EN DEUX TEMPS (le calibrage, puis le plein écran
    // de l'atelier, sous la même fermeture) reste ouverte après ce retour : sans
    // nouvelle entrée, le retour suivant quitterait l'écran.
    nav.plusTard(() => { if (pile.length > 0) poserEntree() })
  }

  return {
    /** Une feuille s'ouvre. Rend la fonction à appeler quand elle se ferme. */
    ouvrir(fermer: () => void): () => void {
      if (!ecoute) { nav.ecouter(surRetour); ecoute = true }
      pile.push(fermer)
      retraitPrevu = false
      if (pile.length === 1) lienEnRoute = false
      poserEntree()
      return () => {
        const i = pile.lastIndexOf(fermer)
        if (i >= 0) pile.splice(i, 1)
        if (pile.length > 0) { poserEntree(); return }
        // Dernière feuille fermée : on retire l'entrée au tour suivant, sauf si
        // une feuille s'est rouverte entre-temps.
        retraitPrevu = true
        nav.plusTard(() => {
          if (!retraitPrevu || pile.length > 0 || !entree) return
          retraitPrevu = false
          entree = false
          // Next ne change l'adresse qu'APRÈS avoir chargé l'écran suivant —
          // des centaines de millisecondes, des secondes en développement. Au
          // tour suivant, l'adresse n'a donc PAS encore changé : le test
          // ci-dessous ne suffit pas, et `history.back()` annulait la
          // navigation (mesuré : « Plus » → « Modèles » ne partait jamais).
          if (lienEnRoute) { lienEnRoute = false; return }
          // On a changé de page (un lien de la feuille a été suivi) : reculer
          // ramènerait à l'écran quitté. L'entrée reste derrière, inerte — au
          // pire un retour de plus, jamais un retour en arrière non voulu.
          if (nav.adresse && adressePosee !== undefined && nav.adresse() !== adressePosee) return
          retoursInternes++
          nav.reculer()
        })
      }
    },
    /**
     * Un lien interne vient d'être touché dans une feuille : la fermeture qui
     * suit est une navigation. L'entrée reste derrière, inerte — au pire un
     * retour de plus, jamais une navigation annulée. `MobileSheet` l'appelle
     * pour toute feuille ; un écran n'a rien à faire.
     */
    lienSuivi() { if (entree) lienEnRoute = true },
    /** Pour les tests. */
    etat: () => ({ ouvertes: pile.length, entree, retoursInternes }),
  }
}

let instance: ReturnType<typeof creerHistoriqueDesFeuilles> | null = null
/** Le gestionnaire du navigateur, créé à la première feuille. */
export function historiqueDesFeuilles() {
  return (instance ??= creerHistoriqueDesFeuilles({
    pousser: () => history.pushState({ ...(history.state ?? {}) }, ""),
    reculer: () => history.back(),
    ecouter: f => window.addEventListener("popstate", f),
    plusTard: f => { setTimeout(f, 0) },
    adresse: () => location.href,
  }))
}
