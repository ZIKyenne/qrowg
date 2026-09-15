// Un envoi demande la permission au même endroit — garde de classe.
//
// Relevé du 15 septembre. L'écran Réglages propose **six** interrupteurs de
// notification. Pour chacun, j'ai cherché l'envoi qui le consulte :
//
//   email_leads         lib/notifierProprietaireLead.ts    ✓
//   lead_confirmation   lib/accuseReceptionLead.ts         ✓
//   scan_alert          lib/premierScan.ts                 ✓
//   weekly_report       lib/rapportHebdo.ts                ✓
//   product_updates     — personne
//   marketing           — personne
//
// **Deux sur six ne commandent rien.** Le commerçant coche « Nouveautés
// produit », l'écran répond « Préférences enregistrées », la colonne garde la
// valeur — et aucun envoi ne la lira jamais. Ce n'est pas une case qui ne marche
// pas : c'est une case qui ment.
//
// Les quatre qui fonctionnent le font chacune à sa façon, écrite sur place :
// trois `!== false` recopiés, un `PREFERENCE_HEBDO` nommé. Quatre endroits où se
// tromper de sens — et se tromper de sens sur un consentement, c'est écrire à
// quelqu'un qui a dit non.
//
// Et `cron/relance`, qui part 48 h après l'inscription, ne consultait rien et ne
// portait **aucun lien de sortie**. Le rapport périodique en a un, l'hebdomadaire
// aussi. Celui-là, non.
//
// La classe : **un envoi demande la permission au même endroit, et un
// interrupteur qui ne commande rien est nommé comme tel.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  INTERRUPTEURS, SANS_ENVOI_POUR_L_INSTANT, peutRecevoir, lienDeSortie,
  type TypeDEmail,
} from "./consentementEmail"
import { hebdoDesactive } from "./rapportHebdo"
import { alerteActivee } from "./premierScan"
import { accuseActive } from "./accuseReceptionLead"

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

describe("demander la permission, une fois pour toutes", () => {
  it("un opt-out envoie tant qu'on n'a pas dit non", () => {
    expect(peutRecevoir("lead", null), "rien d'écrit = le défaut").toBe(true)
    expect(peutRecevoir("lead", {}), "clé absente = le défaut").toBe(true)
    expect(peutRecevoir("lead", { email_leads: true })).toBe(true)
    expect(peutRecevoir("lead", { email_leads: false })).toBe(false)
    expect(peutRecevoir("lead", { email_leads: "non" }), "une valeur d'un autre type ne décide pas").toBe(true)
  })

  it("un opt-in n'envoie que si on a dit oui — c'est l'inverse, et c'est écrit", () => {
    expect(peutRecevoir("marketing", null)).toBe(false)
    expect(peutRecevoir("marketing", {})).toBe(false)
    expect(peutRecevoir("marketing", { marketing: false })).toBe(false)
    expect(peutRecevoir("marketing", { marketing: true })).toBe(true)
    expect(peutRecevoir("nouveautes", {})).toBe(false)
  })

  it("un transactionnel passe toujours — couper « votre QR expire » ne sert personne", () => {
    for (const t of ["bienvenue", "abonnement", "equipe", "expiration", "quota", "contact", "relance"] as TypeDEmail[]) {
      expect(INTERRUPTEURS[t], t).toBeNull()
      expect(peutRecevoir(t, { marketing: false, email_leads: false }), t).toBe(true)
    }
  })

  it("les quatre vérifications d'avant délèguent — un seul sens, pas quatre", () => {
    expect(hebdoDesactive({ weekly_report: false })).toBe(true)
    expect(hebdoDesactive({}), "opt-out : absent = activé").toBe(false)
    expect(alerteActivee({ scan_alert: false })).toBe(false)
    expect(alerteActivee(null)).toBe(true)
    expect(accuseActive({ lead_confirmation: false })).toBe(false)
    expect(accuseActive(undefined)).toBe(true)
    for (const [f, appel] of [
      ["lib/rapportHebdo.ts", 'peutRecevoir("rapportHebdo"'],
      ["lib/premierScan.ts", 'peutRecevoir("premierScan"'],
      ["lib/accuseReceptionLead.ts", 'peutRecevoir("accuseLead"'],
      ["lib/notifierProprietaireLead.ts", 'peutRecevoir("lead"'],
    ] as const) {
      expect(lire(f), f).toContain(appel)
    }
  })

  it("le rappel d'inscription porte enfin une sortie", () => {
    const src = lire("app/api/cron/relance/route.ts")
    expect(src).toContain("lienDeSortie(appUrl)")
    expect(src, "et il dit qu'il ne reviendra pas").toMatch(/un seul rappel/i)
    expect(lienDeSortie("https://qrowg.com")).toBe("https://qrowg.com/dashboard/settings")
    expect(lienDeSortie("https://qrowg.com/"), "pas de double barre").toBe("https://qrowg.com/dashboard/settings")
  })
})

describe("garde de classe : la permission se demande au même endroit", () => {
  /**
   * Les clés de préférence que l'écran Réglages propose vraiment.
   *
   * On lisait le bloc `setNotifs({ … })` de la lecture en base — une forme, pas
   * une intention : au lot v121 cette lecture est passée par une variable et le
   * balayage est devenu aveugle sans qu'aucun interrupteur ne bouge. On lit
   * désormais la DÉCLARATION de l'état, qui est l'endroit où l'écran dit ce
   * qu'il propose.
   */
  function clesDeLEcran(): string[] {
    const src = lire("app/dashboard/settings/page.tsx")
    const m = /const \[notifs, setNotifs\] = useState\(\{([\s\S]*?)\}\)/.exec(src)
    return [...(m?.[1] ?? "").matchAll(/(\w+)\s*:/g)].map(x => x[1])
  }

  it("chaque interrupteur de l'écran est nommé dans la table", () => {
    const connues = new Set(Object.values(INTERRUPTEURS).filter(Boolean).map(i => i!.cle))
    const inconnues = clesDeLEcran().filter(c => !connues.has(c))
    expect(inconnues, "un interrupteur que la table ignore ne sera consulté par personne").toEqual([])
  })

  it("et aucun envoi ne lit une préférence à la main", () => {
    const cles = Object.values(INTERRUPTEURS).filter(Boolean).map(i => i!.cle)
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/consentementEmail.ts") continue          // la table elle-même
      if (rel === "app/dashboard/settings/page.tsx") continue   // l'écran qui les règle
      fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
        if (/^\s*(\/\/|\*)/.test(l)) return
        for (const c of cles) {
          // `preferences.email_leads`, `preferences?.email_leads`, `["email_leads"]`
          if (new RegExp(`preferences\\s*\\??\\.\\s*${c}\\b|\\[\\s*["']${c}["']\\s*\\]`).test(l))
            fautes.push(`${rel}:${i + 1} — ${c}`)
        }
      })
    }
    expect(fautes, "passer par peutRecevoir(...)").toEqual([])
  })

  it("les interrupteurs sans envoi sont nommés, et la liste ne grandit pas", () => {
    // Ils sont opt-in : rien ne part indûment. Mais qui coche attend quelque
    // chose qui n'existe pas encore — autant le dire ici que le taire.
    expect(SANS_ENVOI_POUR_L_INSTANT).toEqual(["nouveautes", "marketing"])
    for (const t of SANS_ENVOI_POUR_L_INSTANT) {
      expect(INTERRUPTEURS[t], `${t} garde son interrupteur`).not.toBeNull()
      expect(INTERRUPTEURS[t]!.parDefaut, `${t} est opt-in : rien ne part par défaut`).toBe(false)
    }
  })

  it("le balayage voit bien les envois — sinon il ne prouve rien", () => {
    let consultent = 0
    for (const f of fichiers()) {
      if (/peutRecevoir\(/.test(fs.readFileSync(f, "utf8"))) consultent++
    }
    expect(consultent, "des fichiers qui demandent la permission").toBeGreaterThan(4)
    expect(Object.keys(INTERRUPTEURS).length, "et une table qui couvre tous les envois").toBeGreaterThan(10)
    expect(clesDeLEcran().length, "et l'écran en propose bien plusieurs").toBeGreaterThan(4)
  })
})
