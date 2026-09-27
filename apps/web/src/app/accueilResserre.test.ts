import { describe, it, expect } from "vitest"
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { FAQ_ITEMS } from "./homeSections/faqData"

// Revue interne du 9 septembre (P1, accueil) : 10 030 px, 99 dégradés, 7 appels
// à l'action, deux sections qui se recouvraient, FAQ de 13 questions ouvertes.
// Mesuré après ce lot à 1440×900 : 7 475 px, 6 dégradés (héros + tuile QR finale).

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const home = lire("HomeClient.tsx")
const SECTIONS = readdirSync(join(__dirname, "homeSections")).filter(f => f.endsWith(".tsx")).sort()
const tout = home + SECTIONS.map(f => lire(`homeSections/${f}`)).join("\n")

describe("une seule section « Le système QRowg »", () => {
  it("« Comment ça marche » a fusionné dans Features : les 6 étapes y sont le sommaire des 6 cartes", () => {
    expect(existsSync(join(__dirname, "homeSections/HowItWorks.tsx"))).toBe(false)
    expect(home).not.toContain("HowItWorks")
    const f = lire("homeSections/Features.tsx")
    expect(f).toContain("export const HOW_STEPS")
    for (const t of ["Créer", "Connecter", "Personnaliser", "Imprimer", "Convertir", "Mesurer"]) expect(f).toContain(`title: "${t}"`)
    expect(f).toContain('<ol className="how-steps" aria-label="Les six étapes"')
    expect(f.indexOf('className="how-steps"')).toBeLessThan(f.indexOf('className="feat-grid"'))
    // six cartes de la même taille : plus de carte vedette ni de carte large
    expect(f).not.toContain("feat-big")
    expect(f).not.toContain("feat-wide")
    // aucune fonctionnalité perdue
    for (const tag of ["Éditeur simple", "QR dynamique", "Statistiques", "Conversion", "Modèles", "Marque professionnelle"]) expect(f).toContain(`tag: "${tag}"`)
  })
})

describe("FAQ repliée", () => {
  const faq = lire("homeSections/Faq.tsx")
  it("six questions visibles, les autres derrière un bouton qui dit combien il en cache", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThan(6)
    expect(faq).toContain("const VISIBLES = 6")
    expect(faq).toContain("const items = toutes ? FAQ_ITEMS : FAQ_ITEMS.slice(0, VISIBLES)")
    expect(faq).toContain('aria-expanded={toutes} aria-controls="faq-liste"')
    expect(faq).toContain("`Voir les ${cachees} autres questions`")
    expect(faq).toContain("{items.map((item, i) => {")
  })
})

describe("un seul registre visuel : l'aplat", () => {
  it("au plus 8 dégradés dans le code de l'accueil (héros et tuile QR finale)", () => {
    expect((tout.match(/(linear|radial)-gradient/g) ?? []).length).toBeLessThanOrEqual(8)
  })
  it("plus aucun bouton en dégradé d'or : l'accent à plat, l'encre sur accent", () => {
    expect(tout).not.toMatch(/linear-gradient\(90deg, ?#C9A84C/)
    expect(tout).not.toContain("linear-gradient(135deg, #EBCE72, #C9A84C)")
    // Cette garde citait le style EN LIGNE du bouton. Elle protégeait une
    // intention juste — l'accent à plat, jamais de dégradé — mais en la
    // clouant à une écriture précise, elle INTERDISAIT de l'unifier : le lot
    // v181 ne pouvait pas passer ce bouton sur la primitive sans la casser.
    // Une garde qui cite un style en ligne empêche de retirer le style en ligne.
    // Elle demande maintenant ce qu'elle voulait : le bouton vient du produit,
    // et la primitive est bien un aplat.
    expect(lire("../components/EnTeteSite.tsx")).toContain("<ButtonLink")
    const css = lire("globals.css")
    // L'apparence du bouton primaire n'a plus qu'une source : `.da-btn-primary`.
    // La primitive pose cette classe au lieu de redéclarer la sienne (lot v184),
    // donc c'est là, et nulle part ailleurs, que la règle se vérifie.
    const bloc = css.match(/\n\.da-btn-primary \{[^}]*\}/)?.[0] ?? ""
    expect(bloc, "règle .da-btn-primary introuvable").not.toBe("")
    expect(bloc).toContain("background:var(--accent)")
    expect(bloc).not.toMatch(/background:\s*(linear|radial)-gradient/)
    expect(lire("../components/EnTeteSite.tsx")).not.toContain("gradient")
  })
  it("aucun séparateur décoratif ne marque les coutures", () => {
    // Cette garde exigeait que le composant `SectionSeam` EXISTE, en se donnant
    // pour sujet — son propre titre le disait — qu'il n'ait « ni faisceau ni
    // halo ». Le lot v189 l'a retiré : la couture ne se dessine plus du tout.
    //
    // Six fois sur l'accueil, un trait horizontal portait au centre le
    // « finder pattern » d'un QR. Ce n'était ni une information ni une
    // séparation nécessaire — l'espace suffit à séparer deux sections — mais un
    // ornement, répété à intervalle régulier. Répété, c'est ce qui fait lire une
    // page comme un gabarit plutôt que comme une page.
    //
    // Épingler l'existence du composant interdisait de le retirer. Recalée sur
    // l'intention : pas de couture dessinée, et surtout pas animée.
    expect(home).not.toContain("seam-beam")
    expect(lire("globals.css")).not.toContain("seamScan")
    expect(home, "le séparateur décoratif est revenu").not.toContain("SectionSeam")
  })
  it("titres de section à 44 px maxi, sous le titre du héros (52)", () => {
    for (const f of SECTIONS) expect(lire(`homeSections/${f}`), f).not.toMatch(/clamp\(28px, ?4vw, ?52px\)/)
    expect(home).toContain('fontSize: "clamp(30px, 3.4vw, 52px)"')
  })
})

describe("un seul vocabulaire d'appel à l'action", () => {
  it("chaque section n'en porte qu'un, et il dit Composer ma page · Choisir un modèle · Créer mon QR code", () => {
    expect(tout).not.toContain("Voir mes analytics")
    expect(tout).not.toContain("Voir la démo")
    // Le second bouton du héros a cessé d'être un outil annexe : depuis que
    // /examples ouvre 34 pages réelles, il mène à la preuve (lot v65).
    expect(home).toContain("Voir une page en vrai")
    // Ancrée sur la destination, plus sur le balisage : c'est le lien qui compte.
    expect(home).toMatch(/href="\/examples"/)
    const uc = lire("homeSections/UseCases.tsx")
    expect(uc.match(/cta: "[^"]+"/g)!.every(l => l.startsWith('cta: "Composer ma page '))).toBe(true)
    expect(uc).toContain('uc.cta.replace(/^Composer ma page /i, "")')
    // la section fusionnée n'ajoute pas un appel à l'action sous le héros
    expect(lire("homeSections/Features.tsx")).not.toMatch(/<a href="\/creer"/)
  })
  it("français partout dans la galerie de l'accueil", () => {
    const t = lire("homeSections/Templates.tsx")
    expect(t).not.toContain("Freelance Pro")
    expect(t).not.toContain("Food & Beverage")
    expect(lire("homeSections/UseCases.tsx")).not.toContain("ce template")
  })
})

describe("Fonctionnalités, alignée sur l'accueil", () => {
  const f = lire("features/page.tsx")
  it("même en-tête partagé, chaque entrée mène quelque part, et la courante est marquée", () => {
    // Cette garde citait les CINQ libellés et la ligne exacte de `hrefDe`. Elle
    // ne vérifiait donc pas que la navigation FONCTIONNE — au lot v190, l'entrée
    // « Modèles » pointait vers `#templates`, une section retirée de l'accueil :
    // la garde serait restée verte sur un lien mort.
    //
    // Recalée sur ce qui compte : chaque entrée vise soit une page (`href`),
    // soit une ancre qui EXISTE réellement dans une section rendue.
    const e = lire("../components/EnTeteSite.tsx")
    expect(f).toContain('<EnTeteSite page="features" />')
    expect(f).not.toContain('href="/#pricing" style={{color:MUT')

    const entrees = [...e.matchAll(/\{\s*label: "([^"]+)",\s*id: "([^"]+)"\s*(?:,\s*href: "([^"]+)")?\s*\}/g)]
      .map(m => ({ label: m[1], id: m[2], href: m[3] as string | undefined }))
    expect(entrees.length, "plus aucune entrée de navigation lue — l'extraction est aveugle").toBeGreaterThanOrEqual(4)

    // Les ancres des sections RÉELLEMENT RENDUES, pas de tous les fichiers du
    // dossier. Première version : elle lisait tout `homeSections/`. Or le
    // produit y conserve des sections retirées de l'accueil — `Templates.tsx`
    // porte toujours `id="templates"` sans être rendu. La mutation qui remettait
    // « Modèles » sur cette ancre morte est donc passée au VERT : la garde
    // vérifiait la présence dans le code, pas dans la page.
    const home = lire("HomeClient.tsx")
    const rendues = new Set([...home.matchAll(/<([A-Z]\w+)\s*\/>/g)].map(m => m[1]))
    const fichiersRendus = SECTIONS.filter(f => {
      const src = lire("homeSections/" + f)
      return [...src.matchAll(/export function (\w+)/g)].some(m => rendues.has(m[1]))
    })
    expect(fichiersRendus.length, "aucune section rendue trouvée — l'extraction est aveugle").toBeGreaterThan(3)
    const ancres = new Set<string>()
    for (const m of home.matchAll(/id="([a-z-]+)"/g)) ancres.add(m[1])
    for (const f of fichiersRendus) {
      for (const m of lire("homeSections/" + f).matchAll(/id="([a-z-]+)"/g)) ancres.add(m[1])
    }
    const morts = entrees
      .filter(x => !x.href && !ancres.has(x.id))
      .map(x => x.label + " → #" + x.id + " (aucune section ne porte cet identifiant)")
    expect(morts, "une entrée de navigation ne mène nulle part").toEqual([])

    expect(e).toContain("const isAct=accueil ? active===id : page===id")
  })
  it("un seul vocabulaire pour ses six boutons, à plat", () => {
    for (const l of ["Créer gratuitement", "Ouvrir l'éditeur", "Voir mes statistiques", "Créer mon QRowg gratuit", "Essayer gratuitement"]) expect(f).not.toContain(l)
    expect(f).toContain('page:    { label: "Composer ma page — sans compte", href: () => creerUrl() }')
    expect(f).toContain('qr:      { label: "Créer mon QR code",              href: () => "/generateur-qr-code" }')
    expect(f).toContain('modele:  { label: "Choisir un modèle",              href: () => creerUrl() }')
    expect((f.match(/<CtaInline/g) ?? []).length).toBe(6)
    expect(f).not.toContain("gradient")
  })
  it("« Freelance », pas « Freelance Pro » ; vouvoiement", () => {
    expect(f).not.toContain("Freelance Pro")
    expect(f).not.toContain("Commence gratuitement.")
    expect(f).toContain("Commencez gratuitement.")
  })
})
