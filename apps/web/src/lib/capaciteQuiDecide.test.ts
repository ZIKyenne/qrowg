// Une capacité vendue est celle qui décide — garde de classe.
//
// Relevé du 15 septembre. Le lot du 11 septembre a posé la règle des promesses :
// « toute promesse cochée porte une PREUVE — un champ de son propre plan, ou un
// fichier du produit » (`app/promessesTenues.ts`). `preuveResolue` vérifie que
// le champ EXISTE et qu'il est vrai sur ce plan.
//
// Il ne vérifie pas qu'on le LISE. Et quatre capacités vendues n'étaient lues
// par personne — le produit décidait ailleurs, autrement :
//
//   caps.printStudio        4 promesses   décidé par : rien. L'atelier est gratuit
//                                          pour tous (`print-studio/page.tsx`)
//   caps.qrStudioAdvanced   1 promesse    décidé par : PLAN_RANK[plan] >= 2
//   caps.exportFormats      1 promesse    décidé par : FORMAT_CFG, dans QRStudio
//   caps.dynDomaineMarque   4 promesses   décidé par : DEFAULT_DOMAIN_LIMITS + une table
//
// Ce que ça donnait, chez le commerçant :
//
// **1. Un badge « PRO » qu'un client Pro ne peut pas ouvrir.** `PLAN_RANK` vaut
// `{ free: 0, pro: 1, business: 2 }`. Le studio écrivait `PLAN_RANK[userPlan] >= 2`
// et appelait ça `canPro`. C'est-à-dire **Business**. Un commerçant qui paie le
// plan Pro voyait le badge doré « PRO » sur un style de modules, cliquait, et
// lisait « passez au plan Pro ». Celui qu'il paie. Même chose pour les styles de
// coins, les niveaux de correction Q et H, et les tailles HD.
// Et `canBusiness = PLAN_RANK[userPlan] >= 3` ne désignait **personne** : le rang
// le plus haut est 2.
//
// **2. Le JPG, vendu et introuvable.** La grille promettait « Export PNG / JPG /
// PDF HD / SVG ». L'atelier propose png, png transparent, webp, svg, pdf. **Il
// n'a jamais proposé de JPG.** Et le PNG transparent et le WEBP, qui existent et
// sont payants, n'étaient vendus nulle part.
//
// **3. L'atelier d'impression, vendu à qui l'a déjà.** Il est devenu gratuit pour
// tous — la page le dit et le fait, avec sa raison. Mais `caps.printStudio` valait
// encore `false` sur le gratuit, la grille cochait « Atelier d'impression ✗ », et
// l'accueil le vendait comme une raison de payer. Un commerçant gratuit pouvait
// payer pour ce qu'il avait déjà, ou ne jamais ouvrir ce qui l'attendait.
//
// La classe : **la capacité qui est vendue est celle qui décide.** Une preuve qui
// nomme un champ que personne ne lit ne prouve rien.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { PLANS, PLAN_RANK, PLAN_LIST, canQrAdvanced, canExport, canPrintStudio, canDynDomaine, minPlanFor, minPlanForFormat, type PlanId } from "./plans"
import { preuveResolue } from "@/app/promessesTenues"

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

/** Toutes les preuves `caps.X` citées par une promesse cochée, quel que soit le plan. */
function capacitesVendues(): string[] {
  const out = new Set<string>()
  for (const id of Object.keys(PLANS) as PlanId[]) {
    for (const p of PLANS[id].perks) {
      if (p.included && p.preuve?.startsWith("caps.")) out.add(p.preuve.slice("caps.".length))
    }
  }
  // La grille de l'accueil vend les mêmes capacités, dans ses propres mots.
  for (const m of lire("app/homeSections/Pricing.tsx").matchAll(/preuve:\s*"caps\.(\w+)"/g)) out.add(m[1])
  return [...out].sort()
}

/**
 * Les gardes de `plans.ts`, lues dans `plans.ts` : `canAI` lit `caps.ai`,
 * `canDynSecurite` lit `caps.dynSecuriteLien`. Le nom de la garde ne se déduit
 * pas de celui de la capacité — deviner l'aurait fait crier sur trois capacités
 * parfaitement consultées, et c'est ce qu'a montré le premier essai.
 */
function gardesParCapacite(): Record<string, string[]> {
  const src = lire("lib/plans.ts")
  const map: Record<string, string[]> = {}
  for (const m of src.matchAll(/export const (can\w+)[^\n]*?caps\.(\w+)/g)) {
    (map[m[2]] ??= []).push(m[1])
  }
  return map
}

/** Le produit consulte-t-il cette capacité ailleurs que dans sa définition ? */
function consultee(cap: string): string[] {
  const gardes = gardesParCapacite()[cap] ?? []
  const lieux: string[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    if (rel === "lib/plans.ts" || rel === "app/promessesTenues.ts") continue
    // Sans les commentaires : la vérification par mutation a montré qu'un fichier
    // qui CITE `caps.printStudio` dans une note passait pour un lecteur. Un
    // commentaire ne décide rien.
    // Deux exclusions trouvées par la vérification par mutation : un fichier qui
    // CITE `caps.printStudio` dans une note passait pour un lecteur, et la ligne
    // `preuve: "caps.printStudio"` de la grille aussi. Un commentaire ne décide
    // rien ; une promesse encore moins — c'est précisément ce qu'on vérifie.
    const s = fs.readFileSync(f, "utf8").split("\n")
      .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l) && !/\bpreuve:/.test(l)).join("\n")
    const appel = gardes.some(g => new RegExp(`\\b${g}\\s*\\(`).test(s))
    if (appel || new RegExp(`caps\\.${cap}\\b`).test(s)) lieux.push(rel)
  }
  return lieux
}

describe("ce que le rang de plan voulait dire", () => {
  it("le rang le plus haut est 2 — donc « >= 3 » ne désignait personne", () => {
    expect(Math.max(...Object.values(PLAN_RANK))).toBe(2)
  })

  it("un client Pro a bien le QR Studio complet", () => {
    // C'est la promesse « QR Studio complet », vendue sur le plan Pro.
    expect(canQrAdvanced("pro"), "il le paie").toBe(true)
    expect(canQrAdvanced("starter"), "l'ancien nom du même plan").toBe(true)
    expect(canQrAdvanced("business")).toBe(true)
    expect(canQrAdvanced("free")).toBe(false)
    expect(canQrAdvanced(null)).toBe(false)
    // L'ancien test — `PLAN_RANK[plan] >= 2` — répondait `false` pour « pro ».
    expect(PLAN_RANK["pro"] >= 2, "le rang écrit à la main disait l'inverse").toBe(false)
  })

  it("les formats vendus sont ceux que l'atelier propose", () => {
    const studio = lire("app/dashboard/qr-codes/QRStudio.tsx")
    for (const fmt of PLANS.pro.caps.exportFormats) {
      expect(studio, `« ${fmt} » est vendu : l'atelier doit le proposer`).toContain(`"${fmt}":`)
    }
    expect(PLANS.pro.caps.exportFormats, "le JPG n'a jamais existé dans l'atelier").not.toContain("jpg")
    expect(canExport("free", "png")).toBe(true)
    expect(canExport("pro", "png-t")).toBe(true)
    expect(canExport("free", "png-t"), "le PNG transparent reste payant").toBe(false)
    expect(minPlanForFormat("png")).toBe("free")
    expect(minPlanForFormat("pdf")).toBe("pro")
  })

  it("l'atelier d'impression est gratuit, et la grille le dit", () => {
    // La décision est écrite dans la page ; la grille la refusait encore.
    expect(lire("app/dashboard/print-studio/page.tsx"), "la page consulte la capacité").toContain("canPrintStudio(prof?.plan)")
    expect(canPrintStudio("free"), "gratuit pour tous, comme la page le fait").toBe(true)
    expect(minPlanFor("printStudio")).toBe("free")
    const gratuit = PLANS.free.perks.find(p => p.preuve === "caps.printStudio")
    expect(gratuit?.included, "cochée, puisqu'elle est donnée").toBe(true)
    expect(preuveResolue(PLANS.free, "caps.printStudio")).toBe(true)
  })

  it("les domaines personnalisés sont refusés par la capacité, pas par un nombre", () => {
    expect(canDynDomaine("free")).toBe(false)
    expect(canDynDomaine("pro")).toBe(true)
    expect(lire("app/api/domains/route.ts")).toContain("if (!canDynDomaine(userPlan))")
  })
})

describe("garde de classe : une capacité vendue est lue quelque part", () => {
  it("chaque capacité citée par une promesse est consultée par le produit", () => {
    const fautes = capacitesVendues()
      .filter(c => consultee(c).length === 0)
      .map(c => `caps.${c}`)
    expect(fautes, "une preuve qui nomme un champ que personne ne lit ne prouve rien").toEqual([])
  })

  it("et le studio ne décide plus avec un rang écrit à la main", () => {
    const studio = lire("app/dashboard/qr-codes/QRStudio.tsx")
    expect(studio, "la capacité vendue décide").toContain("const canPro = canQrAdvanced(userPlan)")
    expect(studio, "la génération en lot est une capacité à elle").toContain("canDynMasse(userPlan)")
    expect(studio, "et le plan annoncé vient du plan, pas d'une chaîne").not.toContain('plan:"pro" })')
    expect(studio, "plus de rang comparé à un nombre nu").not.toMatch(/PLAN_RANK\[\w+\]\s*>=\s*\d/)
  })

  it("le balayage voit bien les capacités — sinon il ne prouve rien", () => {
    const vendues = capacitesVendues()
    expect(vendues.length, "des capacités vendues").toBeGreaterThan(5)
    expect(vendues, "dont celles du relevé").toEqual(expect.arrayContaining(["printStudio", "qrStudioAdvanced", "exportFormats", "dynDomaineMarque"]))
    // Et le détecteur sait dire non : une capacité inventée n'est lue nulle part.
    expect(consultee("capaciteQuiNExistePas"), "une capacité inventée n'a ni garde ni lecteur").toEqual([])
    expect(Object.keys(gardesParCapacite()).length, "et les gardes se lisent bien dans plans.ts").toBeGreaterThan(6)
    expect(consultee("removeBranding").length, "tandis qu'une vraie l'est").toBeGreaterThan(0)
  })

  it("aucune promesse cochée ne reste sans preuve", () => {
    // La règle du 11 septembre tient toujours, sur les plans modifiés ici.
    for (const p of PLAN_LIST) {
      const sans = p.perks.filter(k => k.included && !k.soon && !preuveResolue(p, k.preuve))
      expect(sans.map(k => k.text), p.id).toEqual([])
    }
  })
})
