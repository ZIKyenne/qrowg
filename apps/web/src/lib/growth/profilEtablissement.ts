// Le profil d'un établissement, tel qu'on ose l'utiliser.
//
// ── La règle qui gouverne tout ce fichier ──────────────────────────────────
//
// Une information sans source reste VIDE. Jamais devinée, jamais « plausible ».
//
// C'est la contrainte la plus dure du moteur de croissance, et c'est aussi la
// seule qui le rende utilisable : une page de proposition qui affiche un horaire
// inventé ou un prix approximatif ne vaut pas mieux qu'un spam, et elle expose
// l'entreprise qu'elle prétend servir. Le dépôt applique déjà cette règle à
// l'intérieur du produit — `preuveNonInventee.test.ts` empêche les modèles
// d'écrire des avis et des notes à la place de l'utilisateur. On l'étend ici aux
// données venues de l'extérieur.
//
// Concrètement, chaque champ porte sa provenance. Un champ sans provenance n'est
// pas un champ : c'est une case à compléter, et la page générée l'affichera
// comme telle.

/** D'où vient une information, et quand on l'a vue. */
export type Provenance = {
  /** L'URL exacte consultée. Jamais « le site de l'entreprise » en général. */
  source: string
  /** Horodatage ISO de la consultation. Une donnée vieille d'un an se méfie. */
  observeLe: string
  /**
   * Le degré de certitude, et il n'y en a que trois.
   *
   * `confirme` — lu tel quel sur une source autorisée (le nom sur la page
   *   d'accueil, l'adresse sur la page contact).
   * `probable` — déduit sans ambiguïté mais pas écrit (un restaurant dont la
   *   carte liste des pizzas est une pizzeria).
   * `a_verifier` — relevé mais douteux : deux sources divergent, la page est
   *   datée, le format est inhabituel.
   *
   * Il n'existe PAS de quatrième niveau pour « j'ai supposé ». Supposer, c'est
   * laisser le champ vide.
   */
  certitude: "confirme" | "probable" | "a_verifier"
}

/** Une valeur accompagnée de sa provenance. L'une ne va jamais sans l'autre. */
export type Verifie<T> = { valeur: T; provenance: Provenance }

/**
 * Un champ du profil : soit une valeur sourcée, soit `null`.
 *
 * `null` n'est pas un échec, c'est une réponse. Il dit « on ne sait pas », et la
 * page générée le traduira en « à compléter » visible plutôt qu'en invention
 * invisible.
 */
export type Champ<T> = Verifie<T> | null

/**
 * Un jour de la semaine, dans les clés EXACTES du bloc `opening_hours`.
 *
 * Pourquoi pas un texte libre « Mardi au samedi » : parce qu'il faudrait
 * l'interpréter pour le poser dans la page, et interpréter c'est le début de
 * l'invention. Le profil parle donc la langue du produit, et la correspondance
 * devient une recopie vérifiable plutôt qu'une traduction.
 */
export type JourSemaine = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
export type Horaire = { jour: JourSemaine; heures: string }
export type PlatReleve = { nom: string; prix: string | null; description: string | null }

/**
 * Le profil d'un restaurant.
 *
 * Volontairement restreint à ce qu'on sait relever honnêtement sur un site
 * public. On n'y trouvera ni « ambiance », ni « clientèle cible », ni aucune de
 * ces catégories qu'un modèle de langage remplit toujours avec aplomb et
 * jamais avec une source.
 */
export type ProfilRestaurant = {
  /** Identifiant interne du prospect. Pas une donnée publique. */
  id: string
  /** La raison sociale ou l'enseigne, telle qu'écrite. */
  nom: Champ<string>
  /** Une phrase de présentation RELEVÉE, pas rédigée par nous. */
  accroche: Champ<string>
  ville: Champ<string>
  adresse: Champ<string>
  telephone: Champ<string>
  /** Les horaires, uniquement s'ils sont lisibles sans interprétation. */
  horaires: Champ<Horaire[]>
  /** Lien de réservation existant (TheFork, Zenchef, formulaire…). */
  reservation: Champ<string>
  /** Lien vers la carte publiée par l'établissement, si elle existe. */
  carteEnLigne: Champ<string>
  /** Quelques plats relevés sur la carte publique, avec leur prix SI affiché. */
  plats: Champ<PlatReleve[]>
  instagram: Champ<string>
  facebook: Champ<string>
  ficheGoogle: Champ<string>
  /**
   * La sous-catégorie, qui décide du modèle de départ.
   * `null` → on prendra le modèle le plus neutre, pas le plus vendeur.
   */
  genre: Champ<"bistrot" | "rapide" | "bar">
}

/** Fabrique un champ sourcé. La seule façon d'en créer un. */
export function sourcer<T>(valeur: T, provenance: Provenance): Verifie<T> {
  return { valeur, provenance }
}

/** La valeur si elle existe, sinon `null`. Aucun repli silencieux. */
export function valeurDe<T>(champ: Champ<T>): T | null {
  return champ ? champ.valeur : null
}

/**
 * Le champ est-il assez sûr pour être AFFICHÉ comme un fait sur la page ?
 *
 * `a_verifier` ne l'est pas : on garde l'information pour la proposer à
 * l'établissement, mais la page ne l'affirme pas à sa place.
 */
export function affichable<T>(champ: Champ<T>): champ is Verifie<T> {
  return champ !== null && champ.provenance.certitude !== "a_verifier"
}

/** Un profil vide : tout est inconnu, et c'est un état parfaitement valide. */
export function profilVide(id: string): ProfilRestaurant {
  return {
    id,
    nom: null, accroche: null, ville: null, adresse: null, telephone: null,
    horaires: null, reservation: null, carteEnLigne: null, plats: null,
    instagram: null, facebook: null, ficheGoogle: null, genre: null,
  }
}

/** Les champs qui portent une valeur affichable, pour les compteurs et la QA. */
export function champsAffichables(p: ProfilRestaurant): string[] {
  return Object.entries(p)
    .filter(([cle]) => cle !== "id")
    .filter(([, v]) => affichable(v as Champ<unknown>))
    .map(([cle]) => cle)
    .sort()
}

/**
 * Les champs relevés mais trop incertains pour être affirmés.
 * Ils deviennent des questions posées à l'établissement, pas du contenu.
 */
export function champsAVerifier(p: ProfilRestaurant): string[] {
  return Object.entries(p)
    .filter(([cle]) => cle !== "id")
    .filter(([, v]) => {
      const c = v as Champ<unknown>
      return c !== null && c.provenance.certitude === "a_verifier"
    })
    .map(([cle]) => cle)
    .sort()
}

/**
 * Le profil est-il assez riche pour qu'une page personnalisée ait du sens ?
 *
 * Le seuil n'est pas esthétique, il est honnête : sans NOM et sans au moins
 * deux autres faits affichables, la page générée ne serait pas « personnalisée
 * pour cette entreprise », ce serait un modèle vierge portant une enseigne. La
 * fabriquer ferait perdre son temps à tout le monde — et le document de mission
 * est explicite : une personnalisation réussie est la fidélité des faits, pas
 * deux couleurs changées.
 */
export const MINIMUM_FAITS = 3

/**
 * Les champs que la page sait RENDRE.
 *
 * `ville` et `genre` en sont absents : le premier sert au ciblage, le second
 * au choix du modèle, mais aucun des deux n'apparaît à l'écran. Les compter
 * gonflait le score de richesse sans rien ajouter à la page — un profil pouvait
 * passer le seuil en n'affichant, en réalité, que son nom. Défaut trouvé en
 * regardant une page générée, pas en relisant le code.
 */
const CHAMPS_AFFICHES = [
  "nom", "accroche", "adresse", "telephone", "horaires",
  "reservation", "carteEnLigne", "plats", "instagram", "facebook", "ficheGoogle",
] as const

export function assezRichePourUnePage(p: ProfilRestaurant): boolean {
  const rendus = champsAffichables(p).filter(c => (CHAMPS_AFFICHES as readonly string[]).includes(c))
  return affichable(p.nom) && rendus.length >= MINIMUM_FAITS
}
