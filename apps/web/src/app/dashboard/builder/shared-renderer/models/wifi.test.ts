import { describe, it, expect } from "vitest"
import { wifiDuBloc, masquer } from "./wifi"

describe("le Wi-Fi", () => {
  it("rien tant qu'aucun réseau n'est nommé", () => {
    expect(wifiDuBloc({})).toBeNull()
    expect(wifiDuBloc({ ssid: "   ", password: "x" })).toBeNull()
  })
  it("un réseau sans mot de passe est ouvert", () => {
    expect(wifiDuBloc({ ssid: "Bistrot-Invités" })).toEqual({ reseau: "Bistrot-Invités", motDePasse: "", ouvert: true, note: "" })
    expect(wifiDuBloc({ ssid: "Bistrot", password: " cafe2026 ", note: "Gratuit" })).toEqual({ reseau: "Bistrot", motDePasse: "cafe2026", ouvert: false, note: "Gratuit" })
  })
  it("le masque ne dit pas la longueur exacte des mots de passe courts ni longs", () => {
    expect(masquer("ab")).toBe("••••••")
    expect(masquer("cafe2026")).toBe("••••••••")
    expect(masquer("x".repeat(40))).toBe("••••••••••••")
  })
})
