import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// PERF-006 (audit UX v2, 22 nov.) : le JavaScript initial de la page publique a
// un budget, vérifié après chaque `next build` (scripts/budget-page-publique.mjs).
// Cette garde tient le cliquet : le plafond ne remonte pas, et le contrôle reste
// branché sur le build.

const racine = join(__dirname, "../../../..")
const script = readFileSync(join(racine, "apps/web/scripts/budget-page-publique.mjs"), "utf8")
const paquet = JSON.parse(readFileSync(join(racine, "package.json"), "utf8"))

describe("budget JavaScript de la page publique", () => {
  it("le plafond ne remonte pas au-dessus de la dernière mesure + 5 %", () => {
    // Mesures : 221 Ko gzip, puis 193 et 188 après PERF-003. On ABAISSE ce plafond quand une optimisation le permet.
    const plafond = Number(script.match(/export const PLAFOND_KO = (\d+)/)?.[1])
    expect(plafond).toBeGreaterThan(0)
    expect(plafond, "plafond relevé : allégez la page au lieu de déplacer la barre").toBeLessThanOrEqual(197)
  })

  it("le contrôle tourne à la fin du build, et un dépassement fait échouer", () => {
    expect(paquet.scripts.build).toMatch(/next build && node scripts\/budget-page-publique\.mjs$/)
    expect(script).toContain("process.exit(1)")
  })
})
