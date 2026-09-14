// mediaUtilise.ts — « si », là où le produit peut regarder.
//
// Relevé du 14 septembre, en balayant les confirmations du produit. Trois
// d'entre elles disent « si » d'une chose que la base sait :
//
//   assets/page.tsx:64  « Cette action est définitive. Si ces médias sont
//                         utilisés sur des pages publiées, ils n'y
//                         apparaîtront plus. »
//   assets/page.tsx:90  « Si ce média est utilisé sur une page publiée, il n'y
//                         apparaîtra plus. »
//   FileUpload.tsx:52   « S'il est utilisé sur une page publiée, le lien ne
//                         fonctionnera plus. »
//
// Le produit a pourtant tout ce qu'il faut : les pages du compte, leurs blocs,
// et l'URL du média. Il peut répondre « utilisé sur 2 pages, dont 1 publiée :
// Le Comptoir, Menu midi » — un fait — au lieu d'une condition que le
// commerçant ne peut pas lever lui-même.
//
// Deux autres formulations du produit disent « peut-être » et ont RAISON :
//
//   suppressionDePage.ts « Ce code est peut-être déjà collé ou distribué »
//   qr-link/page.tsx     « Si ce QR est déjà imprimé quelque part »
//
// Personne ne sait si un autocollant est sur une table. La règle qui distingue
// les deux : **« peut-être » est permis sur ce qui vit dehors, jamais sur ce
// que la base sait.** Module PUR.

export type PageUtilisante = { titre?: string | null; status?: string | null }

const texte = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

/**
 * Le nom de fichier d'une URL de média. C'est lui qu'on cherche, pas l'URL
 * entière : une même image peut être référencée avec des paramètres de
 * transformation ou une forme encodée différemment.
 */
export function nomDeFichierDeUrl(url: unknown): string {
  const u = texte(url)
  if (!u) return ""
  const sansQuery = u.split(/[?#]/)[0]
  const dernier = sansQuery.split("/").filter(Boolean).pop() ?? ""
  try { return decodeURIComponent(dernier) } catch { return dernier }
}

/**
 * Ce contenu (objet de bloc, thème de page…) référence-t-il ce média ?
 * On descend dans les objets et les tableaux : les blocs stockent les images
 * dans des champs de noms très variés (`avatar`, `img1`, `src`, `image`…).
 */
export function contientLeMedia(valeur: unknown, nomFichier: string): boolean {
  const cible = texte(nomFichier)
  if (!cible) return false
  const vu = new Set<unknown>()
  const descendre = (v: unknown): boolean => {
    if (typeof v === "string") return v.includes(cible)
    if (!v || typeof v !== "object" || vu.has(v)) return false
    vu.add(v)
    return Object.values(v as Record<string, unknown>).some(descendre)
  }
  return descendre(valeur)
}

export type BlocLu = { page_id?: string | null; content?: unknown }
export type PageLue = { id?: string | null; title?: string | null; status?: string | null; theme?: unknown }

/**
 * Les pages qui utilisent ce média — blocs ET thème de la page (une image de
 * fond vit dans le thème, pas dans un bloc).
 */
export function pagesUtilisantLeMedia(
  pages: PageLue[] | null | undefined,
  blocs: BlocLu[] | null | undefined,
  urlOuNom: string,
): PageUtilisante[] {
  const cible = nomDeFichierDeUrl(urlOuNom) || texte(urlOuNom)
  if (!cible) return []
  const parId = new Map<string, PageLue>()
  for (const p of pages ?? []) if (texte(p?.id)) parId.set(texte(p.id), p)

  const trouvees = new Set<string>()
  for (const p of pages ?? []) {
    if (texte(p?.id) && contientLeMedia(p?.theme, cible)) trouvees.add(texte(p.id))
  }
  for (const b of blocs ?? []) {
    const id = texte(b?.page_id)
    if (!id || trouvees.has(id) || !parId.has(id)) continue
    if (contientLeMedia(b?.content, cible)) trouvees.add(id)
  }
  return [...trouvees].map(id => ({ titre: parId.get(id)?.title ?? null, status: parId.get(id)?.status ?? null }))
}

const nomDePage = (p: PageUtilisante): string => texte(p.titre) || "Page sans titre"

/**
 * La phrase qui remplace le « si ». Elle nomme les pages, et distingue les
 * publiées : ce sont elles que les visiteurs voient aujourd'hui.
 */
export function phraseUtilisation(pages: PageUtilisante[] | null | undefined): string | null {
  const liste = pages ?? []
  if (!liste.length) return null
  const publiees = liste.filter(p => texte(p.status) === "published")
  const noms = liste.slice(0, 3).map(nomDePage).join(", ")
  const reste = liste.length - Math.min(3, liste.length)
  const suite = reste > 0 ? `, et ${reste} de plus` : ""
  const combien = liste.length === 1 ? "1 page" : `${liste.length} pages`
  const dont = publiees.length === liste.length
    ? (liste.length === 1 ? " publiée" : " publiées")
    : publiees.length > 0
      ? `, dont ${publiees.length} publiée${publiees.length > 1 ? "s" : ""}`
      : " (aucune publiée)"
  return `Utilisé sur ${combien}${dont} : ${noms}${suite}.`
}

/** Le message de confirmation d'une suppression de média. */
export function phraseSuppressionMedia(nom: string, pages: PageUtilisante[] | null | undefined): string {
  const quoi = texte(nom) ? `Supprimer « ${texte(nom)} » ?` : "Supprimer ce média ?"
  const usage = phraseUtilisation(pages)
  return usage
    ? `${quoi}\n\n${usage} Il y disparaîtra définitivement.`
    : `${quoi}\n\nIl n'est utilisé sur aucune de vos pages. La suppression est définitive.`
}

/** Et celui d'une suppression en lot : on chiffre au lieu de supposer. */
export function phraseSuppressionLot(usages: PageUtilisante[][] | null | undefined): string {
  const lots = usages ?? []
  const n = lots.length
  const utilises = lots.filter(u => (u ?? []).length > 0).length
  const tete = `${n} média${n > 1 ? "s" : ""} à supprimer. Cette action est définitive.`
  if (!utilises) return `${tete}\n\nAucun n'est utilisé sur vos pages.`
  return utilises === n
    ? `${tete}\n\n${n > 1 ? "Ils sont tous utilisés" : "Il est utilisé"} sur vos pages : ${n > 1 ? "ils y disparaîtront" : "il y disparaîtra"}.`
    : `${tete}\n\n${utilises} d'entre eux ${utilises > 1 ? "sont utilisés" : "est utilisé"} sur vos pages et ${utilises > 1 ? "y disparaîtront" : "y disparaîtra"}.`
}
