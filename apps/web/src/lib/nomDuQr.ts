// nomDuQr.ts — le nom du support qui ne sort jamais de l'écran des statistiques.
//
// Relevé du 13 septembre. Le produit demande au commerçant de nommer ses
// supports — c'est le rôle de `api/qr-label` : « renomme un QR (nom du support
// pour l'attribution : « Vitrine », « Table 4 »…) » — et il affiche ces noms
// dans « Performance par support ».
//
// Partout ailleurs, `qr_codes.label` n'est pas lu. À la place, le titre de la
// PAGE :
//
//   · nom du fichier exporté (QRStudio) :
//       expFilename.trim() || active?.pages?.title?.replace(…) || short_code
//   · liste de choix de l'atelier d'impression (PrintStudioClient) :
//       .select("short_code, pages(title, slug)")   ← `label` pas même demandé
//       list.push({ …, label: pg?.title || pg?.slug || "QR code" })
//
// Or depuis le lot v83, une page porte plusieurs supports pour de bon : vitrine,
// tables, flyers. Conséquences concrètes, au moment précis où il faut les
// distinguer :
//
//   · l'atelier d'impression affiche « Le Comptoir » quatre fois de suite, et
//     rien ne dit lequel est la vitrine ;
//   · quatre exports atterrissent dans le dossier Téléchargements sous
//     « le-comptoir.png », « le-comptoir (1).png », « le-comptoir (2).png »…
//     C'est à l'imprimeur qu'on s'en aperçoit.
//
// Un seul nom, une seule règle, dans tout le produit. Module PUR.

export type QrNommable = {
  /** Le nom du support, donné par le commerçant (« Vitrine », « Table 4 »). */
  label?: string | null
  /** Le titre de la page derrière le QR. */
  pageTitre?: string | null
  short_code?: string | null
}

const texte = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

/**
 * Le nom sous lequel un QR se montre, partout.
 *
 * L'ordre n'est pas arbitraire : le nom du support est ce que le commerçant a
 * écrit LUI-MÊME pour distinguer ce QR des autres. Le titre de la page ne les
 * distingue pas — c'est le même pour tous les supports d'une page.
 */
export function nomDuQr(qr: QrNommable | null | undefined): string {
  const l = texte(qr?.label)
  if (l) return l
  const p = texte(qr?.pageTitre)
  if (p) return p
  const c = texte(qr?.short_code)
  return c ? `code ${c}` : "QR sans nom"
}

/**
 * Le même nom, mais quand une page porte plusieurs supports : on ajoute le nom
 * de la page pour situer, sans perdre ce qui distingue.
 */
export function nomDuQrSitue(qr: QrNommable | null | undefined): string {
  const l = texte(qr?.label)
  const p = texte(qr?.pageTitre)
  if (l && p) return `${p} — ${l}`
  return nomDuQr(qr)
}

/**
 * Le nom d'une ligne `qr_codes` telle que la base la rend, page jointe comprise
 * (PostgREST rend la jointure tantôt en objet, tantôt en tableau).
 */
export function nomDeLigneQr(q: any): string {
  const pg = Array.isArray(q?.pages) ? q.pages[0] : q?.pages
  return nomDuQrSitue({ label: q?.label, pageTitre: pg?.title || pg?.slug, short_code: q?.short_code })
}

const ACCENTS = /[̀-ͯ]/g

/**
 * Un nom de fichier qui se lit dans un dossier Téléchargements et qui ne
 * ressemble pas au voisin. Jamais vide.
 */
export function nomDeFichier(nom: string, suffixe?: string | null): string {
  const base = (nom || "")
    .normalize("NFD").replace(ACCENTS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  const s = texte(suffixe).toLowerCase().replace(/[^a-z0-9]+/g, "")
  const tete = base || "qr"
  return s ? `${tete}-${s}` : tete
}

/**
 * Le nom de fichier d'un QR : son nom lisible, et son code court en suffixe.
 *
 * Le code court est ce qui rend deux fichiers distincts même quand deux supports
 * portent le même nom — et c'est aussi lui qu'on retrouve sur le QR imprimé
 * quand on cherche de quel fichier il vient.
 */
export function fichierDuQr(qr: QrNommable | null | undefined): string {
  return nomDeFichier(nomDuQr(qr), qr?.short_code)
}
