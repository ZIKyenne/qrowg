// Le QR imprimé qui s'arrête quand on arrête de payer — garde de classe.
//
// Relevé du 13 septembre, en suivant un retour au plan gratuit dans le code.
// Webhook Stripe, `customer.subscription.deleted` → `reconcileDynamicLinks(…,
// "free")` → `planDynamicReconcile` écrit, au-delà du quota :
//
//     { status: "paused", paused_reason: "quota" }
//
// Le plan gratuit couvre UN QR modifiable. Un commerçant qui en avait six en
// voit cinq s'éteindre — cinq supports collés sur des tables et distribués en
// flyers. Et ce que sa liste de QR affichait alors :
//
//     etatLien → { badge: "En pause", phrase: "En pause — ne redirige plus" }
//
// La même phrase que pour une pause qu'il aurait décidée. `paused_reason`
// existait, valait « quota », et n'était lu nulle part.
//
// La classe : quand le produit éteint un support IMPRIMÉ, il le dit — avant si
// c'est prévisible, après si c'est fait — et il ne promet nulle part le
// contraire.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  PAUSE_QUOTA, PAUSE_MANUELLE, etatDePause, qrQuiSArretent,
  phraseAvantDeRetomber, phraseApresLaBascule, type LienDynamique,
} from "./pauseDeQuota"
import { planDynamicReconcile } from "./dynamicReconcile"
import { etatLien } from "@/app/dashboard/qr-link/instantQr"
import { PLAN_LIST, getPlan, dynLimit } from "./plans"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

const MAINTENANT = Date.parse("2026-09-13T12:00:00Z")
const actif = (id: string): LienDynamique => ({ id, status: "active", expires_at: null, paused_reason: null })

describe("ce que le produit éteint", () => {
  it("compte exactement ce que la bascule couperait", () => {
    const liens = [actif("a"), actif("b"), actif("c"), actif("d"), actif("e"), actif("f")]
    const coupes = qrQuiSArretent(liens, 1, MAINTENANT)
    expect(coupes.map(l => l.id)).toEqual(["b", "c", "d", "e", "f"])
  })

  it("et dit la même chose que le code qui exécute la bascule", () => {
    // Une prévision qui diverge de l'acte est pire que pas de prévision.
    const liens = [
      actif("a"), actif("b"),
      { id: "essai", status: "active", expires_at: "2026-12-01T00:00:00Z", paused_reason: null },
      { id: "expire", status: "active", expires_at: "2026-01-01T00:00:00Z", paused_reason: null },
      { id: "manuel", status: "paused", expires_at: null, paused_reason: PAUSE_MANUELLE },
      actif("c"),
    ]
    const prevus = qrQuiSArretent(liens, 1, MAINTENANT).map(l => l.id).sort()
    const faits = planDynamicReconcile(liens as any, 1, MAINTENANT)
      .filter(o => (o.patch as any).paused_reason === PAUSE_QUOTA)
      .map(o => o.id).sort()
    expect(prevus).toEqual(faits)
  })

  it("ne prévient jamais pour rien", () => {
    expect(qrQuiSArretent([actif("a")], 1, MAINTENANT)).toEqual([])
    expect(qrQuiSArretent(null, 1, MAINTENANT)).toEqual([])
    expect(qrQuiSArretent([actif("a"), actif("b")], null, MAINTENANT)).toEqual([])
    // Une pause décidée par le commerçant ne se compte pas comme une coupure.
    expect(qrQuiSArretent([{ id: "m", status: "paused", expires_at: null, paused_reason: PAUSE_MANUELLE }], 0, MAINTENANT)).toEqual([])
  })
})

describe("la liste de QR ne confond plus les deux pauses", () => {
  it("une pause voulue reste sobre", () => {
    const e = etatLien({ dynamic: true, status: "paused", expires_at: null, paused_reason: PAUSE_MANUELLE })
    expect(e.badge).toBe("En pause")
    expect(e.phrase).toBe("En pause — ne redirige plus")
    expect(e.action).toBeUndefined()
  })

  it("une coupure de plan dit qu'un support imprimé est mort, et comment le rallumer", () => {
    const e = etatLien({ dynamic: true, status: "paused", expires_at: null, paused_reason: PAUSE_QUOTA })
    expect(e.badge).not.toBe("En pause")
    expect(e.phrase).toContain("imprimé")
    expect(e.action).toBeTruthy()
    expect(e.action).toContain("reste valable")
  })

  it("un motif inconnu ou absent retombe sur la phrase sobre — jamais sur une alarme", () => {
    for (const r of [null, undefined, "", "autre_chose"]) {
      expect(etatLien({ dynamic: true, status: "paused", expires_at: null, paused_reason: r as any }).badge, String(r)).toBe("En pause")
    }
  })

  it("le motif est bien lu par l'écran, pas seulement par le module", () => {
    expect(lire("app/dashboard/qr-link/instantQr.ts")).toContain("etatDePause(qr.paused_reason)")
    expect(lire("app/dashboard/qr-link/page.tsx"), "l'action n'est pas affichée").toContain("ex.action")
  })
})

describe("dit avant, dit après", () => {
  it("l'avertissement compte juste, au singulier comme au pluriel", () => {
    expect(phraseAvantDeRetomber(0)).toBeNull()
    expect(phraseAvantDeRetomber(-3)).toBeNull()
    expect(phraseAvantDeRetomber(1)).toContain("1 de vos QR modifiables cesserait")
    expect(phraseAvantDeRetomber(5)).toContain("5 de vos QR modifiables cesseraient")
    for (const n of [1, 5]) {
      expect(phraseAvantDeRetomber(n), String(n)).toContain("imprim")
      expect(phraseAvantDeRetomber(n), String(n)).toMatch(/[.!?]$/)
    }
  })

  it("la phrase d'après nomme la limite réelle du nouveau plan", () => {
    expect(phraseApresLaBascule(5, 1)).toContain("n'en couvre plus que un seul")
    expect(phraseApresLaBascule(2, 20)).toContain("n'en couvre plus que 20")
    expect(phraseApresLaBascule(2, null)).toContain("tous")
    expect(phraseApresLaBascule(0, 1)).toBeNull()
  })

  it("l'écran de facturation prévient AVANT, sur un compte payant", () => {
    const src = lire("app/dashboard/settings/page.tsx")
    expect(src).toContain("qrQuiSArretent(")
    expect(src).toContain("phraseAvantDeRetomber(")
    expect(src, "le calcul doit porter sur le quota du plan gratuit").toContain('dynLimit("free")')
  })

  it("le webhook prévient APRÈS, sur les deux chemins de descente", () => {
    const src = lire("app/api/webhooks/stripe/route.ts")
    expect(src).toContain("phraseApresLaBascule(")
    // Changement de plan ET annulation : les deux appellent reconcile, les deux doivent prévenir.
    expect((src.match(/prevenirQrCoupes\(/g) || []).length, "un des deux chemins ne prévient pas").toBeGreaterThanOrEqual(3)
    expect(src).toContain("PAUSE_QUOTA")
  })
})

describe("et la grille tarifaire ne promet plus le contraire", () => {
  it("aucun plan ne promet qu'un QR imprimé ne s'arrête jamais", () => {
    for (const p of PLAN_LIST) {
      for (const perk of p.perks) {
        expect(perk.text, `${p.id} : « ${perk.text} »`).not.toMatch(/ne s['’]arrête jamais/i)
      }
      for (const f of p.features) {
        expect(f, `${p.id} : « ${f} »`).not.toMatch(/ne s['’]arrête jamais/i)
      }
    }
    expect(lire("app/homeSections/Pricing.tsx")).not.toMatch(/ne s['’]arrête jamais/)
  })

  it("la promesse tenable — les vues — est toujours là", () => {
    const gratuit = getPlan("free")
    expect(gratuit.perks.some(k => /Vues illimitées/.test(k.text) && k.included)).toBe(true)
    // Et le quota qui, lui, s'arrête, est bien celui qu'on annonce.
    expect(dynLimit("free")).toBe(1)
    expect(gratuit.perks.some(k => /1 QR modifiable/.test(k.text))).toBe(true)
  })
})
