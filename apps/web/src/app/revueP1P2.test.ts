import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PLAN_LIST, GROUPES_PERKS } from "@/lib/plans"

// Revue du 9 septembre, P1/P2 : tarification lisible pour un visiteur, accueil
// plus dense avec un seul vocabulaire d'appel à l'action et un seul logo, page
// Fonctionnalités alignée, finitions (« bientôt » non interactifs, focus visible).

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

describe("tarification", () => {
  const up = lire("upgrade/page.tsx")
  it("un visiteur sans compte reçoit la navigation publique, un connecté son retour au tableau de bord", () => {
    expect(up).toContain("setSignedIn(!!user)")
    expect(up).toContain("{signedIn === false ? (")
    expect(up).toContain('<Link href="/" aria-label="QRowg — accueil"')
    expect(up).toContain("Retour au tableau de bord")
    expect(up).not.toContain("Retour au dashboard")
    // et personne ne lui dit que le plan Gratuit est « actuel » : il n'a pas de plan.
    expect(up).toContain("const isCurrentPlan = signedIn === true && currentPlan === plan.id")
  })
  it("en annuel, le total est écrit tel qu'il sera facturé : « 12,42 €/mois, facturé 149 €/an »", () => {
    // Il l'était… en le RECALCULANT (12,42 × 12 = 149,04, affiché « 149 » ici et
    // « 149,04 » sur l'accueil). Le montant facturé est maintenant lu, pas refait
    // — voir lib/tarifs.ts et Q06.
    expect(up).toContain("{price} €/mois, facturé {fmtEuros(plan.totalAnnuel)} €/an")
    expect(up).not.toContain("plan.rawAnnual * 12")
  })
  it("les avantages sont regroupés par thème, dans le même ordre sur chaque carte", () => {
    expect(up).toContain("{GROUPES_PERKS.map(groupe => {")
    for (const p of PLAN_LIST) for (const perk of p.perks) expect(GROUPES_PERKS, `${p.id} : ${perk.text}`).toContain(perk.groupe)
  })
  it("capitalisation uniforme : chaque avantage commence par une majuscule ou un chiffre", () => {
    for (const p of PLAN_LIST) for (const perk of p.perks) expect(perk.text, perk.text).toMatch(/^[A-ZÀ-Ý0-9]/)
  })
})

describe("accueil", () => {
  const home = lire("HomeClient.tsx")
  it("sections resserrées : 72 px de haut au lieu de 100 (56 au lieu de 72 sur mobile)", () => {
    for (const f of ["Analytics", "Faq", "Pricing", "QRStudioLive", "Templates", "UseCases", "Features"]) {
      const s = lire(`homeSections/${f}.tsx`)
      expect(s, f).not.toMatch(/padding: ?"100px 48px"/)
      expect(s, f).not.toMatch(/padding: ?72px 2[04]px ?!important/)
    }
    // Le héros ne cite plus une valeur exacte : il ne doit pas revenir à
    // 100 px, ni reprendre la hauteur de l'écran (lot v181 — un héros en
    // `100vh` pousse toute la page hors du premier regard).
    expect(home).not.toMatch(/padding: ?"100px/)
    expect(home).not.toContain('minHeight: "min(100vh')
  })
  it("un seul vocabulaire d'appel à l'action : Composer ma page · Choisir un modèle · Créer mon QR code", () => {
    expect(lire("homeSections/Features.tsx")).not.toContain("Essayer gratuitement")
    expect(lire("homeSections/Pricing.tsx")).not.toContain("Commencer gratuitement")
    expect(lire("homeSections/QRStudioLive.tsx")).toContain("Créer mon QR code")
    expect(lire("homeSections/Templates.tsx")).toContain("Choisir un modèle")
    expect(home).not.toContain('className="fl">Créer une page</Link>')
  })
  it("un seul logo : QrowgLogo sur l'accueil, dans la coquille, l'éditeur et la page Fonctionnalités", () => {
    // L'en-tête public est partagé (components/EnTeteSite.tsx) : l'accueil et
    // Fonctionnalités le montent, il porte le logo.
    expect(lire("../components/EnTeteSite.tsx")).toContain("<QrowgLogo size={22} />")
    expect(home).toContain("<EnTeteSite />")
    expect(lire("features/page.tsx")).toContain('<EnTeteSite page="features" />')
    // La coquille emploie la variante « wordmark » du MÊME composant depuis la
    // refonte du 28 septembre : « qrowg » d'un seul tenant, la capsule « QR » se
    // lisant comme deux morceaux à côté d'un fil d'Ariane. L'invariant tenu ici est
    // qu'il n'existe qu'un seul composant de logo, et que tout le monde le monte.
    expect(lire("dashboard/DashboardShell.tsx")).toContain('<QrowgLogo size={28} variant="wordmark" />')
    expect(lire("dashboard/builder/BuilderV4.tsx")).toContain("<QrowgLogo size={16} />")
    expect(lire("features/page.tsx")).not.toContain('fontFamily:"Fraunces,serif",fontSize:20,color:G,fontWeight:700}}>QRowg')
    const logo = lire("../components/QrowgLogo.tsx")
    expect(logo).not.toContain("linear-gradient")
    expect(logo).not.toContain("boxShadow")
  })
})

describe("fonctionnalités", () => {
  const f = lire("features/page.tsx")
  it("les surtitres ne ressemblent plus à des filtres (pas de contour ni de fond)", () => {
    const chip = f.slice(f.indexOf("function Chip("), f.indexOf("}\n", f.indexOf("function Chip(")) + 2)
    expect(chip).not.toContain("border")
    expect(chip).not.toContain("background")
  })
  it("marges resserrées et « Modèles » plutôt que « Templates »", () => {
    expect(f).not.toContain('padding:"100px')
    expect(f).toContain('<Chip label="Modèles" />')
  })
})

describe("finitions", () => {
  it("le pied de page ne promet rien que le produit n'a pas", () => {
    const home = lire("HomeClient.tsx")
    // Cette garde tenait jusqu'ici que « Blog / Roadmap / Changelog — bientôt »
    // ne soient pas des liens. Audit UX v2 (22 nov.) : une page « bientôt » est
    // une promesse sans page — retirées, avec le feu vert « Tous les systèmes
    // opérationnels » écrit en dur (vert même en panne) et le « v1.0.0 » décoratif.
    expect(home, "un « (bientôt) » est revenu dans le pied de page").not.toContain("bientôt disponible")
    expect(home, "un état de service écrit en dur est revenu").not.toContain("Tous les systèmes opérationnels")
    expect(home, "un numéro de version décoratif est revenu").not.toMatch(/>\s*v\d+\.\d+\.\d+\s*</)
    // Une destination, un lien : « Exemples » doublait « Modèles » (/examples).
    const pied = home.slice(home.lastIndexOf("<footer"))
    expect(pied.match(/href="\/examples"/g)?.length ?? 0, "deux liens du pied de page vers /examples").toBeLessThanOrEqual(1)
  })
  it("aucune promesse de vitesse chiffrée sans mesure", () => {
    // « en moins d'une seconde après le scan, même en 4G » : mesuré le 21 nov.,
    // 0,3-0,45 s à chaud mais 1,2-1,5 s au premier scan après une pause, côté
    // serveur seulement. Une promesse chiffrée ne revient qu'avec sa mesure.
    expect(lire("qr-code/verticals.ts")).not.toMatch(/moins d.une seconde/)
  })
  it("focus clavier visible partout (règle globale) et sur la vignette de modèle", () => {
    const css = lire("globals.css")
    // Sur une machine Windows, git rend le fichier en CRLF dès qu'il repasse
    // par l'index : la règle est intacte, c'est la garde qui ne se reconnaissait
    // plus. Ce qu'elle tient ne dépend pas des fins de ligne.
    expect(css).toMatch(/^:focus-visible \{\r?\n  outline: 2px solid/m)
    expect(css).toContain(".tpl-vignette:focus-visible")
  })
})
