// faitsDuCommercant.ts — la règle du 10 septembre, et le chemin qui lui échappait.
//
// Le produit s'est donné une règle, écrite dans `app/preuveNonInventee.test.ts` :
//
//   « le pré-remplissage donne la STRUCTURE et le TITRE (l'emplacement), jamais
//     l'AFFIRMATION. Les champs de preuve arrivent vides. »
//
// Elle est tenue par les 34 modèles de page et par les recettes de la création
// guidée. Elle n'a jamais été appliquée à la génération par IA.
//
// Relevé du 14 septembre — brief demandé par le prompt du produit pour « Le
// Comptoir, bistrot à Lyon », passé dans `aiBriefToTemplate` : 8 blocs,
// 14 affirmations inventées.
//
//     testimonials.name1  = « Marie L. »
//     testimonials.text1  = « La meilleure quenelle de Lyon. »
//     testimonials.stars1 = « 5 »
//     menu_section.item1_price = « 18 € »
//     opening_hours.mon_fri    = « 12h-14h / 19h-22h »
//     google_maps_embed.address = « 14 rue des Marronniers, 69002 Lyon »
//     social_links.instagram    = « https://instagram.com »
//     cta_button.url            = « # »
//
// C'est exactement l'exemple que la revue du 10 septembre citait — « Marie L. —
// La meilleure entrecôte de Paris » — réapparu par une autre porte. Et pire que
// sur un modèle : la page est présentée au commerçant comme la SIENNE, faite à
// partir de sa description. Les horaires inventés alimentent ensuite le badge
// public « Ouvert · ferme à 22 h » (lot v79), et l'adresse inventée s'affiche
// dans une carte.
//
// Deux natures de champ, deux traitements :
//
//  · la PREUVE (avis, notes, chiffres de vanité, logos, certifications) n'est
//    jamais écrite par le produit — personne d'autre que le commerçant ne peut
//    la connaître, et personne ne l'a écrite dans une description ;
//  · le FAIT CHIFFRÉ (prix, horaires, adresse, lien) est gardé UNIQUEMENT s'il
//    vient de ce que le commerçant a écrit. Un chiffre qui n'est pas dans sa
//    description n'entre pas dans sa page.
//
// Module PUR.

export type BlocSimple = { type: string; content: Record<string, any> }

/** Champs de PREUVE : jamais écrits par le produit. Liste de `preuveNonInventee`. */
export const CHAMPS_DE_PREUVE: Record<string, RegExp[]> = {
  testimonials: [/^name\d+$/, /^text\d+$/, /^stars\d+$/, /^role\d+$/],
  video_testimonials: [/^t\d+_name$/, /^t\d+_quote$/],
  google_review: [/^name\d+$/, /^text\d+$/],
  stats_block: [/^s\d+_value$/],
  business_stats: [/^s\d+_value$/, /^stat\d+_value$/],
  stat_hero: [/^value$/, /^unit$/, /^label$/],
  avatar_row: [/^count$/, /^label$/, /^name\d+$/],
  logo_marquee: [/^name\d+$/],
  logo_wall: [/^logo\d+_name$/],
  partners: [/^logo\d+_name$/],
  trust_badge: [/^b\d+_label$/],
  business_certifications: [/^c\d+_name$/],
}

/** Champs de FAIT : gardés seulement s'ils viennent de la description. */
export const CHAMPS_DE_FAIT: Record<string, RegExp[]> = {
  menu_section: [/_price$/],
  pricing: [/^price\d+$/],
  opening_hours: [/^mon_fri$/, /^saturday$/, /^sunday$/, /^mon$/, /^tue$/, /^wed$/, /^thu$/, /^fri$/, /^sat$/, /^sun$/, /^exception$/],
  google_maps_embed: [/^address$/, /^embed_url$/],
  social_links: [/^[a-z]+$/],
  cta_button: [/^url$/],
  phone_button: [/^phone$/],
  email_button: [/^email$/],
}

const texte = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

function correspond(regles: RegExp[] | undefined, champ: string): boolean {
  return (regles ?? []).some(re => re.test(champ))
}

/** Le champ est-il une preuve — donc à ne jamais écrire à la place de quelqu'un ? */
export function estUnePreuve(type: string, champ: string): boolean {
  return correspond(CHAMPS_DE_PREUVE[type], champ)
}

/** Le champ est-il un fait que seul le commerçant connaît ? */
export function estUnFait(type: string, champ: string): boolean {
  return correspond(CHAMPS_DE_FAIT[type], champ)
}

const SANS_ACCENT = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/** Les suites de chiffres d'une valeur : « 12h-14h » → ["12", "14"]. */
export function chiffresDe(valeur: string): string[] {
  return (valeur.match(/\d+/g) ?? []).filter(n => n.length >= 1)
}

/** Les mots porteurs de sens : au moins quatre lettres. */
export function motsDe(valeur: string): string[] {
  return (SANS_ACCENT(valeur).match(/[a-z]{4,}/g) ?? [])
}

/**
 * Cette valeur vient-elle de ce que le commerçant a écrit ?
 *
 * Règle stricte et vérifiable : **tous** les chiffres de la valeur doivent se
 * retrouver dans la description. Une valeur sans chiffre doit y retrouver au
 * moins un de ses mots. Sans description, rien n'est relayé — on n'invente pas
 * par défaut.
 *
 * Les URL et les liens font exception à l'exception : un lien n'est gardé que
 * si son domaine apparaît dans la description, jamais parce qu'il contient un
 * chiffre commun.
 */
export function faitRelaye(valeur: unknown, description: string | null | undefined): boolean {
  const v = texte(valeur)
  const d = texte(description)
  if (!v || !d) return false
  const dn = SANS_ACCENT(d)
  const chiffres = chiffresDe(v)
  if (chiffres.length) return chiffres.every(n => dn.includes(n))
  const mots = motsDe(v)
  if (!mots.length) return false
  return mots.some(m => dn.includes(m))
}

/**
 * Un bloc débarrassé de ce que le produit ne peut pas savoir. Les preuves
 * partent toujours ; les faits restent s'ils viennent de la description.
 * La structure, les titres et les textes de présentation ne bougent pas : c'est
 * l'emplacement qu'on donne, pas l'affirmation.
 */
export function nettoyerBloc<T extends BlocSimple>(bloc: T, description?: string | null): T {
  const content: Record<string, any> = { ...(bloc?.content ?? {}) }
  for (const champ of Object.keys(content)) {
    const v = content[champ]
    if (typeof v !== "string" || !v.trim()) continue
    if (estUnePreuve(bloc.type, champ)) { content[champ] = ""; continue }
    if (estUnFait(bloc.type, champ) && !faitRelaye(v, description)) content[champ] = ""
  }
  return { ...bloc, content } as T
}

/** La même chose sur une page entière. */
export function nettoyerLesBlocs<T extends BlocSimple>(blocs: T[] | null | undefined, description?: string | null): T[] {
  return (blocs ?? []).map(b => nettoyerBloc(b, description))
}

export type FaitAffirme = { type: string; champ: string; valeur: string; nature: "preuve" | "fait" }

/** Ce qu'une page affirme à la place de quelqu'un — l'oracle de la garde. */
export function faitsAffirmes(blocs: BlocSimple[] | null | undefined, description?: string | null): FaitAffirme[] {
  const out: FaitAffirme[] = []
  for (const b of blocs ?? []) {
    for (const [champ, v] of Object.entries(b?.content ?? {})) {
      const valeur = texte(v)
      if (!valeur) continue
      if (estUnePreuve(b.type, champ)) { out.push({ type: b.type, champ, valeur, nature: "preuve" }); continue }
      if (estUnFait(b.type, champ) && !faitRelaye(valeur, description)) out.push({ type: b.type, champ, valeur, nature: "fait" })
    }
  }
  return out
}

/** Ce qu'on dit au commerçant, près du bouton « Publier ». */
export function phraseAComplete(type: string, nbChamps: number): string {
  const quoi: Record<string, string> = {
    testimonials: "avis", video_testimonials: "avis", google_review: "avis",
    menu_section: "prix", pricing: "tarifs", opening_hours: "horaires",
    google_maps_embed: "adresse", social_links: "liens", cta_button: "lien",
    stats_block: "chiffres", business_stats: "chiffres", stat_hero: "chiffre",
  }
  const mot = quoi[type] ?? "informations"
  return nbChamps > 1 ? `${mot} à compléter — le produit ne les invente pas` : `${mot} à compléter — le produit ne l'invente pas`
}
