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
/** Ce qui n'en est pas un : pastille, bouton-icône à taille fixe, interrupteur. */
const ROND = /borderRadius\s*:\s*["']50%["']/
const TAILLE_FIXE = /\bwidth\s*:\s*\d/
const INTERRUPTEUR = /role\s*=\s*["']switch["']/

export type Zone = "site public" | "page publiée" | "dashboard" | "composants"

function zoneDe(rel: string): Zone {
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
    const re = /<(button|a|Link)\s([\s\S]{0,900}?)>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      const attrs = m[2]
      if (!/style=\{\{/.test(attrs)) continue
      if (!VISUEL.test(attrs) || !FORME.test(attrs)) continue
      if (ROND.test(attrs) || TAILLE_FIXE.test(attrs) || INTERRUPTEUR.test(attrs)) continue
      const z = zoneDe(rel)
      parZone[z]++
      details.push({ fichier: rel, zone: z })
    }
  }
  return { parZone, details }
}

/**
 * L'état réel au lot v181. Ces nombres ne remontent jamais.
 *
 * Point de départ, avant ce lot : site public 65, composants 3.
 * Le site public et les composants descendront à zéro dans les lots suivants ;
 * le tableau de bord vient après, il n'est pas sur le chemin du lancement.
 */
const PLAFONDS: Record<Zone, number> = {
  "site public": 49,
  "page publiée": 5,
  dashboard: 84,
  composants: 3,
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

  it("la page d'accueil et l'en-tête n'en contiennent plus aucun", () => {
    const { details } = boutonsFaitsMain()
    const restants = details
      .map(d => d.fichier)
      .filter(f => f === "app/HomeClient.tsx" || f === "app/homeSectionsRetirees.tsx"
        || f.startsWith("app/homeSections/") || f === "components/EnTeteSite.tsx")
    expect(restants, "le chemin du lancement doit être entièrement unifié").toEqual([])
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
