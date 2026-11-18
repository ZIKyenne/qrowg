import { describe, it, expect } from "vitest"
import { etatQuota } from "./quotaQr"

const stat = (n: number) => Array.from({ length: n }, () => ({ dynamic: false }))
const modif = (n: number) => Array.from({ length: n }, () => ({ dynamic: true }))

// Depuis le 18 nov. : les QR vers un lien SIMPLES sont illimités pour tous les
// plans (limits.qr = null). Seuls les modifiables après impression sont comptés.
describe("un compte gratuit", () => {
  it("part avec des QR simples illimités, dont un modifiable", () => {
    const e = etatQuota("free", [])
    expect(e.restants).toBeNull()
    expect(e.restantsModifiables).toBe(1)
    expect(e.peutEnregistrer).toBe(true)
    expect(e.peutCreerModifiable).toBe(true)
    expect(e.raison).toBeNull()
  })

  it("garde ses QR simples quand le modifiable est pris", () => {
    const e = etatQuota("free", modif(1))
    expect(e.peutCreerModifiable).toBe(false)
    expect(e.peutEnregistrer).toBe(true)
    expect(e.raisonModifiable).toContain("QR modifiable")
    expect(e.raisonModifiable).toContain("non modifiable") // dit ce qui reste possible
    expect(e.raison).toBeNull()                            // ...et ne bloque pas le reste
  })

  it("n'est jamais arrêté pour un QR simple, même au deux-centième", () => {
    const e = etatQuota("free", [...stat(200), ...modif(1)])
    expect(e.peutEnregistrer).toBe(true)
    expect(e.raison).toBeNull()
    // …le modifiable, lui, reste compté.
    expect(e.peutCreerModifiable).toBe(false)
    expect(e.raisonModifiable).toContain("Gratuit")
  })
})

describe("le refus dit quoi faire", () => {
  it("nomme le plan, le nombre, et la sortie", () => {
    const e = etatQuota("pro", modif(20))
    expect(e.raisonModifiable).toContain("20 QR modifiable")
    expect(e.raisonModifiable).toContain("Établissement")
    expect(e.raisonModifiable).toContain("non modifiable") // la sortie : un QR simple reste possible
  })

  it("ne parle jamais d'essai ni d'expiration", () => {
    // Un QR collé sur une table ne meurt plus au bout de 30 jours : plus aucun
    // message ne doit le laisser croire.
    for (const p of ["free", "pro", "business"]) {
      const e = etatQuota(p, [...stat(40), ...modif(40)])
      for (const t of [e.raison, e.raisonModifiable]) {
        if (!t) continue
        expect(t).not.toMatch(/essai|expir|30 jours|\/ ?mois/i)
      }
    }
  })

  it("des QR simples, si nombreux soient-ils, ne bloquent rien", () => {
    for (const p of ["free", "starter", "pro"]) {
      const e = etatQuota(p, stat(99))
      expect(e.peutEnregistrer, p).toBe(true)
      expect(e.peutCreerModifiable, p).toBe(true)
      expect(e.raison, p).toBeNull()
    }
  })
})

describe("le plan Business", () => {
  it("n'annonce aucune limite", () => {
    const e = etatQuota("business", [...stat(500), ...modif(500)])
    expect(e.restants).toBeNull()
    expect(e.restantsModifiables).toBeNull()
    expect(e.peutEnregistrer).toBe(true)
    expect(e.peutCreerModifiable).toBe(true)
    expect(e.raison).toBeNull()
    expect(e.raisonModifiable).toBeNull()
  })
})

describe("les paliers intermédiaires", () => {
  it("Établissement : QR simples illimités, 20 modifiables", () => {
    const e = etatQuota("pro", [])
    expect(e.restants).toBeNull()
    expect(e.restantsModifiables).toBe(20)
  })

  it("un plan inconnu retombe sur le gratuit, jamais sur l'illimité", () => {
    const e = etatQuota("plan_qui_nexiste_pas", modif(1))
    expect(e.peutCreerModifiable).toBe(false)
  })
})
