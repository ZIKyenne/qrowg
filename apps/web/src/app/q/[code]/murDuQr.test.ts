// Le mur au bout du QR imprimé — garde de classe.
//
// Relevé du 13 septembre, en scannant pour de vrai un code inconnu sur le
// serveur compilé : l'écran d'échec ne contenait qu'un seul lien, et ce lien
// menait à qrowg.com (« Créer votre propre QR Code → »). Une personne debout
// devant la vitrine, le flyer à la main, recevait une publicité pour l'outil de
// son commerçant, et rien pour joindre le commerce.
//
// La classe : AUCUN écran rendu par /q/<code> ne doit laisser le client sans
// autre sortie qu'un lien vers QRowg dès lors que le produit connaît un moyen de
// joindre le commerce. Et les règles de la maison — texte ≥ 11 px, cible
// ≥ 32 px — valent aussi sur ces écrans-là, qui ne sont pas dans l'arbre React
// balayé par lisibiliteEtCibles.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { moyensDeJoindre, phraseDuMur, titreDuMur, MOYENS_MAX, type BlocConnu, type RaisonDuMur } from "./joindreLeCommerce"
import { contraste, CONTRASTE_MIN } from "@/app/dashboard/builder/couleurLisible"

const ROUTE = fs.readFileSync(path.join(__dirname, "route.ts"), "utf8")

const RAISONS: RaisonDuMur[] = ["introuvable", "expire", "en_pause", "brouillon", "erreur"]

const bloc = (type: string, content: Record<string, unknown>): BlocConnu => ({ type, content })

describe("ce qu'on offre au client devant le mur", () => {
  it("rend le téléphone de la page en bouton d'appel", () => {
    const m = moyensDeJoindre([bloc("call_button", { label: "Appeler", phone: "01 23 45 67 89" })])
    expect(m).toHaveLength(1)
    expect(m[0].libelle).toBe("Appeler")
    expect(m[0].href).toBe("tel:0123456789")
  })

  it("rend l'adresse en itinéraire, et l'échappe", () => {
    const m = moyensDeJoindre([bloc("directions_button", { address: "12 rue de l'Église, Paris" })])
    expect(m[0].libelle).toBe("Itinéraire")
    expect(m[0].href).toContain("google.com/maps/dir/")
    expect(m[0].href).toContain(encodeURIComponent("12 rue de l'Église, Paris"))
  })

  it("classe par urgence : appeler avant WhatsApp, WhatsApp avant l'itinéraire", () => {
    const m = moyensDeJoindre([
      bloc("email_button", { email: "bonjour@comptoir.fr" }),
      bloc("directions_button", { address: "12 rue des Lilas" }),
      bloc("whatsapp_button", { phone: "+33612345678" }),
      bloc("call_button", { phone: "0123456789" }),
    ])
    expect(m.map(x => x.libelle)).toEqual(["Appeler", "WhatsApp", "Itinéraire", "Écrire"])
  })

  it("ne propose pas deux fois la même chose", () => {
    const m = moyensDeJoindre([
      bloc("call_button", { phone: "0123456789" }),
      bloc("call_button", { phone: "0987654321" }),
      bloc("contact_info", { phone: "0111111111" }),
    ])
    expect(m).toHaveLength(1)
  })

  it("ignore un bloc vide — un bouton « Appeler » sans numéro n'est pas un moyen", () => {
    expect(moyensDeJoindre([bloc("call_button", { label: "Appeler", phone: "   " })])).toEqual([])
    expect(moyensDeJoindre([bloc("call_button", {})])).toEqual([])
    expect(moyensDeJoindre(null)).toEqual([])
  })

  it("n'offre jamais plus de quatre choix", () => {
    const m = moyensDeJoindre([
      bloc("call_button", { phone: "1" }), bloc("whatsapp_button", { phone: "2" }),
      bloc("directions_button", { address: "a" }), bloc("email_button", { email: "a@b.fr" }),
      bloc("contact_info", { phone: "3", address: "b", email: "c@d.fr" }),
    ])
    expect(m.length).toBeLessThanOrEqual(MOYENS_MAX)
  })
})

describe("ce qu'on dit au client", () => {
  it("nomme le commerce quand on le connaît, sur chaque raison sauf le code inconnu", () => {
    for (const r of RAISONS) {
      if (r === "introuvable") continue
      expect(titreDuMur(r, "Le Comptoir"), r).toBe("Le Comptoir")
      expect(phraseDuMur(r, "Le Comptoir", true), r).toContain("Le Comptoir")
    }
  })

  it("ne promet « voici comment le joindre » que si on a quelque chose à offrir", () => {
    for (const r of RAISONS) {
      const sansRien = phraseDuMur(r, "Le Comptoir", false)
      expect(sansRien, r).not.toContain("joignable")
      expect(sansRien, r).not.toContain("Voici comment")
      // À défaut, la phrase dit quand même quoi faire.
      expect((sansRien.split(". ")[1] ?? "").length, r).toBeGreaterThan(10)
    }
  })

  it("reste correct quand on ne connaît rien", () => {
    for (const r of RAISONS) {
      const t = titreDuMur(r, null), ph = phraseDuMur(r, "  ")
      expect(t.length, r).toBeGreaterThan(3)
      expect(ph, r).toMatch(/[.!?]$/)
      expect(ph + t, r).not.toMatch(/undefined|null/)
      // Pas d'article collé à un nom propre : « la page de Le Comptoir ».
      expect(phraseDuMur(r, "Le Comptoir", true), r).not.toMatch(/\bde Le\b|\bde La\b|\bde Les\b/)
    }
  })

  it("ne dit plus deux choses contradictoires sur un code inconnu", () => {
    // « n'existe pas ou n'est plus actif » : le client ne peut rien en faire.
    expect(phraseDuMur("introuvable")).not.toContain("n'existe pas ou")
    expect(phraseDuMur("introuvable")).toContain("demandez le lien")
  })
})

describe("l'écran rendu par la redirection", () => {
  it("n'a plus aucun gabarit d'échec qui ne propose que QRowg", () => {
    // Les trois anciens gabarits sont remplacés par un seul, `murHtml`.
    for (const mort of ["pausedHtml", "expiredHtml", "noticeHtml", "noticeResponse"]) {
      expect(ROUTE, `${mort} subsiste`).not.toContain(`function ${mort}(`)
    }
    expect(ROUTE).toContain("function murHtml(")
  })

  it("appelle le mur avec une raison connue à chaque échec", () => {
    const raisons = [...ROUTE.matchAll(/raison:\s*"([a-z_]+)"/g)].map(m => m[1])
    expect(raisons.length).toBeGreaterThanOrEqual(8)
    for (const r of raisons) expect(RAISONS, `raison inconnue : ${r}`).toContain(r as RaisonDuMur)
  })

  it("propose les moyens de joindre le commerce partout où le QR est connu", () => {
    // Chaque `murResponse` posé APRÈS la résolution du QR passe par commerceDuQr().
    const apres = ROUTE.slice(ROUTE.indexOf("const commerceDuQr"))
    const appels = [...apres.matchAll(/murResponse\(\{([^}]*)\}/g)].map(m => m[1])
    expect(appels.length).toBeGreaterThanOrEqual(4)
    const sansCommerce = appels.filter(a => !a.includes("commerceDuQr()") && !a.includes('raison: "erreur"'))
    expect(sansCommerce, `Ces murs oublient le commerce : ${sansCommerce.join(" | ")}`).toEqual([])
  })

  it("le lien QRowg reste, mais n'est plus la seule sortie", () => {
    expect(ROUTE).toContain("QR Code créé avec QRowg")
    expect(ROUTE).toContain('class="joindre"')
  })

  it("respecte le contraste minimum, comme tout le reste du produit", () => {
    // Règle posée au lot v68 (WCAG AA, 4.5:1). L'écran d'échec est du HTML écrit
    // à la main : il échappe à l'arbre React balayé par la garde de lisibilité,
    // donc rien ne l'y tenait. Les couleurs d'origine passaient (le gris du texte
    // était à 5,2:1) — cette garde est là pour que la prochaine retouche passe
    // aussi, sur un écran que personne ne regarde jamais en interne.
    const mur = ROUTE.slice(ROUTE.indexOf("function murHtml("), ROUTE.indexOf("function murResponse("))
    const CARTE = "#0F0E0B"
    const couleurs = [...mur.matchAll(/color:\s*(#[0-9A-Fa-f]{6})/g)].map(m => m[1] ?? "")
    expect(couleurs.length).toBeGreaterThanOrEqual(3)
    const trop = couleurs.filter(c => (contraste(c, CARTE) ?? 0) < CONTRASTE_MIN)
    expect(trop, `sous ${CONTRASTE_MIN}:1 sur la carte : ${trop.join(", ")}`).toEqual([])
  })

  it("respecte les règles de la maison : aucun texte sous 11 px, aucune cible sous 32 px", () => {
    const mur = ROUTE.slice(ROUTE.indexOf("function murHtml("), ROUTE.indexOf("function murResponse("))
    const tailles = [...mur.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1]))
    expect(tailles.length).toBeGreaterThan(3)
    expect(tailles.filter(t => t < 11), `tailles trop petites : ${tailles.filter(t => t < 11)}`).toEqual([])
    const cibles = [...mur.matchAll(/min-height:\s*(\d+)px/g)].map(m => Number(m[1]))
    expect(cibles.length).toBeGreaterThanOrEqual(2)
    expect(cibles.filter(h => h < 32)).toEqual([])
  })
})
