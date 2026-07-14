import { describe, it, expect } from "vitest"
import { selKind, mobileContextTools, type SelKind } from "./mobileContextTools"

describe("selKind — priorite de deduction", () => {
  it("multi l'emporte sur tout", () => {
    expect(selKind({ multi: true, isQr: true, isText: true })).toBe("multi")
  })
  it("QR avant image/texte", () => {
    expect(selKind({ isQr: true, isImage: true })).toBe("qr")
  })
  it("image avant texte", () => {
    expect(selKind({ isImage: true, isText: true })).toBe("image")
  })
  it("texte", () => expect(selKind({ isText: true })).toBe("text"))
  it("bouton (label non nul) quand ni texte ni image", () => {
    expect(selKind({ label: "RÉSERVER" })).toBe("button")
  })
  it("groupe", () => expect(selKind({ isGroupObj: true })).toBe("group"))
  it("forme par defaut", () => expect(selKind({})).toBe("shape"))
  it("label vide chaine => reste 'button' (non nul)", () => {
    expect(selKind({ label: "" })).toBe("button")
  })
  it("label null => forme", () => expect(selKind({ label: null })).toBe("shape"))
})

const ALL: SelKind[] = ["qr", "text", "image", "button", "group", "shape", "multi"]

describe("mobileContextTools — invariants", () => {
  it("chaque type renvoie au moins 2 actions dont Supprimer", () => {
    for (const k of ALL) {
      const tools = mobileContextTools(k)
      expect(tools.length).toBeGreaterThanOrEqual(2)
      expect(tools.some(t => t.id === "delete")).toBe(true)
    }
  })
  it("tous les outils ont id + label + icon non vides", () => {
    for (const k of ALL) {
      for (const t of mobileContextTools(k)) {
        expect(t.id).toBeTruthy()
        expect(t.label).toBeTruthy()
        expect(t.icon).toBeTruthy()
      }
    }
  })
  it("ids uniques dans chaque barre", () => {
    for (const k of ALL) {
      const ids = mobileContextTools(k).map(t => t.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe("mobileContextTools — specifiques par type", () => {
  it("non-multi (hors QR) commencent par 'settings' (Modifier)", () => {
    for (const k of ALL.filter(k => k !== "multi" && k !== "qr")) {
      expect(mobileContextTools(k)[0].id).toBe("settings")
    }
  })
  it("QR expose des intentions directes (couleurs/modules/coins/correction), pas 'settings'", () => {
    const ids = mobileContextTools("qr").map(t => t.id)
    expect(ids).not.toContain("settings")
    for (const id of ["colors", "modules", "corners", "ecc"]) expect(ids).toContain(id)
  })
  it("multi n'a PAS 'settings' mais a align + group", () => {
    const ids = mobileContextTools("multi").map(t => t.id)
    expect(ids).not.toContain("settings")
    expect(ids).toContain("align")
    expect(ids).toContain("group")
  })
  it("mono-objet expose 'stack' (empilement), pas multi", () => {
    for (const k of ALL.filter(k => k !== "multi")) {
      expect(mobileContextTools(k).some(t => t.id === "stack")).toBe(true)
    }
    expect(mobileContextTools("multi").some(t => t.id === "stack")).toBe(false)
  })
  it("qr propose 'Habiller'", () => {
    expect(mobileContextTools("qr").some(t => t.id === "dress")).toBe(true)
  })
  it("texte propose les tailles A- / A+", () => {
    const ids = mobileContextTools("text").map(t => t.id)
    expect(ids).toContain("sizeUp")
    expect(ids).toContain("sizeDown")
  })
  it("image propose l'ordre devant/derriere", () => {
    const ids = mobileContextTools("image").map(t => t.id)
    expect(ids).toContain("front")
    expect(ids).toContain("back")
  })
  it("groupe propose 'Dégrouper'", () => {
    expect(mobileContextTools("group").some(t => t.id === "ungroup")).toBe(true)
  })
})
