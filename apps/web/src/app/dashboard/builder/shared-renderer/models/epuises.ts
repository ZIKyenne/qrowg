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

export const CLE_EPUISES = "epuises"
export const BLOCS_DE_CARTE = ["menu_section", "menu_tabs"] as const

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
export type PlatDeLaCarte = { nom: string; prix: string; epuise: boolean }
export type RubriqueDeLaCarte = { blocId: string; titre: string; plats: PlatDeLaCarte[] }

type BlocLu = { id: string; type: string; content: Record<string, any> | null; visible?: boolean | null; position?: number | null }

/**
 * Les rubriques de la carte d'une page, dans l'ordre de la page : un
 * `menu_section` donne une rubrique, un `menu_tabs` une rubrique par onglet.
 * Les blocs masqués n'y sont pas — ils ne sont pas en ligne.
 */
export function carteDeLaPage(
  blocs: readonly BlocLu[],
  lire: {
    section: (c: Record<string, any>) => { category?: string; items: { name: string; price?: string }[] }
    onglets: (c: Record<string, any>) => { title?: string; sections: { title: string; items: { name: string; price?: string }[] }[] }
  },
): RubriqueDeLaCarte[] {
  const out: RubriqueDeLaCarte[] = []
  const ordonnes = [...blocs].filter(b => b.visible !== false && (BLOCS_DE_CARTE as readonly string[]).includes(b.type))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  for (const b of ordonnes) {
    const c = b.content ?? {}
    const ep = epuisesDuBloc(c)
    const plat = (it: { name: string; price?: string }): PlatDeLaCarte => ({ nom: it.name, prix: it.price ?? "", epuise: ep.has(cleDuPlat(it.name)) })
    if (b.type === "menu_section") {
      const s = lire.section(c)
      if (s.items.length) out.push({ blocId: b.id, titre: s.category || "Carte", plats: s.items.map(plat) })
    } else {
      const t = lire.onglets(c)
      for (const sec of t.sections) if (sec.items.length) out.push({ blocId: b.id, titre: t.title ? `${t.title} · ${sec.title}` : sec.title, plats: sec.items.map(plat) })
    }
  }
  return out
}

/** « 3 produits épuisés » — ou null si tout est en vente. */
export function phraseEpuises(rubriques: readonly RubriqueDeLaCarte[]): string | null {
  const n = rubriques.reduce((s, r) => s + r.plats.filter(p => p.epuise).length, 0)
  if (n === 0) return null
  return n === 1 ? "1 produit épuisé" : `${n} produits épuisés`
}
