import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 9 septembre — les écrans Réglages (Profil, Paramètres, Équipe, Domaines,
// Redirections, Sous-domaine) partagent une seule section (SettingsSection :
// surface + filet, icône grise, titre 14 px) et un seul style de champ. Fini
// les trois variantes de carte à contour doré et à tuile colorée.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const PRIM = readFileSync(join(__dirname, "../../components/ui/SettingsSection.tsx"), "utf8")

describe("SettingsSection", () => {
  it("est une <section> avec un <h2>, sur --surface avec un filet, sans tuile dorée", () => {
    expect(PRIM).toContain("<section id={id}")
    expect(PRIM).toContain('background: "var(--surface)", border: "1px solid var(--line-strong)"')
    expect(PRIM).toContain('color: "var(--muted)", flexShrink: 0 }}>{icon}')
    expect(PRIM).not.toContain("color-mix(in srgb, var(--accent) 10%")
    expect(PRIM).toMatch(/<h2 style=\{\{[^}]*fontSize: 14/)
  })
  it("expose le style de champ commun (fond --field, contour --line-strong)", () => {
    expect(PRIM).toContain('export const champStyle')
    expect(PRIM).toContain('background: "var(--field)", border: "1px solid var(--line-strong)"')
  })
})

describe("les écrans Réglages passent par la primitive", () => {
  it("Paramètres : sa Section délègue, ses champs sont champStyle", () => {
    const s = lire("settings/page.tsx")
    expect(s).toContain("return <SettingsSection title={title} sub={subtitle} icon={icon}")
    expect(s).toContain("const inputStyle: React.CSSProperties = champStyle")
    expect(s).not.toContain("#0d0c09")
  })
  it("Profil : SectionCard délègue, inputStyle/labelStyle dérivent des styles communs, surfaces sur jetons", () => {
    const b = lire("profile/briquesProfil.tsx")
    expect(b).toContain("return <SettingsSection title={title} icon={<Icon size={15} />}")
    expect(b).toContain("export const inputStyle: React.CSSProperties = { ...champStyle")
    expect(b).toContain("export const labelStyle: React.CSSProperties = etiquetteStyle")
    expect(b).not.toContain("Fraunces")
    const p = lire("profile/page.tsx")
    expect(p).toContain('const SURF = "var(--surface)"')
    expect(p).toContain('const BG = "var(--bg)"')
  })
  for (const f of ["team/page.tsx", "domains/DomainsPage.tsx", "domains/DomainRoutesPanel.tsx", "domains/MultiBrandDomainsPanel.tsx", "redirects/RedirectsPanel.tsx", "subdomain/SubdomainPanel.tsx", "profile/page.tsx", "settings/page.tsx"]) {
    it(`${f} : plus de conteneur à contour doré ni de rayon 16`, () => {
      const s = lire(f)
      expect(s).not.toMatch(/border:\s*["`]1px solid color-mix\(in srgb, var\(--accent\) (?:8|10|12|13|15|20)%, transparent\)["`]/)
      expect(s).not.toMatch(/borderRadius:\s*16\b/)
      expect(s).not.toMatch(/rgba\(201,168,76/)
    })
  }
  it("Équipe : la carte d'invitation au plan Business est plate", () => {
    expect(lire("team/page.tsx")).not.toContain("linear-gradient(135deg, rgba(201,168,76")
  })
})
