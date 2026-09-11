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

// Deux sortes de dessins existaient. Les MAQUETTES D'ILLUSTRATION — la vignette
// « ANALYTICS · EXEMPLE » de l'accueil, les maquettes d'éditeur et de statistiques
// de Fonctionnalités, le mini-téléphone des cas d'usage — étaient dispensées de la
// règle : elles ne le sont plus (lot v61). Elles ont été redessinées : moins
// d'éléments, rien sous 11 px.
//
// Restent les RENDUS À L'ÉCHELLE : la page du client telle qu'elle sera publiée
// (canvas de l'éditeur, téléphone de l'aperçu de modèle) et le support imprimé tel
// qu'il sortira (scène de QR de pages, vignettes de l'atelier). Les agrandir
// mentirait sur le rendu. Ils sont nommés ici, un par un, avec leur frontière.
const RENDUS_A_ECHELLE: { fichier: string; avant?: number; apres?: number; borne?: [string, string]; pourquoi: string }[] = [
  { fichier: "dashboard/templates/TemplatePreviewModal.tsx", avant: 2588,
    pourquoi: "le téléphone d'aperçu rend la page du modèle à l'échelle ; l'interface de la modale commence après" },
  { fichier: "dashboard/builder/builderPreview.tsx",
    pourquoi: "le canvas de l'éditeur rend la page publiée à l'échelle" },
  { fichier: "dashboard/builder/shared-renderer/blocks/",
    pourquoi: "les adaptateurs éditeur de blocs sont dessinés DANS ce canvas : même rendu, même échelle réduite" },
  { fichier: "dashboard/qr-codes/QRStudio.tsx", borne: ['{previewScene !== "none" && (', '<div style={{ display: previewScene==="none"'],
    pourquoi: "la scène d'aperçu montre carte, affiche et téléphone au format réel" },
  { fichier: "dashboard/print-studio/PrintStudioClient.tsx", apres: 2200,
    pourquoi: "les vignettes de supports reproduisent le support imprimé ; tout ce qui précède la ligne 2200 est l'interface de l'atelier, et reste soumis à la règle" },
]

// Lot v67. La règle avait une LISTE de vingt écrans ; trois n'y avaient jamais
// figuré — Domaines, Redirections, Équipe — et personne ne s'en était aperçu,
// parce qu'une liste ne signale pas ce qui lui manque. Mesuré sur le banc
// d'essai, Domaines affichait quatre numéros d'étape à 10 px et Redirections
// six libellés de statistiques et d'aperçu d'URL au même format.
//
// Le périmètre n'est donc plus une liste mais un ARBRE : tout `dashboard/`, tout
// `homeSections/`, plus les écrans publics nommés. On n'en sort que par une
// dispense écrite ci-dessus, avec sa raison. Ajouter un écran ne demande plus
// de penser à l'inscrire quelque part : il est couvert dès qu'il existe.
const ARBRES = ["dashboard", "homeSections"]
const FICHIERS_EN_PLUS = [
  "HomeClient.tsx", "features/page.tsx", "upgrade/page.tsx", "generateur-qr-code/page.tsx",
  "examples/page.tsx", "../components/ui/PageHeader.tsx", "../components/ui/SettingsSection.tsx",
  "../components/MobileNav.tsx", "../components/EnTeteSite.tsx", "../components/NextStepCard.tsx",
]

function tousLesEcrans(): string[] {
  const vus: string[] = []
  const marche = (rel: string) => {
    for (const e of readdirSync(join(APP, rel), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = `${rel}/${e.name}`
      if (e.isDirectory()) { marche(r); continue }
      if (!e.name.endsWith(".tsx") || e.name.includes(".test.")) continue
      vus.push(r)
    }
  }
  for (const a of ARBRES) marche(a)
  return [...vus, ...FICHIERS_EN_PLUS].sort()
}

/** Un fichier est dispensé si une entrée de RENDUS_A_ECHELLE le nomme, ou nomme son dossier. */
const dispense = (f: string) => RENDUS_A_ECHELLE.find(r => r.fichier.endsWith("/") ? f.startsWith(r.fichier) : f === r.fichier)

describe("aucun texte lu sous 11 px", () => {
  const ECRANS = tousLesEcrans()

  it("le périmètre est un arbre, pas une liste : il couvre tout le tableau de bord", () => {
    // Les trois écrans oubliés jusqu'au lot v67 y sont, sans avoir été inscrits.
    for (const f of ["dashboard/domains/DomainsPage.tsx", "dashboard/redirects/RedirectsPanel.tsx", "dashboard/team/page.tsx"])
      expect(ECRANS, f).toContain(f)
    expect(ECRANS.length).toBeGreaterThan(100)
  })

  for (const f of ECRANS) {
    const d = dispense(f)
    if (d && !d.borne && d.avant === undefined && d.apres === undefined) continue
    it(`${f}`, () => {
      const src = lire(f)
      // La scène d'aperçu de QRStudio dessine un support imprimé : elle est exclue par nom.
      const scene = d?.borne ? src.indexOf(d.borne[0]) : -1
      const finScene = scene > -1 ? src.indexOf(d!.borne![1], scene) : -1
      const fautes: string[] = []
      let pos = 0
      src.split("\n").forEach((l, i) => {
        const debutLigne = pos; pos += l.length + 1
        if (scene > -1 && debutLigne > scene && debutLigne < finScene) return
        if (d?.avant !== undefined && i + 1 < d.avant) return
        if (d?.apres !== undefined && i + 1 > d.apres) return
        const m = l.match(/fontSize:\s*(\d+(?:\.\d+)?)/g)
        for (const x of m ?? []) {
          const v = parseFloat(x.replace(/fontSize:\s*/, ""))
          if (v < 11) fautes.push(`${i + 1}: ${v} px`)
        }
      })
      expect(fautes, `${f} — ${fautes.join(" · ")}`).toEqual([])
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

describe("les rendus à l'échelle sont nommés, pas oubliés", () => {
  it("chacun existe encore, et dit pourquoi il échappe à la règle", () => {
    for (const r of RENDUS_A_ECHELLE) {
      const st = statSync(join(APP, r.fichier))
      expect(r.fichier.endsWith("/") ? st.isDirectory() : st.isFile(), r.fichier).toBe(true)
      expect(r.pourquoi.length, r.fichier).toBeGreaterThan(30)
    }
  })
  it("les frontières citées existent dans le code : une dispense ne flotte pas", () => {
    for (const r of RENDUS_A_ECHELLE) {
      if (!r.borne) continue
      const src = lire(r.fichier)
      const [debut, fin] = r.borne
      expect(src.indexOf(debut), `${r.fichier} : début`).toBeGreaterThan(-1)
      expect(src.indexOf(fin), `${r.fichier} : fin`).toBeGreaterThan(src.indexOf(debut))
    }
  })
  it("la vitrine n'en fait plus partie : ses maquettes ont été redessinées", () => {
    const fichiers = RENDUS_A_ECHELLE.map(r => r.fichier)
    for (const f of ["homeSections/Analytics.tsx", "features/page.tsx", "homeSections/UseCases.tsx", "HomeClient.tsx"]) {
      expect(fichiers, f).not.toContain(f)
    }
    // La vignette de statistiques de l'accueil : trois panneaux de trois lignes, pas quatre de quatre.
    const a = lire("homeSections/Analytics.tsx")
    expect((a.match(/\{ name: "/g) ?? []).length).toBe(3)
    expect((a.match(/\{ label: "(Direct QR|Réseaux|Email)"/g) ?? []).length).toBe(3)
    expect(a).not.toContain("Réseaux soc.")
    expect(a).toContain('@media(max-width:720px){ .an-kpis{ grid-template-columns:repeat(2,1fr)!important; } .an-bas{ grid-template-columns:1fr!important; } }')
  })
  it("plus d'anglicisme dans l'aperçu de modèle", () => {
    expect(lire("dashboard/templates/TemplatePreviewModal.tsx")).not.toContain("Temps de setup")
    expect(lire("dashboard/templates/TemplatePreviewModal.tsx")).toContain('label: "Prêt en"')
  })
})
