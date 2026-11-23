// epuises.ts — « plus de menthe ce soir » : un plat épuisé, sans rien effacer.
//
// Le geste le plus fréquent d'un bar n'est pas de créer sa carte, c'est de la
// tenir à jour : retirer un cocktail un samedi soir, le remettre le lendemain.
// Il fallait ouvrir l'éditeur, retrouver la ligne, la vider, republier — et la
// retaper le lendemain.
//
// L'état est rangé PAR NOM, dans une seule clé du bloc (`epuises`, un nom par
// ligne), et non par ligne numérotée : le répéteur de l'éditeur réordonne et
// supprime les lignes en ne déplaçant que les champs qu'il connaît — un drapeau
// `item3_epuise` serait resté sur la ligne 3 pendant que le plat partait en 2.
// Par le nom, l'état suit le plat, et vaut pour les deux blocs de carte
// (`menu_section`, et `menu_tabs` dont les lignes sont un texte collé).
// Renommer un plat le remet en vente : c'est un autre plat. Module PUR.

import { allergenesDuProduit } from "./allergenes"

export const CLE_EPUISES = "epuises"
export const BLOCS_DE_CARTE = ["menu_section", "menu_tabs", "carte_illustree", "carte_boissons", "happy_hour"] as const
/** Ceux où Ma carte sait aussi AJOUTER, corriger et retirer un produit. Les autres
 *  (photo, badges, deux prix, prix barré) se composent dans l'éditeur. */
export const BLOCS_EDITABLES = ["menu_section", "menu_tabs"] as const
export const estEditable = (type: string) => (BLOCS_EDITABLES as readonly string[]).includes(type)

/**
 * Où vit un produit, dans les blocs à lignes numérotées (vague 1, 23 nov.) : son
 * nom, le prix que Ma carte change, et la description qui fait son IDENTITÉ
 * (voir identiteDuPlat). Une seule table : la lecture de Ma carte, le changement
 * de prix et le rendu public d'« Épuisé » en dépendent tous les trois.
 * `prixSeulSiVide` : le prix n'est modifiable que si ce champ est vide (une
 * boisson à deux prix, verre ET bouteille, se corrige dans l'éditeur).
 */
export type LigneDeProduit = { nom: string; prix: string; desc: string | null; prixSeulSiVide?: string }
export const LIGNES_DE_PRODUITS: Record<string, LigneDeProduit> = {
  menu_section:    { nom: "item{i}_name", prix: "item{i}_price", desc: "item{i}_desc" },
  carte_illustree: { nom: "p{i}_name", prix: "p{i}_price", desc: "p{i}_desc" },
  carte_boissons:  { nom: "b{i}_name", prix: "b{i}_p1", desc: "b{i}_detail", prixSeulSiVide: "b{i}_p2" },
  happy_hour:      { nom: "h{i}_name", prix: "h{i}_happy", desc: null },
}
export const cleDeLigne = (motif: string, i: number) => motif.replace("{i}", String(i))

/** Le produit est-il épuisé dans ce bloc ? (nom + description, comme Ma carte l'écrit) */
export function epuiseDansLeBloc(c: Record<string, unknown> | null | undefined, nom: string, desc?: string | null): boolean {
  return epuisesDuBloc(c).has(cleDuPlat(identiteDuPlat(nom, desc)))
}

/**
 * L'identité d'un produit : son nom, et sa description quand il en a une.
 *
 * Relevé du 16 novembre sur la vraie carte du Red Fish : « CHAMPAGNE JOSEPH
 * PERRIER » y figure CINQ fois (Brut, Brut Nature, Magnum, Blanc de Blancs,
 * Rosé), « POUILLY FUME » deux (bouteille, verre). Par le nom seul, épuiser le
 * magnum épuisait les cinq. La description les distingue ; elle reste écrite
 * par le commerçant, donc lisible dans la liste `epuises`.
 */
export const identiteDuPlat = (nom: string, desc?: string | null) => {
  const d = (desc ?? "").trim()
  return d ? `${nom.trim()} · ${d}` : nom.trim()
}

/** Comparaison insensible à la casse, aux espaces multiples et aux accents décomposés. */
export const cleDuPlat = (nom: string) => nom.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr")

function lignes(content: Record<string, unknown> | null | undefined): string[] {
  const v = content?.[CLE_EPUISES]
  return typeof v === "string" ? v.split("\n").map(s => s.trim()).filter(Boolean) : []
}

/** Les plats épuisés de ce bloc, par clé normalisée. */
export function epuisesDuBloc(content: Record<string, unknown> | null | undefined): Set<string> {
  return new Set(lignes(content).map(cleDuPlat))
}

export function estEpuise(content: Record<string, unknown> | null | undefined, nom: string): boolean {
  return epuisesDuBloc(content).has(cleDuPlat(nom))
}

/** Le contenu du bloc avec ce plat épuisé (ou remis en vente). Ne touche à rien d'autre. */
export function avecEpuise<T extends Record<string, unknown>>(content: T, nom: string, epuise: boolean): T & { epuises: string } {
  const cle = cleDuPlat(nom)
  const autres = lignes(content).filter(l => cleDuPlat(l) !== cle)
  const suite = epuise ? [...autres, nom.trim()] : autres
  return { ...content, [CLE_EPUISES]: suite.join("\n") }
}

/** Tout remettre en vente : la carte de l'ouverture. */
export function toutEnVente<T extends Record<string, unknown>>(content: T): T & { epuises: string } {
  return { ...content, [CLE_EPUISES]: "" }
}

// ── La carte vue depuis le comptoir ─────────────────────────────────────────
export type PlatDeLaCarte = { nom: string; prix: string; desc: string; identite: string; epuise: boolean
  /** false : le prix ne se change que dans l'éditeur (deux prix). Absent = modifiable. */
  prixModifiable?: boolean
  /** Allergènes renseignés (codes) ; [] = aucun des 14 ; null = pas renseigné (vague 2). */
  allergenes: string[] | null }
/** `section` : numéro de l'onglet (grande carte), null pour un menu simple. */
export type RubriqueDeLaCarte = { blocId: string; section: number | null; titre: string; plats: PlatDeLaCarte[]
  /** false : ajouter, corriger, retirer se font dans l'éditeur. Absent = possible. */
  edition?: boolean }
/** Ce qu'un lecteur rend pour les blocs autres que les deux menus. */
export type RubriqueLue = { titre: string; plats: { name: string; price?: string; desc?: string; prixModifiable?: boolean }[] }

type BlocLu = { id: string; type: string; content: Record<string, any> | null; visible?: boolean | null; position?: number | null }

/**
 * Les rubriques de la carte d'une page, dans l'ordre de la page : un
 * `menu_section` donne une rubrique, un `menu_tabs` une rubrique par onglet.
 * Les blocs masqués n'y sont pas — ils ne sont pas en ligne.
 */
export function carteDeLaPage(
  blocs: readonly BlocLu[],
  lire: {
    section: (c: Record<string, any>) => { category?: string; items: { name: string; price?: string; desc?: string }[] }
    onglets: (c: Record<string, any>) => { title?: string; sections: { i: number; title: string; items: { name: string; price?: string; desc?: string }[] }[] }
    /** Carte illustrée, boissons, happy hour (vague 1) : une ou plusieurs rubriques par bloc. */
    autres?: (type: string, c: Record<string, any>) => RubriqueLue[]
  },
): RubriqueDeLaCarte[] {
  const out: RubriqueDeLaCarte[] = []
  const ordonnes = [...blocs].filter(b => b.visible !== false && (BLOCS_DE_CARTE as readonly string[]).includes(b.type))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  for (const b of ordonnes) {
    const c = b.content ?? {}
    const ep = epuisesDuBloc(c)
    const plat = (it: { name: string; price?: string; desc?: string; prixModifiable?: boolean }): PlatDeLaCarte => {
      const identite = identiteDuPlat(it.name, it.desc)
      const p: PlatDeLaCarte = { nom: it.name, prix: it.price ?? "", desc: (it.desc ?? "").trim(), identite, epuise: ep.has(cleDuPlat(identite)), allergenes: allergenesDuProduit(c, it.name, it.desc) }
      if (it.prixModifiable === false) p.prixModifiable = false
      return p
    }
    if (!estEditable(b.type)) {
      for (const r of lire.autres?.(b.type, c) ?? []) if (r.plats.length) out.push({ blocId: b.id, section: null, titre: r.titre, plats: r.plats.map(plat), edition: false })
      continue
    }
    if (b.type === "menu_section") {
      const s = lire.section(c)
      if (s.items.length) out.push({ blocId: b.id, section: null, titre: s.category || "Carte", plats: s.items.map(plat) })
    } else {
      const t = lire.onglets(c)
      // Un onglet vide mais titré (« Mocktail », à remplir) reste une rubrique :
      // c'est là qu'on ajoute ses premiers produits.
      for (const sec of t.sections) out.push({ blocId: b.id, section: sec.i, titre: t.title ? `${t.title} · ${sec.title}` : sec.title, plats: sec.items.map(plat) })
    }
  }
  return out
}

/** La page porte-t-elle une carte ? (embed `blocks(type)` d'une lecture de pages) */
export function aUneCarte(blocs: readonly { type: string }[] | null | undefined): boolean {
  return (blocs ?? []).some(b => (BLOCS_DE_CARTE as readonly string[]).includes(b.type))
}

/**
 * « Ma carte » à un toucher de l'accueil (cap du 16 novembre). Les types de
 * blocs arrivent avec la page (`blocks(type)`) et sont réduits ici à un
 * booléen : la liste ne transporte pas le contenu des blocs. Ici, et non dans
 * DashboardClient : une fonction d'un fichier "use client" ne s'appelle pas
 * depuis le composant serveur.
 */
export function avecCarte<P extends { blocks?: { type: string }[] | null }>(pages: readonly P[] | null | undefined): (Omit<P, "blocks"> & { carte: boolean })[] {
  return (pages ?? []).map(({ blocks, ...p }) => ({ ...p, carte: aUneCarte(blocks) }))
}

/** « 3 produits épuisés » — ou null si tout est en vente. */
export function phraseEpuises(rubriques: readonly RubriqueDeLaCarte[]): string | null {
  const n = rubriques.reduce((s, r) => s + r.plats.filter(p => p.epuise).length, 0)
  if (n === 0) return null
  return n === 1 ? "1 produit épuisé" : `${n} produits épuisés`
}
