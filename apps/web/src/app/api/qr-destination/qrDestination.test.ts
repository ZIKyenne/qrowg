import { describe, it, expect } from "vitest"
import { buildDestUrl, validateDest } from "./qrDestination"
import { resolveOverrideDest } from "../../q/[code]/qrResolve"

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
  it("url : un « http » qui n'est pas http:// ne passe pas, un domaine en « http… » oui (v399)", () => {
    for (const v of ["httpjavascript:alert(1)", "httpx:evil", "javascript:alert(1)", "data:text/html,x", "ftp://serveur.fr/x"])
      expect(validateDest("url", v), v).toBe("URL invalide")
    for (const v of ["httpbin.org", "httpstatus.fr/menu", " https://x.fr ", "HTTPS://X.FR"])
      expect(validateDest("url", v), v).toBeNull()
  })
  it("url / file : ce qui est accepté à l'enregistrement mène, au scan, à une vraie adresse web", () => {
    // Deux règles qui divergeaient : « ok » à l'enregistrement, page d'erreur au scan.
    // (L'inverse n'est pas voulu : « mailto: » en type url deviendrait « https://mailto:… ».)
    const corpus = ["exemple.fr", "https://x.fr/p?q=1", "http://x.fr", "httpbin.org", "httpjavascript:alert(1)", "httpx:evil",
      "javascript:alert(1)", "data:text/html,x", "ftp://serveur.fr", "mailto:a@b.fr", "tel:+33612", "x.fr:8080/menu", "HTTPS://X.FR"]
    let acceptees = 0
    for (const type of ["url", "file"] as const)
      for (const v of corpus) {
        if (validateDest(type, v) !== null) continue
        acceptees++
        const sortie = resolveOverrideDest({ type, value: v, url: buildDestUrl(type, v) })
        expect(sortie, `${type} « ${v} » accepté puis mort au scan`).not.toBeNull()
        expect(() => new URL(sortie!), `${type} « ${v} » → « ${sortie} »`).not.toThrow()
        expect(new URL(sortie!).protocol, `${type} « ${v} »`).toMatch(/^https?:$/)
      }
    expect(acceptees, "le corpus contient des entrées valides").toBeGreaterThanOrEqual(10)
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
