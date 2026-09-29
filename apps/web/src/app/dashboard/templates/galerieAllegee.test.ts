import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PAGE_TEMPLATES } from "../builder/page-templates"
import { nomsEnDouble, estHomonyme, type ModeleClassable } from "./classementDesModeles"

// Revue du 9 septembre (P0, Choix d'un modèle) : cartes réduites à l'essentiel,
// 8 modèles recommandés d'abord, quasi-doublons clarifiés, nom du projet avant
// l'apparence dans la fenêtre de création. Aucun modèle retiré.

const src = readFileSync(join(__dirname, "page.tsx"), "utf8")
const modal = readFileSync(join(__dirname, "TemplatePreviewModal.tsx"), "utf8")
const carte = src.slice(src.indexOf('className="tpl-card"'), src.indexOf("</article>"))

// Le catalogue tel que la galerie l'assemble : les 14 modèles historiques
// (relus dans le fichier) et les modèles partagés, variante comprise.
const AMBIANCE = (desc: string) => (desc.includes(" — ") ? desc.split(" — ").slice(1).join(" — ") : undefined)
const CATALOGUE: ModeleClassable[] = [
  ...[...src.matchAll(/\{ id: "([a-z_]+)", name: "([^"]+)", variante: "([^"]+)", category: "([^"]+)"/g)]
    .map(m => ({ id: m[1], name: m[2], variante: m[3], category: m[4] })),
  ...PAGE_TEMPLATES.map(t => ({ id: t.key, name: t.label, category: t.group, variante: AMBIANCE(t.desc) ?? t.theme.name })),
]

describe("carte allégée", () => {
  it("porte le plan (vignette), le nom, une phrase et les actions — rien d'autre", () => {
    expect(carte).toContain("{template.name}</h2>")
    expect(carte).toContain("{template.description}</p>")
    expect(carte).toContain("Aperçu de ${template.name}")
    for (const parti of ["template.highlight", "template.tags", "SETUP_TIME", "blockCount} blocs", "categorieLue(template.category)", "tier"]) {
      expect(carte, parti).not.toContain(parti)
    }
  })
  it("l'accroche, les blocs, la durée et les étiquettes vivent dans l'aperçu", () => {
    expect(modal).toContain("{template.highlight}</p>")
    expect(modal).toContain('label: "Blocs inclus"')
    // « setup » a quitté l'interface avec le lot v61 : on lit « Prêt en ».
    expect(modal).toContain('label: "Prêt en"')
    expect(modal).toContain("{template.tags.map(")
  })
  it("plus de popularité inventée (hachage de l'identifiant) nulle part", () => {
    expect(src).not.toContain("popTier")
    expect(src).not.toContain('"Populaire"')
    expect(src).not.toContain('"Tendance"')
  })
})

describe("recommandés d'abord", () => {
  it("8 modèles gratuits, un par grand métier, puis « Voir les N autres modèles »", () => {
    expect(src).toContain('const RECOMMANDES = ["biz_freelance", "resto_bistrot", "beaute_coiffure", "coach_vie", "creatif_artiste", "immo_agence", "shop_boutique", "event_soiree"]')
    expect(src).toContain('const accueil = !fromEntry && activeMetier === "Tous" && activePlan === "all" && !search.trim()')
    expect(src).toContain("const affiches = accueil && !voirTout ? ordonnes.slice(0, RECOMMANDES.length) : ordonnes")
    expect(src).toContain("Voir les {autres} autres modèles")
    expect(src).toContain('"Pour bien démarrer"')
    expect(src).toContain("{affiches.map((template: any, idx: number) => {")
  })
  it("un filtre, une recherche ou une arrivée par secteur montrent tout, comme avant", () => {
    expect(src).toContain("if (!accueil) return filtered")
  })
})

describe("quasi-doublons clarifiés", () => {
  it("les 14 modèles historiques portent une variante d'ambiance, affichée sur la carte et dans l'aperçu", () => {
    const n = (src.match(/variante: "/g) ?? []).length
    expect(n).toBe(14)
    expect(carte).toContain("{template.variante}</span>")
    expect(modal).toContain("{template.variante}</span>")
  })
  it("deux modèles homonymes (deux « Salon de coiffure ») portent chacun une variante qui les sépare", () => {
    // Ce test lisait une expression du fichier. Il lit maintenant le résultat :
    // les vingt modèles ÉCRITS n'ont pas de suffixe d'ambiance dans leur
    // description, et `beaute_coiffure` s'affichait donc SANS variante, juste
    // au-dessus de `studio_coiffure` (« rose nuit ») — même nom, rien pour
    // les distinguer. À défaut de suffixe, le nom du thème fait la variante.
    const doubles = nomsEnDouble(CATALOGUE)
    const homonymes = CATALOGUE.filter(t => estHomonyme(t, doubles))
    expect(homonymes.length, "aucun homonyme : le test ne vérifie plus rien").toBeGreaterThan(0)
    const sans = homonymes.filter(t => !(t.variante || "").trim()).map(t => t.id)
    expect(sans, "homonymes sans variante affichable").toEqual([])
    const coiffure = CATALOGUE.filter(t => t.name === "Salon de coiffure")
    expect(coiffure).toHaveLength(2)
    expect(new Set(coiffure.map(t => t.variante)).size, "deux variantes identiques ne distinguent rien").toBe(2)
  })
  it("la variante s'affiche sur la carte, y compris sur mobile quand le nom est partagé", () => {
    expect(carte).toContain("{template.variante}</span>")
    expect(carte).toContain("isMobile && homonyme && template.variante")
  })
  it("« Freelance Pro » ne dit plus « Pro » (ce n'est pas un plan) ; « Personal Brand » est traduit", () => {
    expect(src).not.toContain('name: "Freelance Pro"')
    expect(src).toContain('name: "Freelance", variante: "noir & or"')
    expect(src).not.toContain("Personal Brand")
    expect(src).toContain('name: "Influenceur & Marque personnelle"')
  })
})

describe("fenêtre de création : le nom d'abord", () => {
  it("le champ « Nom du projet » précède le bloc Apparence", () => {
    const nom = src.indexOf("{/* Nom */}")
    const apparence = src.indexOf("{/* Apparence, APRÈS le nom")
    const boutons = src.indexOf("{/* Boutons */}")
    expect(nom).toBeGreaterThan(0)
    expect(apparence).toBeGreaterThan(nom)
    expect(boutons).toBeGreaterThan(apparence)
  })
})
