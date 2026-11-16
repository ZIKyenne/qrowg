// ajoutDeProduit.ts — compléter sa carte depuis « Ma carte », sans l'éditeur.
//
// Troisième geste du comptoir : « on a un nouveau cocktail ». Le produit est
// ajouté À LA FIN de sa rubrique :
//  · `menu_section` : la ligne numérotée suivante (item{n}_name/price/desc) ;
//  · `menu_tabs`    : une ligne au bout du texte collé de l'onglet, écrite avec
//    le séparateur que ce texte utilise DÉJÀ — en changer ferait relire toutes
//    les autres lignes autrement (parseMenuPaste devine le séparateur sur le
//    texte entier).
// Refusé : un doublon exact (même nom, même description — l'état « épuisé » et
// le prix les confondraient), et une ligne que la carte n'afficherait pas
// (plafonds du rendu). Module PUR.

import { separateurProbable } from "@/lib/tableauColle"
import { parseMenuPaste } from "../../menuImport"
import { cleDuPlat, identiteDuPlat } from "./epuises"
import { refusDuPrix, PHRASES_REFUS } from "./prixDeLaCarte"
import { plafondDesLignes } from "./plafondDesLignes"
import { limite } from "@/lib/limitesDeSaisie"

// Nommées une fois dans lib/limitesDeSaisie : l'écran les affiche, ce module les applique.
export const NOM_MAX = limite("nomDeProduit")
export const DESC_MAX = limite("descriptionDeProduit")
/** parseMenuPaste ne lit que les 50 premières lignes d'un onglet. */
export const LIGNES_PAR_ONGLET = 50

export type NouveauProduit = { nom: string; prix: string; desc: string }
export type RefusAjout = "nom_vide" | "nom_long" | "desc_longue" | "prix" | "doublon" | "plein" | "rubrique"

/** Une ligne de texte propre : pas de retour à la ligne, pas de tabulation, espaces resserrés. */
export const champPropre = (s: string) => (s ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim()

export function refusDuProduit(p: NouveauProduit): { raison: RefusAjout; phrase: string } | null {
  if (!p.nom) return { raison: "nom_vide", phrase: "Donnez un nom au produit." }
  if (p.nom.length > NOM_MAX) return { raison: "nom_long", phrase: `Un nom tient en ${NOM_MAX} caractères au plus.` }
  if (p.desc.length > DESC_MAX) return { raison: "desc_longue", phrase: `Une description tient en ${DESC_MAX} caractères au plus.` }
  const rp = refusDuPrix(p.prix)
  if (rp) return { raison: "prix", phrase: PHRASES_REFUS[rp] }
  return null
}

/** La ligne à ajouter, dans le format du texte existant. */
export function ligneAuFormat(texte: string, p: NouveauProduit): string {
  const lignes = texte.split(/\r?\n/).filter(l => l.trim() !== "")
  const sep = lignes.length ? separateurProbable(lignes) : ";"
  const sansSep = (s: string, remplacement: string) => s.split(sep).join(remplacement)
  if (sep === "\t" && texte.includes("\t")) return [p.nom, p.prix, p.desc].join("\t").replace(/\t+$/, "")
  if (sep === "|") return `| ${sansSep(p.nom, "/")} | ${sansSep(p.prix, "/")} | ${sansSep(p.desc, "/")} |`
  // Virgules : une virgule dans un champ ouvrirait une colonne.
  if (sep === ",") return [sansSep(p.nom, " -"), p.prix.replace(/,/g, "."), sansSep(p.desc, " -")].join(",").replace(/,+$/, "")
  // Point-virgule, texte vide, ou une seule colonne (« Mojito 10€ ») : le
  // point-virgule ne change pas la lecture des lignes d'une colonne.
  const pv = (s: string) => s.replace(/;/g, ",")
  return [pv(p.nom), pv(p.prix), pv(p.desc)].join(";").replace(/;+$/, "")
}

export function avecProduit<T extends Record<string, any>>(
  type: string, content: T, section: number | null, brut: NouveauProduit,
): { ok: true; content: T; produit: NouveauProduit } | { ok: false; raison: RefusAjout; phrase: string } {
  const p = { nom: champPropre(brut.nom), prix: champPropre(brut.prix), desc: champPropre(brut.desc) }
  const refus = refusDuProduit(p)
  if (refus) return { ok: false, ...refus }
  const cle = cleDuPlat(identiteDuPlat(p.nom, p.desc))
  const c: Record<string, any> = { ...content }
  const doublon = { ok: false as const, raison: "doublon" as const, phrase: "Ce produit est déjà sur la carte, avec la même description." }

  if (type === "menu_section") {
    const max = plafondDesLignes("menu_section")
    let dernier = 0
    for (let i = 1; i <= max + 50; i++) {
      if (["name", "price", "desc"].some(k => typeof c[`item${i}_${k}`] === "string" && c[`item${i}_${k}`].trim())) dernier = i
      const nom = c[`item${i}_name`]
      if (typeof nom === "string" && nom.trim() && cleDuPlat(identiteDuPlat(nom, c[`item${i}_desc`])) === cle) return doublon
    }
    const n = dernier + 1
    if (n > max) return { ok: false, raison: "plein", phrase: `Cette rubrique est pleine (${max} produits). Ajoutez-en une autre dans l'éditeur.` }
    c[`item${n}_name`] = p.nom; c[`item${n}_price`] = p.prix; c[`item${n}_desc`] = p.desc
    return { ok: true, content: c as T, produit: p }
  }

  if (type === "menu_tabs") {
    if (!section || section < 1 || section > plafondDesLignes("menu_tabs")) return { ok: false, raison: "rubrique", phrase: "Rubrique introuvable." }
    const texte: string = typeof c[`sec${section}_items`] === "string" ? c[`sec${section}_items`] : ""
    const items = parseMenuPaste(texte, LIGNES_PAR_ONGLET + 1)
    if (items.some(it => cleDuPlat(identiteDuPlat(it.name, it.desc)) === cle)) return doublon
    if (items.length >= LIGNES_PAR_ONGLET) return { ok: false, raison: "plein", phrase: `Cet onglet est plein (${LIGNES_PAR_ONGLET} produits). Ajoutez une section dans l'éditeur.` }
    const fin = /\r\n/.test(texte) ? "\r\n" : "\n"
    const base = texte.replace(/[\r\n]+$/, "")
    c[`sec${section}_items`] = (base ? base + fin : "") + ligneAuFormat(texte, p)
    return { ok: true, content: c as T, produit: p }
  }
  return { ok: false, raison: "rubrique", phrase: "Rubrique introuvable." }
}
