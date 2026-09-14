// cleDeLien.ts — le même lien, compté une fois.
//
// Relevé du 14 septembre. Les statistiques regroupent les clics ainsi :
//
//     key = `${c.block_id}::${c.click_target}`        TopLinksPanel:144
//
// et la clé émise par les boutons est, presque partout, l'ADRESSE elle-même :
//
//     u.trackClick(trackTarget ?? href)               LayoutSurface:59
//
// Sur 52 blocs publics qui rendent un lien : 3 passent une clé stable
// (`download_file` → « download », `email_button` → « email », `whatsapp_button`
// → « whatsapp »), 11 passent `url || "repli"` — donc l'URL dès qu'elle existe —
// et les autres passent l'URL sans repli, ou rien du tout, auquel cas SmartCta
// retombe sur le `href`.
//
// Ce que ça donne, pour un commerçant qui écrit puis corrige son lien Instagram :
//
//   saisie                                        clé enregistrée
//   instagram.com/lecomptoir                      https://instagram.com/lecomptoir
//   https://instagram.com/lecomptoir              https://instagram.com/lecomptoir
//   https://www.instagram.com/lecomptoir          https://www.instagram.com/lecomptoir
//   https://www.instagram.com/lecomptoir?utm=qr   …?utm=qr
//
//   quatre saisies du MÊME lien, trois clés distinctes.
//
// « Top 10 liens » affiche alors le même bouton trois fois, ses clics coupés en
// trois. Le commerçant croit que son lien Instagram marche mal ; il marche, il
// est compté en morceaux. Ajouter un `?utm=` pour mesurer une campagne — le
// geste que le produit encourage — suffit à couper l'historique.
//
// Le produit l'avait écrit, dans `SmartCta` : « on conserve les clés historiques
// pour ne pas casser les statistiques déjà collectées ». Trois blocs sur
// cinquante-deux appliquent la phrase.
//
// La réparation ne touche PAS la base : la même normalisation est appliquée à
// l'écriture (le clic) ET à la lecture (le regroupement). Les clics déjà
// enregistrés se rassemblent donc d'eux-mêmes au prochain affichage.
//
// Module PUR.

/** Paramètres de campagne : ils décrivent la provenance, pas la destination. */
const PARAMS_DE_CAMPAGNE = /^(utm(_[a-z]+)?|fbclid|gclid|gbraid|wbraid|msclkid|mc_cid|mc_eid|igshid|ref_src|si)$/i

/** Une clé stable écrite par le produit (« download », « email »…) n'est pas une URL. */
const EST_UNE_URL = /^(https?:\/\/|mailto:|tel:|sms:)/i

const texte = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

/**
 * La clé sous laquelle un clic est compté.
 *
 * Une clé déjà stable traverse sans être touchée — c'est ce qui préserve
 * « download », « email », « whatsapp » et les autres clés historiques.
 *
 * Une adresse est ramenée à ce qui la rend unique : schéma et hôte en
 * minuscules, `www.` retiré, barre finale retirée, paramètres de campagne
 * retirés, ancre retirée. Le reste — chemin, paramètres utiles, casse du chemin —
 * est conservé : `…/menu` et `…/carte` restent deux liens.
 */
export function cleDeLien(cible: unknown): string {
  const brut = texte(cible)
  if (!brut) return ""
  if (!EST_UNE_URL.test(brut)) return brut

  // mailto: et tel: n'ont ni hôte ni paramètres : on normalise ce qui compte.
  const court = /^(mailto|tel|sms):/i.exec(brut)
  if (court) {
    const schema = court[1].toLowerCase()
    const reste = brut.slice(court[0].length).split("?")[0].trim()
    return `${schema}:${schema === "mailto" ? reste.toLowerCase() : reste.replace(/[\s.-]/g, "")}`
  }

  let u: URL
  try { u = new URL(brut) } catch { return brut }

  u.protocol = u.protocol.toLowerCase()
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "")
  u.hash = ""
  for (const nom of [...u.searchParams.keys()]) {
    if (PARAMS_DE_CAMPAGNE.test(nom)) u.searchParams.delete(nom)
  }
  u.search = u.searchParams.toString() ? `?${u.searchParams.toString()}` : ""
  // Une barre finale ne désigne pas une autre page. La racine garde la sienne.
  if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "")
  return u.toString().replace(/\/$/, u.pathname === "/" && !u.search ? "" : "$&")
}

/** La clé de regroupement des statistiques : le bloc, et le lien normalisé. */
export function cleDeRegroupement(blocId: unknown, cible: unknown): string {
  return `${texte(blocId)}::${cleDeLien(cible) || "—"}`
}

/** Deux cibles désignent-elles le même lien ? */
export function memeLien(a: unknown, b: unknown): boolean {
  const x = cleDeLien(a)
  return !!x && x === cleDeLien(b)
}

/**
 * Ce qu'on affiche pour une clé. Une clé stable n'est pas une adresse : la
 * montrer telle quelle (« download ») n'apprend rien, mais l'inventer une
 * adresse serait pire. On la rend lisible, sans prétendre qu'elle est un lien.
 */
const NOMS_DE_CLE: Record<string, string> = {
  download: "Téléchargement",
  email: "Écrire un e-mail",
  whatsapp: "WhatsApp",
  order: "Commander",
  ticket: "Billetterie",
  merch: "Boutique",
  giftcard: "Carte cadeau",
  promo_banner: "Bandeau promo",
  cta_button: "Bouton d'action",
  directions: "Itinéraire",
  spotify_player: "Spotify",
  event_info: "Informations de l'événement",
  product: "Produit",
  link: "Lien",
}

export function libelleDeCle(cle: unknown): string {
  const c = texte(cle)
  if (!c) return "—"
  if (EST_UNE_URL.test(c)) return c
  return NOMS_DE_CLE[c] ?? c
}

/** Cette clé est-elle une adresse qu'on peut proposer d'ouvrir ? */
export function cleOuvrable(cle: unknown): boolean {
  return /^https?:\/\//i.test(texte(cle))
}
