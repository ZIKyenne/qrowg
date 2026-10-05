import { describe, it, expect } from "vitest"
import { normalizeUrl, escapeWifi, buildWifi, buildTel, buildSms, buildEmail, buildVCard, etiquetteDuQr, nomDeLaFiche } from "./qrLinkUtils"
import { echapperVCard } from "@/lib/vcard"

describe("buildSms", () => {
  it("format SMSTO avec numero nettoye et message", () => {
    expect(buildSms("+33 6 12 34 56 78", "Bonjour")).toBe("SMSTO:+33612345678:Bonjour")
  })
  it("sans message = numero seul (pas de : superflu)", () => {
    expect(buildSms("0612345678")).toBe("SMSTO:0612345678")
  })
  it("message vide/espaces ignore", () => {
    expect(buildSms("06", "   ")).toBe("SMSTO:06")
  })
  it("numero vide = chaine vide", () => {
    expect(buildSms("")).toBe("")
    expect(buildSms("   ", "salut")).toBe("")
  })
})

describe("buildTel", () => {
  it("prefixe tel: et ne garde que chiffres et +", () => {
    expect(buildTel("+33 6 00 00 00 00")).toBe("tel:+33600000000")
    expect(buildTel("01.23.45.67.89")).toBe("tel:0123456789")
  })
  it("vide -> chaine vide", () => {
    expect(buildTel("")).toBe("")
    expect(buildTel("   ")).toBe("")
  })
})

describe("buildEmail", () => {
  it("mailto simple", () => {
    expect(buildEmail("contact@resto.fr")).toBe("mailto:contact@resto.fr")
  })
  it("ajoute sujet et corps encodes", () => {
    expect(buildEmail("a@b.fr", "Réservation", "Bonjour, une table ?"))
      .toBe("mailto:a@b.fr?subject=R%C3%A9servation&body=Bonjour%2C%20une%20table%20%3F")
  })
  it("n'ajoute que les params fournis", () => {
    expect(buildEmail("a@b.fr", "", "Salut")).toBe("mailto:a@b.fr?body=Salut")
  })
  it("adresse vide -> chaine vide", () => {
    expect(buildEmail("", "x", "y")).toBe("")
  })
})

describe("buildVCard", () => {
  it("joint ses lignes en CRLF, comme l'exige la norme", () => {
    // Cette version joignait en LF simple — et c'est elle qui fabrique les QR
    // de contact réellement imprimés.
    expect(buildVCard({ firstName: "Marie", lastName: "Durand" })).toContain("\r\n")
  })
  it("construit une vCard 3.0 complete", () => {
    const out = buildVCard({ firstName: "Marie", lastName: "Durand", phone: "+33600000000", email: "marie@resto.fr", org: "Le Resto", title: "Gerante", url: "resto.fr" })
    expect(out).toContain("BEGIN:VCARD")
    expect(out).toContain("VERSION:3.0")
    expect(out).toContain("N:Durand;Marie;;;")
    expect(out).toContain("FN:Marie Durand")
    expect(out).toContain("ORG:Le Resto")
    expect(out).toContain("TITLE:Gerante")
    expect(out).toContain("TEL;TYPE=CELL:+33600000000")
    expect(out).toContain("EMAIL;TYPE=INTERNET:marie@resto.fr")
    expect(out).toContain("URL:https://resto.fr")
    expect(out.endsWith("END:VCARD")).toBe(true)
  })
  it("omet les champs vides", () => {
    const out = buildVCard({ firstName: "Marie" })
    expect(out).toContain("FN:Marie")
    expect(out).not.toContain("ORG:")
    expect(out).not.toContain("TEL")
    expect(out).not.toContain("EMAIL")
  })
  it("nom requis : sans prenom ni nom -> chaine vide", () => {
    expect(buildVCard({ phone: "+33600000000", email: "x@y.fr" })).toBe("")
    expect(buildVCard({})).toBe("")
  })
  it("echappe les caracteres speciaux", () => {
    expect(echapperVCard("Durand, Marie; SARL")).toBe("Durand\\, Marie\\; SARL")
    expect(buildVCard({ firstName: "Jean", org: "Dupont; Fils" })).toContain("ORG:Dupont\\; Fils")
  })
})

describe("buildWifi", () => {
  it("construit une charge WIFI standard (WPA)", () => {
    expect(buildWifi("MonResto", "secret123", "WPA")).toBe("WIFI:T:WPA;S:MonResto;P:secret123;;")
  })
  it("reseau ouvert : type nopass, mot de passe vide", () => {
    expect(buildWifi("FreeWifi", "ignore", "nopass")).toBe("WIFI:T:nopass;S:FreeWifi;P:;;")
  })
  it("echappe les caracteres speciaux", () => {
    expect(escapeWifi('a;b,c:d"e\\f')).toBe('a\\;b\\,c\\:d\\"e\\\\f')
    expect(buildWifi("Cafe;Bar", "p:w", "WPA")).toBe("WIFI:T:WPA;S:Cafe\\;Bar;P:p\\:w;;")
  })
  it("SSID vide -> chaine vide", () => {
    expect(buildWifi("", "x", "WPA")).toBe("")
    expect(buildWifi("   ", "x", "WPA")).toBe("")
  })
})

describe("normalizeUrl", () => {
  it("ajoute https:// quand aucun schema", () => {
    expect(normalizeUrl("monsite.fr")).toBe("https://monsite.fr")
    expect(normalizeUrl("instagram.com/moncompte")).toBe("https://instagram.com/moncompte")
  })
  it("laisse intacts les schemas reconnus", () => {
    expect(normalizeUrl("https://x.com")).toBe("https://x.com")
    expect(normalizeUrl("http://x.com")).toBe("http://x.com")
    expect(normalizeUrl("mailto:a@b.com")).toBe("mailto:a@b.com")
    expect(normalizeUrl("tel:+33600000000")).toBe("tel:+33600000000")
  })
  it("gere le vide et les espaces", () => {
    expect(normalizeUrl("")).toBe("")
    expect(normalizeUrl("   ")).toBe("")
    expect(normalizeUrl("  x.com  ")).toBe("https://x.com")
  })
})


// ── L'étiquette d'un QR : une seule formule (Q08) ──────────────────────────
// Elle était écrite deux fois dans l'écran — une pour l'aperçu en cours, une
// pour les vignettes de l'historique — et les deux ne traitaient pas pareil une
// valeur absente : la version de l'historique affichait « 📶 » ou « 👤 » tout
// seuls. Une seule formule, et elle se tait quand il n'y a rien à dire.
describe("étiquette d'un QR", () => {
  it("nomme chaque type par ce qu'il contient", () => {
    expect(etiquetteDuQr({ type: "wifi", ssid: "Chez Paul" } as any)).toBe("📶 Chez Paul")
    expect(etiquetteDuQr({ type: "text", text: "  Bonjour  " } as any)).toBe("Bonjour")
    expect(etiquetteDuQr({ type: "phone", phone: "+33123456789" } as any)).toBe("📞 +33123456789")
    expect(etiquetteDuQr({ type: "email", em: { to: "a@b.fr" } } as any)).toBe("✉️ a@b.fr")
    expect(etiquetteDuQr({ type: "sms", sms: { to: "0600000000" } } as any)).toBe("💬 0600000000")
    expect(etiquetteDuQr({ type: "contact", vc: { firstName: "Léa", lastName: "Martin" } } as any)).toBe("👤 Léa Martin")
  })

  it("un lien perd son protocole, qui n'apprend rien", () => {
    expect(etiquetteDuQr({ type: "link", url: "https://qrowg.com/x" } as any)).toBe("qrowg.com/x")
    expect(etiquetteDuQr({ type: "link", url: "qrowg.com" } as any)).toBe("qrowg.com")
  })

  it("et se tait plutôt que d'afficher un pictogramme orphelin", () => {
    for (const vide of [
      { type: "wifi", ssid: "" }, { type: "wifi", ssid: "   " },
      { type: "contact", vc: {} }, { type: "phone", phone: "" },
      { type: "email", em: {} }, { type: "sms", sms: {} }, { type: "text", text: "  " },
    ]) {
      expect(etiquetteDuQr(vide as any), JSON.stringify(vide)).toBe("")
    }
  })

  it("un objet vide ne fait pas tomber la formule", () => {
    expect(etiquetteDuQr({} as any)).toBe("")
  })

  it("le nom d'une fiche contact se recompose sans trou", () => {
    expect(nomDeLaFiche({ firstName: "Léa" })).toBe("Léa")
    expect(nomDeLaFiche({ lastName: "Martin" })).toBe("Martin")
    expect(nomDeLaFiche({})).toBe("")
    expect(nomDeLaFiche()).toBe("")
  })
})
