import { describe, it, expect } from "vitest"
import { buildDestUrl, validateDest } from "./qrDestination"

describe("buildDestUrl", () => {
  it("email : prefixe mailto: (idempotent)", () => {
    expect(buildDestUrl("email", "a@b.fr")).toBe("mailto:a@b.fr")
    expect(buildDestUrl("email", "mailto:a@b.fr")).toBe("mailto:a@b.fr")
  })
  it("phone : prefixe tel: et retire les espaces", () => {
    expect(buildDestUrl("phone", "+33 6 12 34 56 78")).toBe("tel:+33612345678")
    expect(buildDestUrl("phone", "tel:+33612")).toBe("tel:+33612")
  })
  it("whatsapp : wa.me sans + ni separateurs", () => {
    expect(buildDestUrl("whatsapp", "+33 6 12 34 56 78")).toBe("https://wa.me/33612345678")
  })
  it("url / file / page : valeur brute", () => {
    expect(buildDestUrl("url", "exemple.fr")).toBe("exemple.fr")
    expect(buildDestUrl("file", "https://cdn.fr/x.pdf")).toBe("https://cdn.fr/x.pdf")
    expect(buildDestUrl("page", "id-123")).toBe("id-123")
  })
})

describe("validateDest", () => {
  it("valeur vide -> requise", () => {
    expect(validateDest("url", "")).toBe("La valeur est requise")
    expect(validateDest("url", "   ")).toBe("La valeur est requise")
  })
  it("url : accepte un domaine nu, rejette une url cassee", () => {
    expect(validateDest("url", "exemple.fr")).toBeNull()
    expect(validateDest("url", "https://x.fr/path")).toBeNull()
    expect(validateDest("url", "http://")).toBe("URL invalide")
  })
  it("email valide / invalide", () => {
    expect(validateDest("email", "a@b.fr")).toBeNull()
    expect(validateDest("email", "mailto:a@b.fr")).toBeNull()
    expect(validateDest("email", "pasunemail")).toBe("Email invalide")
  })
  it("phone valide / invalide", () => {
    expect(validateDest("phone", "+33 6 12 34 56")).toBeNull()
    expect(validateDest("phone", "12")).toBe("Numéro invalide")
  })
  it("whatsapp valide / invalide", () => {
    expect(validateDest("whatsapp", "+33612345678")).toBeNull()
    expect(validateDest("whatsapp", "abc")).toBe("Numéro WhatsApp invalide")
  })
  it("page : UUID 36 caracteres", () => {
    expect(validateDest("page", "0123abcd-0123-0123-0123-0123456789ab")).toBeNull()
    expect(validateDest("page", "trop-court")).toBe("ID de page invalide")
  })
  it("type inconnu (entree non fiable) -> rejete", () => {
    // @ts-expect-error test volontaire d'un type hors union
    expect(validateDest("javascript", "alert(1)")).toBe("Type de destination invalide")
  })
})
