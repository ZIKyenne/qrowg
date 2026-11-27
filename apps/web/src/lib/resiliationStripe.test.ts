import { describe, it, expect } from "vitest"
import { resilierToutChezStripe, STATUTS_A_ANNULER, type ClientStripe } from "./resiliationStripe"

// Supprimer son compte ne touchait pas Stripe : le client continuait d'être
// prélevé après la disparition de son compte.

function faux(subs: { id: string; status: string }[], echec = false): ClientStripe & { annules: string[] } {
  const annules: string[] = []
  return {
    annules,
    subscriptions: {
      async list() { if (echec) throw new Error("Stripe indisponible"); return { data: subs } },
      async cancel(id: string) { annules.push(id) },
    },
  }
}

describe("résiliation avant suppression de compte", () => {
  it("annule tout ce qui facture encore, laisse le reste", async () => {
    const s = faux([{ id: "a", status: "active" }, { id: "b", status: "canceled" }, { id: "c", status: "past_due" }, { id: "d", status: "trialing" }])
    const r = await resilierToutChezStripe(s, "cus_1")
    expect(r.annules.sort()).toEqual(["a", "c", "d"])
    expect(r.ignores).toEqual(["b"])
    expect(s.annules.sort()).toEqual(["a", "c", "d"])
  })
  it("sans client Stripe, rien à faire", async () => {
    const s = faux([{ id: "a", status: "active" }])
    expect(await resilierToutChezStripe(s, null)).toEqual({ annules: [], ignores: [] })
    expect(s.annules).toEqual([])
  })
  it("une panne Stripe remonte — l'appelant doit refuser la suppression", async () => {
    await expect(resilierToutChezStripe(faux([], true), "cus_1")).rejects.toThrow("Stripe indisponible")
  })
  it("les statuts qui facturent sont tous couverts", () => {
    for (const st of ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]) expect(STATUTS_A_ANNULER.has(st), st).toBe(true)
    expect(STATUTS_A_ANNULER.has("canceled")).toBe(false)
  })
  // La route elle-même (ordre Stripe → suppression → purge, refus de Stripe,
  // purge échouée) est JOUÉE depuis v397 : app/api/account/delete/bancSuppression.test.ts.
})
