// unSeulBouton — lot v181.
//
// ── Le relevé du 24 septembre ──────────────────────────────────────────────
//
// « J'aimerais qu'il n'y ait pas vingt styles de bouton différents. » Compté :
//
//   157 appels à l'action écrits à la main, contre 39 usages de `<Button>`
//   68 rien que sur le site public — et pas un seul usage du composant
//   35 formes visuelles distinctes pour ces 68, dont la moitié n'apparaît
//      qu'une fois
//   22 rayons de bordure différents, 47 fonds littéraux
//
// Ces 35 formes ne recouvrent pourtant que quatre intentions : or plein,
// contour doré, contour neutre, destructif. Soit exactement les quatre
// variantes que `components/ui/Button.tsx` propose depuis toujours.
//
// ── Pourquoi le composant n'était pas utilisé ──────────────────────────────
//
// Pas par négligence : la moitié de ces boutons sont des LIENS, et `<Button>`
// rendait un `<button>`, incapable de porter un `href`. Chacun a donc redessiné
// le sien à côté. `ButtonLink` comble ce trou — mêmes classes, aucune règle de
// plus.
//
// ── Ce que cette garde tient ───────────────────────────────────────────────
//
// Un cliquet : par zone, le nombre de boutons faits main ne peut que DESCENDRE.
// Les plafonds ci-dessous sont l'état réel après ce lot. Convertir en fait
// baisser un ; en réintroduire un fait échouer le test. Aucune ligne n'autorise
// une exception : on baisse les plafonds au fur et à mesure, et le jour où l'un
// atteint zéro, il y reste.
//
// ── Ce que la garde NE compte pas, et pourquoi c'est écrit ─────────────────
//
// Mon premier relevé comptait 192 boutons. Il ramassait les nuanciers de
// couleur, les croix de fermeture et l'interrupteur de facturation annuelle —
// des ronds et des carrés à dimensions fixes, qui ne sont pas des boutons et
// n'ont rien à faire dans `.ui-btn`. Un cliquet posé sur cette population
// m'aurait poussé à convertir ce qu'il ne fallait pas. La définition est donc
// explicite, et la contre-épreuve du bas vérifie qu'elle exclut bien ces trois
// familles.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const RACINE = path.resolve(__dirname, "../..")

/** Un appel à l'action : un cliquable qui porte un fond ou une bordure ET un rembourrage. */
const VISUEL = /(background|backgroundColor|border)\s*:/
const FORME = /padding\s*:/
/**
 * Ce qui n'en est PAS un. Cinq familles, et chacune a été ajoutée parce que le
 * relevé précédent la comptait à tort — un cliquet posé sur une population
 * fausse pousse à convertir ce qu'il ne faut pas.
 *
 *   1. pastille ronde (nuancier, croix, avatar)
 *   2. bouton-icône à dimensions fixes
 *   3. interrupteur ou onglet : d'autres primitives, d'autres règles
 *   4. carte cliquable : un lien qui enveloppe un titre, un texte, une flèche
 *   5. ligne dépliante (en-tête d'accordéon) : pleine largeur, libellé à
 *      gauche, chevron à droite — `.ui-btn` la casserait
 *   6. icône sans surface : ni fond, ni bordure, ni rayon
 *   7. segment d'un groupe (`aria-pressed`, `aria-selected`, `role="radio"`) :
 *      un rail où l'un est actif, dessiné à plat en 32 px — `.ui-btn` le casse
 *   8. commande dense : une hauteur explicite sous 44 px, posée sciemment
 *      (filtres, légendes, rails), que `.ui-btn` ferait toutes grandir
 *   9. surface de mise en page : `position: sticky/fixed/absolute`. Une barre
 *      collante qui se trouve être cliquable reste d'abord une barre — le
 *      convertisseur lui a retiré son `sticky`, et une garde de classe l'a vu.
 */
const ROND = /borderRadius\s*:\s*["']50%["']/
const TAILLE_FIXE = /\bwidth\s*:\s*\d/
const INTERRUPTEUR = /role\s*=\s*["'](switch|tab)["']/
const CARTE = /<(div|p|h[1-6]|ul|section|article)[\s>]/
const LIGNE_DEPLIANTE = /justifyContent:\s*["']space-between["']|textAlign:\s*["']left["']/
const SEGMENT = /aria-pressed|aria-selected|role\s*=\s*["'](radio|tab)["']/
const DENSE = /minHeight:\s*(\d+)/
const SURFACE = /position:\s*["'](sticky|fixed|absolute)["']/
const sansSurface = (a: string) =>
  /background(Color)?:\s*["'](none|transparent)["']/.test(a)
  && /border:\s*["']none["']/.test(a) && !/borderRadius\s*:/.test(a)

/** Le `>` qui ferme la balise — pas celui de `() =>`, pas un `>` dans une expression. */
function finDeBalise(src: string, depuis: number): number {
  let prof = 0
  for (let i = depuis; i < src.length; i++) {
    const c = src[i]
    if (c === "{") prof++
    else if (c === "}") prof--
    else if (c === ">" && prof === 0 && src[i - 1] !== "=") return i
  }
  return -1
}

export type Zone = "site public" | "page publiée" | "dashboard" | "composants" | "banc d'essai"

function zoneDe(rel: string): Zone {
  // Le banc d'essai n'est pas une surface que quelqu'un regarde : il existe pour
  // que les tests de bout en bout aient un canevas. Il a sa propre zone plutôt
  // qu'une dérogation, parce que la raison ne tient pas à un fichier mais à sa
  // nature.
  if (rel.startsWith("app/e2e-harness/")) return "banc d'essai"
  // Le moteur de rendu PARTAGÉ vit sous `dashboard/builder/`, mais ses vues
  // `Public*` et ses formulaires dessinent la page du commerçant, pas
  // l'éditeur. Ils relèvent de la même exemption que `app/[slug]/` : le produit
  // ne pose pas son or sur la page de ses clients. Le chemin trompe, la
  // fonction ne doit pas.
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
  })(RACINE)
  return out
}

export function boutonsFaitsMain(lire = (f: string) => fs.readFileSync(f, "utf8")) {
  const parZone: Record<string, number> = { "site public": 0, "page publiée": 0, dashboard: 0, composants: 0 }
  const details: { fichier: string; zone: Zone }[] = []
  for (const f of fichiers()) {
    const rel = path.relative(RACINE, f).split(path.sep).join("/")
    const src = lire(f)
    const re = /<(button|a|Link)\s/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      const tag = m[1]
      const ferme = finDeBalise(src, m.index + m[0].length)
      if (ferme < 0 || src[ferme - 1] === "/") continue
      const attrs = src.slice(m.index + m[0].length, ferme)
      if (!/style=\{\{/.test(attrs)) continue
      if (!VISUEL.test(attrs) || !FORME.test(attrs)) continue
      if (ROND.test(attrs) || TAILLE_FIXE.test(attrs) || INTERRUPTEUR.test(attrs)) continue
      if (LIGNE_DEPLIANTE.test(attrs) || sansSurface(attrs)) continue
      if (SEGMENT.test(attrs) || SURFACE.test(attrs)) continue
      const dense = DENSE.exec(attrs)
      if (dense && Number(dense[1]) < 44) continue
      const ferme2 = src.indexOf(`</${tag}>`, ferme)
      const enfants = ferme2 > 0 ? src.slice(ferme + 1, ferme2) : ""
      if (CARTE.test(enfants)) continue
      if ((enfants.match(/<[a-zA-Z]/g) || []).length > 1) continue
      const z = zoneDe(rel)
      parZone[z]++
      details.push({ fichier: rel, zone: z })
    }
  }
  return { parZone, details }
}

/**
 * L'état réel. Ces nombres ne remontent jamais.
 *
 *   lot v181 : site public 65, composants 3
 *   lot v182 : site public **0**
 *   lot v183 : tableau de bord **0** (164 convertis)
 *
 * `page publiée` n'est PAS une dette. Ces quatre éléments rendent la page DU
 * COMMERÇANT, avec SON thème — ses couleurs, ses polices, choisies par lui dans
 * l'éditeur. Leur imposer `.ui-btn`, c'est-à-dire l'or de QRowg, écraserait son
 * identité sur sa propre page. Le produit ne s'invite pas dans le rendu de ses
 * clients : c'est une exemption assumée, et le test ci-dessous vérifie qu'elle
 * porte bien sur des fichiers de rendu public, pas sur n'importe quoi.
 */
const PLAFONDS: Record<Zone, number> = {
  "site public": 0,
  "page publiée": 19,
  dashboard: 0,
  composants: 1,
  "banc d'essai": 1,
}

/**
 * Le seul reste des composants partagés, et pourquoi il reste.
 *
 * `Toast` porte une action à l'intérieur d'une notification : 5 px de
 * rembourrage vertical, dans une barre qui en fait une quarantaine en tout. La
 * plus petite taille de `.ui-btn` impose 38 px de haut — elle ferait éclater la
 * barre. Ce n'est pas de la dette, c'est un contrôle d'une autre échelle.
 *
 * La dérogation se vérifie : le fichier doit toujours être celui d'une
 * notification. Une dérogation qu'on n'interroge pas finit par mentir (v175).
 */
const DEROGATIONS: Record<string, string> = {
  "components/Toast.tsx":
    "Action d'une notification : 5 px de rembourrage dans une barre de 40 px. La plus petite taille de .ui-btn en impose 38 et ferait éclater la barre.",
}

describe("un seul vocabulaire de boutons", () => {
  it("le relevé n'est pas vide (sinon le cliquet ne retient rien)", () => {
    const { details } = boutonsFaitsMain()
    expect(details.length).toBeGreaterThan(0)
  })

  it("aucune zone ne remonte au-dessus de son plafond", () => {
    const { parZone } = boutonsFaitsMain()
    const trop = (Object.keys(PLAFONDS) as Zone[])
      .filter(z => parZone[z] > PLAFONDS[z])
      .map(z => `${z} : ${parZone[z]} > ${PLAFONDS[z]}`)
    expect(trop, "un bouton écrit à la main a été réintroduit — utilisez <Button> ou <ButtonLink>").toEqual([])
  })

  it("les plafonds collent au réel : un plafond trop haut ne protège rien", () => {
    const { parZone } = boutonsFaitsMain()
    const relaches = (Object.keys(PLAFONDS) as Zone[])
      .filter(z => parZone[z] < PLAFONDS[z])
      .map(z => `${z} : ${parZone[z]} réels pour un plafond à ${PLAFONDS[z]} — descendez le plafond`)
    // Un cliquet qu'on oublie de resserrer après une conversion laisse la place
    // libre pour en réintroduire un sans rien casser. Le test le réclame.
    expect(relaches).toEqual([])
  })

  it("le site public n'en contient plus aucun", () => {
    const { details } = boutonsFaitsMain()
    const restants = details.filter(d => d.zone === "site public")
    expect(restants.map(d => d.fichier), "tout ce qu'un visiteur voit doit parler le même vocabulaire").toEqual([])
  })

  it("chaque reste des composants porte une dérogation écrite, et elle est encore vraie", () => {
    const { details } = boutonsFaitsMain()
    for (const d of details.filter(x => x.zone === "composants")) {
      const raison = DEROGATIONS[d.fichier]
      expect(raison, `${d.fichier} : un bouton fait main sans raison écrite`).toBeTruthy()
      expect(raison.length).toBeGreaterThan(60)
    }
    // Et l'inverse : une dérogation qui ne vise plus rien doit partir.
    for (const f of Object.keys(DEROGATIONS)) {
      expect(details.some(d => d.fichier === f), `dérogation périmée : ${f} n'a plus de bouton fait main`).toBe(true)
    }
  })

  it("l'exemption des pages publiées porte bien sur le rendu du commerçant", () => {
    const { details } = boutonsFaitsMain()
    for (const d of details.filter(x => x.zone === "page publiée")) {
      // Un fichier de rendu public lit le thème du commerçant. S'il ne le lit
      // pas, il n'a rien à faire sous cette exemption.
      const src = fs.readFileSync(path.join(RACINE, d.fichier), "utf8")
      expect(/theme\.|FONT_B|MUTED|TEXT/.test(src), `${d.fichier} ne rend pas le thème du commerçant`).toBe(true)
    }
  })

  it("les deux composants ne peuvent pas diverger : ils lisent la même fonction", () => {
    const src = fs.readFileSync(path.join(RACINE, "components/ui/Button.tsx"), "utf8")
    expect(src).toContain("export function classesBouton(")
    // Ni Button ni ButtonLink ne compose sa liste de classes dans son coin.
    const appels = (src.match(/classesBouton\(/g) || []).length
    expect(appels, "Button et ButtonLink doivent tous deux passer par classesBouton()").toBeGreaterThanOrEqual(3)
    // Première version de cette assertion : « le fichier ne contient pas
    // `"ui-btn", \`ui-btn--` ». Elle échouait sur `classesBouton` elle-même,
    // qui compose évidemment cette liste — je vérifiais la présence du motif au
    // lieu de sa DUPLICATION. Ce qu'il faut interdire, c'est qu'un composant
    // assemble ses classes ailleurs que dans la fonction partagée.
    const horsFonction = src.slice(src.indexOf("export interface ButtonProps"))
    expect(horsFonction, "un composant assemble ses classes à côté de classesBouton()").not.toContain('"ui-btn"')
  })

  it("contre-épreuve : ni pastille, ni bouton-icône, ni interrupteur ne comptent", () => {
    const faux = (f: string) => f.endsWith("components/ui/Button.tsx")
      ? `<a href="/x" style={{ background: "#fff", padding: 8, borderRadius: "50%" }}>o</a>
         <button style={{ background: "#fff", padding: 8, width: 34, height: 34 }} />
         <button role="switch" style={{ background: "#fff", padding: 2, borderRadius: 16 }} />
         <a href="/y" style={{ background: "#fff", padding: "12px 20px", borderRadius: 10 }}>Vrai bouton</a>`
      : ""
    const { parZone } = boutonsFaitsMain(faux)
    // Sur les quatre, un seul est un bouton.
    expect(parZone["composants"]).toBe(1)
  })
})
