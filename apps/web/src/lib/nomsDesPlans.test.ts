import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PLANS, getPlan, PLAN_ORDER } from "./plans"

// Revue du 9 septembre (P0) — la grille publique dit Gratuit · Établissement ·
// Multi-sites, mais la galerie de modèles, l'aperçu, la puce de la coquille,
// l'accueil connecté et le profil disaient encore « Starter » et « Pro ».
// Désormais : un seul endroit écrit les noms (lib/plans.ts), les autres lisent.

const APP = join(__dirname, "../app")
const lire = (p: string) => readFileSync(join(APP, p), "utf8")

describe("lib/plans.ts, source des noms", () => {
  it("nomme trois plans : Gratuit · Établissement · Multi-sites", () => {
    expect(PLAN_ORDER.map(id => PLANS[id].label)).toEqual(["Gratuit", "Établissement", "Multi-sites"])
  })
  it("replie l'ancien « starter » sur Établissement", () => {
    expect(getPlan("starter").label).toBe("Établissement")
    expect(getPlan("starter").id).toBe("pro")
    expect(getPlan(undefined).label).toBe("Gratuit")
  })
})

// Écrans qui affichent un nom de plan : ils ne doivent plus en écrire un seul en dur.
const ECRANS = [
  "dashboard/templates/page.tsx",
  "dashboard/templates/TemplatePreviewModal.tsx",
  "dashboard/DashboardShell.tsx",
  "dashboard/DashboardClient.tsx",
  "dashboard/profile/page.tsx",
  "dashboard/qr-codes/QRStudio.tsx",
]
const EN_DUR = [
  /["'`]Starter["'`]/,
  /["'`]Plan Pro["'`]/,
  /["'`]Passer au Pro["'`]/,
  /label:\s*"Pro"/,
  /label:\s*"Free"/,
  /label:\s*"Business"/,
  /Passer à Starter/,
  /Passez à Starter/,
  /\?\s*"Business"\s*:\s*[^?]*\?\s*"Pro"/,
]

describe("les écrans lisent les noms dans lib/plans.ts", () => {
  for (const f of ECRANS) {
    it(`${f} : aucun nom de plan écrit en dur`, () => {
      // Les contenus de modèles (blocs « tarifs » d'exemple, JSON sur une ligne) ne sont pas de l'interface.
      const s = lire(f).split("\n").filter(l => !l.includes('"type":"pricing"') && !l.trim().startsWith("//")).join("\n")
      for (const re of EN_DUR) expect(s, String(re)).not.toMatch(re)
      expect(s).toMatch(/getPlan\(|PLANS\./)
    })
  }
  it("galerie : filtres et badges dérivent de PLANS/getPlan, et « starter » se filtre comme Établissement", () => {
    const s = lire("dashboard/templates/page.tsx")
    expect(s).toContain('["free", PLANS.free.label], ["pro", PLANS.pro.label]')
    expect(s).toContain("const planConfig = (plan: string) => { const p = getPlan(plan); return { label: p.label")
    expect(s).toContain('getPlan(t.plan).id === activePlan')
    expect(s).not.toContain('["starter", "Starter')
  })
  it("aperçu de modèle : « Plan … requis » vient de getPlan", () => {
    expect(lire("dashboard/templates/TemplatePreviewModal.tsx")).toContain("Plan {getPlan(template.plan).label} requis")
  })
  it("coquille : la puce nomme le plan via getPlan, et invite au plan Établissement sinon", () => {
    expect(lire("dashboard/DashboardShell.tsx")).toContain("const planLabel = isPaid ? `Plan ${getPlan(plan).label}` : `Passer à ${PLANS.pro.label}`")
  })
  it("accueil connecté : l'invitation cite le plan Établissement et ne promet plus un quota de vues (illimitées)", () => {
    const s = lire("dashboard/DashboardClient.tsx")
    expect(s).toContain('Passez à {getPlan("pro").label} — {fmtPrice(getPlan("pro").priceMonthly)}€/mois')
    expect(s).not.toContain('limits.views!.toLocaleString')
  })
  it("profil : « Passer à Établissement », pas « Starter ou Pro »", () => {
    expect(lire("dashboard/profile/page.tsx")).toContain("<span>Passer à {PLANS.pro.label}</span>")
  })
})
