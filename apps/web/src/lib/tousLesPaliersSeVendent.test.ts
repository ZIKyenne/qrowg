import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { PLAN_LIST } from "./plans"

// Un palier affiché est un palier qu'on peut acheter — garde de classe.
//
// ── Ce qui est arrivé, et que 6 875 tests n'ont pas vu ────────────────────
//
// Le lot v220 a remis « Starter » (4,90 €) dans `PLAN_LIST`. Trois endroits
// devaient suivre ; un seul l'a fait.
//
//   · la grille de l'accueil  → mise à jour ✔
//   · l'écran /upgrade        → OUBLIÉ : `PLAN_UI.starter` n'existait pas
//   · la route de paiement    → OUBLIÉ : `PRICE_IDS.starter` n'existait pas
//
// Conséquences, constatées sur la page réelle le 13 novembre :
//
//   1. `...undefined` ne lève pas. La carte se construisait sans libellé, sans
//      icône et sans identifiant de prix.
//   2. Le libellé manquant tombait sur la valeur par défaut de
//      `SubscribeButton` — qui était « Passer à Business ». **La carte à
//      4,90 € vendait le plan à 29,90 €.**
//   3. Le clic envoyait `plan: "starter"` à une route qui l'ignorait :
//      « Plan invalide », HTTP 400.
//
// Deux jours en production, sur l'écran qui encaisse l'argent, et la suite
// était verte : aucun test ne regardait cette page.
//
// ── Pourquoi CETTE garde, et pas seulement un type ────────────────────────
//
// `PLAN_UI` est désormais typé `Record<PlanId, …>`, donc TypeScript réclame
// l'entrée. Mais la route de paiement, elle, lit des variables
// d'environnement : ses tables sont des `Record<string, string>` et le
// compilateur n'a aucun moyen de savoir qu'il manque un palier. C'est ce que ce
// fichier vérifie — en lisant les sources, comme le dépôt le fait ailleurs.
//
// Il ne lit que QUATRE fichiers nommés : aucune marche d'arborescence.

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Les clés d'un objet littéral nommé, lues dans une source. */
function clesDeLObjet(source: string, nom: string): string[] {
  const i = source.indexOf(`const ${nom}`)
  if (i < 0) return []
  const debut = source.indexOf("{", i)
  if (debut < 0) return []
  // Équilibrage des accolades : un objet contient des sous-objets.
  let profondeur = 0, fin = debut
  for (let k = debut; k < source.length; k++) {
    if (source[k] === "{") profondeur++
    else if (source[k] === "}") { profondeur--; if (profondeur === 0) { fin = k; break } }
  }
  const corps = source.slice(debut + 1, fin)
  // Seulement les clés de PREMIER niveau : on retire d'abord les sous-objets.
  const platAplati = corps.replace(/\{[^{}]*\}/g, "''")
  return [...platAplati.matchAll(/(?:^|,)\s*([a-zA-Z_][\w]*)\s*:/g)].map(m => m[1])
}

/** Les paliers PAYANTS : ceux qu'un commerçant peut acheter. */
const PAYANTS = PLAN_LIST.filter(p => p.priceMonthly > 0).map(p => p.id)

describe("tout palier payant est achetable", () => {
  it("il y a bien des paliers payants à vérifier", () => {
    // Sans ça, la garde passerait au vert en ne vérifiant rien le jour où la
    // grille change de forme.
    expect(PAYANTS.length, "aucun palier payant trouvé : la garde ne garde plus rien").toBeGreaterThanOrEqual(2)
  })

  it("chacun a son habillage sur l'écran /upgrade", () => {
    const cles = clesDeLObjet(lire("app/upgrade/page.tsx"), "PLAN_UI")
    expect(cles.length, "PLAN_UI introuvable ou illisible").toBeGreaterThan(0)
    for (const id of PAYANTS) {
      expect(cles, `/upgrade : le palier « ${id} » n'a pas d'entrée dans PLAN_UI — sa carte s'affichera sans libellé ni prix`)
        .toContain(id)
    }
  })

  it("chacun a son prix mensuel dans la route de paiement", () => {
    const cles = clesDeLObjet(lire("app/api/stripe/checkout/route.ts"), "PRICE_IDS")
    expect(cles.length, "PRICE_IDS introuvable").toBeGreaterThan(0)
    for (const id of PAYANTS) {
      expect(cles, `paiement : le palier « ${id} » répondra « Plan invalide »`).toContain(id)
    }
  })

  it("chacun a son prix annuel, puisque la grille propose l'annuel", () => {
    const cles = clesDeLObjet(lire("app/api/stripe/checkout/route.ts"), "ANNUAL_PRICE_IDS")
    for (const id of PAYANTS) {
      expect(cles, `paiement annuel : « ${id} » retomberait silencieusement sur le mensuel`).toContain(id)
    }
  })

  it("chacun a son appel à l'action sur la grille de l'accueil", () => {
    const src = lire("app/homeSections/Pricing.tsx")
    for (const id of PAYANTS) {
      expect(src, `accueil : le palier « ${id} » n'a pas de bouton`).toMatch(new RegExp(`\\n\\s*${id}\\s*:`))
    }
  })

  it("chaque palier payant lit une variable de prix qui porte son nom", () => {
    // Le nom de la variable compte autant que la clé : `.env.local` définissait
    // `STRIPE_PRO_PRICE_ID` quand le code lit `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`.
    // Une variable bien remplie sous le mauvais nom ne sert à rien.
    const src = lire("app/api/stripe/checkout/route.ts")
    for (const id of PAYANTS) {
      const attendu = `NEXT_PUBLIC_STRIPE_${id.toUpperCase()}_PRICE_ID`
      expect(src, `la route ne lit pas ${attendu}`).toContain(attendu)
    }
  })
})

describe("le bouton de paiement ne choisit jamais le plan à notre place", () => {
  it("son libellé est obligatoire", () => {
    // Il était optionnel, avec « Passer à Business » pour défaut : une carte qui
    // oubliait de le passer vendait le plan le plus cher en silence.
    const src = lire("components/SubscribeButton.tsx")
    expect(src, "le libellé est redevenu optionnel").toContain("label: string;")
    // Le motif regarde ce qui PRÉCÈDE « label » : `aria-label="…"` en contient
    // un, et la première version de cette garde se dénonçait elle-même dessus.
    expect(src, "un défaut est réapparu").not.toMatch(/(?<![\w-])label\s*=\s*"/)
  })

  it("et aucun nom de plan n'est écrit en dur dans ce composant", () => {
    // Un composant générique qui cite « Business » finira par le vendre.
    const src = lire("components/SubscribeButton.tsx")
    const codeSeul = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "")
    for (const nom of ["Business", "Établissement", "Starter"]) {
      expect(codeSeul, `« ${nom} » est écrit en dur dans SubscribeButton`).not.toContain(nom)
    }
  })
})
