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
  CONSIGNE_SUPPORTS, CONSIGNE_DUPLICATION, styleAReprendre, COLONNES_DE_STYLE,
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

// « Le produit permet ce qu'il demande » (un QR de plus sur la MÊME page, la
// sienne seulement, au quota du plan, nommé sans doublon) et « la duplication
// crée bien une page » : JOUÉS depuis v402 (app/api/qr-duplicate/bancDuplication.test.ts).

describe("et ce qu'un bouton fait, son libellé le dit", () => {

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

// Lot v280 : « Ajouter un support » revient dans le Studio compact. Le quota
// annoncé AVANT doit être celui que le serveur applique APRÈS : initialQrStatus
// compte avec pageLimit. L'ancien studio comptait avec qrLimit (3 en Gratuit,
// contre 1 page) : il annonçait « il vous reste 1 QR actif » à un compte dont le
// support arrivait en brouillon.
describe("le Studio compact dit le quota que le serveur applique", () => {
  const lireSrc = (p: string) => fs.readFileSync(path.join(__dirname, "..", p), "utf8")
  it("même limite des deux côtés : pageLimit", () => {
    const studio = lireSrc("app/dashboard/qr-codes/QRStudioZero.tsx")
    const ligne = studio.split("\n").find(l => l.includes("peutAjouterUnSupport("))!
    expect(ligne, "le studio ne vérifie plus le quota avant d'ajouter un support").toBeTruthy()
    expect(ligne).toContain("pageLimit(userPlan)")
    expect(ligne).not.toContain("qrLimit")
    expect(lireSrc("lib/quota.ts")).toMatch(/initialQrStatus[\s\S]{0,300}pageLimit\(plan\)/)
  })
  it("et ne promet pas de place quand le support arrive en brouillon", () => {
    const studio = lireSrc("app/dashboard/qr-codes/QRStudioZero.tsx")
    expect(studio).toContain("r.brouillon ? null : phraseRestants(v)")
  })
})

// Relevé du 18 nov. : un support ajouté sortait noir sur blanc (la route
// n'écrivait que le nom et le code). Un support, c'est le même QR posé ailleurs.
describe("un support garde l'apparence du QR dont il part", () => {
  const vitrine = { id: "a", created_at: "2026-01-01", foreground_color: "#C9A227", background_color: "#0A0A0A", corner_style: "dot", error_correction: "H", style_config: { dotStyle: "rounded", logoUrl: "data:x" }, logo_url: null }
  const table = { id: "b", created_at: "2026-02-01", foreground_color: "#111111", background_color: "#FFFFFF", corner_style: "square", error_correction: "M", style_config: {}, logo_url: null }

  it("reprend le style du QR d'où l'on part", () => {
    expect(styleAReprendre([vitrine, table], "b")).toMatchObject({ foreground_color: "#111111", corner_style: "square" })
    expect(styleAReprendre([vitrine, table], "a")).toEqual({
      foreground_color: "#C9A227", background_color: "#0A0A0A", corner_style: "dot", error_correction: "H",
      style_config: { dotStyle: "rounded", logoUrl: "data:x" },
    })
  })

  it("à défaut, celui du plus ancien QR de la page", () => {
    expect(styleAReprendre([table, vitrine])).toMatchObject({ foreground_color: "#C9A227" })
    // Un `depuis` qui n'est pas sur la page (QR d'un autre compte…) n'est pas suivi.
    expect(styleAReprendre([table, vitrine], "etranger")).toMatchObject({ foreground_color: "#C9A227" })
  })

  it("rien à reprendre : les valeurs par défaut de la base", () => {
    expect(styleAReprendre([])).toEqual({})
    // Un null n'écrase pas une valeur par défaut NOT NULL.
    expect(styleAReprendre([{ id: "c", foreground_color: null }])).toEqual({})
  })

  it("ne recopie que l'apparence : jamais l'identité, le statut ni la destination", () => {
    const ligne = { ...vitrine, short_code: "x", status: "paused", dest_override: { type: "url" }, label: "Vitrine", user_id: "u" } as any
    const s = styleAReprendre([ligne], "a")
    for (const k of Object.keys(s)) expect(COLONNES_DE_STYLE as readonly string[]).toContain(k)
  })

  // La route lit le style parmi les QR de CETTE page et de CE compte : JOUÉ
  // depuis v402 (app/api/qr-duplicate/bancDuplication.test.ts).
  it("le studio dit d'où part le support", () => {
    expect(lire("app/dashboard/qr-codes/QRStudioZero.tsx")).toContain("ajouterUnSupport(q.page_id, q.id)")
  })
})
