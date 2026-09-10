import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

// Revue interne du 9 septembre (P2) : 25 textes sous 11 px sur les tarifs, 29 sur
// « QR de pages », des liens de 15 px au générateur, et 18 segments de statut à
// 28 px dans Messages. Deux règles, tenues ici sur le code et vérifiées au
// navigateur : aucun texte lu sous 11 px, aucune cible sous 32 px.
// Mesuré après ce lot (1440×900 et 390×844) : 0 / 0 sur les 14 écrans du produit.

const APP = __dirname
const SRC = join(__dirname, "..")
const lire = (p: string) => readFileSync(join(APP, p), "utf8")

// Les maquettes dessinent un rendu à l'échelle (un tableau de bord en vignette, un
// support imprimé, un téléphone miniature) : leurs tailles sont proportionnelles au
// dessin, pas au texte que l'on lit. Elles sont nommées ici, une par une.
const MAQUETTES = [
  "app/homeSections/Analytics.tsx",       // vignette « ANALYTICS · EXEMPLE »
  "app/homeSections/UseCases.tsx",        // mini-téléphone d'aperçu
  "app/homeSections/Templates.tsx",       // mini-aperçus de modèles
  "app/features/page.tsx",                // maquettes d'éditeur et de statistiques
  "app/homeSectionsRetirees.tsx",         // sections conservées hors page
  "app/dashboard/builder/builderPreview.tsx",
  "app/dashboard/print-studio/PrintStudioClient.tsx", // vignettes de supports (> ligne 2200)
]

describe("aucun texte lu sous 11 px", () => {
  const ECRANS = [
    "upgrade/page.tsx",
    "dashboard/qr-codes/QRStudio.tsx",
    "dashboard/qr-codes/panneauxQr.tsx",
    "dashboard/leads/LeadsClient.tsx",
    "dashboard/analytics/AnalyticsClient.tsx",
    "dashboard/analytics/OverviewCards.tsx",
    "dashboard/DashboardShell.tsx",
    "dashboard/templates/page.tsx",
    "generateur-qr-code/page.tsx",
    "homeSections/Pricing.tsx",
    "../components/ui/PageHeader.tsx",
    "../components/ui/SettingsSection.tsx",
  ]
  for (const f of ECRANS) {
    it(`${f}`, () => {
      const src = lire(f)
      // La scène d'aperçu de QRStudio dessine un support imprimé : elle est exclue par nom.
      const scene = src.indexOf('{previewScene !== "none" && (')
      const finScene = scene > -1 ? src.indexOf('<div style={{ display: previewScene==="none"', scene) : -1
      const fautes: string[] = []
      src.split("\n").forEach((l, i) => {
        const pos = src.split("\n").slice(0, i).join("\n").length
        if (scene > -1 && pos > scene && pos < finScene) return
        const m = l.match(/fontSize:\s*(\d+(?:\.\d+)?)/g)
        for (const x of m ?? []) {
          const v = parseFloat(x.replace(/fontSize:\s*/, ""))
          if (v < 11) fautes.push(`${i + 1}: ${v} px`)
        }
      })
      expect(fautes, fautes.join(" · ")).toEqual([])
    })
  }

  it("le pied de page et les surtitres de l'accueil sont à 11 px", () => {
    const home = lire("HomeClient.tsx")
    expect(home).toContain(".fc-title { color:#C9A84C; font-size:11px;")
    expect(home).not.toMatch(/font-size:\s*(8|9|10)(\.\d+)?px/)
  })
})

describe("aucune cible sous 32 px", () => {
  it("le pied de page de l'accueil : chaque lien fait sa hauteur", () => {
    const home = lire("HomeClient.tsx")
    expect(home).toContain(".fl { display:flex; align-items:center; min-height:32px;")
    expect(home).toContain('display:"inline-flex",alignItems:"center",minHeight:32,margin:"-8px 0" }}')
  })
  it("la règle de l'en-tête public vise 32 px", () => {
    expect(lire("globals.css")).toMatch(/\.qf-entete a,\n\.qf-entete button \{[^}]*min-height: 32px/)
  })
  it("tarifs : bascule annuelle et lien de contact", () => {
    expect(lire("homeSections/Pricing.tsx")).toContain("style={{ width:54, height:32, borderRadius:16,")
    expect(lire("upgrade/page.tsx")).toContain('display: "inline-flex", alignItems: "center", minHeight: 40, margin: "-12px 0" }}>Contactez-nous')
  })
  it("QR de pages : menus de ligne, actions de destination, boutons de panneau", () => {
    const q = lire("dashboard/qr-codes/QRStudio.tsx")
    expect(q).not.toContain("width:isMobile?32:20")
    expect((q.match(/width:32, height:32, margin:-5,/g) ?? []).length).toBe(4)
    expect(lire("dashboard/qr-codes/panneauxQr.tsx")).toContain("style={{ width:32, height:32, borderRadius:7,")
  })
  it("segmenteurs partagés du studio QR", () => {
    expect(lire("dashboard/qr-codes/SegTabs.tsx")).toContain("gap: 6, minHeight: 32,")
    expect(lire("dashboard/qr-codes/SegmentedControl.tsx")).toContain('cursor: "pointer", minHeight: 32,')
    expect(lire("globals.css")).toContain(".da-pill { display:inline-flex; align-items:center; gap:6px; border-radius:999px; min-height:32px;")
  })
  it("générateur : fil d'Ariane, maillage et bandeaux contextuels", () => {
    const g = lire("generateur-qr-code/page.tsx")
    expect(g).toContain('display: "inline-flex", alignItems: "center", minHeight: 32, margin: "-8px 0"')
    expect(g).toContain('display: "inline-flex", alignItems: "center", minHeight: 40, padding: "0 12px"')
    expect(g).not.toContain("linear-gradient(90deg,${G},#b8953f)")
  })
  it("statistiques : période et légende", () => {
    expect(lire("dashboard/analytics/AnalyticsClient.tsx")).toContain('style={{ minHeight: 32, padding: "0 13px", borderRadius: 7,')
    expect((lire("dashboard/analytics/OverviewCards.tsx").match(/minHeight: 32, padding: "0 12px", borderRadius: 999,/g) ?? []).length).toBe(2)
  })
  it("atelier d'impression : « Créez-en un » et les réglages avancés", () => {
    const ps = lire("dashboard/print-studio/PrintStudioClient.tsx")
    expect(ps).toContain('minHeight: 40, margin: "-12px 0" }}>Créez-en un')
    expect((ps.match(/cursor: "pointer", fontSize: 12, minHeight: 32, padding: 0/g) ?? []).length).toBe(4)
  })
  it("connexion : logo, mot de passe oublié, création de compte", () => {
    expect(lire("auth/login/LoginForm.tsx")).toContain('fontWeight: 600, display: "inline-flex", alignItems: "center", minHeight: 32 }}')
    expect(lire("auth/login/page.tsx")).toContain("alignItems: 'center', minHeight: 32, textDecoration: 'none'")
  })
})

describe("Messages : le statut est un choix, pas trois boutons", () => {
  const l = lire("dashboard/leads/LeadsClient.tsx")
  it("un vrai segmenteur : piste, segment actif souligné d'accent, 32 px", () => {
    expect(l).toContain('<div role="radiogroup" aria-label="Statut de ce message"')
    expect(l).toContain('background: "var(--field)", border: "1px solid var(--line-strong)", borderRadius: 9, padding: 3 }}')
    expect(l).toContain('<button key={s.key} role="radio" aria-checked={on}')
    expect(l).toContain('boxShadow: on ? "inset 0 -2px 0 var(--accent)" : "none"')
    expect(l).toContain("minHeight: 32, background: on ?")
  })
  it("les filtres de type et de statut font 32 px", () => {
    expect(l).toContain('borderRadius: 20, minHeight: 32, padding: "6px 14px"')
    expect(l).toContain('borderRadius: 9, minHeight: 32, padding: "6px 12px"')
  })
})

describe("les maquettes sont nommées, pas oubliées", () => {
  it("chacune existe encore : le jour où l'une disparaît, sa dispense saute avec elle", () => {
    for (const f of MAQUETTES) {
      expect(statSync(join(SRC, f)).isFile(), f).toBe(true)
    }
  })
  it("aucun écran de la liste n'est aussi déclaré maquette", () => {
    const dbl = MAQUETTES.filter(m => m.endsWith("upgrade/page.tsx") || m.endsWith("LeadsClient.tsx"))
    expect(dbl).toEqual([])
  })
  it("l'inventaire reste à jour : autant de fichiers d'écran que de dossiers de sections", () => {
    const sections = readdirSync(join(APP, "homeSections")).filter(f => f.endsWith(".tsx")).sort()
    expect(sections.length).toBeGreaterThan(5)
  })
})
