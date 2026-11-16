// prixDeLaCarte.ts — changer un prix depuis « Ma carte », sans l'éditeur.
//
// Deuxième geste du comptoir après « épuisé » : « le mojito passe à 11 € ».
// Le prix vit à deux endroits selon le bloc :
//  · `menu_section` : un champ `item{n}_price` ;
//  · `menu_tabs`    : une cellule d'une LIGNE de texte collé (« MOJITO;10€;… »),
//    lue par parseMenuPaste avec un séparateur deviné sur tout le texte.
// On ne réécrit que la cellule du prix, avec le séparateur que le texte utilise
// déjà : nom, description, autres lignes, en-tête et lignes vides restent à
// l'octet près. Le produit est reconnu par son identité (nom · description,
// voir epuises.ts) ; tous ses doublons exacts changent ensemble. Module PUR.

import { separateurProbable, estSeparateurMarkdown } from "@/lib/tableauColle"
import { cleDuPlat, identiteDuPlat } from "./epuises"
import { plafondDesLignes } from "./plafondDesLignes"
import { limite } from "@/lib/limitesDeSaisie"

export const PRIX_MAX = limite("prixDeProduit")

/**
 * Le prix saisi, mis dans la forme des prix voisins : « 11 » tapé au clavier
 * numérique devient « 11€ » si l'ancien s'écrivait « 10€ », « 11 € » s'il
 * s'écrivait « 10 € ». Un prix déjà accompagné de sa devise est gardé tel quel.
 */
export function formaterCommeAvant(ancien: string, saisi: string): string {
  const s = saisi.trim().replace(/\s+/g, " ")
  if (!s || /[^\d\s.,]/.test(s)) return s           // vide, ou devise / texte déjà écrits
  const m = /^(.*?\d)(\s*)(€|eur|euros?|\$|£|chf)\s*$/i.exec(ancien.trim())
  return m ? `${s}${m[2]}${m[3]}` : s
}

export type RefusPrix = "vide_interdit" | "trop_long" | "caractere"
/** Un prix acceptable : court, sur une ligne, et (s'il n'est pas vide) avec un chiffre. */
export function refusDuPrix(prix: string): RefusPrix | null {
  if (prix.length > PRIX_MAX) return "trop_long"
  if (/[\r\n\t;|]/.test(prix)) return "caractere"
  if (prix && !/\d/.test(prix)) return "vide_interdit"
  return null
}
export const PHRASES_REFUS: Record<RefusPrix, string> = {
  vide_interdit: "Un prix s'écrit avec des chiffres (ex. 11€).",
  trop_long: `Un prix tient en ${PRIX_MAX} caractères au plus.`,
  caractere: "Ce prix contient un caractère réservé (; | ou retour à la ligne).",
}

const PRIX_EN_FIN = /^(.*?)([\s—–-]*)((?:\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|eur|euros?|\$|£|chf)?)\s*$/i

/** Réécrit les lignes d'un texte collé dont l'identité correspond. Rend le texte et le nombre de lignes changées. */
export function texteAvecPrix(texte: string, identite: string, prix: string): { texte: string; changees: number } {
  const lignes = texte.split(/(\r?\n)/)                // garde les fins de ligne d'origine
  const utiles = lignes.filter((l, i) => i % 2 === 0 && l.trim() !== "")
  const sep = separateurProbable(utiles)
  const cle = cleDuPlat(identite)
  let changees = 0
  for (let i = 0; i < lignes.length; i += 2) {
    const l = lignes[i]
    if (!l.trim()) continue
    const cellules = l.split(sep)
    // Tableau markdown : une cellule vide de bord avant la première donnée.
    const decalage = sep === "|" && cellules[0].trim() === "" ? 1 : 0
    if (sep === "|" && estSeparateurMarkdown(cellules.slice(decalage).filter((c, k, a) => !(k === a.length - 1 && c.trim() === "")))) continue
    const donnees = cellules.length - decalage
    if (donnees >= 2) {
      const nom = cellules[decalage].trim(), desc = (cellules[decalage + 2] ?? "").trim()
      if (cleDuPlat(identiteDuPlat(nom, desc)) !== cle) continue
      // La cellule garde ses espaces autour (« ;  10€ ; ») : seul le contenu change.
      const ancienne = cellules[decalage + 1]
      const avant = /^\s*/.exec(ancienne)![0], apres = /\s*$/.exec(ancienne)![0]
      // Une virgule dans un texte séparé par des virgules ouvrirait une colonne.
      cellules[decalage + 1] = avant + (sep === "," ? prix.replace(/,/g, ".") : prix) + apres
      lignes[i] = cellules.join(sep)
      changees++
    } else {
      // Une seule colonne : « Mojito 10€ » — le prix est en fin de ligne.
      const m = PRIX_EN_FIN.exec(l)
      const nom = (m && m[1].trim() && /\d/.test(m[3]) ? m[1] : l).trim()
      if (cleDuPlat(identiteDuPlat(nom, "")) !== cle) continue
      lignes[i] = prix ? `${nom} ${prix}` : nom
      changees++
    }
  }
  return { texte: lignes.join(""), changees }
}

/** Le contenu du bloc avec ce prix, et combien de lignes ont changé (0 = produit introuvable). */
export function avecPrix<T extends Record<string, any>>(type: string, content: T, identite: string, prix: string): { content: T; changees: number } {
  const c: Record<string, any> = { ...content }
  const cle = cleDuPlat(identite)
  let changees = 0
  if (type === "menu_section") {
    for (let i = 1; i <= plafondDesLignes("menu_section"); i++) {
      const nom = c[`item${i}_name`]
      if (typeof nom !== "string" || !nom.trim()) continue
      if (cleDuPlat(identiteDuPlat(nom, c[`item${i}_desc`])) !== cle) continue
      c[`item${i}_price`] = prix
      changees++
    }
  } else if (type === "menu_tabs") {
    for (let i = 1; i <= plafondDesLignes("menu_tabs"); i++) {
      const t = c[`sec${i}_items`]
      if (typeof t !== "string" || !t) continue
      const r = texteAvecPrix(t, identite, prix)
      if (r.changees) { c[`sec${i}_items`] = r.texte; changees += r.changees }
    }
  }
  return { content: c as T, changees }
}
