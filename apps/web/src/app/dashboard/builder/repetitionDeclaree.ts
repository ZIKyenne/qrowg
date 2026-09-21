// repetitionDeclaree — une répétition déclarée se lit, elle ne se réécrit pas.
//
// Suite du lot v144. Ce lot-là avait converti la rangée d'icônes au répéteur et
// laissé un CLIQUET : « vingt-sept types de blocs tombent encore dans la liste
// générique de champs ; chacun a ses suffixes à lui — `cert_1`, `link_1`,
// `transport1` — et les convertir en aveugle casserait l'édition de vingt-sept
// types de blocs. »
//
// **En lisant vraiment les clés, ce n'est pas ce qu'elles disent.** Sur les
// vingt-sept, la grande majorité s'écrit dans la forme que le répéteur parle
// déjà (`c1_title`, `r3_label`, `transport2_icon`). Ce qui manquait n'était pas
// une capacité : c'était d'avoir lu.
//
// Et il manquait une seule chose de vrai : le numéro n'est pas toujours au même
// endroit.
//
//     grid_section    c1_title   c1_text        le préfixe porte le numéro
//     testimonials    name1      text1          le NOM DU CHAMP porte le numéro
//
// Une clé répétée, dans tout le produit, s'écrit donc `<avant><n>` ou
// `<avant><n>_<après>`. Une seule forme à deux trous, pas deux familles.
//
// ── Et le nom de la ligne est déjà écrit ─────────────────────────────────────
//
// Le panneau réécrivait à la main (`noun="Plat"`, `fields=[{suffix:"label"}]`)
// ce que chaque libellé déclare déjà, mot pour mot :
//
//     « Avis 1 — Nom »        la ligne s'appelle « Avis », le champ « Nom »
//     « Carte 3 — Texte »     la ligne « Carte », le champ « Texte »
//     « Ville 2 »             la ligne « Ville », et c'est son seul champ
//
// Ce module lit cette déclaration. Il n'invente rien : quand le libellé ne dit
// pas, il renvoie `null` et le bloc reste où il est. C'est la raison pour
// laquelle le cliquet descend sans jamais forcer.

import type { BlockField } from "./types"

/** Ce que le répéteur sait rendre. Un `color`, une `date` : pas encore. */
export const TYPES_RENDUS = ["text", "textarea", "url", "select", "image", "file"] as const
export type TypeRendu = (typeof TYPES_RENDUS)[number]

/** Combien d'emplacements il faut pour qu'une série soit une répétition. */
export const EMPLACEMENTS_MIN = 3

/**
 * Un champ d'une ligne répétée. `avant` précède le numéro, `apres` le suit :
 * `c1_title` → avant « c », après « title » ; `name1` → avant « name », après
 * vide. Les deux ensemble reconstituent la clé plate, inchangée.
 */
export interface ChampRepete {
  avant: string
  apres: string
  nom: string
  type: TypeRendu
  placeholder?: string
  options?: string[]
}

export interface Repetition {
  /** Le nom d'une ligne, lu dans le libellé : « Avis », « Carte », « Ville ». */
  nom: string
  champs: ChampRepete[]
  /** Les numéros déclarés, en ordre. Le plus grand dit combien d'emplacements. */
  numeros: number[]
  /** Les champs qui ne se répètent pas : titre, style, alignement, couleurs. */
  fixes: BlockField[]
}

/** La clé plate d'un champ répété, telle qu'elle est déclarée et enregistrée. */
export function cleRepetee(c: { avant: string; apres: string }, n: number): string {
  return c.apres ? `${c.avant}${n}_${c.apres}` : `${c.avant}${n}`
}

/** `c1_title` → { avant: "c", n: 1, apres: "title" } ; `name1` → { avant: "name", n: 1, apres: "" }. */
export function decouperLaCle(cle: string): { avant: string; n: number; apres: string } | null {
  const m = /^([A-Za-z_]+?)(\d+)(?:_([a-z_]+))?$/.exec(cle)
  if (!m) return null
  return { avant: m[1], n: Number(m[2]), apres: m[3] ?? "" }
}

/**
 * Le libellé d'un champ répété, tel que le produit l'écrit :
 *
 *     « Avis 1 — Nom »   → ligne « Avis »,  champ « Nom »
 *     « Ville 2 »        → ligne « Ville », champ « Ville »
 *     « 1 — Titre »      → pas de nom de ligne, champ « Titre »
 *
 * Le numéro doit être celui de la clé : un libellé qui parle d'un autre chiffre
 * (« Note sur 5 ») ne déclare rien.
 */
export function lireLeLibelle(label: string, n: number): { ligne: string; champ: string } | null {
  // Une parenthèse posée après le numéro appartient au CHAMP, pas à la ligne :
  // « Nom 1 (si pas de logo) » nomme la ligne « Nom » et le champ « Nom (si
  // pas de logo) ». Elle est mise de côté, puis recollée.
  const brut = label.trim()
  const paren = /\s*(\([^()]*\))$/.exec(brut)
  const sansParen = paren ? brut.slice(0, paren.index) : brut
  const m = new RegExp(`^(.*?)\\s*\\b${n}\\b\\s*(?:—\\s*(.+))?$`).exec(sansParen)
  if (!m) return null
  const ligne = m[1].trim()
  const suite = (m[2] ?? "").trim()
  if (!ligne && !suite) return null
  const champ = [suite || ligne, paren?.[1]].filter(Boolean).join(" ")
  return { ligne, champ }
}

/**
 * La répétition qu'un bloc DÉCLARE, ou `null` s'il n'en déclare pas une que le
 * répéteur saurait rendre sans rien perdre. Les trois refus, tous écrits :
 *
 *   · aucune série d'au moins trois emplacements ;
 *   · un champ répété d'un type que le répéteur ne rend pas (`color`, `date`) —
 *     le convertir ferait disparaître un réglage, ce qui est interdit ;
 *   · un libellé qui ne nomme pas sa ligne — on ne devine pas un nom.
 */
export function repetitionDeclaree(fields: BlockField[]): Repetition | null {
  // Un champ répété est identifié par (avant, apres) : le numéro est ce qui varie.
  const parChamp = new Map<string, { c: Omit<ChampRepete, "nom" | "type">; f: BlockField[]; n: number[] }>()
  const fixes: BlockField[] = []
  for (const f of fields) {
    const d = decouperLaCle(f.key)
    if (!d) { fixes.push(f); continue }
    const id = `${d.avant}|${d.apres}`
    const e = parChamp.get(id) ?? { c: { avant: d.avant, apres: d.apres }, f: [], n: [] }
    e.f.push(f); e.n.push(d.n)
    parChamp.set(id, e)
  }

  const assezSouvent = [...parChamp.values()].filter(e => new Set(e.n).size >= EMPLACEMENTS_MIN)
  if (!assezSouvent.length) return null

  // Un champ qui partage le `avant` d'une série EST de la même ligne, même s'il
  // n'est déclaré que deux fois : `b2_color` est la couleur de la barre 2, et
  // les rendus publics lisent `b${i}_color` pour tout i. Le ranger ailleurs
  // laisserait « Barre 2 — Couleur » flotter seul en bas du panneau.
  const avants = new Set(assezSouvent.map(e => e.c.avant))
  const repetes = [...parChamp.values()].filter(e => avants.has(e.c.avant))
  for (const e of parChamp.values()) if (!repetes.includes(e)) fixes.push(...e.f)

  const numeros = [...new Set(assezSouvent.flatMap(e => e.n))].sort((a, b) => a - b)

  // Le nom de la ligne : celui que déclare le PREMIER champ répété. Les autres
  // nomment leur propre colonne (« Photo 1 », « Nom 1 ») et ne se contredisent
  // donc pas — ils ne parlent pas de la même chose.
  const premier = assezSouvent[0]
  const teteLue = lireLeLibelle(premier.f[0].label, Math.min(...premier.n))
  if (!teteLue || !teteLue.ligne) return null

  const champs: ChampRepete[] = []
  for (const e of repetes) {
    const f = e.f[0]
    if (!(TYPES_RENDUS as readonly string[]).includes(f.type)) return null
    const lu = lireLeLibelle(f.label, Math.min(...e.n))
    if (!lu) return null
    champs.push({
      ...e.c, nom: lu.champ, type: f.type as TypeRendu,
      ...(f.placeholder ? { placeholder: f.placeholder } : {}),
      ...(f.options ? { options: f.options } : {}),
    })
  }

  return { nom: teteLue.ligne, champs, numeros, fixes }
}

/**
 * L'article d'un nom de ligne. Le genre d'un nom français n'est écrit nulle part
 * dans une clé ni dans un libellé : il ne se dérive pas, il se déclare. Un nom
 * absent de cette table n'est pas routé — le bloc reste où il est, plutôt que
 * de porter un bouton « Ajouter un carte ».
 */
export const ARTICLE_DES_LIGNES: Readonly<Record<string, "un" | "une">> = {
  Action: "une", Artiste: "un", Avis: "un", Carte: "une", Case: "une", Colonne: "une",
  Engagement: "un", "Entrée": "une", Formule: "une", Ligne: "une", Logo: "un",
  Montant: "un", Photo: "une", Plan: "un", Produit: "un", Question: "une",
  TikTok: "un", Transport: "un", "Ville": "une", "Étape": "une",
}

/** « Ajouter une carte », « Ajouter un produit » — ou `null` si le genre n'est pas déclaré. */
export function libelleDAjout(nom: string): string | null {
  const a = ARTICLE_DES_LIGNES[nom]
  if (!a) return null
  // « TikTok » garde sa casse : une majuscule à l'intérieur d'un mot marque un
  // nom propre, et « ajouter un tiktok » ne s'écrit pas.
  const propre = /[A-ZÀ-Þ]/.test(nom.slice(1))
  return `Ajouter ${a} ${propre ? nom : nom.toLocaleLowerCase("fr")}`
}
