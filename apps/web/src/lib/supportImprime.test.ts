// Le support qu'on ne peut pas créer — garde de classe.
//
// Relevé du 13 septembre, en comparant ce que le produit DIT et ce qu'il FAIT.
//
// Il dit, sur l'écran fait pour ça (« Performance par support », état vide) :
//   « Créez un QR par support … dupliquez un QR depuis le QR Studio POUR UNE
//     MÊME PAGE. »
// et dans sa FAQ publique :
//   « Créez un QR par support pour comparer les scans par affiche, flyer ou
//     publication. »
//
// Il fait, dans `api/qr-duplicate` : `if (orig.page_id) { … }` → une NOUVELLE
// page (nouveau slug, remise en brouillon), et `q.page_id = newPageId`.
//
// Autrement dit : l'instruction est inapplicable, et le panneau qui la porte ne
// peut jamais se remplir — l'attribution par support se fait par `qr_code_id`
// sur UNE page.
//
// La classe : ce que le produit demande de faire, le produit doit le permettre ;
// et ce qu'un bouton fait vraiment, son libellé doit le dire.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  peutAjouterUnSupport, phraseRestants, nomDeSupportLibre,
  CONSIGNE_SUPPORTS, CONSIGNE_DUPLICATION,
} from "./supportImprime"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

describe("la règle de quota est dite, pas inventée", () => {
  it("laisse passer tant qu'il reste un slot", () => {
    expect(peutAjouterUnSupport({ actifs: 2, limite: 10 })).toEqual({ possible: true, restants: 8 })
    expect(peutAjouterUnSupport({ actifs: 0, limite: 1 })).toEqual({ possible: true, restants: 1 })
    expect(peutAjouterUnSupport({ actifs: 99, limite: null })).toEqual({ possible: true, restants: null })
  })

  it("refuse quand tout est pris, et dit quoi faire", () => {
    const v1 = peutAjouterUnSupport({ actifs: 1, limite: 1 })
    expect(v1.possible).toBe(false)
    expect(!v1.possible && v1.phrase).toContain("plan supérieur")
    const v10 = peutAjouterUnSupport({ actifs: 10, limite: 10 })
    expect(!v10.possible && v10.phrase).toContain("en pause")
    expect(!v10.possible && v10.phrase).toContain("10")
  })

  it("la phrase du reste ne parle que quand elle a quelque chose à dire", () => {
    expect(phraseRestants(peutAjouterUnSupport({ actifs: 0, limite: null }))).toBeNull()
    expect(phraseRestants(peutAjouterUnSupport({ actifs: 9, limite: 10 }))).toContain("reste 1")
    expect(phraseRestants(peutAjouterUnSupport({ actifs: 5, limite: 10 }))).toContain("5 QR actifs")
  })
})

describe("nommer le support suivant", () => {
  it("évite ce qui est déjà pris, casse et espaces compris", () => {
    expect(nomDeSupportLibre([])).toBe("Support 2")
    expect(nomDeSupportLibre(["Support 2"])).toBe("Support 3")
    expect(nomDeSupportLibre(["  support 2 ", "SUPPORT 3"])).toBe("Support 4")
    expect(nomDeSupportLibre(["Vitrine", "Table 4"])).toBe("Support 2")
  })

  it("ignore les noms vides", () => {
    expect(nomDeSupportLibre([null, undefined, "", "   "])).toBe("Support 2")
  })
})

describe("le produit permet ce qu'il demande", () => {
  const route = lire("app/api/qr-support/route.ts")

  it("une route ajoute un QR à la MÊME page", () => {
    expect(route).toContain('.from("qr_codes").insert(')
    expect(route, "la route doit réutiliser la page existante").toContain("page_id,")
    expect(route, "elle ne doit surtout pas créer de page").not.toContain('.from("pages").insert')
  })

  it("elle vérifie que la page appartient bien au demandeur", () => {
    expect(route).toContain('.eq("user_id", user.id)')
    expect(route).toContain("Page introuvable")
  })

  it("elle suit la règle de quota existante, sans la réécrire", () => {
    expect(route).toContain("initialQrStatus(")
    expect(route).toContain("uniqueShortCode(")
    expect(route).toContain("nomDeSupportLibre(")
  })

  it("et l'écran l'offre", () => {
    // L'appel vit dans ./ajoutDeSupport : QRStudio.tsx est tenu sous 3 000 lignes
    // par `testsDeterministes`, et l'action y serait repassée au-dessus.
    expect(lire("app/dashboard/qr-codes/ajoutDeSupport.ts")).toContain('"/api/qr-support"')
    const studio = lire("app/dashboard/qr-codes/QRStudio.tsx")
    expect(studio).toContain("ajouterUnSupport(")
    expect(studio).toContain("Ajouter un support")
  })
})

describe("et ce qu'un bouton fait, son libellé le dit", () => {
  it("« Dupliquer » annonce qu'il crée une page", () => {
    const studio = lire("app/dashboard/qr-codes/QRStudio.tsx")
    expect(studio).toContain("Dupliquer (nouvelle page)")
  })

  it("la duplication crée bien une page — le libellé n'est pas une supposition", () => {
    const dup = lire("app/api/qr-duplicate/route.ts")
    expect(dup).toContain('.from("pages")')
    expect(dup).toContain("q.page_id    = newPageId")
  })

  it("l'ancienne consigne inapplicable a disparu des deux endroits", () => {
    const panel = lire("app/dashboard/analytics/SupportPanel.tsx")
    expect(panel, "le panneau renvoie encore à la duplication").not.toContain("dupliquez un QR depuis le QR Studio pour une même page")
    expect(panel).toContain("CONSIGNE_SUPPORTS")
    expect(panel).toContain("CONSIGNE_DUPLICATION")
    const faq = lire("app/qr-code/verticals.ts")
    expect(faq).not.toContain("Créez un QR par support pour comparer les scans")
    expect(faq, "la FAQ doit dire par où passer").toContain("ajoutez un support")
  })

  it("les deux consignes disent ce qui est vrai", () => {
    expect(CONSIGNE_SUPPORTS).toContain("même page")
    expect(CONSIGNE_SUPPORTS).toContain("propres scans")
    expect(CONSIGNE_DUPLICATION).toContain("autre page")
    for (const c of [CONSIGNE_SUPPORTS, CONSIGNE_DUPLICATION]) {
      expect(c).toMatch(/[.!?]$/)
      expect(c.length).toBeGreaterThan(40)
    }
  })
})
