// identitePageSeo — de qui parle une page publiée, pour Google.
//
// Deux défauts mesurés le 4 septembre :
//  1. la description de repli commençait par le nom du TITULAIRE DU COMPTE :
//     l'extrait Google d'une brasserie annonçait « Jean Dupont sur QRowg » ;
//  2. le JSON-LD déclarait `mainEntity: Person` pour TOUTE page, brasserie et
//     agence immobilière comprises — un balisage faux, que Google ignore au
//     mieux, qui empêche le rich result « établissement » au pire.
//
// La page porte un titre choisi par son auteur : c'est lui qui nomme l'affaire.
// Le modèle d'origine (`template_id`) dit de quel genre d'affaire il s'agit.

export type EntreeIdentite = {
  titre?: string | null
  nomProprietaire?: string | null
  templateId?: string | null
}

/** Le nom que Google doit lire : le titre de la page d'abord, le compte en dernier recours. */
export function nomAffiche(e: EntreeIdentite): string {
  return (e.titre || "").trim() || (e.nomProprietaire || "").trim() || "Cette page"
}

// Préfixes des modèles rattachés à un établissement ayant une adresse physique.
const ETABLISSEMENT = ["resto", "commerce", "beaute", "immo", "artisan", "asso", "event"]
// Préfixes des modèles où la page présente UNE personne.
const PERSONNE = ["freelance", "creatif", "coach"]

export type TypeEntite = "LocalBusiness" | "Person" | "Organization"

export function typeEntite(templateId?: string | null): TypeEntite {
  const t = (templateId || "").toLowerCase()
  if (ETABLISSEMENT.some(p => t.startsWith(p))) return "LocalBusiness"
  if (PERSONNE.some(p => t.startsWith(p))) return "Person"
  // Sans modèle connu, « Organization » : neutre, vrai pour une page d'entreprise
  // comme pour une page de projet, et jamais faux au point d'être trompeur.
  return "Organization"
}

/** Longueur utile d'une description : au-delà, la SERP coupe. */
const DESCRIPTION_MAX = 158
/** En deçà, un extrait de contenu n'apprend rien de plus que la phrase générique. */
const EXTRAIT_MIN = 60

/**
 * Le texte que la page dit d'elle-même, s'il y en a (SEO-03).
 *
 * Les blocs sont du contenu libre : on ne prend que ce qui se lit comme une
 * phrase — une bio, un texte d'introduction — et jamais une URL, un numéro ni
 * une étiquette de bouton. L'ordre des blocs est celui de la page : le premier
 * texte substantiel est, par construction, celui que l'auteur a mis en tête.
 */
export function texteDeLaPage(blocs?: { content?: unknown }[] | null): string {
  // Les champs qui contiennent de la prose. `label`, `url`, `phone`… n'en sont pas.
  const CHAMPS = ["text", "bio", "description", "subtitle", "tagline", "intro"]
  for (const b of blocs ?? []) {
    const c = b?.content
    if (!c || typeof c !== "object") continue
    for (const champ of CHAMPS) {
      const v = (c as Record<string, unknown>)[champ]
      if (typeof v !== "string") continue
      const propre = v.replace(/\s+/g, " ").trim()
      // Ni une adresse, ni un fragment de balisage : une phrase.
      if (propre.length < EXTRAIT_MIN) continue
      if (/^https?:\/\//i.test(propre) || propre.includes("<")) continue
      return propre
    }
  }
  return ""
}

/**
 * Description de repli, quand l'auteur n'a pas rempli la sienne.
 *
 * SEO-03. Elle rendait une phrase unique — « X — coordonnées, horaires, liens et
 * contact réunis sur une seule page » — pour TOUTES les pages. Les six pages
 * clientes indexées portaient donc la même description au nom près, alors que
 * leur contenu réel était déjà chargé par la requête qui les rend.
 *
 * On préfère désormais ce que la page dit d'elle-même, préfixé de son nom pour
 * que l'extrait commence par l'établissement. La phrase générique reste, pour
 * les pages qui n'ont pas encore de texte : mieux vaut une phrase vraie et
 * répétée qu'une description vide.
 */
export function descriptionRepli(e: EntreeIdentite, blocs?: { content?: unknown }[] | null): string {
  const nom = nomAffiche(e)
  const propre = texteDeLaPage(blocs)
  if (propre) {
    const phrase = `${nom} — ${propre}`
    if (phrase.length <= DESCRIPTION_MAX) return phrase
    // On coupe au dernier mot entier, pas au milieu d'un mot.
    const coupe = phrase.slice(0, DESCRIPTION_MAX - 1)
    const espace = coupe.lastIndexOf(" ")
    return `${(espace > nom.length ? coupe.slice(0, espace) : coupe).trimEnd()}…`
  }
  return `${nom} — coordonnées, horaires, liens et contact réunis sur une seule page, accessible en un scan.`.slice(0, DESCRIPTION_MAX)
}

/** Le type Open Graph : « profile » ne vaut que pour la page d'une personne. */
export function typeOg(templateId?: string | null): "profile" | "website" {
  return typeEntite(templateId) === "Person" ? "profile" : "website"
}

export function jsonLdPage(opts: {
  titre?: string | null
  nomProprietaire?: string | null
  templateId?: string | null
  descriptionSeo?: string | null
  url: string
  image?: string | null
}): Record<string, unknown> {
  const e: EntreeIdentite = { titre: opts.titre, nomProprietaire: opts.nomProprietaire, templateId: opts.templateId }
  const nom = nomAffiche(e)
  const type = typeEntite(opts.templateId)
  return {
    "@context": "https://schema.org",
    "@type": type === "Person" ? "ProfilePage" : "WebPage",
    name: nom,
    description: opts.descriptionSeo || descriptionRepli(e),
    url: opts.url,
    inLanguage: "fr",
    mainEntity: {
      "@type": type,
      name: nom,
      url: opts.url,
      ...(opts.image ? { image: opts.image } : {}),
    },
  }
}
