// editionDeProduit.ts — corriger ou retirer un produit depuis « Ma carte ».
//
// Les deux derniers gestes qui obligeaient à ouvrir l'éditeur : corriger un nom
// ou une description (« Spritz Apérol » → « Aperol Spritz »), et retirer un
// produit qui quitte la carte — avec retour arrière (« Annuler »), d'où
// `remettreProduit` qui le replace à sa place exacte.
//
// Même discipline que prixDeLaCarte / ajoutDeProduit : dans une grande carte,
// seule la ligne visée change, avec le séparateur que le texte utilise déjà ;
// les autres lignes, l'en-tête et les fins de ligne restent à l'octet près.
// Le repérage des lignes suit EXACTEMENT les règles de parseMenuPaste
// (séparateur deviné sur tout le texte, première rangée d'en-tête sautée,
// lignes de tirets markdown ignorées) — un test le vérifie. Module PUR.

import { separateurProbable, estSeparateurMarkdown, ressembleAUnEntete } from "@/lib/tableauColle"
import { cleDuPlat, identiteDuPlat, CLE_EPUISES } from "./epuises"
import { champPropre, ligneAuFormat, NOM_MAX, DESC_MAX } from "./ajoutDeProduit"
import { plafondDesLignes } from "./plafondDesLignes"

export type ProduitEdite = { nom: string; desc: string }
export type Retire = { nom: string; prix: string; desc: string; index: number }
type Echec = { ok: false; phrase: string }

const PRIX_EN_FIN = /^(.*?)[\s—–-]*((?:\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|eur|euros?|\$|£|chf)?)\s*$/i

type Ligne = { i: number; cellules: string[]; decalage: number; nom: string; prix: string; desc: string; mono: boolean }

/** Les lignes de produits d'un texte collé, dans l'ordre où parseMenuPaste les lit. */
export function lignesDeProduits(texte: string): { morceaux: string[]; sep: string; lignes: Ligne[] } {
  const morceaux = texte.split(/(\r?\n)/)           // indices pairs = lignes, impairs = fins de ligne
  const pleines = morceaux.filter((l, k) => k % 2 === 0 && l.trim() !== "")
  const sep = separateurProbable(pleines)
  const rangees: { i: number; brutes: string[]; cellules: string[]; decalage: number }[] = []
  for (let i = 0; i < morceaux.length; i += 2) {
    if (!morceaux[i].trim()) continue
    const brutes = morceaux[i].split(sep)
    let cellules = brutes.map(c => c.trim()), decalage = 0
    if (sep === "|") {
      if (cellules[0] === "") { cellules = cellules.slice(1); decalage = 1 }
      if (cellules.length && cellules[cellules.length - 1] === "") cellules = cellules.slice(0, -1)
      if (!cellules.length || estSeparateurMarkdown(cellules)) continue
    }
    rangees.push({ i, brutes, cellules, decalage })
  }
  // corpsEtEntete : la première rangée est sautée si elle a l'air d'un en-tête ET qu'il en reste derrière.
  const corps = rangees.length > 1 && ressembleAUnEntete(rangees[0].cellules) ? rangees.slice(1) : rangees
  const lignes: Ligne[] = []
  for (const r of corps) {
    let nom = r.cellules[0] ?? "", prix = r.cellules[1] ?? ""
    const desc = r.cellules[2] ?? ""
    const mono = !prix && r.cellules.length === 1
    if (mono) { const m = PRIX_EN_FIN.exec(nom); if (m && m[1].trim() && /\d/.test(m[2])) { nom = m[1].trim(); prix = m[2].trim() } }
    if (!nom) continue
    lignes.push({ i: r.i, cellules: r.brutes, decalage: r.decalage, nom, prix, desc, mono })
  }
  return { morceaux, sep, lignes }
}

/** Un champ sans le séparateur du texte (il ouvrirait une colonne). */
function sansSeparateur(s: string, sep: string): string {
  if (sep === ";") return s.replace(/;/g, ",")
  if (sep === ",") return s.replace(/,/g, " -")
  if (sep === "|") return s.replace(/\|/g, "/")
  return s
}

/** La ligne réécrite avec un nouveau nom / une nouvelle description, prix inchangé. */
function ligneModifiee(l: Ligne, sep: string, texteAUnSeparateur: boolean, p: ProduitEdite): string {
  if (l.mono || !texteAUnSeparateur) {
    // Une seule colonne : la description ne tient que si l'on passe au point-virgule
    // (sans effet sur la lecture des autres lignes d'une colonne).
    return p.desc ? ligneAuFormat("", { nom: p.nom, prix: l.prix, desc: p.desc }) : `${p.nom}${l.prix ? " " + l.prix : ""}`
  }
  const c = [...l.cellules]
  const garde = (ancienne: string | undefined, neuve: string) => {
    const a = ancienne ?? ""
    return (/^\s*/.exec(a)![0]) + neuve + (/\s*$/.exec(a)![0])
  }
  const k = l.decalage
  c[k] = garde(c[k], sansSeparateur(p.nom, sep))
  if (c[k + 1] === undefined) c[k + 1] = sep === "|" ? " " : ""
  if (p.desc || c[k + 2] !== undefined) c[k + 2] = garde(c[k + 2] ?? (sep === "|" ? " " : ""), sansSeparateur(p.desc, sep))
  if (sep === "|" && c.length === k + 3) c.push("")   // bordure de fin d'un tableau markdown
  return c.join(sep)
}

const plein = (texte: string) => /[\t|;,]/.test(texte)
const doublon: Echec = { ok: false, phrase: "Un autre produit porte déjà ce nom et cette description." }
const introuvable: Echec = { ok: false, phrase: "Ce produit a changé depuis l'ouverture de l'écran. Rechargez la page." }

function verifier(p: ProduitEdite): ProduitEdite | Echec {
  const nom = champPropre(p.nom), desc = champPropre(p.desc)
  if (!nom) return { ok: false, phrase: "Donnez un nom au produit." }
  if (nom.length > NOM_MAX) return { ok: false, phrase: `Un nom tient en ${NOM_MAX} caractères au plus.` }
  if (desc.length > DESC_MAX) return { ok: false, phrase: `Une description tient en ${DESC_MAX} caractères au plus.` }
  return { nom, desc }
}

/** L'état « épuisé » suit le produit renommé. */
function epuisesRenommes(c: Record<string, any>, ancienne: string, nouvelle: string) {
  const v = c[CLE_EPUISES]
  if (typeof v !== "string" || !v) return
  const cle = cleDuPlat(ancienne)
  c[CLE_EPUISES] = v.split("\n").map(l => (cleDuPlat(l) === cle ? nouvelle : l)).join("\n")
}

export function modifierProduit<T extends Record<string, any>>(
  type: string, content: T, section: number | null, identite: string, brut: ProduitEdite,
): { ok: true; content: T; produit: ProduitEdite } | Echec {
  const p = verifier(brut)
  if ("ok" in p) return p
  const cle = cleDuPlat(identite), neuve = identiteDuPlat(p.nom, p.desc), cleNeuve = cleDuPlat(neuve)
  const c: Record<string, any> = { ...content }
  if (type === "menu_section") {
    const cibles: number[] = []
    for (let i = 1; i <= plafondDesLignes("menu_section") + 50; i++) {
      const nom = c[`item${i}_name`]
      if (typeof nom !== "string" || !nom.trim()) continue
      const k = cleDuPlat(identiteDuPlat(nom, c[`item${i}_desc`]))
      if (k === cle) cibles.push(i)
      else if (k === cleNeuve) return doublon
    }
    if (!cibles.length) return introuvable
    for (const i of cibles) { c[`item${i}_name`] = p.nom; c[`item${i}_desc`] = p.desc }
  } else if (type === "menu_tabs") {
    const cleTexte = `sec${section}_items`
    if (!section || typeof c[cleTexte] !== "string") return introuvable
    const { morceaux, sep, lignes } = lignesDeProduits(c[cleTexte])
    const cibles = lignes.filter(l => cleDuPlat(identiteDuPlat(l.nom, l.desc)) === cle)
    if (!cibles.length) return introuvable
    if (lignes.some(l => cleDuPlat(identiteDuPlat(l.nom, l.desc)) === cleNeuve && !cibles.includes(l))) return doublon
    const aUnSep = plein(c[cleTexte])
    for (const l of cibles) morceaux[l.i] = ligneModifiee(l, sep, aUnSep, p)
    c[cleTexte] = morceaux.join("")
  } else return introuvable
  epuisesRenommes(c, identite, neuve)
  return { ok: true, content: c as T, produit: p }
}

export function retirerProduit<T extends Record<string, any>>(
  type: string, content: T, section: number | null, identite: string,
): { ok: true; content: T; retire: Retire } | Echec {
  const cle = cleDuPlat(identite)
  const c: Record<string, any> = { ...content }
  // L'état « épuisé » est laissé tel quel : « Annuler » remet le produit DANS son état.
  if (type === "menu_section") {
    const max = plafondDesLignes("menu_section") + 50
    let index = 0, cible = 0, dernier = 0
    for (let i = 1; i <= max; i++) {
      if (["name", "price", "desc"].some(k => typeof c[`item${i}_${k}`] === "string" && c[`item${i}_${k}`].trim())) dernier = i
      const nom = c[`item${i}_name`]
      if (typeof nom !== "string" || !nom.trim()) continue
      if (!cible && cleDuPlat(identiteDuPlat(nom, c[`item${i}_desc`])) === cle) cible = i
      else if (!cible) index++
    }
    if (!cible) return introuvable
    const retire = { nom: c[`item${cible}_name`], prix: c[`item${cible}_price`] ?? "", desc: c[`item${cible}_desc`] ?? "", index }
    // Les lignes suivantes remontent d'un cran — comme « Supprimer » dans l'éditeur.
    for (let i = cible; i < dernier; i++) for (const k of ["name", "price", "desc"]) c[`item${i}_${k}`] = c[`item${i + 1}_${k}`] ?? ""
    for (const k of ["name", "price", "desc"]) c[`item${dernier}_${k}`] = ""
    return { ok: true, content: c as T, retire }
  }
  if (type === "menu_tabs") {
    const cleTexte = `sec${section}_items`
    if (!section || typeof c[cleTexte] !== "string") return introuvable
    const { morceaux, lignes } = lignesDeProduits(c[cleTexte])
    const index = lignes.findIndex(l => cleDuPlat(identiteDuPlat(l.nom, l.desc)) === cle)
    if (index < 0) return introuvable
    const l = lignes[index]
    // La ligne ET sa fin de ligne (celle d'après, ou celle d'avant pour la dernière).
    if (l.i + 1 < morceaux.length) morceaux.splice(l.i, 2)
    else if (l.i > 0) morceaux.splice(l.i - 1, 2)
    else morceaux.splice(l.i, 1)
    c[cleTexte] = morceaux.join("")
    return { ok: true, content: c as T, retire: { nom: l.nom, prix: l.prix, desc: l.desc, index } }
  }
  return introuvable
}

/** « Annuler » : le produit retiré, remis à sa place exacte. */
export function remettreProduit<T extends Record<string, any>>(
  type: string, content: T, section: number | null, r: Retire,
): { ok: true; content: T } | Echec {
  const c: Record<string, any> = { ...content }
  const p = { nom: champPropre(r.nom), prix: champPropre(r.prix), desc: champPropre(r.desc) }
  if (!p.nom) return introuvable
  if (type === "menu_section") {
    const max = plafondDesLignes("menu_section")
    const noms: number[] = []
    let dernier = 0
    for (let i = 1; i <= max + 50; i++) {
      if (["name", "price", "desc"].some(k => typeof c[`item${i}_${k}`] === "string" && c[`item${i}_${k}`].trim())) dernier = i
      if (typeof c[`item${i}_name`] === "string" && c[`item${i}_name`].trim()) noms.push(i)
    }
    if (dernier + 1 > max) return { ok: false, phrase: "La rubrique est pleine : le produit n'a pas pu revenir." }
    const place = noms[r.index] ?? dernier + 1
    for (let i = dernier; i >= place; i--) for (const k of ["name", "price", "desc"]) c[`item${i + 1}_${k}`] = c[`item${i}_${k}`] ?? ""
    c[`item${place}_name`] = p.nom; c[`item${place}_price`] = p.prix; c[`item${place}_desc`] = p.desc
    return { ok: true, content: c as T }
  }
  if (type === "menu_tabs") {
    const cleTexte = `sec${section}_items`
    if (!section) return introuvable
    const texte: string = typeof c[cleTexte] === "string" ? c[cleTexte] : ""
    const { morceaux, lignes } = lignesDeProduits(texte)
    const ligne = ligneAuFormat(texte, p)
    const fin = /\r\n/.test(texte) ? "\r\n" : "\n"
    const avant = lignes[r.index]
    if (avant) morceaux.splice(avant.i, 0, ligne, fin)
    else {
      const base = texte.replace(/[\r\n]+$/, "")
      c[cleTexte] = (base ? base + fin : "") + ligne
      return { ok: true, content: c as T }
    }
    c[cleTexte] = morceaux.join("")
    return { ok: true, content: c as T }
  }
  return introuvable
}
