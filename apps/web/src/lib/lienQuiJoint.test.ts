// Un lien de contact se fabrique, il ne se concatène pas — garde de classe.
//
// Relevé du 14 septembre. Quarante-trois endroits fabriquent un lien de contact.
// Le téléphone et WhatsApp passent presque partout par les aides du produit.
// **L'adresse e-mail, elle, est toujours concaténée à la main** — onze fois,
// sans jamais être vérifiée :
//
//   models/contactEtAction.ts:65    `mailto:${mail}`
//   models/equipeEtContacts.ts:24   `mailto:${mail}`
//   models/emailButton.ts:8         `mailto:${email}${c.subject ? …}`
//   renduLegacy.tsx:728, 1012, 1775, 1804
//   blocsPublics.tsx:585, 667       le repli courrier du formulaire
//   builderPreview, TemplatePreviewModal, LeadsClient, contact/page, api/contact
//
// Alors que le produit sait exactement pourquoi il faudrait : `destinataireLead`
// portait depuis le 6 septembre une règle qui refuse virgules, chevrons et
// retours à la ligne — « un en-tête d'e-mail se coupe à la ligne, et une adresse
// qui en contient permettrait d'ajouter des destinataires ou des en-têtes ».
// Elle ne servait qu'au destinataire d'un formulaire.
//
//   email = "contact@resto.fr?bcc=quelquun@ailleurs.fr"
//     Chaque client qui écrit au commerçant écrit aussi à un tiers, en copie
//     cachée, sans que ni l'un ni l'autre ne le voie.
//
//   email = "contact@resto.fr, direction@resto.fr"
//     Le brouillon s'ouvre avec un destinataire que la messagerie refuse. Le
//     bouton a l'air vivant, il ne mène nulle part. Le cas le plus fréquent.
//
// La classe : **un lien de contact se fabrique, il ne se concatène pas.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  adresseEmailValide, lienEmail, lienTelephone, lienWhatsApp, lienSms,
  lienPartageEmail, chiffresDuNumero,
} from "./lienDeContact"
import { adresseEmailValide as depuisLead } from "./destinataireLead"
import { telLink, waLink } from "@/app/dashboard/builder/types"
import { buildTel, buildSms, buildEmail } from "@/app/dashboard/qr-link/qrLinkUtils"
import { emailButtonViewModel } from "@/app/dashboard/builder/shared-renderer/models/emailButton"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function fichiers(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

describe("une adresse, ou rien", () => {
  it("les paramètres glissés dans le champ ne sont pas une adresse", () => {
    expect(adresseEmailValide("contact@resto.fr?bcc=ailleurs@x.fr")).toBeNull()
    expect(adresseEmailValide("contact@resto.fr?subject=Bonjour")).toBeNull()
    expect(adresseEmailValide("contact@resto.fr#x")).toBeNull()
    expect(adresseEmailValide("contact@resto.fr, direction@resto.fr")).toBeNull()
    expect(adresseEmailValide("contact@resto.fr\nbcc: x@y.fr")).toBeNull()
    expect(adresseEmailValide("<contact@resto.fr>")).toBeNull()
    expect(adresseEmailValide("contact@resto.fr")).toBe("contact@resto.fr")
    expect(adresseEmailValide("  contact@resto.fr  "), "les bords ne comptent pas").toBe("contact@resto.fr")
  })

  it("la règle est la même que celle du destinataire d'un formulaire", () => {
    expect(depuisLead).toBe(adresseEmailValide)
  })

  it("un lien mort n'est pas rendu — l'appelant reçoit `null`", () => {
    expect(lienEmail("contact@resto.fr?bcc=x@y.fr")).toBeNull()
    expect(lienEmail("")).toBeNull()
    expect(lienEmail(undefined)).toBeNull()
    expect(lienEmail("contact@resto.fr")).toBe("mailto:contact@resto.fr")
  })

  it("le sujet et le corps sont encodés ici, pas glissés dans l'adresse", () => {
    const l = lienEmail("contact@resto.fr", { sujet: "Table pour 2 ?", corps: "Bonjour & merci" })
    expect(l).toBe("mailto:contact@resto.fr?subject=Table%20pour%202%20%3F&body=Bonjour%20%26%20merci")
    expect(lienEmail("contact@resto.fr", { sujet: "  " }), "un sujet vide n'ajoute rien").toBe("mailto:contact@resto.fr")
  })

  it("le bouton « Envoyer un email » ne s'affiche plus quand l'adresse est cassée", () => {
    expect(emailButtonViewModel({ email: "contact@resto.fr" }).link.visible).toBe(true)
    expect(emailButtonViewModel({ email: "contact@resto.fr?bcc=x@y.fr" }).link.visible).toBe(false)
    expect(emailButtonViewModel({ email: "pas une adresse" }).link.visible).toBe(false)
  })
})

describe("un numéro que l'appareil sait composer", () => {
  it("le téléphone garde le « + » international et rien d'autre", () => {
    expect(lienTelephone("06 12 34 56 78")).toBe("tel:0612345678")
    expect(lienTelephone("+33 6 12 34 56 78")).toBe("tel:+33612345678")
    expect(lienTelephone("appelez-nous")).toBe("")
    expect(lienTelephone(null)).toBe("")
  })

  it("WhatsApp n'accepte ni « + » ni espace — les laisser casse le bouton", () => {
    expect(lienWhatsApp("+33 6 12 34 56 78")).toBe("https://wa.me/33612345678")
    expect(lienWhatsApp("06 12 34 56 78", undefined, "33"), "le 0 national tombe devant l'indicatif").toBe("https://wa.me/33612345678")
    expect(lienWhatsApp("33612345678", undefined, "33")).toBe("https://wa.me/33612345678")
    expect(lienWhatsApp("")).toBe("")
    expect(chiffresDuNumero("06.12.34.56.78", "33")).toBe("33612345678")
  })

  it("le SMS et le partage ont aussi leur forme", () => {
    expect(lienSms("+33612345678", "Bonjour")).toBe("SMSTO:+33612345678:Bonjour")
    expect(lienSms("", "Bonjour")).toBe("")
    // Le partage est le seul `mailto:` sans destinataire — il a son nom, sinon
    // chaque appelant le refabrique et la règle se contourne d'elle-même.
    expect(lienPartageEmail("Sujet", "Corps")).toBe("mailto:?subject=Sujet&body=Corps")
    expect(lienPartageEmail()).toBe("mailto:")
  })

  it("les aides d'avant délèguent — un seul geste, pas quatre", () => {
    expect(telLink).toBe(lienTelephone)
    expect(waLink).toBe(lienWhatsApp)
    expect(buildTel("06 12 34 56 78")).toBe("tel:0612345678")
    expect(buildSms("0612345678")).toBe("SMSTO:0612345678")
    expect(buildEmail("contact@resto.fr", "Bonjour")).toBe("mailto:contact@resto.fr?subject=Bonjour")
    expect(buildEmail("contact@resto.fr?bcc=x@y.fr"), "un QR ne fabrique pas de copie cachée").toBe("")
  })
})

describe("garde de classe : aucun lien de contact concaténé à la main", () => {
  /** Les formes qui fabriquent un lien de contact sans passer par le module. */
  const A_LA_MAIN = [
    /`mailto:/, /"mailto:"\s*\+/, /'mailto:'\s*\+/,
    /`tel:/, /"tel:"\s*\+/,
    /`SMSTO:/, /wa\.me\/\$\{/, /`https:\/\/wa\.me\//,
  ]

  it("aucun fichier du produit n'en fabrique un", () => {
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/lienDeContact.ts") continue   // le seul endroit qui a le droit
      fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
        if (/^\s*(\/\/|\*)/.test(l)) return          // les commentaires citent l'ancien code
        if (A_LA_MAIN.some(rx => rx.test(l))) fautes.push(`${rel}:${i + 1} — ${l.trim().slice(0, 70)}`)
      })
    }
    expect(fautes, "passer par lib/lienDeContact").toEqual([])
  })

  it("et le balayage voit bien où on joint quelqu'un — sinon il ne prouve rien", () => {
    let fichiersConcernes = 0, appels = 0
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      const n = (src.match(/\b(?:lienEmail|lienTelephone|lienWhatsApp|lienSms|lienPartageEmail|telLink|waLink|adresseEmailValide)\(/g) || []).length
      if (n) { fichiersConcernes++; appels += n }
    }
    expect(fichiersConcernes, "des fichiers qui joignent quelqu'un").toBeGreaterThan(12)
    expect(appels, "et beaucoup d'appels, tous vérifiés").toBeGreaterThan(30)
  })

  it("le geste vit à un seul endroit", () => {
    const mod = lire("lib/lienDeContact.ts")
    expect(mod).toContain("un lien de contact se fabrique, il ne se concatène pas")
    expect(lire("lib/destinataireLead.ts"), "la règle a déménagé, pas été dupliquée")
      .toContain('import { adresseEmailValide } from "./lienDeContact"')
  })
})
