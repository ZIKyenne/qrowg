// champQuiNeZoomePas — lot v185.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Sur iPhone, Safari ZOOME la page dès qu'on touche un champ dont la police
// fait moins de 16 px. Le commerçant tape une lettre, la page grossit, il doit
// pincer pour revenir. Ce n'est pas une préférence de style : c'est un
// comportement du navigateur, et il rend la saisie mobile pénible.
//
// Le produit le savait. Sa propre primitive `.ui-input` pose 16 px, avec ce
// commentaire : « font-size 16px = pas de zoom auto iOS au focus (corrige un
// point a11y) ».
//
// Relevé du 27 septembre : **186 champs écrits à la main**, dont **75 déclarent
// une police sous 16 px** et **110 n'en déclarent aucune** — ils héritent, donc
// personne ne sait ce qu'ils font. Aucun ne passe par la primitive : la leçon
// qu'elle porte ne les protège pas.
//
// Ce chiffre a d'abord été lu à 96. La sonde bornait la lecture d'un attribut,
// et un champ dont le `style={{…}}` dépassait la borne n'était pas vu — le même
// aveuglement qu'au lot v182, sur une autre sonde. C'est pourquoi le
// recensement vit ICI, dans un test qui s'exécute, et non dans un script jeté :
// une mesure qu'on ne rejoue pas est une mesure qu'on croit.
//
// Le défaut avait même déjà été rencontré — deux fois, et corrigé deux fois à
// côté de la plaque :
//
//   • `.ps-root textarea { font-size: 16px !important }` — un seul champ, dans
//     l'atelier d'impression.
//   • un bloc de QUATORZE sélecteurs écrits à la main sous `@media (max-width:
//     1024px)`, pour `.builder-root` et `.ps-root`.
//
// Le second est l'illustration exacte de la cause que cette série poursuit
// depuis le lot v151 : **une population écrite à la main finit par ne plus dire
// la vérité.** Elle énumérait douze types de champs, citait
// `input[type="email"]` pour une racine sur deux, et ne couvrait rien ailleurs.
// Pire, son déclencheur était une LARGEUR d'écran : un iPad Pro en paysage fait
// 1366 px, on y tape au doigt, et il ratait la règle.
//
// ── Ce que cette garde tient ───────────────────────────────────────────────
//
// 1. Il existe une règle, conditionnée au TACTILE et non à une largeur, qui
//    donne au moins 16 px à tout champ de saisie — sélecteur d'élément nu, donc
//    valable partout, y compris pour un champ qui n'existe pas encore.
// 2. Aucun retour à l'ancienne forme : pas de correctif du zoom reposant sur
//    une largeur d'écran, pas de liste de racines à tenir à jour.
// 3. La primitive garde ses 16 px : la règle tactile est un filet, pas un
//    remplacement.
// 4. Un cliquet sur les champs faits main, par zone, pour qu'ils converjent
//    vers la primitive au lieu de se multiplier.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const SRC = path.resolve(__dirname, "../..")
const CSS = path.join(SRC, "app/globals.css")
const css = () => fs.readFileSync(CSS, "utf8")

/** Le minimum que réclame iOS Safari pour ne pas zoomer. */
export const TAILLE_SANS_ZOOM = 16

// ── Lecture du CSS ─────────────────────────────────────────────────────────

/**
 * Les blocs `@media` du fichier, condition et corps, accolades équilibrées.
 *
 * Un `indexOf("}")` suffirait pour une règle plate, pas pour un `@media` qui
 * contient les siennes : il couperait le corps à la première règle interne. La
 * garde lirait alors un corps vide et conclurait à l'absence de la règle.
 */
export function blocsMedia(source = css()): { condition: string; corps: string }[] {
  const out: { condition: string; corps: string }[] = []
  const re = /@media([^{]+)\{/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source))) {
    let profondeur = 1
    let i = m.index + m[0].length
    const debut = i
    for (; i < source.length && profondeur > 0; i++) {
      if (source[i] === "{") profondeur++
      else if (source[i] === "}") profondeur--
    }
    out.push({ condition: m[1].trim(), corps: source.slice(debut, i - 1) })
  }
  return out
}

/** Les règles `sélecteurs { déclarations }` d'un corps, commentaires retirés. */
export function reglesDe(corps: string): { selecteurs: string[]; decls: string }[] {
  const propre = corps.replace(/\/\*[\s\S]*?\*\//g, "")
  const out: { selecteurs: string[]; decls: string }[] = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(propre))) {
    out.push({ selecteurs: m[1].split(",").map(s => s.trim()).filter(Boolean), decls: m[2] })
  }
  return out
}

/**
 * Le sélecteur vise-t-il un champ de saisie SANS le restreindre à un endroit ?
 *
 * C'est le cœur de la garde. `.builder-root input` vise bien un champ, mais
 * seulement sous une racine : c'est la forme qu'on vient de retirer, parce
 * qu'elle laisse dehors tout ce qui n'a pas été énuméré. On accepte donc
 * `input`, `textarea`, `select`, éventuellement affinés par `:not(...)` ou par
 * un attribut, et on refuse tout ce qui porte une classe, un identifiant ou un
 * ancêtre.
 */
export function viseToutChampDeSaisie(selecteur: string): boolean {
  // `:not(...)` peut contenir des crochets : on le retire avant les attributs.
  const sansNot = selecteur.replace(/:not\([^)]*\)/g, "")
  const sansAttr = sansNot.replace(/\[[^\]]*\]/g, "").trim()
  return /^(input|textarea|select)$/.test(sansAttr)
}

/**
 * TOUTES les tailles de police déclarées dans un bloc, en pixels.
 *
 * Un bloc peut en déclarer plusieurs. Ne lire que la première fait dire
 * n'importe quoi à la garde : lors du contrôle par mutation de ce lot, une
 * altération a été « attrapée » alors qu'elle était sans effet — un `15px`
 * inséré AVANT le `16px` d'origine, donc écrasé par lui. La garde criait à
 * tort, ce qui est aussi grave que se taire à tort : les deux font perdre
 * confiance dans le vert.
 */
export function taillesPolice(decls: string): number[] {
  return [...decls.matchAll(/font-size\s*:\s*([\d.]+)px/g)].map(m => parseFloat(m[1]))
}

/**
 * La taille qui S'APPLIQUE : la dernière déclarée, comme le fait le navigateur.
 */
export function taillePolice(decls: string): number | null {
  const t = taillesPolice(decls)
  return t.length ? t[t.length - 1] : null
}

/** Les règles qui protègent du zoom : tactile + champ nu + ≥ 16 px. */
export function reglesAntiZoom(source = css()) {
  const out: { condition: string; selecteur: string; px: number }[] = []
  for (const { condition, corps } of blocsMedia(source)) {
    // « tactile » se demande au pointeur, pas à la largeur de la fenêtre.
    if (!/pointer\s*:\s*coarse/.test(condition)) continue
    for (const { selecteurs, decls } of reglesDe(corps)) {
      const px = taillePolice(decls)
      if (px === null || px < TAILLE_SANS_ZOOM) continue
      for (const s of selecteurs) if (viseToutChampDeSaisie(s)) out.push({ condition, selecteur: s, px })
    }
  }
  return out
}

/**
 * Les correctifs du zoom pilotés par une LARGEUR d'écran — l'ancienne forme.
 *
 * Un `@media (max-width: …)` qui pose 16 px sur des champs ne corrige le zoom
 * que pour les fenêtres étroites. Il rate les tablettes larges et s'applique à
 * des bureaux qui n'en ont pas besoin. Si quelqu'un en réintroduit un, c'est
 * qu'il n'a pas vu la règle tactile — et la garde le dit.
 */
export function correctifsParLargeur(source = css()) {
  const out: { condition: string; selecteur: string }[] = []
  for (const { condition, corps } of blocsMedia(source)) {
    if (!/\bmax-width\b/.test(condition) || /pointer\s*:\s*coarse/.test(condition)) continue
    for (const { selecteurs, decls } of reglesDe(corps)) {
      if (taillePolice(decls) !== TAILLE_SANS_ZOOM) continue
      for (const s of selecteurs) {
        if (/\b(input|textarea|select)\b/.test(s)) out.push({ condition, selecteur: s })
      }
    }
  }
  return out
}

// ── Recensement des champs faits main ──────────────────────────────────────

export type Zone = "site public" | "page publiée" | "dashboard" | "composants" | "banc d'essai"

function zoneDe(rel: string): Zone {
  if (rel.startsWith("app/e2e-harness/")) return "banc d'essai"
  if (/shared-renderer\/(blocks\/.*\/Public|forms\/)/.test(rel)) return "page publiée"
  if (rel.startsWith("app/dashboard/")) return "dashboard"
  if (rel.startsWith("app/[slug]/")) return "page publiée"
  if (rel.startsWith("components/")) return "composants"
  return "site public"
}

function fichiers(): string[] {
  const out: string[] = []
  ;(function walk(d: string) {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p)
    }
  })(SRC)
  return out
}

/**
 * Où finissent les attributs d'une balise ouvrante.
 *
 * Le premier `>` ne suffit pas : `onChange={e => …}` en contient un, et la
 * lecture s'arrêterait au milieu des attributs. Ce piège a coûté trois fichiers
 * cassés au lot v182 ; il est écrit ici pour ne pas être réappris.
 */
export function finDeBalise(src: string, depuis: number): number {
  let accolades = 0
  for (let i = depuis; i < src.length; i++) {
    const c = src[i]
    if (c === "{") accolades++
    else if (c === "}") accolades--
    else if (c === ">" && accolades === 0 && src[i - 1] !== "=") return i
  }
  return src.length
}

/** Les types de champ qui n'ont pas de texte à zoomer. */
const SANS_TEXTE = /type\s*=\s*"(checkbox|radio|range|color|hidden|file|submit|button|image|reset)"/

/**
 * Un champ « fait main » : il porte un style en ligne. C'est le signe qu'il se
 * dessine lui-même au lieu de porter une classe — et donc qu'il peut dériver de
 * tous les autres. Un champ qui porte `className` suit une feuille de style
 * commune, même si ce n'est pas encore `.ui-input`.
 */
export function champsFaitsMain() {
  const details: { fichier: string; ligne: number; zone: Zone; balise: string; px: number | null }[] = []
  for (const abs of fichiers()) {
    const rel = path.relative(SRC, abs).replace(/\\/g, "/")
    // La primitive a le droit de se dessiner : c'est son métier.
    if (rel === "components/ui/Input.tsx") continue
    const src = fs.readFileSync(abs, "utf8")
    const re = /<(input|textarea|select)(\s)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      const balise = src.slice(m.index, finDeBalise(src, m.index) + 1)
      if (SANS_TEXTE.test(balise)) continue
      if (!/\bstyle\s*=\s*\{/.test(balise)) continue
      const px = balise.match(/fontSize\s*:\s*["']?(\d+(?:\.\d+)?)/)
      details.push({
        fichier: rel,
        ligne: src.slice(0, m.index).split("\n").length,
        zone: zoneDe(rel),
        balise: m[1],
        px: px ? parseFloat(px[1]) : null,
      })
    }
  }
  return details
}

/**
 * Le cliquet. Ces nombres ne remontent jamais.
 *
 * Relevé du 27 septembre, après la pose de la règle tactile. Ils ne descendent
 * pas d'eux-mêmes : chaque champ repris par `.ui-input` les fait baisser, et le
 * test refuse qu'on laisse un plafond au-dessus du réel.
 *
 * Ces nombres sont hauts, et c'est volontaire : un cliquet se pose au réel, pas
 * à l'idéal. Le zoom iOS est déjà réglé pour les 186 par la règle tactile ; le
 * cliquet sert à la seconde moitié du problème, l'apparence — sept rayons de
 * bordure, onze hauteurs. Il empêche la 187e, il ne prétend pas avoir corrigé
 * les 186.
 */
const PLAFONDS: Record<Zone, number> = {
  "site public": 28,
  "page publiée": 10,
  dashboard: 146,
  composants: 1,
  "banc d'essai": 1,
}

describe("aucun champ ne fait zoomer la page du commerçant", () => {
  // ── 1. La règle existe, et elle demande la bonne chose ───────────────────

  it("une règle tactile donne au moins 16 px à tout champ de saisie", () => {
    const r = reglesAntiZoom()
    expect(
      r.map(x => x.selecteur),
      "aucune règle tactile ne protège les champs du zoom iOS : un champ sous 16 px fera grossir la page au premier appui",
    ).not.toEqual([])
    // Les trois éléments de saisie doivent être couverts, pas seulement `input`.
    for (const el of ["input", "textarea", "select"]) {
      expect(
        r.some(x => x.selecteur.replace(/:not\([^)]*\)/g, "").trim().startsWith(el)),
        `${el} n'est pas couvert par la règle tactile`,
      ).toBe(true)
    }
  })

  it("elle bat les styles en ligne", () => {
    // 186 champs se dessinent avec `style={{ … }}`. Un style en ligne
    // l'emporte sur toute feuille de style : sans `!important`, la règle serait
    // écrite et sans effet — le pire des deux mondes, puisque la garde
    // passerait au vert.
    for (const { condition } of reglesAntiZoom()) {
      const bloc = blocsMedia().find(b => b.condition === condition)!
      const regle = reglesDe(bloc.corps).find(r => r.selecteurs.some(viseToutChampDeSaisie))!
      expect(regle.decls, "la règle tactile n'est pas !important : les styles en ligne la neutralisent").toContain("!important")
    }
  })

  // ── 2. Pas de retour à l'ancienne forme ──────────────────────────────────

  it("aucun correctif du zoom ne repose sur une largeur d'écran", () => {
    expect(
      correctifsParLargeur().map(x => `@media ${x.condition} → ${x.selecteur}`),
      "un correctif du zoom piloté par la largeur rate les tablettes tactiles larges : le tactile se demande au pointeur",
    ).toEqual([])
  })

  it("la règle ne tient pas une liste de racines", () => {
    // La forme retirée nommait `.builder-root` et `.ps-root`. Une liste de
    // racines laisse dehors tout ce qu'on n'a pas pensé à y mettre.
    for (const { selecteur } of reglesAntiZoom()) {
      expect(selecteur, "la règle tactile est restreinte à un ancêtre : elle ne protège plus que ce qu'on a énuméré").not.toMatch(/[.#]|\s/)
    }
  })

  // ── 3. La primitive garde sa promesse ────────────────────────────────────

  it("la primitive déclare toujours au moins 16 px", () => {
    // Le filet tactile ne dispense pas la primitive de bien faire : sur un
    // écran de bureau, c'est elle seule qui décide.
    //
    // Premier essai : `/\.ui-input\s*\{/`. Il ne trouvait rien, parce que la
    // primitive est déclarée dans une LISTE — `.ui-input, .ui-textarea,
    // .ui-select { … }`. La garde annonçait « la primitive a perdu ses 16 px »
    // alors qu'elle les avait : elle était épinglée sur la forme du sélecteur
    // au lieu de son intention. On cherche donc la règle qui CONTIENT la
    // primitive, quelle que soit sa compagnie.
    const regles = reglesDe(css()).filter(r => r.selecteurs.includes(".ui-input"))
    expect(regles.length, ".ui-input introuvable — la garde ne lit plus la primitive").toBeGreaterThan(0)
    // On exige que TOUTE taille déclarée tienne le seuil, pas seulement celle
    // qui gagne. Une petite valeur écrasée aujourd'hui par une grande est une
    // régression qui attend qu'on réordonne le bloc.
    const tailles = regles.flatMap(r => taillesPolice(r.decls))
    expect(tailles, ".ui-input ne déclare plus aucune taille de police").not.toEqual([])
    for (const px of tailles) expect(px, `.ui-input déclare ${px}px : iOS zoomera`).toBeGreaterThanOrEqual(TAILLE_SANS_ZOOM)
  })

  // ── 4. Le cliquet ────────────────────────────────────────────────────────

  it("le recensement voit des champs (sinon il est aveugle)", () => {
    const c = champsFaitsMain()
    expect(c.length, "aucun champ fait main trouvé — l'extraction ne lit plus les fichiers").toBeGreaterThan(100)
    expect(new Set(c.map(x => x.fichier)).size).toBeGreaterThan(20)
    // La sonde qui a d'abord lu 96 au lieu de 186 bornait la lecture d'un
    // attribut. Voir le plus gros fichier en entier prouve que la borne n'est
    // pas revenue : `builderPanels.tsx` en porte 27 à lui seul.
    expect(c.filter(x => x.fichier.endsWith("builderPanels.tsx")).length).toBeGreaterThan(20)
  })

  it("les champs faits main ne se multiplient pas", () => {
    const c = champsFaitsMain()
    const parZone = Object.fromEntries(Object.keys(PLAFONDS).map(z => [z, 0])) as Record<Zone, number>
    for (const x of c) parZone[x.zone]++

    const trop = (Object.keys(PLAFONDS) as Zone[])
      .filter(z => parZone[z] > PLAFONDS[z])
      .map(z => `${z} : ${parZone[z]} > ${PLAFONDS[z]}`)
    expect(trop, "un champ dessiné à la main a été ajouté — passez par <Input> ou la classe .ui-input").toEqual([])
  })

  it("aucun plafond ne reste au-dessus du réel", () => {
    // Sans ça, le cliquet se desserre en silence : on reprend dix champs, le
    // plafond garde son ancienne valeur, et dix nouveaux peuvent revenir.
    const parZone = Object.fromEntries(Object.keys(PLAFONDS).map(z => [z, 0])) as Record<Zone, number>
    for (const x of champsFaitsMain()) parZone[x.zone]++
    const relaches = (Object.keys(PLAFONDS) as Zone[])
      .filter(z => parZone[z] < PLAFONDS[z])
      .map(z => `${z} : ${parZone[z]} réels pour un plafond à ${PLAFONDS[z]} — descendez le plafond`)
    expect(relaches, "le cliquet s'est desserré").toEqual([])
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  it("une règle restreinte à une racine ne serait pas comptée comme protectrice", () => {
    const faux = `@media (hover: none) and (pointer: coarse) { .builder-root input { font-size: 16px !important } }`
    expect(reglesAntiZoom(faux)).toEqual([])
  })

  it("une règle tactile sous 16 px ne serait pas comptée comme protectrice", () => {
    const faux = `@media (hover: none) and (pointer: coarse) { input, textarea, select { font-size: 15px !important } }`
    expect(reglesAntiZoom(faux)).toEqual([])
  })

  it("un correctif par largeur réintroduit serait vu", () => {
    const faux = `@media (max-width: 1024px) { .ps-root textarea { font-size: 16px !important } }`
    expect(correctifsParLargeur(faux).length).toBeGreaterThan(0)
  })

  it("la vraie règle du produit passe bien les deux épreuves", () => {
    // Le pendant des trois contre-épreuves : elles prouvent que l'extraction
    // sait refuser. Celle-ci prouve qu'elle sait accepter.
    expect(reglesAntiZoom().length).toBeGreaterThanOrEqual(3)
    expect(correctifsParLargeur()).toEqual([])
  })

  it("la fin de balise ne se laisse pas prendre par une flèche", () => {
    const b = `<input onChange={e => setX(e)} style={{ fontSize: 12 }} />`
    expect(b.slice(0, finDeBalise(b, 0) + 1)).toContain("style=")
  })
})
