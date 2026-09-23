// misesEnPage.ts — ce qui fait exister un bloc de mise en page.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Trente et un blocs disparaissaient de la page publiée sans que rien ne le
// dise. Ceux-là décident dans leur composant : leur adapter public porte la
// condition, écrite une fois, dans le corps du rendu —
//
//     export function PublicFrameBox({ content, ctx }) {
//       const c = content || {}
//       if (!c.title && !c.text) return null
//       …
//
// — pendant que leur adapter éditeur, lui, rend la vue SANS condition :
//
//     export function EditorFrameBox({ content, ctx }) { return <View … /> }
//
// La vue d'un bloc vide ne dessine rien. Le commerçant ajoute « Encadré » depuis
// la bibliothèque et voit… un espace. Le cadre du canvas fait 36 px de haut, et
// l'étiquette du bloc ne s'affiche que tant qu'il est SÉLECTIONNÉ : dès qu'il
// clique ailleurs, il reste un trou muet au milieu de sa page.
//
// ── Pourquoi ce fichier, plutôt qu'une condition dans chaque éditeur ───────
//
// Recopier la condition dans l'adapter éditeur, c'est la dérive que les lots
// v151 à v154 ont passé leur temps à défaire : deux copies d'une même règle
// finissent par ne plus dire la même chose. Les quatorze conditions de cette
// famille sont ici, déclarées, et les DEUX adapters les lisent — plus le
// détecteur de la liste d'avant publication, qui entre ainsi dans la boucle
// sans rien recopier non plus (lots v166 et v167).
//
// ── Ce que la déclaration a corrigé au passage ────────────────────────────
//
// Les conditions écrites à la main demandaient `!c.title` : une ligne d'espaces
// passait donc pour du contenu, et le bloc se publiait vide. Le contrat du
// produit dit le contraire depuis toujours — « une ligne blanche, un item
// fantôme ne sont PAS du contenu publiable ». Les champs sont jugés ici avec la
// règle du produit : le texte est nettoyé, une image passe par `safeImageUrl`,
// un nom d'ancre par `anchorId`.

import { safeImageUrl, anchorId } from "./layoutStyle"

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

/**
 * Un champ qui porte le bloc, et la manière de le juger.
 *
 * `image` et `ancre` ne sont pas des détails de forme : une adresse d'image que
 * le produit refuse ne dessine rien, et un nom qui ne donne aucune ancre ne
 * sert à personne. Les juger comme du texte ferait survivre un bloc qui ne
 * montrerait rien.
 */
export type Porteur = { cle: string; image?: boolean; ancre?: boolean }

/**
 * Ce qui porte chacun des quatorze blocs.
 *
 * Repris de la condition que chaque rendu public appliquait — **et corrigé de
 * treize oublis, que la déclaration a rendus visibles.** La vue de
 * `text_columns` dessine `{c.title}`, mais sa condition ne regardait que
 * `text` : un commerçant qui écrit le titre de sa section et rien d'autre
 * voyait son titre dans l'aperçu, et la page ne publiait rien. Même chose pour
 * `toggle_content.title`, `big_statement.subtext`, `overlay_card.subtitle` et
 * `eyebrow`, `frame_box.signature`, `card_link.eyebrow`,
 * `full_bleed_image.caption`, et le libellé de bouton de trois blocs — que
 * `free_section`, lui, comptait déjà : les frères ne répondaient pas pareil.
 *
 * La règle est celle-ci, et sa garde la vérifie en lisant les vues : **ce que
 * la vue dessine porte le bloc.** Sinon le produit efface ce que le commerçant
 * a écrit.
 */
export const CE_QUI_PORTE: Record<string, Porteur[]> = {
  free_section: [{ cle: "title" }, { cle: "text" }, { cle: "subtitle" }, { cle: "eyebrow" }, { cle: "bg_image", image: true }, { cle: "cta_label" }],
  image_text: [{ cle: "image", image: true }, { cle: "title" }, { cle: "text" }, { cle: "cta_label" }],
  split_panel: [{ cle: "l_title" }, { cle: "r_title" }, { cle: "l_text" }, { cle: "r_text" }],
  overlay_card: [{ cle: "image", image: true }, { cle: "title" }, { cle: "subtitle" }, { cle: "eyebrow" }, { cle: "cta_label" }],
  frame_box: [{ cle: "title" }, { cle: "text" }, { cle: "emoji" }, { cle: "signature" }],
  banner_strip: [{ cle: "text" }, { cle: "emoji" }, { cle: "cta_label" }],
  full_bleed_image: [{ cle: "image", image: true }, { cle: "caption" }],
  ribbon_banner: [{ cle: "text" }, { cle: "emoji" }],
  big_statement: [{ cle: "text" }, { cle: "subtext" }],
  text_columns: [{ cle: "text" }, { cle: "title" }],
  card_link: [{ cle: "title" }, { cle: "text" }, { cle: "emoji" }, { cle: "eyebrow" }],
  toggle_content: [{ cle: "text" }, { cle: "title" }],
  highlight_box: [{ cle: "text" }, { cle: "title" }, { cle: "emoji" }],
  // Celui-ci est à part, et c'est écrit dans son fichier : il est invisible en
  // ligne PAR DESSEIN — il ne sert qu'à recevoir les sauts du menu interne.
  // Sans nom, il ne reçoit rien : il ne pose même pas son ancre.
  anchor_target: [{ cle: "name", ancre: true }],
}

/**
 * Ce bloc a-t-il de quoi exister ?
 *
 * Un type hors de cette famille répond `true` : on ne masque jamais par erreur
 * un bloc dont la règle n'est pas écrite ici (même prudence que
 * `hasPublishableContent`).
 */
export function porteQuelqueChose(type: string, c: Record<string, any> | null | undefined): boolean {
  const porteurs = CE_QUI_PORTE[type]
  if (!porteurs) return true
  const src = c || {}
  return porteurs.some(p =>
    p.image ? !!safeImageUrl(src[p.cle])
      : p.ancre ? !!anchorId(src[p.cle])
        : txt(src[p.cle]) !== "")
}
