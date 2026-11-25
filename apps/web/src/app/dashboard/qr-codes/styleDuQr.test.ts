import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { renduDuQr, styleComplet, eccEffectif, COLONNES_DU_STYLE } from "./styleDuQr"
import { DEFAULT_STYLE } from "./styleQr"
import { sansCommentaires } from "@/lib/codeSeul"

// Vague 3, point 2 (revue du 23 nov.) : un QR se dessine d'une seule façon, dans
// le QR Studio comme sur un support imprimé.

describe("le style enregistré, lu comme le QR Studio le lit", () => {
  it("couleurs, modules, correction du QR", () => {
    const r = renduDuQr({ foreground_color: "#0B6E4F", background_color: "#FFF6E0", error_correction: "Q", style_config: { dotStyle: "dot", cornerStyle: "circle" } })
    expect([r.fg, r.bg, r.ecc]).toEqual(["#0B6E4F", "#FFF6E0", "Q"])
    expect(r.style).toMatchObject({ dotStyle: "dot", cornerStyle: "circle", silence: DEFAULT_STYLE.silence })
  })
  it("un logo (même dans l'ancienne colonne logo_url) force la correction H", () => {
    const r = renduDuQr({ error_correction: "M", logo_url: "https://cdn.exemple.fr/logo.png" })
    expect(r.style.logoUrl).toBe("https://cdn.exemple.fr/logo.png")
    expect(r.ecc).toBe("H")
    expect(styleComplet({ style_config: { logoUrl: "https://a/b.png" }, logo_url: "https://c/d.png" }).logoUrl).toBe("https://a/b.png")
    expect(eccEffectif({}, "L")).toBe("L")
  })
  it("rien d'enregistré ou une valeur absurde : les défauts, jamais un plantage", () => {
    expect(renduDuQr({})).toMatchObject({ fg: "#080808", bg: "#FFFFFF", ecc: "M" })
    expect(renduDuQr({ error_correction: "Z" as never, style_config: null }).ecc).toBe("M")
  })
})

describe("les deux studios passent par la même règle", () => {
  const lire = (p: string) => sansCommentaires(readFileSync(join(__dirname, "..", p), "utf8"))
  it("le QR Studio ne recompose plus son style à la main", () => {
    const s = lire("qr-codes/QRStudioZero.tsx")
    expect(s).toContain("styleComplet(active)")
    expect(s).toContain("eccEffectif(styleConf, ecc)")
    expect(s).toContain("useStyleDeRendu(styleConf)")
    expect(s).not.toContain("composeLogo(")
  })
  it("le Print Studio demande le style à la base, et dessine avec lui", () => {
    // La lecture en base reste dans l'atelier ; le QR vectoriel est dans le rendu du support (v383).
    const s = lire("print-studio/PrintStudioClient.tsx") + lire("print-studio/renduDuSupport.tsx")
    expect((s.match(/\$\{COLONNES_DU_STYLE\}/g) ?? []).length).toBe(2)
    expect(s).toContain("rendu: renduDuQr(r)")
    expect(s).toContain("rendu={qrRendu ?? null}")
    expect(s, "le QR n'est plus redessiné avec une correction M et un style vide en dur")
      .not.toMatch(/createQRSvg\(\{ data: value \|\| "https:\/\/qrowg\.com", fg, bg, ecc: "M", style: \{\}/)
    expect(COLONNES_DU_STYLE).toBe("foreground_color, background_color, error_correction, style_config, logo_url")
  })
})
