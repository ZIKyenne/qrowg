// lectureDeCarte.ts — « Coller ma carte » : reconnaître sections, produits,
// prix et descriptions dans un texte copié tel quel (PDF, Word, site, photo
// passée dans un lecteur de texte), sans intelligence artificielle.
//
// Pourquoi : remplir une carte de 100 produits exigeait des lignes
// « NOM;PRIX;Description », section par section, dans l'éditeur. Un gérant qui
// découvre Qrowg s'arrête là.
//
// Deux lectures :
//  · TABLEAU — la plupart des lignes portent un séparateur (point-virgule,
//    tabulation) : une ligne d'une seule cellule sans prix est un titre de
//    section, les autres sont « nom, prix, description » ;
//  · TEXTE LIBRE — une ligne qui porte un prix est un produit (« MOJITO 10€ »,
//    « Mojito ...... 10,00 € », « Mojito - 9,50 », « Mojito 10€ menthe,
//    citron ») ; une ligne sans prix est un titre de section si elle en a
//    l'allure (majuscules, « : » final, courte et sans virgule, suivie d'un
//    produit), sinon la description du produit précédent ; un prix seul sur sa
//    ligne revient au produit d'avant qui n'en avait pas.
// Ce qui ne se lit pas est rendu dans `aVerifier`, jamais jeté en silence.
// Les plafonds du rendu sont respectés et dits (20 onglets, 50 produits).
// Module PUR.

import { champPropre } from "./ajoutDeProduit"
import { plafondDesLignes } from "./plafondDesLignes"
import { limite } from "@/lib/limitesDeSaisie"

export type ProduitLu = { nom: string; prix: string; desc: string }
export type SectionLue = { titre: string; produits: ProduitLu[] }
export type CarteLue = { sections: SectionLue[]; aVerifier: { ligne: string; raison: string }[]; produits: number }

export const SECTIONS_MAX = plafondDesLignes("menu_tabs")   // 20
export const PRODUITS_PAR_SECTION = 50
const TITRE_PAR_DEFAUT = "Carte"

const DEVISE = "(?:€|eur(?:os?)?\\b)"
const NOMBRE = "\\d{1,4}(?:[.,]\\d{1,2})?"
// Un prix avec sa devise, n'importe où dans la ligne.
const PRIX_DEVISE = new RegExp(`(${NOMBRE})\\s*${DEVISE}`, "i")
// Sans devise, seulement en fin de ligne : décimal (« 9,50 »), ou entier
// détaché par des points de conduite, un tiret ou deux espaces (« Mojito  10 »).
const PRIX_DECIMAL_FIN = /^(.*?\S)\s*(?:[-–—:]\s*)?(\d{1,4}[.,]\d{1,2})\s*$/
const PRIX_ENTIER_FIN = /^(.*?\S)(?:\s{2,}|\s*[-–—]\s*)(\d{1,4})\s*$/

/** Points de conduite et tirets décoratifs : « Mojito ........ 10 € » → « Mojito  10 € ». */
const sansConduite = (l: string) => l.replace(/[.\u00b7_\u2026]{3,}/g, "  ").replace(/[\u00a0\u202f]/g, " ")

const bordsPropres = (s: string) => s.replace(/^[\s\-–—:,;|]+|[\s\-–—:,;|]+$/g, "")

// Carte sans devise (« Margherita 9 ») : quand AUCUNE ligne n'a de « € » et que
// plusieurs finissent par un nombre, ce nombre final est un prix.
const PRIX_ENTIER_NU = /^(.*?\p{L}.*?\S)\s+(\d{1,3})\s*$/u

/** Le prix d'une ligne, et ce qui l'entoure. null : pas de prix. */
export function prixDansLaLigne(ligne: string, entiersNus = false): { avant: string; prix: string; apres: string } | null {
  const l = sansConduite(ligne)
  const m = PRIX_DEVISE.exec(l)
  if (m) return { avant: bordsPropres(l.slice(0, m.index)), prix: m[0].replace(/\s+/g, " ").trim(), apres: bordsPropres(l.slice(m.index + m[0].length)) }
  const d = PRIX_DECIMAL_FIN.exec(l) ?? PRIX_ENTIER_FIN.exec(l.replace(/\s+$/, "")) ?? (entiersNus ? PRIX_ENTIER_NU.exec(l) : null)
  if (d) return { avant: bordsPropres(d[1]), prix: d[2], apres: "" }
  return null
}

/** Une ligne sans prix a-t-elle l'allure d'un titre de section ? */
export function allureDeTitre(ligne: string): boolean {
  const l = ligne.trim()
  if (!l || l.length > 40 || /[,;]/.test(l.replace(/:$/, ""))) return false
  if (l.endsWith(":")) return true
  const lettres = l.replace(/[^\p{L}]/gu, "")
  if (lettres.length >= 3 && lettres === lettres.toLocaleUpperCase("fr")) return true
  return l.split(/\s+/).length <= 4 && /^\p{Lu}/u.test(l)
}

function separateurDeTableau(lignes: string[]): string | null {
  for (const sep of ["\t", ";"]) {
    if (lignes.filter(l => l.includes(sep)).length >= Math.max(2, Math.ceil(lignes.length * 0.5))) return sep
  }
  return null
}

const titrePropre = (l: string) => champPropre(l.replace(/:\s*$/, "")).slice(0, limite("titreDeCarte"))

export function lireUneCarte(texte: string): CarteLue {
  const lignes = (texte ?? "").split(/\r?\n/).map(l => l.replace(/\s+$/, "")).filter(l => l.trim() !== "")
  const sections: SectionLue[] = []
  const aVerifier: CarteLue["aVerifier"] = []
  let courante: SectionLue | null = null
  const section = () => (courante ??= (sections.push({ titre: TITRE_PAR_DEFAUT, produits: [] }), sections[sections.length - 1]))
  const ouvrir = (titre: string) => { courante = { titre: titrePropre(titre) || TITRE_PAR_DEFAUT, produits: [] }; sections.push(courante) }
  const produit = (nom: string, prix: string, desc: string, brut: string) => {
    const p = { nom: champPropre(nom), prix: champPropre(prix), desc: champPropre(desc) }
    if (!p.nom) { aVerifier.push({ ligne: brut.trim(), raison: "Un prix sans nom de produit." }); return }
    if (p.nom.length > limite("nomDeProduit")) { aVerifier.push({ ligne: brut.trim(), raison: "Nom trop long : sans doute deux produits sur une ligne." }); return }
    p.desc = p.desc.slice(0, limite("descriptionDeProduit"))
    section().produits.push(p)
  }

  const entiersNus = !lignes.some(l => PRIX_DEVISE.test(l)) && lignes.filter(l => /\p{L}.*\s\d{1,3}\s*$/u.test(l)).length >= 2
  const prixDe = (l: string) => prixDansLaLigne(l, entiersNus)
  const sep = separateurDeTableau(lignes)
  if (sep) {
    for (const l of lignes) {
      const cellules = l.split(sep).map(c => c.trim())
      const pleines = cellules.filter(Boolean)
      if (pleines.length === 1 && !prixDe(pleines[0])) { ouvrir(pleines[0]); continue }
      produit(cellules[0] ?? "", cellules[1] ?? "", cellules.slice(2).filter(Boolean).join(" "), l)
    }
  } else {
    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i]
      const p = prixDe(l)
      // (cast : `courante` change dans les fonctions ci-dessus, TypeScript ne le suit pas)
      const enCours = courante as SectionLue | null
      const dernier = enCours?.produits[enCours.produits.length - 1]
      if (p && p.avant) { produit(p.avant, p.prix, p.apres, l); continue }
      if (p && !p.avant) {
        // « 10 € » seul : le prix du produit d'avant, s'il n'en avait pas.
        if (dernier && !dernier.prix) { dernier.prix = p.prix; if (p.apres) dernier.desc = champPropre(`${dernier.desc} ${p.apres}`); continue }
        aVerifier.push({ ligne: l.trim(), raison: "Un prix seul, sans produit avant lui." }); continue
      }
      const suivante = lignes[i + 1]
      const prixSuivant = suivante ? prixDe(suivante) : null
      // « Café gourmand » puis « 8€ » : un produit dont le prix est à la ligne.
      if (prixSuivant && !prixSuivant.avant) { produit(l, "", "", l); continue }
      const suiviDUnProduit = !!prixSuivant?.avant
      if (allureDeTitre(l) && (suiviDUnProduit || !dernier)) { ouvrir(l); continue }
      if (dernier) {
        // Une ligne de plus du produit précédent : sa description.
        const desc = champPropre(`${dernier.desc} ${l}`)
        if (desc.length <= limite("descriptionDeProduit")) { dernier.desc = desc; continue }
      }
      if (allureDeTitre(l)) { ouvrir(l); continue }
      // Ni prix, ni titre, ni suite : un produit sans prix, à vérifier.
      produit(l, "", "", l)
      aVerifier.push({ ligne: l.trim(), raison: "Produit sans prix : ajoutez-le dans « Ma carte » si besoin." })
    }
  }

  // Les sections vides (deux titres de suite) disparaissent ; une section trop
  // longue est coupée en « (suite) » — le rendu ne lit que 50 lignes par onglet.
  const decoupees: SectionLue[] = []
  for (const s of sections.filter(x => x.produits.length)) {
    for (let k = 0; k < s.produits.length; k += PRODUITS_PAR_SECTION)
      decoupees.push({ titre: k ? `${s.titre} (suite)` : s.titre, produits: s.produits.slice(k, k + PRODUITS_PAR_SECTION) })
  }
  const gardees = decoupees.slice(0, SECTIONS_MAX)
  for (const s of decoupees.slice(SECTIONS_MAX))
    aVerifier.push({ ligne: s.titre, raison: `Au-delà de ${SECTIONS_MAX} sections : collez cette partie dans une deuxième carte.` })
  return { sections: gardees, aVerifier, produits: gardees.reduce((n, s) => n + s.produits.length, 0) }
}

/** Le contenu d'un bloc « Grande carte » prêt à insérer. */
export function contenuDeGrandeCarte(titre: string, sections: readonly SectionLue[]): Record<string, string> {
  const pv = (s: string) => champPropre(s).replace(/;/g, ",")
  const c: Record<string, string> = { title: champPropre(titre).slice(0, limite("titreDeCarte")) || "Notre carte", text_size: "Normal", row_density: "Normal" }
  sections.slice(0, SECTIONS_MAX).forEach((s, k) => {
    c[`sec${k + 1}_title`] = pv(s.titre).slice(0, limite("titreDeCarte")) || TITRE_PAR_DEFAUT
    c[`sec${k + 1}_items`] = s.produits.slice(0, PRODUITS_PAR_SECTION)
      .map(p => [pv(p.nom), pv(p.prix), pv(p.desc)].join(";").replace(/;+$/, "")).join("\n")
  })
  return c
}

/**
 * Où ranger une carte importée : juste APRÈS la dernière carte de la page
 * (menu ou grande carte) — retour du 16 novembre : « elle aurait dû se créer
 * juste après les autres », pas sous l'Instagram et les horaires. Sans carte
 * existante : à la fin. Les blocs qui suivent descendent d'un cran ; seuls
 * ceux-là sont réécrits.
 */
export function placeDeLaCarte(blocs: readonly { id: string; type: string; position: number }[]): { position: number; decaler: { id: string; position: number }[] } {
  const tries = [...blocs].sort((a, b) => a.position - b.position)
  const cartes = tries.filter(b => b.type === "menu_section" || b.type === "menu_tabs")
  if (!cartes.length) return { position: (tries[tries.length - 1]?.position ?? -1) + 1, decaler: [] }
  const position = cartes[cartes.length - 1].position + 1
  return { position, decaler: tries.filter(b => b.position >= position).map(b => ({ id: b.id, position: b.position + 1 })) }
}
