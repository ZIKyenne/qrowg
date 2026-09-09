import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Revue du 9 septembre (P0, passe éditoriale) : vouvoiement partout, « Wi-Fi »
// écrit d'une seule façon, accents dans la galerie, anglicismes traduits dans
// ce que l'utilisateur LIT (les identifiants techniques ne bougent pas).

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
// Ne garde que ce qui est lu : retire commentaires de ligne et blocs JSON de contenu de modèle.
const lisible = (s: string) => s.split("\n").filter(l => !l.trim().startsWith("//") && !l.trim().startsWith("*") && !l.includes('"type":"pricing"')).join("\n")

describe("vouvoiement", () => {
  it("fonctionnalités : « Créez », « Comprenez », plus d'« outil business »", () => {
    const s = lire("features/page.tsx")
    expect(s).toContain("Créez une page mobile, générez un QR dynamique et mesurez chaque interaction.")
    expect(s).toContain("Comprenez ce qui se passe")
    expect(s).not.toContain("Comprends ce qui")
    expect(s).not.toContain("outil business")
    expect(s).not.toContain('title:"Branding personnalisé"')
    expect(s).not.toContain('title:"Collaboration équipe"')
  })
  it("éditeur : plus de « ta page »", () => {
    expect(lisible(lire("dashboard/builder/builderPanels.tsx"))).not.toMatch(/\b(ta|ton|tes) (page|QR|compte)\b/)
  })
  for (const f of ["HomeClient.tsx", "features/page.tsx", "upgrade/page.tsx", "dashboard/templates/page.tsx", "dashboard/DashboardClient.tsx"]) {
    it(`${f} : aucun tutoiement lu`, () => {
      const s = lisible(lire(f))
      expect(s).not.toMatch(/[>"](Crée|Génère|Mesure|Comprends|Choisis|Découvre) (ta|ton|tes|une|un|ce|le|la)\b/)
      expect(s).not.toMatch(/\b(ta|ton|tes) (page|QR|compte|boutique)\b/)
    })
  }
})

describe("Wi-Fi", () => {
  it("s'écrit « Wi-Fi » dans tout ce qui est lu (verticales, générateurs, navigation)", () => {
    for (const f of ["qr-code/verticals.ts", "generateur-qr-code/GeneratorClient.tsx", "dashboard/qr-link/page.tsx", "../components/MobileNav.tsx"]) {
      const s = lisible(lire(f))
      // Chaînes lues : entre guillemets ou balises, hors identifiants (wifi:, "wifi", /wifi, -wifi, Wifi composant/icône).
      const lus = [...s.matchAll(/(?:[>"'`(] ?|\s)(wifi|WiFi|Wifi|WIFI)(?=[ .,:;!?)"'`<])/g)].map(m => m[0].trim())
        .filter(t => !/^["'`(]?(wifi|WIFI)["'`)]?$/.test(t))
        // « Wifi » nu = l'icône lucide (import, table d'icônes), jamais du texte lu.
        .filter(t => t !== "Wifi")
      expect(lus, `${f} : ${lus.join(" | ")}`).toEqual([])
    }
    expect(lire("qr-code/verticals.ts")).toContain('eyebrow: "Wi-Fi"')
  })
})

describe("galerie de modèles : accents et français", () => {
  const s = lire("dashboard/templates/page.tsx")
  it("les catégories lues sont accentuées et en français (les clés de filtre ne bougent pas)", () => {
    const c = lire("dashboard/templates/categorieLue.ts")
    for (const [cle, lu] of [["Business", "Entreprise"], ["Food", "Restauration"], ["Creatif", "Créatif"], ["Event", "Événement"], ["Bien-etre", "Bien-être"], ["Beaute", "Beauté"], ["Sante", "Santé"]]) {
      expect(c).toContain(`${cle.includes("-") ? `"${cle}"` : cle}: "${lu}"`)
    }
    expect(s).toContain("{categorieLue(template.category)}")
    expect(lire("dashboard/templates/TemplatePreviewModal.tsx")).toContain("{categorieLue(template.category)}")
    expect(s).toContain('category: "Business"') // la clé sert toujours au filtrage
  })
  it("descriptions, étiquettes et accroches sans anglicisme ni faute d'accent", () => {
    for (const mot of ["Countdown", "Waitlist", "Pricing", "Features", "Media Kit", "Media kit", "Landing page", "Digitaux", "ebooks", "methode", "specialites", "Integration Doctolib", "Voir tous les templates"]) {
      expect(lisible(s), mot).not.toContain(mot)
    }
  })
  it("plan Gratuit : une description qui dit ce qu'on obtient", () => {
    expect(lire("../lib/plans.ts")).not.toContain("Un support, pour de vrai")
  })
})

describe("styles et presets : familles nommées en français", () => {
  it("familles de thèmes de l'éditeur", () => {
    const s = lire("dashboard/builder/builderPanels.tsx")
    for (const g of ['group: "Business"', 'group: "Creator"', 'group: "Luxury"', 'useState("Business")']) expect(s, g).not.toContain(g)
    expect(s).toContain('useState("Entreprise")')
  })
  it("familles de styles du QR Studio", () => {
    const s = lire("dashboard/qr-codes/presetsQr.ts")
    for (const l of ['label:"Business"', 'label:"Createur"', 'label:"Event"', 'label:"Retail"']) expect(s, l).not.toContain(l)
    expect(s).toContain('label:"Événement"')
  })
})
