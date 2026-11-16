// Le profil de marque — ce que QRowg a le droit de dire de LUI-MÊME.
//
// ── Le chaînon qui manquait ────────────────────────────────────────────────
//
// Tout le moteur de croissance s'interdit d'inventer quoi que ce soit sur le
// COMMERÇANT : `profilEtablissement.ts` exige une provenance par champ,
// `generateurRestaurant.ts` refuse de recopier les plats de démonstration,
// `controleQualite.ts` rejette la page qui affirmerait sans appui.
//
// Et sur NOUS, rien. La page de proposition dit « Proposition non officielle
// créée par QRowg » — puis plus un mot. Celui qui la reçoit ne lui a rien
// demandé, et elle ne lui dit ni qui l'envoie, ni ce que ça coûte, ni comment
// la faire disparaître. La règle appliquée au prospect vaut d'abord pour
// l'expéditeur : **une promesse publique n'est jamais plus large que
// l'inventaire** (`confianceQuiSeVerifie.test.ts`, Q13).
//
// ── Pourquoi ce module REFUSE, au lieu de rédiger ─────────────────────────
//
// Une page de proposition non sollicitée doit nommer son expéditeur. Pas par
// politesse : c'est ce qui distingue une proposition d'un spam, et c'est ce
// qu'exige la LCEN (art. 6-III) de tout service en ligne. Or `lib/editeur.ts`
// est AUJOURD'HUI entièrement vide — raison sociale, forme juridique, SIRET,
// siège, directeur de publication : cinq `null`. La page `/legal` en tire déjà
// la seule conclusion honnête : elle se retire de l'index plutôt que d'afficher
// des crochets.
//
// Ce module en tire la même. Tant que l'identité n'est pas renseignée, il ne
// rend PAS une présentation dégradée : il rend un refus, qui nomme les champs
// manquants. Une proposition anonyme ne part pas.
//
// ── Pourquoi il ne contient presque aucun texte de vente ──────────────────
//
// Les arguments produit ne sont pas écrits ici : ils sont DÉRIVÉS des avantages
// du palier gratuit (`plans.ts`), qui portent déjà chacun leur `preuve` — un
// champ de limite, une capacité, ou un fichier du produit. Écrire une seconde
// liste à la main créerait une quatrième source de vérité sur ce que QRowg
// fait, à côté des trois que le dépôt traîne déjà ailleurs.
//
// Conséquence voulue : on ne peut promettre au prospect que ce que le palier à
// 0 € tient réellement. Il découvrira le produit par ce qu'il peut obtenir sans
// payer, et la grille tarifaire et la proposition ne pourront plus diverger.

import { EDITEUR, mentionsManquantes, type Editeur } from "@/lib/editeur"
import { PLANS, type Perk, type Preuve } from "@/lib/plans"
import { JOURS_DE_VALIDITE } from "./jetonApercu"
import { JOURS_DE_GRACE } from "./retentionApercus"

/**
 * Ce qui adosse une revendication.
 *
 * Les deux premières formes viennent de `plans.ts` : un champ vérifiable ici
 * même, ou un fichier du produit. La troisième est à nous, et elle est
 * volontairement laide à écrire — `tenu_a_la_main:` dit qu'AUCUNE mécanique ne
 * garantit la promesse, seulement quelqu'un qui lit ses e-mails. Une promesse
 * humaine reste légitime ; la déguiser en mécanisme ne l'est pas.
 */
export type Appui = Preuve | `fichier:${string}` | `tenu_a_la_main:${string}`

export type NatureDeRevendication = "produit" | "tarif" | "engagement"

export type Revendication = {
  cle: string
  texte: string
  nature: NatureDeRevendication
  appui: Appui
}

/**
 * L'adresse unique de la proposition.
 *
 * Le dépôt en utilise cinq (`contact@`, `bonjour@`, `hello@`, `support@`,
 * `privacy@`). Pour une page que le destinataire n'a pas demandée, une seule
 * compte : celle que `/legal` publie comme voie de réclamation. Un test le
 * vérifie en lisant la page, pour que le jour où `/legal` change d'adresse,
 * cette constante ne reste pas seule en arrière.
 */
export const ADRESSE_DE_CONTACT = "contact@qrowg.com"

/**
 * Les familles de phrases qu'on s'interdit, et ce qui les démasque.
 *
 * Ce ne sont pas des interdits de style : chacune affirme quelque chose que ce
 * dépôt ne peut pas prouver. Le nombre de clients n'existe nulle part en base ;
 * aucun avis n'a jamais été recueilli ; aucun classement n'a été établi ; aucune
 * conversion n'a jamais été observée (`scoreProspect.ts` le dit déjà en propres
 * termes). L'urgence, elle, ne ment pas sur un fait : elle fabrique une
 * contrainte qui n'existe pas, ce qui revient au même pour celui qui la lit.
 */
const FAMILLES_INTERDITES: { nom: string; motif: RegExp }[] = [
  {
    nom: "clientèle chiffrée",
    motif: /\b(?:déjà\s+)?\+?\s?\d[\d\s.,]*\s*(?:clients?|commerçants?|restaurants?|entreprises?|utilisateurs?|professionnels?|pages?\s+créées?|établissements?)\b/i,
  },
  {
    nom: "avis ou note",
    motif: /\b\d(?:[.,]\d)?\s*\/\s*5\b|\bétoiles?\b|\bavis\s+(?:clients?|vérifiés?|positifs?)\b|\bnote\s+moyenne\b|\bnous\s+font\s+confiance\b/i,
  },
  {
    nom: "superlatif non établi",
    // « le premier » demande une précaution : « dès le premier mois » n'est pas
    // un classement, c'est une date. La première version de ce motif l'a pris
    // pour un superlatif et a classé « +40 % de réservations dès le premier
    // mois » dans la mauvaise famille — le détecteur mordait, mais il désignait
    // le mauvais coupable, et l'auteur de la phrase aurait corrigé à côté.
    motif: /\bn°\s*1\b|\bnuméro\s+un\b|\ble\s+meilleur\b|\ble\s+premier\s+(?!mois|jour|semaine|an\b|année|trimestre|essai)|\bla\s+référence\b|\bleader\b|\ble\s+plus\s+(?:utilisé|simple|rapide)\b/i,
  },
  {
    nom: "urgence fabriquée",
    motif: /\boffre\s+limitée\b|\bplus\s+que\s+\d|\bdernière[s]?\s+(?:chance|places?)\b|\bdépêchez[-\s]vous\b|\bexpire\s+dans\b|\bse\s+termine\s+(?:ce\s+soir|demain)\b/i,
  },
  {
    nom: "promesse de résultat",
    motif: /\+\s?\d+\s*%|\b(?:augmentez|doublez|triplez|multipliez|boostez)\b|\bgarantie?\s+de\s+résultat/i,
  },
]

/**
 * La famille interdite que ce texte déclenche, ou `null`.
 *
 * Rendue par son NOM et pas par un booléen : un refus doit pouvoir dire
 * laquelle, sinon l'auteur de la phrase corrige au hasard.
 */
export function motifInterdit(texte: string): string | null {
  for (const f of FAMILLES_INTERDITES) if (f.motif.test(texte)) return f.nom
  return null
}

/**
 * Ce que le palier gratuit tient réellement, converti en revendications.
 *
 * On ne garde que les avantages INCLUS, PROUVÉS et DÉJÀ CONSTRUITS. Un avantage
 * marqué `soon` est une promesse de feuille de route : la grille tarifaire a le
 * droit de l'afficher à quelqu'un qui vient chercher un plan, une proposition
 * envoyée à quelqu'un qui n'a rien demandé ne l'a pas.
 */
export function revendicationsDuProduit(perks: readonly Perk[] = PLANS.free.perks): Revendication[] {
  return perks
    .filter(p => p.included && !p.soon && p.preuve)
    .map(p => ({
      cle: `gratuit:${p.preuve}`,
      texte: p.text,
      nature: "produit" as const,
      appui: p.preuve as Preuve,
    }))
}

/** Le prix du palier gratuit, dit par la grille et non par nous. */
export function revendicationTarifaire(): Revendication {
  const free = PLANS.free
  return {
    cle: "tarif:gratuit",
    // `label` et `priceMonthly` viennent de la grille. Si elle change, cette
    // phrase change avec elle — c'est tout l'intérêt de ne pas l'écrire ici.
    texte: `Le palier « ${free.label} » existe : ${free.priceMonthly} € par mois.`,
    nature: "tarif",
    // Pas une `Preuve` de `plans.ts` : le prix n'est ni une limite ni une
    // capacité, c'est un champ de la grille. On nomme donc le champ.
    appui: "fichier:lib/plans.ts › PLANS.free.priceMonthly",
  }
}

/**
 * Combien de jours cette page survit sans que personne ne fasse rien.
 *
 * Trente jours servis, puis sept jours de grâce en base, puis effacée. Les deux
 * nombres viennent des modules qui les appliquent vraiment ; les recopier ici
 * aurait produit une promesse que la purge aurait démentie en silence.
 */
export function dureeDeVieEnJours(): number {
  return JOURS_DE_VALIDITE + JOURS_DE_GRACE
}

/** Les engagements, qui ne portent que sur ce que nous maîtrisons. */
export function revendicationsDEngagement(): Revendication[] {
  return [
    {
      cle: "engagement:non_officielle",
      texte: "Cette page n'est pas officielle : vous ne l'avez ni demandée, ni approuvée, et vous n'êtes pas client.",
      nature: "engagement",
      appui: "fichier:app/apercu/[jeton]/ApercuPropose.tsx",
    },
    {
      cle: "engagement:faits_sources",
      texte: "Tout ce qu'elle affiche sur votre établissement vient de votre site public. Le reste est laissé vide, pas deviné.",
      nature: "engagement",
      appui: "fichier:lib/growth/profilEtablissement.ts",
    },
    {
      cle: "engagement:effacement",
      texte: `Sans rien faire de votre part, elle cesse d'être consultable après ${JOURS_DE_VALIDITE} jours et disparaît ${JOURS_DE_GRACE} jours plus tard.`,
      nature: "engagement",
      appui: "fichier:lib/growth/retentionApercus.ts",
    },
    {
      cle: "engagement:retrait",
      // Pas de mécanique derrière : personne ne clique, quelqu'un lit. On le
      // dit, plutôt que de laisser croire à un bouton de désinscription.
      texte: `Un mot à ${ADRESSE_DE_CONTACT} et elle est retirée immédiatement, sans question.`,
      nature: "engagement",
      appui: `tenu_a_la_main:${ADRESSE_DE_CONTACT}`,
    },
  ]
}

export type Presentation = {
  /** Qui envoie, nommé comme sur les mentions légales. */
  expediteur: string
  /** Pourquoi cette page existe, dit sans tourner autour. */
  pourquoiCettePage: string
  revendications: Revendication[]
  /** La ligne de retrait, répétée seule pour ne jamais être noyée. */
  retrait: string
}

export type Refus = {
  possible: false
  raison: string
  /** Ce qu'il faut renseigner pour lever le refus. Nommé, pas sous-entendu. */
  manque: string[]
}

export type Resultat = { possible: true; presentation: Presentation } | Refus

/**
 * La présentation de QRowg sur une page de proposition — ou le refus de la
 * produire.
 *
 * Deux refus, et ils ne se négocient pas :
 *
 *  1. **l'identité de l'éditeur manque** — une proposition non sollicitée qui
 *     ne nomme pas son expéditeur est anonyme, et une proposition anonyme ne
 *     part pas ;
 *  2. **une revendication déclenche une famille interdite** — le texte vient de
 *     la grille tarifaire, qu'une main peut modifier sans penser à cette page.
 *     Le jour où un avantage s'intitulera « +40 % de réservations », la
 *     proposition entière s'arrêtera plutôt que de l'emporter avec elle.
 */
export function presenterLaMarque(
  identite: Editeur = EDITEUR,
  // Injectable pour une seule raison : prouver que le second refus fonctionne.
  // Sans ce paramètre, aucun test ne peut contaminer la grille, et le jour où
  // quelqu'un retirerait ce contrôle, la suite resterait verte.
  perks: readonly Perk[] = PLANS.free.perks,
): Resultat {
  const manquants = mentionsManquantes(identite)
  if (manquants.length > 0) {
    return {
      possible: false,
      raison: "Une proposition non sollicitée doit nommer son expéditeur ; l'identité de l'éditeur n'est pas renseignée.",
      manque: manquants.map(String),
    }
  }

  const revendications = [
    ...revendicationsDuProduit(perks),
    revendicationTarifaire(),
    ...revendicationsDEngagement(),
  ]

  const fautives = revendications
    .map(r => ({ r, famille: motifInterdit(r.texte) }))
    .filter((x): x is { r: Revendication; famille: string } => x.famille !== null)

  if (fautives.length > 0) {
    return {
      possible: false,
      raison: "Une revendication appartient à une famille que ce dépôt ne peut pas prouver.",
      manque: fautives.map(x => `${x.r.cle} — ${x.famille}`),
    }
  }

  const e = identite
  return {
    possible: true,
    presentation: {
      expediteur: `${e.raisonSociale} (${e.formeJuridique}, SIRET ${e.siret}) — ${e.siege}. Directeur de la publication : ${e.directeurPublication}.`,
      pourquoiCettePage:
        "Nous avons composé cette page à partir des informations publiques de votre site, pour vous montrer ce que QRowg ferait du vôtre. Vous ne nous avez rien demandé.",
      revendications,
      retrait: `Pour la faire retirer : ${ADRESSE_DE_CONTACT}.`,
    },
  }
}
