import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fusionnerMessages } from "./messagesAJour"

describe("Messages se tient à jour", () => {
  it("les nouveaux en tête, ce que le commerçant a changé n'est pas écrasé", () => {
    const actuels = [{ id: "b", lu: true }, { id: "a", lu: false }]
    const frais = [{ id: "c", lu: false }, { id: "b", lu: false }, { id: "a", lu: false }]
    expect(fusionnerMessages(actuels, frais)).toEqual([{ id: "c", lu: false }, { id: "b", lu: true }, { id: "a", lu: false }])
  })
  it("rien de neuf : la même liste, sans nouveau rendu inutile", () => {
    const actuels = [{ id: "a" }]
    expect(fusionnerMessages(actuels, [{ id: "a" }])).toBe(actuels)
  })
  it("l'écran Messages relit la liste, et seulement quand il est visible", () => {
    const src = readFileSync(join(__dirname, "..", "app", "dashboard", "leads", "LeadsClient.tsx"), "utf8")
    expect(src).toContain("fusionnerMessages(")
    expect(src).toContain("RAFRAICHIR_TOUTES_LES_MS")
    expect(src).toContain('document.visibilityState === "visible"')
  })
})
