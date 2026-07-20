import { describe, it, expect } from "vitest"
import { classifyTraffic } from "./detectTrafficSource"

describe("classifyTraffic — QR", () => {
  it("détecte un scan QR via utm_medium / qr / src", () => {
    expect(classifyTraffic("?utm_medium=qr", "https://instagram.com").source).toBe("qr_scan")
    expect(classifyTraffic("?qr=1", "").source).toBe("qr_scan")
    expect(classifyTraffic("?src=qr", "").source).toBe("qr_scan")
  })
  it("le QR est prioritaire sur tout le reste", () => {
    expect(classifyTraffic("?utm_medium=qr&utm_source=instagram", "https://facebook.com").source).toBe("qr_scan")
  })
})

describe("classifyTraffic — utm_source", () => {
  it("mappe une source connue (insensible à la casse)", () => {
    expect(classifyTraffic("?utm_source=Instagram", "").source).toBe("instagram")
    expect(classifyTraffic("?utm_source=whatsapp", "").source).toBe("whatsapp")
  })
  it("'x' -> twitter", () => {
    expect(classifyTraffic("?utm_source=x", "").source).toBe("twitter")
  })
  it("prioritaire sur le référent (cas WhatsApp/Telegram qui effacent le referrer)", () => {
    expect(classifyTraffic("?utm_source=telegram", "https://google.com").source).toBe("telegram")
  })
  it("utm_source inconnu -> on retombe sur le référent", () => {
    expect(classifyTraffic("?utm_source=inconnu", "https://instagram.com").source).toBe("instagram")
    expect(classifyTraffic("?utm_source=inconnu", "").source).toBe("direct")
  })
})

describe("classifyTraffic — référent", () => {
  it("classe les réseaux et retourne le domaine (sans www, sans chemin)", () => {
    expect(classifyTraffic("", "https://www.instagram.com/p/abc")).toEqual({ source: "instagram", referrer: "instagram.com" })
    expect(classifyTraffic("", "https://t.co/xyz").source).toBe("twitter")
    expect(classifyTraffic("", "https://lnkd.in/xyz").source).toBe("linkedin")
    expect(classifyTraffic("", "https://vm.tiktok.com/xyz").source).toBe("tiktok")
  })
  it("moteur de recherche -> google", () => {
    expect(classifyTraffic("", "https://www.google.fr/search?q=x").source).toBe("google")
    expect(classifyTraffic("", "https://duckduckgo.com/").source).toBe("google")
  })
  it("domaine inconnu -> referral avec le domaine (sous-domaine conservé, seul www retiré)", () => {
    expect(classifyTraffic("", "https://unblog.example.fr/article")).toEqual({ source: "referral", referrer: "unblog.example.fr" })
    expect(classifyTraffic("", "https://www.example.fr/x").referrer).toBe("example.fr")
  })
  it("yahoo : mail.yahoo -> email, mais yahoo/recherche -> referral (plus de faux 'email')", () => {
    expect(classifyTraffic("", "https://mail.yahoo.com/").source).toBe("email")
    expect(classifyTraffic("", "https://fr.search.yahoo.com/search?q=x").source).toBe("referral")
    expect(classifyTraffic("", "https://yahoo.com/").source).toBe("referral")
  })
  it("pas de référent -> direct", () => {
    expect(classifyTraffic("", "")).toEqual({ source: "direct", referrer: null })
  })
  it("référent malformé -> direct (pas de crash)", () => {
    expect(classifyTraffic("", "pas-une-url").source).toBe("direct")
  })
  it("ne stocke jamais le chemin complet (RGPD : domaine seul)", () => {
    const info = classifyTraffic("", "https://reddit.com/r/secret/very-private-thread")
    expect(info.referrer).toBe("reddit.com")
    expect(info.referrer).not.toContain("secret")
  })
})
