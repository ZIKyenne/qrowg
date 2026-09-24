// signatureQrowg — la signature que le produit pose sur la page d'un commerçant.
//
// ── Ce qu'elle est, et pourquoi elle se compte ─────────────────────────────
//
// En bas d'une page publiée par un compte gratuit, le produit ajoute quelque
// chose qui n'appartient pas au commerçant : un bouton qui invite SON visiteur
// à créer sa propre page. Le lot v156 a posé la règle — « ce qui n'est pas le
// contenu du commerçant se dit » — et l'a rendue visible, avec un vrai libellé
// plutôt qu'un lien discret.
//
// Il manquait l'autre moitié. Ce bouton est aujourd'hui **la seule distribution
// du produit** : une page scannée dans un restaurant montre QRowg à des dizaines
// de personnes qui n'en avaient jamais entendu parler. Et personne ne sait
// combien cliquent, parce que le clic n'est compté nulle part. Les liens du
// commerçant, eux, le sont tous depuis le lot v104.
//
// ── Pourquoi maintenant, alors qu'il n'y a pas encore de page cliente ──────
//
// Relevé du 24 septembre : zéro page appartenant à un tiers. Cette mesure ne
// rapportera donc rien aujourd'hui. Mais une mesure ne se rattrape pas : le jour
// où la première page cliente est scannée, soit le chiffre existe, soit il est
// perdu pour toujours. C'est la différence entre instrumenter avant et regretter
// après — et c'est pour ça que le chantier tient en un fichier plutôt qu'en un
// tableau de bord.

/**
 * L'adresse du bouton. Les paramètres UTM sont ceux du lot v156, inchangés :
 * ils identifient la source côté qrowg.com, là où le clic ARRIVE. Le comptage
 * ci-dessous mesure les clics qui PARTENT — les deux ne voient pas la même
 * chose, et l'écart entre eux est lui-même une information (blocage, abandon
 * en cours de chargement).
 */
export const ADRESSE_SIGNATURE =
  "https://qrowg.com/?utm_source=badge&utm_medium=public_page&utm_campaign=made_with_qrowg"

/**
 * Le type d'événement écrit dans `page_events`.
 *
 * `page_events.kind` est une colonne de texte, filtrée par une liste blanche
 * dans `/api/track`. Cette constante est la MÊME valeur des deux côtés, et une
 * garde vérifie que la route l'accepte : un type ajouté ici et oublié là-bas
 * ferait disparaître l'événement en silence — la route répond `ok` et jette la
 * ligne (leçon du lot v170 : quand deux côtés lisent la même déclaration, il
 * faut que quelqu'un vérifie qu'ils la lisent vraiment tous les deux).
 */
export const KIND_SIGNATURE = "badge"

/**
 * D'où vient le clic. `page_id` dit déjà QUELLE page ; `ref` dit OÙ sur la page,
 * pour que la signature reste distinguable si le produit en pose une ailleurs
 * un jour (un écran d'intro, une page d'erreur, un aperçu partagé).
 */
export const REF_PIED_DE_PAGE = "footer"
