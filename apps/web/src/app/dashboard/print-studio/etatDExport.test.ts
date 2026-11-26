import { describe, it, expect } from "vitest"
import { etatDExport } from "./etatDExport"

const c = (...s: string[]) => s.map(status => ({ status }))

describe("la pastille d'export ne se dit jamais prête sans QR (v393)", () => {
  it("mise en page irréprochable mais pas de QR : il manque le QR, pas « prêt »", () => {
    expect(etatDExport(c("pass", "pass"), false)).toEqual({ etat: "sans-qr", libelle: "Il manque votre QR" })
  })
  it("un point bloquant passe avant le QR manquant", () => {
    expect(etatDExport(c("fail", "warn", "fail"), false)).toEqual({ etat: "a-corriger", libelle: "2 à corriger" })
  })
  it("le QR manquant passe avant les simples avertissements", () => {
    expect(etatDExport(c("warn"), false).etat).toBe("sans-qr")
  })
  it("avec un QR : à vérifier, puis prêt", () => {
    expect(etatDExport(c("warn", "pass", "warn"), true)).toEqual({ etat: "a-verifier", libelle: "À vérifier · 2" })
    expect(etatDExport(c("pass"), true)).toEqual({ etat: "pret", libelle: "Prêt à imprimer" })
  })
})
