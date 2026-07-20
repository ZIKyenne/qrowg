import { describe, it, expect } from "vitest"
import { ALLOWED_TRANSITIONS, ACTION_TO_STATUS, canTransition, type QRStatus } from "./qrStatus"

describe("canTransition", () => {
  it("active : pause/archive/expire OK, activate KO", () => {
    expect(canTransition("active", "pause")).toBe(true)
    expect(canTransition("active", "archive")).toBe(true)
    expect(canTransition("active", "expire")).toBe(true)
    expect(canTransition("active", "activate")).toBe(false)
    expect(canTransition("active", "restore")).toBe(false)
  })
  it("draft : activate/archive OK, pause KO", () => {
    expect(canTransition("draft", "activate")).toBe(true)
    expect(canTransition("draft", "archive")).toBe(true)
    expect(canTransition("draft", "pause")).toBe(false)
  })
  it("paused : activate/archive OK, expire KO", () => {
    expect(canTransition("paused", "activate")).toBe(true)
    expect(canTransition("paused", "expire")).toBe(false)
  })
  it("archived : restore uniquement", () => {
    expect(canTransition("archived", "restore")).toBe(true)
    expect(canTransition("archived", "activate")).toBe(false)
    expect(canTransition("archived", "pause")).toBe(false)
  })
  it("expired : activate/archive OK", () => {
    expect(canTransition("expired", "activate")).toBe(true)
    expect(canTransition("expired", "archive")).toBe(true)
  })
  it("statut ou action inconnus -> false", () => {
    expect(canTransition("mystere", "activate")).toBe(false)
    expect(canTransition("active", "n_importe_quoi")).toBe(false)
  })
})

describe("ACTION_TO_STATUS", () => {
  it("mappe chaque action vers son statut", () => {
    expect(ACTION_TO_STATUS.activate).toBe("active")
    expect(ACTION_TO_STATUS.pause).toBe("paused")
    expect(ACTION_TO_STATUS.archive).toBe("archived")
    expect(ACTION_TO_STATUS.restore).toBe("active")
    expect(ACTION_TO_STATUS.expire).toBe("expired")
  })
})

// Invariants : garantissent que la machine a etats reste coherente.
describe("coherence de la machine a etats", () => {
  it("toute action de transition a un statut resultant defini", () => {
    const actions = new Set(Object.values(ALLOWED_TRANSITIONS).flat())
    for (const a of actions) {
      expect(ACTION_TO_STATUS[a as keyof typeof ACTION_TO_STATUS], `action ${a} sans statut cible`).toBeTruthy()
    }
  })
  it("tout statut resultant est un etat connu (reachable)", () => {
    const states = new Set(Object.keys(ALLOWED_TRANSITIONS))
    for (const s of Object.values(ACTION_TO_STATUS)) {
      expect(states.has(s), `statut ${s} absent de ALLOWED_TRANSITIONS`).toBe(true)
    }
  })
  it("aucune transition ne boucle sur place (statut resultant != source)", () => {
    for (const [status, actions] of Object.entries(ALLOWED_TRANSITIONS)) {
      for (const a of actions) {
        const target = ACTION_TO_STATUS[a as keyof typeof ACTION_TO_STATUS]
        expect(target, `${status} -> ${a} reste sur ${status}`).not.toBe(status as QRStatus)
      }
    }
  })
})
