// Modele PUR de la famille « chaines et reseaux » (aucun React) :
// instagram_feed, tiktok_feed, youtube_channel, twitch_live, discord_server,
// telegram_channel et social_feature.
//
// Sept blocs de meme forme — un nom, quelques lignes d'information, un bouton —
// donc sept fois la meme derive possible. Ce qu'ils avaient :
//
//  · tiktok_feed — l'apercu dessinait SIX FAUSSES VIGNETTES VIDEO en 9/16, avec
//    une note de musique dedans. La page n'en publie aucune : il n'y a pas
//    d'integration TikTok. Le commercant croyait donc composer un mur de vidéos
//    qui n'existerait jamais. Meme famille que les six cases de la galerie,
//    mais en pire : ca ressemble a du contenu integre.
//
//  · discord_server et telegram_channel — l'apercu dessinait TOUJOURS le
//    bouton, avec « Rejoindre le Discord » par defaut, meme sans adresse.
//
//  · youtube_channel et tiktok_feed — l'inverse : la page publiait un bouton
//    (« S'abonner », « Voir sur TikTok ») que l'apercu ne montrait pas tant que
//    le libelle n'etait pas saisi a la main.
//
//  · cinq d'entre eux se publiaient avec un simple nom, sans adresse. Depuis
//    que le rendu ne publie plus de bouton sans destination, cela donnait une
//    carte inerte : un nom de serveur, une icone, et rien a cliquer.
//    `instagram_feed` avait deja la bonne regle ; elle vaut maintenant pour
//    toute la famille — ces blocs existent pour envoyer quelque part.

import { destinationUtile, socialHref, SOCIAL_NETWORKS_MAP } from "../../types"

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

export type LigneChaine = { icone: string; texte: string; couleur: string | null }
export type Chaine = { nom: string; lignes: LigneChaine[]; cta: { label: string; href: string }; enDirect: boolean }

export type Reglage = {
  /** La clé qui porte le nom de la chaîne (username, channel_name, server_name…). */
  cleNom: string
  /** Le libellé du bouton quand le commerçant n'en a pas saisi. */
  labelParDefaut: string
  /** Les lignes d'information sous le nom, dans l'ordre. */
  lignes?: { champ: string; icone?: string; couleur?: string; siEnDirect?: boolean }[]
}

/**
 * Sans destination utilisable, ces blocs ne publient rien.
 * Ils existent pour envoyer le visiteur vers une chaîne : un nom seul ne lui
 * sert à rien, et depuis que le rendu ne publie plus de bouton mort, la carte
 * serait inerte.
 */
export function chaine(c: Record<string, any> | null | undefined, r: Reglage): Chaine | null {
  const src = c || {}
  const href = destinationUtile(txt(src.cta_url))
  if (!href) return null
  const enDirect = txt(src.status) === "live"
  const lignes: LigneChaine[] = (r.lignes ?? [])
    .filter(l => !l.siEnDirect || enDirect)
    .map(l => ({ icone: l.icone ?? "", texte: txt(src[l.champ]), couleur: l.couleur ?? null }))
    .filter(l => l.texte !== "")
  return {
    nom: txt(src[r.cleNom]),
    lignes,
    cta: { label: txt(src.cta_label) || r.labelParDefaut, href },
    enDirect,
  }
}

// ── Réseau mis en avant ─────────────────────────────────────────────────────

export type ReseauVedette = {
  icone: string; couleur: string; libelleReseau: string
  titre: string; description: string; compte: string; image: string
  cta: { label: string; href: string }
}

/** `social_feature` : une grande carte pour UN réseau. L'adresse est construite
 *  à partir du pseudo, comme dans le bloc « Réseaux sociaux ». */
export function reseauVedette(c: Record<string, any> | null | undefined): ReseauVedette | null {
  const src = c || {}
  const cle = txt(src.network)
  const href = destinationUtile(socialHref(cle, txt(src.url)))
  if (!href) return null
  const n = SOCIAL_NETWORKS_MAP[cle] ?? { icon: "🔗", color: "#C9A84C", label: "Réseau" }
  return {
    icone: n.icon, couleur: n.color, libelleReseau: n.label,
    // « Suivez-moi » et « Suivre » nomment le meuble, pas l'entreprise : ce
    // sont des étiquettes, pas des affirmations. Elles restent.
    titre: txt(src.title) || "Suivez-moi",
    description: txt(src.description), compte: txt(src.count), image: txt(src.image),
    cta: { label: txt(src.cta_label) || "Suivre", href },
  }
}
