// La route le dit, trois écrans sur quatre ne l'écoutent pas — garde de classe.
//
// Relevé du 14 septembre. Quand le quota de QR actifs du plan est atteint, la
// page créée reçoit un QR en BROUILLON — `lib/quota` le documente : « créé quand
// même, mais non visitable tant qu'un slot n'est pas libéré ». Les deux routes
// de création renvoient l'information, sous le même nom :
//
//     return NextResponse.json({ pageId, success: true, qrStatus,
//                                atActiveLimit: qrStatus === "draft" })
//
// Qui l'écoutait :
//
//   templates/page.tsx:708 (modal de nommage)   OUI
//   templates/page.tsx:628 (assistant)          non — « Page créée — à vous de jouer »
//   onboarding/OnboardingClient.tsx:37          non — l'écran promet pourtant
//                                                « Page + blocs + QR + objectif »
//   BuilderV4.tsx:566 (/api/pages/create)       non
//
// Trois chemins sur quatre livraient une page dont le QR affiche le mur
// « brouillon » au scan (lot v78), sans le dire. Le commerçant peut l'imprimer.
//
// La classe : une information que le serveur prend la peine de renvoyer est lue
// par TOUS ceux qui appellent la route — sinon elle n'existe pas.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  CHAMP_LIMITE, PHRASE_PAGE_CREEE,
  phraseQrEnBrouillon, phraseCopieEnBrouillon, phraseSupportEnBrouillon,
  messageApresCreation, qrVisitable,
} from "./qrEnBrouillon"
import { pageLimit } from "./plans"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Les quatre chemins de création de page du produit. */
const CHEMINS = [
  "app/dashboard/templates/page.tsx",
  "app/dashboard/onboarding/OnboardingClient.tsx",
  "app/dashboard/builder/BuilderV4.tsx",
]

describe("la phrase existait déjà : on la garde, on l'enrichit", () => {
  it("elle reprend la formulation que l'écran des modèles avait trouvée", () => {
    const p = phraseQrEnBrouillon("free")
    expect(p).toContain("Page créée en brouillon : limite de QR actifs atteinte.")
    expect(p).toContain("Mettez un QR en pause puis activez celle-ci.")
  })

  it("et elle dit combien le plan en permet, quand on le sait", () => {
    expect(phraseQrEnBrouillon("free")).toContain(`${pageLimit("free")} QR actif`)
    expect(phraseQrEnBrouillon("pro")).toContain(`${pageLimit("pro")} QR actifs`)
    // Plan sans limite : on n'affiche pas un chiffre qui n'existe pas.
    expect(pageLimit("business")).toBeNull()
    expect(phraseQrEnBrouillon("business")).not.toMatch(/\d/)
    expect(phraseQrEnBrouillon(null)).toContain("QR actif")
  })
})

describe("les trois objets qu'on peut créer en brouillon", () => {
  it("une page, une copie de QR, un support — trois phrases, un seul module", () => {
    // Le produit avait déjà les trois, chacune dans son écran (v83 pour le
    // support, QR Studio pour la copie). Elles disent maintenant la même chose
    // du quota, et chacune reste juste sur l'objet dont elle parle.
    for (const p of [phraseQrEnBrouillon("pro"), phraseCopieEnBrouillon("pro"), phraseSupportEnBrouillon("pro")]) {
      expect(p).toContain("limite de QR actifs atteinte")
      expect(p).toContain(`${pageLimit("pro")} QR actifs`)
      expect(p).toContain("pause")
    }
    expect(phraseCopieEnBrouillon()).toContain("Copie créée")
    expect(phraseSupportEnBrouillon()).toContain("Support créé")
  })
})

describe("le message d'après-création, pour les quatre chemins", () => {
  it("le cas du relevé : quota atteint", () => {
    expect(messageApresCreation({ pageId: "p1", qrStatus: "draft", atActiveLimit: true }, "free"))
      .toBe(phraseQrEnBrouillon("free"))
  })

  it("et le cas ordinaire", () => {
    expect(messageApresCreation({ pageId: "p1", qrStatus: "active", atActiveLimit: false })).toBe(PHRASE_PAGE_CREEE)
  })

  it("un champ absent n'est ni une bonne ni une mauvaise nouvelle", () => {
    // Si une route cessait de renvoyer le champ, on ne veut pas alarmer — ni
    // promettre. Message neutre.
    expect(messageApresCreation({ pageId: "p1" })).toBe(PHRASE_PAGE_CREEE)
    expect(messageApresCreation(null)).toBe(PHRASE_PAGE_CREEE)
    expect(messageApresCreation("pas un objet" as any)).toBe(PHRASE_PAGE_CREEE)
  })

  it("« visitable » suit le statut réel, pas l'optimisme", () => {
    expect(qrVisitable({ atActiveLimit: true, qrStatus: "draft" })).toBe(false)
    expect(qrVisitable({ qrStatus: "draft" })).toBe(false)
    expect(qrVisitable({ qrStatus: "paused" })).toBe(false)
    expect(qrVisitable({ qrStatus: "active" })).toBe(true)
    expect(qrVisitable({})).toBe(true)
    expect(qrVisitable(null)).toBe(true)
  })
})

describe("les deux routes renvoient bien l'information", () => {
  for (const r of ["app/api/templates/use/route.ts", "app/api/pages/create/route.ts"]) {
    it(`${r} la renvoie sous le nom attendu`, () => {
      const src = lire(r)
      expect(src).toContain(`${CHAMP_LIMITE}: qrStatus === "draft"`)
      expect(src, "le statut initial vient de lib/quota").toContain("initialQrStatus(")
    })
  }

  it("et `lib/quota` dit bien ce que vaut un brouillon", () => {
    const quota = lire("lib/quota.ts")
    expect(quota).toContain("non visitable tant qu'un slot n'est pas libéré")
  })
})

describe("garde de classe : ce que le serveur renvoie est lu par tous", () => {
  it("les quatre chemins de création disent la même chose", () => {
    for (const f of CHEMINS) {
      const src = lire(f)
      expect(src, `${f} ignore le message d'après-création`).toContain("messageApresCreation(")
    }
  })

  it("les deux autres créateurs de QR passent aussi par le module", () => {
    expect(lire("app/dashboard/qr-codes/QRStudio.tsx")).toContain("phraseCopieEnBrouillon(")
    expect(lire("app/dashboard/qr-codes/ajoutDeSupport.ts")).toContain("phraseSupportEnBrouillon(")
  })

  it("aucun écran ne réécrit la phrase dans son coin", () => {
    const marcher = (d: string, out: string[] = []): string[] => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p, out) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
      return out
    }
    for (const f of marcher(SRC)) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/qrEnBrouillon.ts") continue
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        expect(l.includes("limite de QR actifs atteinte"),
          `${rel}:${i + 1} recopie la phrase au lieu de l'importer`).toBe(false)
      }
    }
  })

  it("et personne n'annonce une réussite sans regarder le statut du QR", () => {
    // Le motif exact du défaut : un `toast.success` de création de page écrit en
    // dur, juste après la réponse d'une route qui renvoie `atActiveLimit`.
    for (const f of CHEMINS) {
      const src = lire(f)
      for (const [i, ligne] of src.split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//")) continue
        if (!/toast\.(success|info)\("/.test(l)) continue
        expect(/[Pp]age créée/.test(l),
          `${f}:${i + 1} annonce la création sans lire le statut — ${l}`).toBe(false)
      }
    }
  })
})
