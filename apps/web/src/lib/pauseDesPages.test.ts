// Décision du 14 novembre 2026 (audit A1) : au retour à un plan inférieur, les QR
// de page au-delà du quota passent en pause ; le client choisit ce qu'il garde.
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { planPagesReconcile, pagesQuiSArretent, PAUSE_PAR_LE_PLAN } from "./pauseDesPages"
import { pageLimit } from "./plans"

const q = (id: string, status: string | null, paused_reason: string | null = null) => ({ id, status, paused_reason })

describe("réconciliation des QR de page", () => {
  it("retour au Gratuit : le plus ancien reste, les autres passent en pause « quota »", () => {
    const ops = planPagesReconcile([q("a", "active"), q("b", "active"), q("c", null)], pageLimit("free"))
    expect(ops).toEqual([
      { id: "b", patch: { status: "paused", paused_reason: PAUSE_PAR_LE_PLAN } },
      { id: "c", patch: { status: "paused", paused_reason: PAUSE_PAR_LE_PLAN } },
    ])
  })
  it("le choix du client tient : un actif récent n'est pas remplacé par un ancien en pause « quota »", () => {
    // Le client a mis A en pause lui-même et rallumé C.
    expect(planPagesReconcile([q("a", "paused", "manual"), q("b", "paused", "quota"), q("c", "active")], 1)).toEqual([])
  })
  it("remontée de plan : les pauses « quota » se rallument, les pauses manuelles jamais", () => {
    const ops = planPagesReconcile([q("a", "active"), q("b", "paused", "quota"), q("m", "paused", "manual"), q("d", "draft")], pageLimit("pro"))
    expect(ops).toEqual([{ id: "b", patch: { status: "active", paused_reason: null } }])
  })
  it("rejouée, la réconciliation ne fait plus rien (idempotente)", () => {
    const avant = [q("a", "active"), q("b", "active")]
    const ops = planPagesReconcile(avant, 1)
    const apres = avant.map(x => ({ ...x, ...(ops.find(o => o.id === x.id)?.patch ?? {}) }))
    expect(planPagesReconcile(apres, 1)).toEqual([])
  })
  it("illimité : rien ne s'éteint ; l'avertissement compte juste", () => {
    expect(planPagesReconcile([q("a", "active"), q("b", "active")], null)).toEqual([])
    expect(pagesQuiSArretent([q("a", "active"), q("b", "active"), q("c", "active")], 1)).toBe(2)
  })
})

describe("câblage", () => {
  const lire = (p: string) => readFileSync(join(__dirname, "..", p), "utf8")
  it("le webhook réconcilie les QR de page sur montée, changement et annulation", () => {
    const r = lire("app/api/webhooks/stripe/route.ts")
    expect(r.match(/reconcilePageQrs\(outcome\.userId/g)?.length).toBe(3)
  })
  it("une pause manuelle est marquée, une activation efface le motif", () => {
    const r = lire("app/api/qr-status/route.ts")
    expect(r).toContain('if (action === "pause") updates.paused_reason = "manual"')
    expect(r).toContain('if (updates.status === "active") updates.paused_reason = null')
  })
  it("la migration ajoute la colonne", () => {
    expect(readFileSync(join(__dirname, "../../../../supabase/migrations/20261114120000_qr_codes_paused_reason.sql"), "utf8"))
      .toContain("add column if not exists paused_reason text")
  })
})

describe("déployé avant la migration", () => {
  it("reconnaît la colonne absente, et seulement elle", async () => {
    const { colonneMotifAbsente } = await import("./pauseDesPages")
    expect(colonneMotifAbsente({ code: "42703", message: 'column "paused_reason" does not exist' })).toBe(true)
    expect(colonneMotifAbsente({ code: "PGRST204", message: "Could not find the 'paused_reason' column" })).toBe(true)
    expect(colonneMotifAbsente({ code: "42501", message: "permission denied" })).toBe(false)
    expect(colonneMotifAbsente(null)).toBe(false)
  })
  it("la pause/activation retombe sur l'ancienne écriture, le webhook ne boucle pas", () => {
    const r = readFileSync(join(__dirname, "../app/api/qr-status/route.ts"), "utf8")
    expect(r).toContain("delete updates.paused_reason")
    const w = readFileSync(join(__dirname, "../app/api/webhooks/stripe/route.ts"), "utf8")
    expect(w).toContain("if (error && colonneMotifAbsente(error))")
  })
})
