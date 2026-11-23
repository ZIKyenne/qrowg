// prixAffiche.ts — un prix de carte s'affiche « 12,00 € », pas « 12.00€ » ni « 20.00 ».
//
// Vague 2 (revue du 23 nov.) : en production, la carte du Red Fish affichait
// « 12.00€ » et « 20.00 » sans devise, collée à côté de « 8,50 € ». Le prix
// était rendu tel que tapé — ou collé depuis un PDF, un tableur, un site.
//
// Règle, appliquée À L'AFFICHAGE seulement (la saisie reste intacte : Ma carte
// et l'éditeur repèrent un produit et reformatent un prix à partir d'elle) :
//  · un montant net — « 12 », « 12.5 », « 12,50 », « 12.00€ », « 12 EUR » —
//    devient « 12,00 € » : virgule décimale, deux décimales, espace insécable
//    avant l'euro, espace fine entre les milliers ;
//  · TOUT le reste est rendu tel quel : du texte (« Prix du marché »), une
//    fourchette (« 5 / 9 »), une précision (« 18 € (15 € le midi) »), un
//    supplément (« +1 € »), une autre devise (« $12 », « 12 CHF »). On ne
//    devine pas : un prix mal lu est pire qu'un prix mal écrit.
// Un nombre sans devise est un prix en euros : le produit est français, ses
// cartes aussi. Les espaces viennent de typographieFr (seul endroit où elles
// s'écrivent). Module PUR.

import { INSECABLE, FINE } from "./typographieFr"

const MONTANT = /^\s*(\d{1,4})(?:[.,](\d{1,2}))?\s*(?:€|eur|euros?)?\s*$/i

export function prixAffiche(brut: unknown): string {
  if (typeof brut !== "string") return ""
  const m = MONTANT.exec(brut)
  if (!m) return brut.trim()
  // « 012 » → « 12 » ; « 1250 » → « 1 250 ».
  const entier = String(Number(m[1])).replace(/\B(?=(\d{3})+(?!\d))/g, FINE)
  const dec = (m[2] ?? "").padEnd(2, "0")                   // « 5 » → « 50 »
  return `${entier},${dec}${INSECABLE}€`
}
