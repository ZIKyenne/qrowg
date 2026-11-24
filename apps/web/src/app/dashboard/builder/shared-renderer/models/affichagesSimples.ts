// Rendu unique, lot 2 — les affichages simples (24 nov.).
//
// Six blocs qui n'avaient encore qu'un rendu par écran : compte à rebours,
// compteur de visites, bannière de couverture, zone desservie, cadeau offert,
// produits populaires. Ce que chacun publie se décide ICI, une fois ; les deux
// adaptateurs (aperçu de l'éditeur, page publiée) ne font que dessiner.
//
// Ce que la migration a corrigé en chemin :
//   · l'aperçu de la galerie de modèles affichait « 1 234 visiteurs » — un
//     nombre écrit en dur — et un compte à rebours vers une date inventée
//     (31 décembre 2026) quand le modèle n'en avait pas ;
//   · l'aperçu de la bannière peignait son dégradé dans la couleur d'ACCENT du
//     thème, la page publiée dans la couleur PRIMAIRE ;
//   · l'aperçu du compte à rebours dessinait le bouton dès qu'il avait un
//     libellé, la page seulement s'il menait quelque part ;
//   · le cadeau publiait sa carte pour n'importe quelle adresse, puis la page
//     retirait le bouton si l'adresse ne menait nulle part : une carte « 🎁 »
//     sans rien à recevoir.
import { destinationUtile } from "../../types"
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"
import { safeColor, safeImageUrl } from "./layoutStyle"

type C = Record<string, any> | null | undefined

// ── countdown ───────────────────────────────────────────────────────────────
export type CompteARebours = {
  cibleMs: number
  accent: string
  titre: string
  sousTitre: string
  fin: string
  cta: { label: string; href: string } | null
}
/** La date est le bloc : sans date lisible, il n'y a rien à compter. `date`
 *  est l'ancienne clé de l'ancien bloc événement, toujours lue. */
export function compteARebours(c: C): CompteARebours | null {
  const brut = texteUtile(c?.target) || texteUtile(c?.date)
  const cibleMs = brut ? new Date(brut).getTime() : NaN
  if (!Number.isFinite(cibleMs)) return null
  const label = texteUtile(c?.cta_label)
  const href = destinationUtile(c?.cta_url)
  return {
    cibleMs,
    accent: safeColor(c?.accent, "#EF4444"),
    titre: texteUtile(c?.title),
    sousTitre: texteUtile(c?.subtitle),
    fin: texteUtile(c?.expired_text) || "Offre terminée",
    cta: label && href ? { label, href } : null,
  }
}

// ── visit_counter ───────────────────────────────────────────────────────────
/** Le nombre vient de la page publiée (son total de vues), jamais du contenu.
 *  Sans total réel, ou à zéro, le bloc ne publie rien — ni ailleurs un
 *  chiffre de démonstration. */
export function compteurDeVisites(total: unknown, c: C): { nombre: string; libelle: string } | null {
  const n = typeof total === "number" && Number.isFinite(total) ? Math.floor(total) : 0
  if (n <= 0) return null
  return { nombre: String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "), libelle: texteUtile(c?.label) || "visiteurs" }
}

// ── free_gift ───────────────────────────────────────────────────────────────
/** Le lien EST le cadeau : sans destination utile, plus de carte du tout. */
export function cadeauOffert(c: C): { emoji: string; description: string; label: string; href: string; externe: boolean } | null {
  const href = destinationUtile(c?.url)
  if (!href) return null
  return {
    emoji: texteUtile(c?.emoji) || "🎁",
    description: texteUtile(c?.description),
    label: texteUtile(c?.label) || "Recevoir mon guide gratuit",
    href,
    externe: /^https?:/i.test(href),
  }
}

// ── service_area ────────────────────────────────────────────────────────────
export function zoneDesservie(c: C): { titre: string; zone: string; rayon: string; villes: string[]; note: string } | null {
  const zone = texteUtile(c?.area)
  const villes = extractIndexed<string>(c || {}, plafondDesLignes("service_area"), (s, i) => texteUtile(s[`city${i}`]) || null)
  if (!zone && villes.length === 0) return null
  return { titre: texteUtile(c?.title), zone, rayon: texteUtile(c?.radius), villes, note: texteUtile(c?.note) }
}

// ── popular_products ────────────────────────────────────────────────────────
export type ProduitPopulaire = { rang: string; img: string; nom: string; prix: string; ventes: string; href: string | null }
export function produitsPopulaires(c: C): ProduitPopulaire[] {
  return extractIndexed<ProduitPopulaire>(c || {}, plafondDesLignes("popular_products"), (s, i) => {
    const nom = texteUtile(s[`p${i}_name`])
    if (!nom) return null
    return {
      // « 🥇 Numéro 1 » : seul le premier mot (la médaille) tient dans la pastille.
      rang: texteUtile(s[`p${i}_rank`]).split(/\s+/)[0] || "",
      img: safeImageUrl(s[`p${i}_img`]),
      nom,
      prix: texteUtile(s[`p${i}_price`]),
      ventes: texteUtile(s[`p${i}_sales`]),
      href: destinationUtile(s[`p${i}_url`]),
    }
  })
}

// ── cover_banner ────────────────────────────────────────────────────────────
/** Une bannière publie dès qu'elle a une image, un titre ou un sous-titre — ou
 *  un fond choisi exprès (dégradé, couleur), qui est un contenu en soi. Même
 *  règle, au mot près, que `blockEmptyState`. */
export function banniereVisible(c: C): boolean {
  return !!(texteUtile(c?.src) || texteUtile(c?.cover_title) || texteUtile(c?.cover_subtitle))
    || c?.banner_type === "gradient" || c?.banner_type === "color"
}
