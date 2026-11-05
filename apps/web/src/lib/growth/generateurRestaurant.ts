// Le générateur de page personnalisée pour un restaurant.
//
// ── Le piège qu'il évite, et qui a failli m'avoir ──────────────────────────
//
// Les modèles de page de QRowg (`page-templates.ts`) contiennent du contenu de
// démonstration VOLONTAIREMENT RÉALISTE : « Le Bistrot Parisien », « Entrecôte
// 300g — 32€ », « Foie gras poêlé — 18€ ». C'est parfait pour montrer un modèle
// dans la galerie ; ce serait désastreux dans une proposition envoyée à un
// restaurateur. Un générateur naïf qui se contente de remplacer le nom
// afficherait des plats et des prix inventés SOUS L'ENSEIGNE DU RESTAURANT.
//
// D'où le pipeline en trois temps, dont aucun ne peut être court-circuité :
//
//   1. le MODÈLE donne le choix et l'ordre des blocs — c'est la vraie
//      expertise métier, et elle vient de la bibliothèque existante ;
//   2. `BLOCK_DEFS[type].defaultContent` donne le contenu NEUTRE — des champs
//      vides que le produit sait déjà afficher proprement ;
//   3. le PROFIL remplit, et lui seul, ce qui est un fait.
//
// Les valeurs de démonstration du modèle ne sont jamais recopiées, sauf pour
// les clés déclarées PRÉSENTATION ci-dessous — un titre de section, un gabarit,
// un mode d'affichage. Rien qui affirme quelque chose sur l'établissement.
//
// C'est la même doctrine que `preuveNonInventee.test.ts` applique à l'intérieur
// du produit : « le pré-remplissage donne la STRUCTURE et le TITRE, jamais
// l'AFFIRMATION ». On l'étend aux données venues de l'extérieur.

import { PAGE_TEMPLATES } from "@/app/dashboard/builder/page-templates"
import { BLOCK_DEFS } from "@/app/dashboard/builder/blockDefs"
import type { PageTheme } from "@/app/dashboard/builder/types"
import {
  type ProfilRestaurant, type Champ, affichable, valeurDe, assezRichePourUnePage,
} from "./profilEtablissement"

export type BlocGenere = { type: string; content: Record<string, unknown> }

export type PageGeneree = {
  /** Le modèle de la bibliothèque dont vient la structure. Traçable. */
  modeleSource: string
  theme: PageTheme
  blocs: BlocGenere[]
  /** Les champs du profil réellement utilisés. Sert à la QA et au message. */
  faitsUtilises: string[]
  /** Ce que l'établissement devra compléter lui-même. Affiché, pas caché. */
  aCompleter: string[]
  /** Blocs retirés parce que leur contenu neutre affirmait quelque chose. */
  blocsOmis: string[]
}

/**
 * Les clés de contenu qu'on accepte de recopier depuis le modèle.
 *
 * Elles décrivent la PRÉSENTATION, jamais l'établissement : un intitulé de
 * section (« Horaires »), un mode d'affichage, un gabarit. La liste est courte
 * et explicite exprès — une liste large redeviendrait une porte ouverte aux
 * valeurs de démonstration, et la garde `fidelitesDesFaits.test.ts` vérifie
 * qu'aucune clé hors de cette liste n'est copiée.
 */
const CLES_DE_PRESENTATION = new Set([
  // Une seule clé, et c'est un titre de section de carte : « 🥗 Entrées »,
  // « 🥩 Plats ». Elle n'affirme rien sur l'établissement.
  "category",
])
//
// La première version de cette liste contenait aussi "label", "title", "mode",
// "platform" et sept autres. La garde `fideliteDesFaits.test.ts` l'a prise en
// défaut dès le premier passage : le modèle bistrot porte
// `google_maps_embed: { label: "Le Bistrot Parisien" }`, et « Le Bistrot
// Parisien » s'est retrouvé dans une page censée être celle de Chez Mariette.
// Un nom d'enseigne passait pour de la présentation.
//
// Tout le reste vient désormais de `BLOCK_DEFS[type].defaultContent`, que le
// produit maintient déjà comme contenu neutre.

/** Le modèle de départ selon le genre relevé. Sans genre : le plus neutre. */
export function modelePour(genre: "bistrot" | "rapide" | "bar" | null): string {
  if (genre === "rapide") return "resto_fastfood"
  if (genre === "bar") return "resto_bar"
  // `bistrot` ET l'inconnu tombent ici. Choisir « bistrot » par défaut n'est pas
  // une invention : c'est le modèle le plus générique des trois (menu, horaires,
  // réservation, plan), celui qui affirme le moins.
  return "resto_bistrot"
}

/** Contenu neutre d'un bloc, tel que l'éditeur le crée. Jamais de démo. */
function contenuNeutre(type: string): Record<string, unknown> {
  const def = BLOCK_DEFS[type]
  return def?.defaultContent ? { ...def.defaultContent } : {}
}

/** Les clés de présentation du modèle, et elles seules. */
function presentationDuModele(contenuModele: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [cle, valeur] of Object.entries(contenuModele)) {
    if (CLES_DE_PRESENTATION.has(cle) && typeof valeur === "string" && valeur.trim()) out[cle] = valeur
  }
  return out
}

/** Pose une valeur si et seulement si le champ est affichable. */
function poser<T>(cible: Record<string, unknown>, cle: string, champ: Champ<T>, utilises: string[], nomDuChamp: string) {
  if (!affichable(champ)) return
  cible[cle] = champ.valeur
  if (!utilises.includes(nomDuChamp)) utilises.push(nomDuChamp)
}

/**
 * Fabrique la page.
 *
 * Rend `null` quand le profil est trop pauvre : mieux vaut ne rien proposer
 * qu'envoyer un modèle vierge portant une enseigne. Le document de mission est
 * explicite — une personnalisation réussie est la fidélité des faits, pas deux
 * couleurs changées.
 */
export function genererPageRestaurant(profil: ProfilRestaurant): PageGeneree | null {
  if (!assezRichePourUnePage(profil)) return null

  const cleModele = modelePour(valeurDe(profil.genre))
  const modele = PAGE_TEMPLATES.find(t => t.key === cleModele)
  if (!modele) return null

  const faitsUtilises: string[] = []
  const aCompleter: string[] = []
  const omis: string[] = []
  const blocs: BlocGenere[] = []

  // Une carte de contact en TEXTE, juste sous le profil.
  //
  // Trouvé en lançant la preuve au navigateur : le modèle ne montre l'adresse
  // que dans l'iframe Google Maps. Sur la page d'un client, c'est un choix
  // défendable ; sur une PROPOSITION envoyée à un restaurateur, c'est raté —
  // il doit reconnaître son établissement au premier coup d'œil, et l'adresse
  // disparaît si l'iframe est bloquée (bandeau de consentement, protection
  // anti-pistage, hors ligne).
  //
  // `quick_contact` est un bloc réel du produit, et il n'affiche que des faits
  // vérifiés : rien n'est ajouté, tout est rendu lisible.
  const contact: Record<string, unknown> = { ...contenuNeutre("quick_contact") }
  let contactUtile = false
  if (affichable(profil.adresse)) { contact.address = profil.adresse.valeur; contactUtile = true; faitsUtilises.push("adresse") }
  if (affichable(profil.telephone)) { contact.phone = profil.telephone.valeur; contactUtile = true; faitsUtilises.push("telephone") }

  for (const blocModele of modele.blocks) {
    const content: Record<string, unknown> = {
      ...contenuNeutre(blocModele.type),
      ...presentationDuModele(blocModele.content as Record<string, unknown>),
    }

    switch (blocModele.type) {
      case "profile": {
        poser(content, "name", profil.nom, faitsUtilises, "nom")
        poser(content, "tagline", profil.accroche, faitsUtilises, "accroche")
        // Pas de badge : « 🌟 Recommandé » serait une distinction que personne
        // n'a décernée.
        content.badge = ""
        if (!affichable(profil.accroche)) aCompleter.push("une phrase de présentation")
        break
      }

      case "menu_section": {
        const plats = affichable(profil.plats) ? profil.plats.valeur : []
        if (plats.length === 0) {
          // Aucun plat relevé : la section reste VIDE et annoncée comme telle.
          // Le produit sait masquer un bloc vide (`isBlockEmpty`) ; on ne le
          // remplit donc pas « pour faire joli ».
          if (!aCompleter.includes("votre carte")) aCompleter.push("votre carte")
          break
        }
        plats.slice(0, 3).forEach((plat, i) => {
          content[`item${i + 1}_name`] = plat.nom
          // Le prix et la description ne s'inventent pas : absents du relevé,
          // ils restent vides, et le restaurateur les complétera.
          content[`item${i + 1}_price`] = plat.prix ?? ""
          content[`item${i + 1}_desc`] = plat.description ?? ""
        })
        if (!faitsUtilises.includes("plats")) faitsUtilises.push("plats")
        if (plats.some(p => p.prix === null)) aCompleter.push("les prix manquants de la carte")
        break
      }

      case "opening_hours": {
        const h = affichable(profil.horaires) ? profil.horaires.valeur : null
        if (!h || h.length === 0) { aCompleter.push("vos horaires"); break }
        // Les clés sont celles du bloc : `mon`…`sun` en mode « Jour par jour ».
        // Mes premières clés (`row1_days`) étaient inventées — elles n'auraient
        // pas planté, elles auraient été ignorées au rendu, et la page aurait
        // paru générée sans horaires. C'est le pire cas, et la garde l'a vu.
        content.mode = "Jour par jour"
        for (const ligne of h) content[ligne.jour] = ligne.heures
        faitsUtilises.push("horaires")
        break
      }

      case "table_booking": {
        if (!affichable(profil.reservation)) {
          // Le contenu neutre de ce bloc vaut `{ label: "Réserver une table",
          // platform: "TheFork" }` : son DÉFAUT affirme déjà une plateforme.
          // Laissé tel quel, il dirait d'un restaurant qui utilise Zenchef
          // qu'il réserve sur TheFork. Sans lien vérifié, le bloc est retiré.
          aCompleter.push("votre lien de réservation")
          omis.push("table_booking")
          break
        }
        content.url = profil.reservation.valeur
        const hote = profil.reservation.valeur.toLowerCase()
        // La plateforme se DÉDUIT de l'URL, elle ne se suppose pas.
        content.platform = /thefork|lafourchette/.test(hote) ? "TheFork"
          : /zenchef/.test(hote) ? "Zenchef"
          : /guestonline/.test(hote) ? "GuestOnline" : ""
        faitsUtilises.push("reservation")
        break
      }

      case "documents": {
        if (!affichable(profil.carteEnLigne)) break
        content.d1_title = "Notre carte"
        content.d1_url = profil.carteEnLigne.valeur
        faitsUtilises.push("carteEnLigne")
        break
      }

      case "google_maps_embed": {
        if (!affichable(profil.adresse)) { aCompleter.push("votre adresse"); break }
        content.address = profil.adresse.valeur
        faitsUtilises.push("adresse")
        break
      }

      case "social_links": {
        poser(content, "instagram", profil.instagram, faitsUtilises, "instagram")
        poser(content, "facebook", profil.facebook, faitsUtilises, "facebook")
        break
      }

      case "testimonials":
      case "popular_products":
      case "timeline":
      case "announcement":
      case "cta_button": {
        // Ces blocs n'affirment rien qu'on puisse sourcer depuis un site public :
        // un avis, un best-seller, une histoire, une annonce. Ils restent à leur
        // contenu neutre — présents dans la structure, vides de contenu — et
        // l'établissement les remplira. `testimonials` surtout : écrire un avis
        // à la place d'un client est exactement ce que le produit s'interdit.
        break
      }
    }

    if (omis.includes(blocModele.type)) continue
    blocs.push({ type: blocModele.type, content })
    if (blocModele.type === "profile" && contactUtile) blocs.push({ type: "quick_contact", content: contact })
  }

  return {
    modeleSource: modele.key,
    theme: modele.theme,
    blocs,
    faitsUtilises: [...new Set(faitsUtilises)].sort(),
    aCompleter: [...new Set(aCompleter)].sort(),
    blocsOmis: [...new Set(omis)].sort(),
  }
}
