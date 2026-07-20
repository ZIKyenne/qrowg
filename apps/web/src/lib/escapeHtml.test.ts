import { describe, it, expect } from "vitest"
import { escapeHtml } from "./escapeHtml"

describe("escapeHtml", () => {
  it("echappe les caracteres de contenu HTML", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(escapeHtml("a & b")).toBe("a &amp; b")
  })
  it("echappe les guillemets (securite en contexte d'attribut)", () => {
    expect(escapeHtml('x" onclick="alert(1)')).toBe("x&quot; onclick=&quot;alert(1)")
    expect(escapeHtml("O'Brien")).toBe("O&#39;Brien")
  })
  it("empeche une sortie d'attribut href", () => {
    const out = escapeHtml('mailto:a@b.fr"><img src=x onerror=alert(1)>')
    expect(out).not.toContain('"')
    expect(out).not.toContain("<")
    expect(out).toContain("&quot;")
    expect(out).toContain("&lt;img")
  })
  it("null / undefined -> chaine vide", () => {
    expect(escapeHtml(null)).toBe("")
    expect(escapeHtml(undefined)).toBe("")
    expect(escapeHtml(0)).toBe("0")
  })
  it("laisse un texte simple intact", () => {
    expect(escapeHtml("Marie Durand")).toBe("Marie Durand")
  })
})
