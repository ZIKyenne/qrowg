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
  // « Une pause manuelle est marquée, une activation efface le motif » : JOUÉ
  // depuis v400 (app/api/qr-status/bancStatut.test.ts).
  it("la migration ajoute la colonne", () => {
    expect(readFileSync(join(__dirname, "../../../../supabase/migrations/20261114120000_qr_codes_paused_reason.sql"), "utf8"))
      .toContain("add column if not exists paused_reason text")
  })
})

describe("retour au gratuit, jours offerts écoulés (U1)", () => {
  it("l'e-mail dit que toutes les pages sont en pause, sans inviter à en choisir une", async () => {
    const { phrasePagesEssaiEcoule } = await import("./pauseDesPages")
    expect(phrasePagesEssaiEcoule(0, 30)).toBeNull()
    const une = phrasePagesEssaiEcoule(1, 30)!
    expect(une).toContain("Les 30 jours de page offerts")
    expect(une).toContain("votre page n'est plus visible")
    expect(phrasePagesEssaiEcoule(3, 30)).toContain("vos 3 pages ne sont plus visibles")
    expect(une).not.toMatch(/Choisissez/)
  })
  it("le webhook prend cette voie quand l'essai est expiré, et compte la page gardée par le quota", () => {
    const r = readFileSync(join(__dirname, "..", "app/api/webhooks/stripe/route.ts"), "utf8")
    expect(r).toContain("if (essaiExpire(plan, prof.free_published_since))")
    expect(r).toContain("const enLigne = (count ?? 0) + nb")
    expect(r).toContain('emailButton("Choisir un plan →", "https://qrowg.com/upgrade")')
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
  // La pause sans la colonne du motif est JOUÉE depuis v400 (qr-status/bancStatut.test.ts).
  it("le webhook ne boucle pas quand la colonne du motif manque", () => {
    const w = readFileSync(join(__dirname, "../app/api/webhooks/stripe/route.ts"), "utf8")
    expect(w).toContain("if (error && colonneMotifAbsente(error))")
  })
})
