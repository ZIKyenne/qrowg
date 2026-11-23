// traductionDesCartes.ts — toutes les cartes de la page dans la langue du client
// (vague 2, revue du 23 nov.).
//
// Jusqu'ici, seule la carte illustrée se traduisait (traductionCarte.ts, bloc par
// bloc). Le menu, la grande carte, les boissons et l'happy hour restaient en
// français pour le touriste — et un resto à trois menus (Entrées, Plats,
// Desserts) aurait dû demander trois traductions.
//
// Ce module généralise, sans rien changer au format :
//  · ce qu'il y a à traduire dans chaque bloc de carte (produits, descriptions,
//    rubriques), lu par les MÊMES modèles que le rendu public ;
//  · UNE demande pour toute la page, à coller dans ChatGPT ou DeepL ;
//  · la RÉPARTITION de la réponse collée : chaque bloc reçoit, dans sa clé
//    `tr_<langue>`, les lignes qui le concernent — le format de la carte
//    illustrée, rattaché au nom FRANÇAIS (réordonner ne mélange rien) ;
//  · l'application d'une traduction à un nom, une description, une rubrique.
// Ce qui n'est pas traduit reste en français. Module PUR.

import { texteUtile } from "./repeaterExtract"
import { menuSectionViewModel } from "./menuSection"
import { menuTabsViewModel } from "./menuTabs"
import { produitsDeLaCarte } from "./carteIllustree"
import { boissons } from "./carteBoissons"
import { offresHappy } from "./happyHour"
import { allergenesDuProduit, phraseAllergenes } from "./allergenes"
import { LANGUES_PROPOSEES, NOM_FR, languesCochees, lireTraduction, type CodeLangue, type Traduction } from "./traductionCarte"

export const BLOCS_TRADUISIBLES = ["menu_section", "menu_tabs", "carte_illustree", "carte_boissons", "happy_hour"] as const
const traduisible = (type: string) => (BLOCS_TRADUISIBLES as readonly string[]).includes(type)

const cle = (s: string) => s.normalize("NFC").trim().toLowerCase()

export type ATraduire = { produits: { nom: string; description: string }[]; rubriques: string[] }

/** Ce qu'il y a à traduire dans un bloc de carte, tel que la page publique le montre. */
export function aTraduire(type: string, c: Record<string, any>): ATraduire {
  const t = (v: unknown) => texteUtile(v)
  if (type === "menu_section") {
    const m = menuSectionViewModel(c)
    return { produits: m.items.map(i => ({ nom: t(i.name), description: t(i.desc) })), rubriques: [t(m.category)].filter(Boolean) }
  }
  if (type === "menu_tabs") {
    const m = menuTabsViewModel(c)
    return {
      produits: m.sections.flatMap(s => s.items.map(i => ({ nom: t(i.name), description: t(i.desc) }))),
      rubriques: [t(m.title), ...m.sections.map(s => t(s.title))].filter(Boolean),
    }
  }
  if (type === "carte_illustree") {
    const ps = produitsDeLaCarte(c)
    return { produits: ps.map(p => ({ nom: p.nom, description: p.description })), rubriques: [...new Set(ps.map(p => p.categorie).filter(Boolean))] }
  }
  if (type === "carte_boissons") {
    const bs = boissons(c)
    return { produits: bs.map(b => ({ nom: b.nom, description: b.detail })), rubriques: [t(c.title), ...new Set(bs.map(b => b.rubrique).filter(Boolean))].filter(Boolean) }
  }
  if (type === "happy_hour") {
    return { produits: offresHappy(c).map(o => ({ nom: o.nom, description: "" })), rubriques: [t(c.title), t(c.offre)].filter(Boolean) }
  }
  return { produits: [], rubriques: [] }
}

type BlocLu = { id: string; type: string; content: Record<string, any> | null; visible?: boolean | null }

/** Tout ce que la page a à traduire, sans doublon, dans l'ordre de la page. */
export function aTraduireDansLaPage(blocs: readonly BlocLu[]): ATraduire {
  const vusP = new Set<string>(), vusR = new Set<string>()
  const out: ATraduire = { produits: [], rubriques: [] }
  for (const b of blocs) {
    if (b.visible === false || !traduisible(b.type)) continue
    const a = aTraduire(b.type, b.content ?? {})
    for (const p of a.produits) if (p.nom && !vusP.has(cle(p.nom))) { vusP.add(cle(p.nom)); out.produits.push(p) }
    for (const r of a.rubriques) if (!vusR.has(cle(r))) { vusR.add(cle(r)); out.rubriques.push(r) }
  }
  return out
}

/** La demande à coller dans ChatGPT / DeepL — même format exigé que la carte illustrée. */
export function demandeDeLaPage(a: ATraduire, langue: CodeLangue): string {
  return [
    `Traduis cette carte de restaurant en ${NOM_FR[langue].toLowerCase()}.`,
    "Réponds UNIQUEMENT avec une ligne par élément, au format exact :",
    "Nom en français ; Nom traduit ; Description traduite",
    "Pour les lignes qui commencent par #, réponds : # Rubrique en français ; Rubrique traduite",
    "Garde le texte en français TEL QUEL au début de chaque ligne. Ne traduis pas les noms propres de plats ou de vins (kebab, tiramisu, Brouilly…) s'ils sont connus ainsi.",
    "",
    ...a.rubriques.map(r => `# ${r}`),
    ...a.produits.map(p => (p.description ? `${p.nom} ; ${p.description}` : p.nom)),
  ].join("\n")
}

/** Combien d'éléments de la page la réponse collée traduit. */
export function couvertureDeLaPage(a: ATraduire, texte: string): { traduits: number; total: number; manquants: string[] } {
  const t = lireTraduction(texte)
  const manquants = [...a.rubriques.filter(r => !t.categories.has(cle(r))), ...a.produits.filter(p => !t.produits.has(cle(p.nom))).map(p => p.nom)]
  const total = a.rubriques.length + a.produits.length
  return { traduits: total - manquants.length, total, manquants }
}

/**
 * La réponse collée, répartie : pour chaque bloc traduisible, les lignes qui le
 * concernent (format `tr_<langue>`), ou "" s'il n'en a aucune. Les lignes qui ne
 * correspondent à rien sont ignorées.
 */
export function repartirLaTraduction(blocs: readonly BlocLu[], texte: string): Map<string, string> {
  const t = lireTraduction(texte)
  const out = new Map<string, string>()
  for (const b of blocs) {
    if (!traduisible(b.type)) continue
    const a = aTraduire(b.type, b.content ?? {})
    const lignes = [
      ...a.rubriques.filter(r => t.categories.has(cle(r))).map(r => `# ${r} ; ${t.categories.get(cle(r))}`),
      ...a.produits.filter(p => t.produits.has(cle(p.nom))).map(p => {
        const x = t.produits.get(cle(p.nom))!
        return x.description ? `${p.nom} ; ${x.nom} ; ${x.description}` : `${p.nom} ; ${x.nom}`
      }),
    ]
    out.set(b.id, lignes.join("\n"))
  }
  return out
}

/** Le contenu du bloc avec cette langue (ou sans, si `lignes` est vide). */
export function avecLangue(content: Record<string, any>, langue: CodeLangue, lignes: string): Record<string, any> {
  const cochees = new Set(languesCochees(content))
  if (lignes.trim()) cochees.add(langue); else cochees.delete(langue)
  return { ...content, [`tr_${langue}`]: lignes, langues: LANGUES_PROPOSEES.filter(l => cochees.has(l)).join(",") }
}

/** Les langues qu'un bloc offre vraiment : cochées ET remplies. */
export function languesDuBloc(c: Record<string, any> | null | undefined): CodeLangue[] {
  return languesCochees(c ?? {}).filter(l => texteUtile((c ?? {})[`tr_${l}`]))
}
/** Les langues que la page offre : l'union de ses cartes, dans l'ordre de la liste. */
export function languesDeLaPage(blocs: readonly BlocLu[]): CodeLangue[] {
  const s = new Set<CodeLangue>()
  for (const b of blocs) if (b.visible !== false && traduisible(b.type)) for (const l of languesDuBloc(b.content)) s.add(l)
  return LANGUES_PROPOSEES.filter(l => s.has(l))
}

// ── Appliquer une traduction ────────────────────────────────────────────────
export function traductionDuBloc(c: Record<string, any> | null | undefined, langue: CodeLangue): Traduction | null {
  return langue === "fr" ? null : lireTraduction((c ?? {})[`tr_${langue}`])
}
export function nomTraduit(t: Traduction | null, nom: string): string { return (t && t.produits.get(cle(nom))?.nom) || nom }
export function descriptionTraduite(t: Traduction | null, nom: string, desc: string | undefined): string | undefined {
  return (t && t.produits.get(cle(nom))?.description) || desc
}
export function rubriqueTraduite(t: Traduction | null, r: string | undefined): string | undefined {
  return (r && t && t.categories.get(cle(r))) || r
}

/**
 * Une liste de produits (menu, grande carte) dans la langue du client. L'identité
 * française sert à retrouver la traduction ET les allergènes (rangés par nom
 * français) ; seuls les textes affichés changent.
 */
export function itemsTraduits<T extends { name: string; desc?: string; allergenes?: string }>(
  items: readonly T[], c: Record<string, any> | null | undefined, t: Traduction | null, langue: CodeLangue,
): T[] {
  if (langue === "fr") return [...items]
  return items.map(it => ({
    ...it,
    name: nomTraduit(t, it.name),
    desc: descriptionTraduite(t, it.name, it.desc),
    allergenes: it.allergenes ? phraseAllergenes(allergenesDuProduit(c, it.name, it.desc), langue) : it.allergenes,
  }))
}

/** Pour Ma carte : chaque langue déjà présente, et ce qu'elle couvre de la carte. */
export function etatDesLangues(blocs: readonly BlocLu[]): { langue: CodeLangue; traduits: number; total: number }[] {
  const a = aTraduireDansLaPage(blocs)
  return languesDeLaPage(blocs).map(l => {
    const c = couvertureDeLaPage(a, blocs.map(b => String((b.content ?? {})[`tr_${l}`] ?? "")).join("\n"))
    return { langue: l, traduits: c.traduits, total: c.total }
  })
}
