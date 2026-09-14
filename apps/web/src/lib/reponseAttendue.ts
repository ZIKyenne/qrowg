// reponseAttendue — une réponse ne parle que si elle est encore attendue.
//
// Relevé du 14 septembre, en balayant les effets qui ATTENDENT (`await`,
// `.then`) puis POSENT un état, et dont les dépendances changent — c'est-à-dire
// ceux qui peuvent avoir deux réponses en vol pour deux questions différentes.
// Il y en a douze. **Six** portent déjà le bon geste. **Six** ne l'ont pas.
//
// Le plus coûteux :
//
//   QRStudio.tsx:385   deps = [activeId, statsPeriod]
//     fetch(`/api/qr-stats/${activeId}?period=${statsPeriod}`)
//       .then(d => setStats(d))
//       .finally(() => setStatsLoading(false))
//
//   Le commerçant clique sur un QR, puis sur un autre avant que le premier
//   n'ait répondu. La réponse du PREMIER arrive en dernier et s'installe sous
//   le nom du SECOND. Il lit 312 scans en face du mauvais QR, et rien à
//   l'écran ne le dit. Le `finally` fait pire encore : la réponse périmée
//   éteint le voyant de chargement pendant que la bonne est toujours en route.
//
//   templates/page.tsx:765   deps = [slug]
//     Le `clearTimeout` couvre la frappe, pas l'appel une fois parti : une
//     réponse périmée pouvait écrire « disponible » sur une adresse que
//     l'utilisateur ne tapait plus. Il clique « Créer », et se fait refuser.
//
//   DashboardShell.tsx:299   deps = [pathname, user]
//     En naviguant vite, le compteur de messages non lus d'une page peut
//     s'afficher sur une autre. Petit, mais faux.
//
// Les trois derniers (BuilderV4:552, qr-link:181, GeneratorClient:60) sont des
// bascules qui ne se produisent qu'une fois, ou déjà tenues par un `ref` : le
// risque y est théorique. Ils prennent le même geste parce qu'une règle qui
// souffre des exceptions au cas par cas n'est plus une règle.
//
// Le produit connaît le bon geste — il l'écrit à la main, **sous trois noms
// différents** : `let cancelled = false` (quatre fois), `let vivant = true`
// (deux), `let alive = true` (trois). Neuf copies, trois vocabulaires.
//
// Le premier relevé n'en comptait que six : il cherchait deux mots sur trois.
// C'est la garde de ce lot, écrite ensuite, qui a trouvé les trois dernières
// dans `PrintStudioClient`, puis une cinquième relecture la dernière dans
// `ResetPasswordForm` — toutes correctes, simplement introuvables pour qui ne
// connaissait pas le bon mot. C'est exactement le risque : une règle qui se
// cherche à quatre endroits finit par avoir une onzième copie qui oublie le
// nettoyage.
//
// La classe : **une réponse ne parle que si elle est encore attendue.**

/** Ce qu'un effet ouvre en partant, et referme en s'en allant. */
export type Attente = {
  /** Vrai tant que c'est toujours cette question-là qui est posée. */
  encoreAttendue(): boolean
  /** À rendre comme nettoyage de l'effet : `return a.abandonner`. */
  abandonner(): void
  /**
   * Enrobe un geste pour qu'il ne s'exécute que si l'attente tient toujours.
   * C'est la forme attendue dans un `.then`, un `.catch` ou un `.finally` :
   * le nom de l'attente est alors visible sur la ligne qui pose l'état.
   */
  siEncoreLa<A extends unknown[]>(faire: (...args: A) => void): (...args: A) => void
}

/**
 * Ouvre une attente.
 *
 * React lance le nettoyage de l'effet AVANT de le relancer : une réponse en
 * retard trouve donc son attente déjà abandonnée, et se tait. C'est le même
 * geste que les `let cancelled = false` du produit, avec un seul nom et un
 * endroit où le tester.
 */
export function attente(): Attente {
  let ouverte = true
  const encoreAttendue = () => ouverte
  const abandonner = () => { ouverte = false }
  const siEncoreLa = <A extends unknown[]>(faire: (...args: A) => void) =>
    (...args: A) => { if (ouverte) faire(...args) }
  return { encoreAttendue, abandonner, siEncoreLa }
}
