import { describe, it, expect } from "vitest"
import { planFromPriceId, PLAN_FROM_PRICE } from "./stripePlan"

// NB : les env NEXT_PUBLIC_STRIPE_*_PRICE_ID ne sont pas definies en test ->
// la map est vide. On verifie donc surtout les garde-fous (null sur inconnu,
// aucune cle vide), independamment de la config.
describe("planFromPriceId", () => {
  it("price absent / vide / inconnu -> null (pas de retrogradation a tort)", () => {
    expect(planFromPriceId(undefined)).toBeNull()
    expect(planFromPriceId(null)).toBeNull()
    expect(planFromPriceId("")).toBeNull()
    expect(planFromPriceId("price_inexistant")).toBeNull()
  })
  it("la map ne contient jamais de cle vide (env manquante ignoree)", () => {
    expect(Object.keys(PLAN_FROM_PRICE)).not.toContain("")
    for (const v of Object.values(PLAN_FROM_PRICE)) {
      expect(["starter", "pro", "business"]).toContain(v)
    }
  })
})
