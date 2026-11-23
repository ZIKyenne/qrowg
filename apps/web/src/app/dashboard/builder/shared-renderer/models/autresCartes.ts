// autresCartes.ts — la carte illustrée, les boissons et l'happy hour, vues depuis
// « Ma carte » (vague 1, revue du 23 nov.). Chaque bloc donne ses rubriques avec
// les MÊMES nom / prix / description que son rendu public : l'identité d'un
// produit (epuises.identiteDuPlat) est donc la même des deux côtés. Module PUR.

import type { RubriqueLue } from "./epuises"
import { produitsDeLaCarte, produitsParCategorie } from "./carteIllustree"
import { boissons, rubriques as rubriquesDeBoissons } from "./carteBoissons"
import { offresHappy } from "./happyHour"

const titre = (c: Record<string, any>, defaut: string) => (typeof c.title === "string" && c.title.trim()) || defaut

export function rubriquesDesAutresCartes(type: string, c: Record<string, any>): RubriqueLue[] {
  if (type === "carte_illustree") {
    const t = titre(c, "Carte illustrée")
    return produitsParCategorie(produitsDeLaCarte(c)).map(g => ({
      titre: g.categorie ? `${t} · ${g.categorie}` : t,
      plats: g.produits.map(p => ({ name: p.nom, price: p.prix, desc: p.description })),
    }))
  }
  if (type === "carte_boissons") {
    const t = titre(c, "Boissons")
    return rubriquesDeBoissons(boissons(c)).map(g => ({
      titre: `${t} · ${g.nom}`,
      plats: g.boissons.map(b => ({
        name: b.nom, desc: b.detail,
        // Deux prix : on les montre tous les deux, et le prix se change dans l'éditeur.
        price: b.prix2 ? [b.prix1, b.prix2].filter(Boolean).join(" / ") : b.prix1,
        ...(b.prix2 ? { prixModifiable: false } : {}),
      })),
    }))
  }
  if (type === "happy_hour") {
    const offres = offresHappy(c)
    return offres.length ? [{ titre: titre(c, "Happy hour"), plats: offres.map(o => ({ name: o.nom, price: o.prixHappy })) }] : []
  }
  return []
}
