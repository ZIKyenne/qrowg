import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 9 septembre — un seul or dans toute l'interface : l'accent par défaut (coquille,
// hook, profil, e-mails, couleur système) est le --gold de globals.css, et plus
// aucune teinte n'est écrite avec l'ancien or rgba(201,168,76,…) dans la chrome ;
// elles passent par color-mix(var(--accent)) et suivent donc l'accent choisi.

const SRC = join(__dirname, "..", "..")
const lire = (p: string) => readFileSync(join(SRC, p), "utf8")
const gold = lire("app/globals.css").match(/--gold:\s*(#[0-9A-Fa-f]{6})/)?.[1]

describe("accent par défaut", () => {
  it("vaut le --gold de globals.css partout où il est écrit en dur", () => {
    expect(gold).toBeTruthy()
    expect(lire("app/dashboard/DashboardShell.tsx")).toContain(`const DEFAULT_ACCENT = "${gold}"`)
    expect(lire("lib/useAccent.ts")).toContain(`export const DEFAULT_ACCENT = "${gold}"`)
    expect(lire("app/dashboard/profile/typesProfil.ts")).toContain(`accent_color: "${gold}"`)
    expect(lire("lib/couleursApp.ts")).toContain(`export const OR_QROWG = "${gold}"`)
    expect(lire("lib/emailLayout.ts")).toContain(`const GOLD = "${gold}"`)
  })
  it("la couleur système (barre du navigateur, manifeste) est le --bg de globals.css", () => {
    const bg = lire("app/globals.css").match(/--bg:\s*(#[0-9A-Fa-f]{6})/)?.[1]
    expect(lire("lib/couleursApp.ts")).toContain(`export const FOND_APP = "${bg}"`)
  })
  it("les huit accents proposés dans Profil sont des hex distincts (jamais var(--accent), qui rendait l'accent circulaire)", () => {
    const src = lire("app/dashboard/profile/page.tsx")
    const i = src.indexOf("Couleur d'accent</p>")
    const bloc = src.slice(i, src.indexOf(".map(color =>", i))
    const hexs = [...bloc.matchAll(/"(#[0-9A-Fa-f]{6})"/g)].map(m => m[1])
    expect(hexs.length).toBe(8)
    expect(new Set(hexs).size).toBe(8)
    expect(bloc).not.toContain("var(--accent)")
    expect(hexs[0]).toBe(gold)
  })
})

describe("plus d'ancien or en dur dans la chrome", () => {
  const chrome = ["app/dashboard/builder/BuilderV4.tsx", "app/dashboard/builder/builderPanels.tsx", "app/dashboard/profile/page.tsx", "app/dashboard/qr-codes/QRStudio.tsx", "app/dashboard/qr-codes/panneauxQr.tsx", "app/dashboard/print-studio/PrintStudioClient.tsx", "app/dashboard/qr-link/page.tsx", "app/dashboard/onboarding/OnboardingClient.tsx", "app/dashboard/assets/page.tsx", "app/dashboard/analytics/OverviewCards.tsx", "components/Dialogue.tsx", "app/upgrade/page.tsx", "app/dashboard/templates/TemplateWizardModal.tsx", "app/dashboard/builder/BuilderWelcome.tsx", "app/dashboard/builder/ImageUpload.tsx", "app/dashboard/builder/FileUpload.tsx"]
  for (const f of chrome) {
    it(`${f} : aucune teinte rgba(201,168,76 / 232,200,119 / 201,162,77)`, () => {
      expect(lire(f)).not.toMatch(/rgba\((?:201,168,76|232,200,119|201,162,77),/)
    })
  }
})
