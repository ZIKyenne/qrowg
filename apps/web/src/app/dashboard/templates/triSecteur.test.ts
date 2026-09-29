import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PAGE_TEMPLATES } from "../builder/page-templates"
import { METIER_BY_USAGE } from "../../creer/entry"
import { appartientAuSecteur, type ModeleClassable } from "./classementDesModeles"

// Une page métier comme /qr-code/salon envoie vers /creer?metier=Beaute. Le tri
// ne connaissait que des IDENTIFIANTS de modèles, alors que les modèles partagés
// portent le NOM DE LEUR GROUPE comme catégorie. Aucun ne remontait : le premier
// écran d'un visiteur venu du référencement était « Salon Beauté », un modèle
// payant, avec son cadenas — pendant que cinq modèles beauté gratuits dormaient
// plus bas dans la liste.
//
// Ce fichier lisait la carte « secteur → clés » dans le JSX de la galerie, à
// l'expression régulière. Elle n'y est plus : l'appartenance vit dans
// `classementDesModeles`, et ce test l'interroge directement — c'est ce qui tourne
// dans le navigateur, pas une copie du texte.
const src = readFileSync(join(__dirname, "./page.tsx"), "utf8")

const CATALOGUE: ModeleClassable[] = [
  ...[...src.matchAll(/\{ id: "([a-z_]+)", name: "([^"]+)", variante: "([^"]+)", category: "([^"]+)"/g)]
    .map(m => ({ id: m[1], name: m[2], variante: m[3], category: m[4] })),
  ...PAGE_TEMPLATES.map(t => ({ id: t.key, name: t.label, category: t.group })),
]

const dansLeSecteur = (s: string) => CATALOGUE.filter(t => appartientAuSecteur(t, s))

describe("un visiteur venu d'une page métier voit des modèles de son métier", () => {
  it("chaque secteur visé par une page SEO remonte au moins un modèle PARTAGÉ", () => {
    // Le point de la panne : les modèles partagés (34 sur 48) ne remontaient pas.
    const muets: string[] = []
    for (const secteur of new Set(Object.values(METIER_BY_USAGE))) {
      const partages = PAGE_TEMPLATES.filter(t => appartientAuSecteur({ id: t.key, category: t.group }, secteur))
      if (partages.length === 0) muets.push(secteur)
    }
    expect(muets, "ces secteurs ne peuvent remonter aucun modèle partagé").toEqual([])
  })

  it("les secteurs des pages métier les plus visitées montrent plusieurs modèles", () => {
    for (const s of ["Restaurant", "Bar", "Cafe", "Beaute", "Sante", "Ecommerce", "Evenement", "Immobilier"]) {
      expect(dansLeSecteur(s).length, `secteur ${s} trop pauvre`).toBeGreaterThan(1)
    }
  })

  it("un secteur ne remonte PAS les modèles d'un autre métier", () => {
    // Contre-épreuve : sans elle, « tout appartient à tout » passerait le test.
    const restaurants = dansLeSecteur("Restaurant").map(t => t.id)
    for (const etranger of ["beaute_coiffure", "immo_agence", "biz_startup", "asso_ong"]) {
      expect(restaurants, `${etranger} n'a rien à faire dans Restaurant`).not.toContain(etranger)
    }
    const beaute = dansLeSecteur("Beaute").map(t => t.id)
    expect(beaute).not.toContain("resto_bistrot")
  })

  it("aucun secteur ne ramène tout le catalogue", () => {
    for (const s of ["Restaurant", "Beaute", "Immobilier", "SaaS"]) {
      expect(dansLeSecteur(s).length, `secteur ${s} ne filtre rien`).toBeLessThan(CATALOGUE.length)
    }
  })
})

describe("les modèles utilisables passent devant les modèles verrouillés", () => {
  it("le tri sépare bien ouverts et fermés à l'intérieur du secteur", () => {
    const bloc = src.slice(src.indexOf("const ordonnes"), src.indexOf("const ordonnes") + 900)
    expect(bloc).toContain("canUse(t.plan)")
    expect(bloc, "l'ordre doit être : ouverts, fermés, puis le reste").toMatch(/\[\.\.\.ouverts, \.\.\.fermes, \.\.\.dehors\]/)
  })

  it("le tri se recalcule quand le plan change", () => {
    const bloc = src.slice(src.indexOf("const ordonnes"), src.indexOf("const ordonnes") + 1000)
    expect(bloc, "userPlan absent des dépendances : un changement de plan ne réordonnerait rien").toMatch(/\[filtered, fromEntry, userPlan, accueil\]/)
  })

  it("les modèles payants restent visibles, seulement plus bas", () => {
    // On ne cache rien : un modèle verrouillé reste une vitrine légitime.
    const bloc = src.slice(src.indexOf("const ordonnes"), src.indexOf("const ordonnes") + 900)
    expect(bloc).toContain("...fermes")
  })

  it("le tri d'arrivée et le filtre jugent avec LE MÊME prédicat", () => {
    // Deux règles d'appartenance, c'était la panne : le tri acceptait les noms de
    // groupe, le filtre non.
    expect(src).toContain("appartientAuSecteur(t, fromEntry)")
    expect(src).toContain("appartientAuSecteur(t, activeMetier)")
    expect(src, "plus aucune carte secteur → clés écrite dans le JSX").not.toContain("CATEGORY_MAP")
  })
})
