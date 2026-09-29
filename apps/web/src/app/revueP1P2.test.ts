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
    expect(up).toContain("{price} €/mois, facturé {(plan.rawAnnual * 12).toLocaleString(\"fr-FR\", { maximumFractionDigits: 0 })} €/an")
    expect(up).not.toContain("Soit {(plan.rawAnnual * 12)")
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
  it("« Blog / Roadmap / Changelog — bientôt » ne sont pas des liens et ne réagissent pas au pointeur", () => {
    const home = lire("HomeClient.tsx")
    // Cette garde citait la couleur exacte de `.fl-soon`, `rgba(188,182,166,0.35)`.
    // Or son sujet — son propre titre le dit — est que ces trois mots NE SOIENT
    // PAS des liens et NE RÉAGISSENT PAS au pointeur. La couleur était incidente,
    // et l'épingler interdisait de la corriger : mesurée au navigateur le
    // 27 septembre, elle donnait 2,1:1. Recalée sur l'intention.
    expect(home, "« bientôt » a perdu son curseur inerte").toMatch(/\.fl-soon \{[^}]*cursor:default/)
    expect(home, "« bientôt » redevient cliquable").toMatch(/\.fl-soon \{[^}]*pointer-events:none/)
    // Et la distinction avec un vrai lien ne repose plus sur la seule pâleur :
    // elle est écrite en toutes lettres.
    // Deuxième recalage (lot v196). La garde citait la valeur exacte du
    // `content`, espace de tête compris — elle interdisait donc de corriger le
    // défaut qu'elle rendait possible : à 11 px, cet espace faisait 3 px et
    // « Blog(bientôt) » se lisait collé. Ce qui compte est que le suffixe soit
    // ÉCRIT et SÉPARÉ, pas la façon dont l'espace est obtenu.
    const regle = home.match(/\.fl-soon::after \{([^}]*)\}/)?.[1] ?? ""
    expect(regle, "« bientôt » n'est plus annoncé en toutes lettres").toContain("(bientôt)")
    expect(
      /margin-left\s*:\s*[1-9]/.test(regle) || /content\s*:\s*"\\00a0|content\s*:\s*"\u00a0/.test(regle),
      "rien ne sépare « bientôt » du libellé : il se lira collé",
    ).toBe(true)
    for (const l of ["Blog", "Roadmap", "Changelog"]) expect(home).toMatch(new RegExp(`<span className="fl fl-soon" aria-label="${l} — bientôt disponible">${l}</span>`))
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
