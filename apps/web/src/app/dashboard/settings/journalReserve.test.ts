// Audit du 14 novembre 2026, lot B : « Vous n'avez plus accès à cette page »
// sous les notifications, au chargement, sans aucune sauvegarde.
//
// Cause démontrée : /api/cron/etat est réservé aux administrateurs et répond
// 403 à tous les autres (voulu) ; Paramètres lisait ce 403 comme un refus, et
// `messageDeRoute(403)` le traduit par la phrase FORBIDDEN du builder.
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { messageDeRoute } from "@/lib/messageDeRoute"

describe("le journal réservé ne parle pas aux commerçants", () => {
  it("un 403 nu se lit bien « plus accès » — d'où l'alerte", () => {
    expect(messageDeRoute(403, { disponible: false, passages: {} }, "repli")).toMatch(/plus accès/)
  })
  it("la route refuse toujours aux non-administrateurs (rien n'est ouvert)", () => {
    const route = readFileSync(join(__dirname, "../../api/cron/etat/route.ts"), "utf8")
    expect(route).toContain("estAdministrateur(user.email)")
    expect(route).toContain("status: 403")
  })
  it("Paramètres tait le 403 attendu, et dit encore les autres refus", () => {
    const src = readFileSync(join(__dirname, "page.tsx"), "utf8")
    const i = src.indexOf('effetDe("/api/cron/etat")')
    expect(i).toBeGreaterThan(0)
    const bloc = src.slice(i, i + 500)
    expect(bloc).toContain("if (r.statut === 403) return")
    expect(bloc).toContain("setRefusJournal(refus)")
  })
})
