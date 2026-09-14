// Un jour, c'est un jour chez le commerçant — garde de classe.
//
// Relevé du 14 septembre, en rejouant les agrégations du produit sur un service
// du samedi soir dans un bar parisien (juillet, UTC+2) :
//
//   horodatage en base      heure à Paris   jour affiché   jour réel
//   2026-07-11T19:10:00Z    21h10           11 samedi      11 samedi
//   2026-07-11T22:15:00Z    00h15           11 samedi      12 DIMANCHE
//   2026-07-11T22:50:00Z    00h50           11 samedi      12 DIMANCHE
//   2026-07-11T23:30:00Z    01h30           11 samedi      12 DIMANCHE
//
//   le produit affichait : { "2026-07-11": 6 }
//   la réalité           : { "2026-07-11": 3, "2026-07-12": 3 }
//
// Pour un bar, un restaurant, une salle : toutes leurs heures de 0 h à 2 h
// tombaient la veille. « Votre meilleur jour : samedi » quand c'était dimanche.
//
// Et « aujourd'hui » suivait : à 00 h 30 le dimanche, le tableau de bord disait
// « aujourd'hui = samedi ». Le commerçant ferme, fait sa caisse, ouvre l'appli,
// et lit les chiffres de la veille sous l'étiquette du jour.
//
// Quatrième défaut, pour l'outre-mer que l'éditeur propose lui-même :
// `formatDay` faisait `new Date("2026-07-11").getDate()` — minuit UTC relu dans
// l'horloge du navigateur. À la Martinique et à Tahiti, l'étiquette reculait
// d'un jour.
//
// Le produit avait DÉJÀ tranché pour les horaires : « un horaire appartient au
// lieu » (`lib/heureDuCommerce`). La classe étend la décision aux chiffres :
// **aucun jour montré au commerçant n'est découpé sur l'horloge UTC.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  jourDuCommerce, aujourdHuiDuCommerce, serieDeJours, dansLaFenetre,
  etiquetteDeJour, nomDuJour, memeJour, mentionFuseauDesStats, FUSEAU_DEFAUT,
} from "./jourDuCommerce"
import { aggregateScanEvents } from "./scanStats"
import { buildDailyData, formatDay } from "@/app/dashboard/analytics/analyticsAgg"
import { nomDeFichierCsv } from "./exportCsv"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Le service du relevé : samedi soir, heure de Paris, stocké en UTC. */
const SERVICE = [
  "2026-07-11T19:10:00Z", // 21h10 samedi
  "2026-07-11T20:05:00Z", // 22h05 samedi
  "2026-07-11T21:40:00Z", // 23h40 samedi
  "2026-07-11T22:15:00Z", // 00h15 DIMANCHE
  "2026-07-11T22:50:00Z", // 00h50 DIMANCHE
  "2026-07-11T23:30:00Z", // 01h30 DIMANCHE
]

describe("le jour d'un instant, chez le commerçant", () => {
  it("le cas du relevé : la soirée se coupe à minuit à Paris, pas à minuit UTC", () => {
    const jours = SERVICE.map(s => jourDuCommerce(s))
    expect(jours).toEqual([
      "2026-07-11", "2026-07-11", "2026-07-11",
      "2026-07-12", "2026-07-12", "2026-07-12",
    ])
    // …et l'ancien découpage mettait les six le même jour.
    expect(new Set(SERVICE.map(s => s.slice(0, 10))).size).toBe(1)
  })

  it("l'heure d'été est celle d'Intl, pas une constante écrite à la main", () => {
    // Même heure d'horloge UTC, deux saisons : en janvier Paris est à +1, en
    // juillet à +2. Un décalage codé en dur se trompe deux dimanches par an.
    expect(jourDuCommerce("2026-01-11T23:30:00Z")).toBe("2026-01-12") // 00h30 le 12
    expect(jourDuCommerce("2026-07-11T22:30:00Z")).toBe("2026-07-12") // 00h30 le 12
    expect(jourDuCommerce("2026-01-11T22:30:00Z")).toBe("2026-01-11") // 23h30 le 11
  })

  it("un fuseau donné l'emporte, un fuseau farfelu retombe sur celui du produit", () => {
    expect(FUSEAU_DEFAUT).toBe("Europe/Paris")
    expect(jourDuCommerce("2026-07-11T22:30:00Z", "Pacific/Tahiti")).toBe("2026-07-11")
    expect(jourDuCommerce("2026-07-11T22:30:00Z", "Indian/Reunion")).toBe("2026-07-12")
    expect(jourDuCommerce("2026-07-11T22:30:00Z", "Mars/Olympus")).toBe(jourDuCommerce("2026-07-11T22:30:00Z"))
    expect(jourDuCommerce("2026-07-11T22:30:00Z", "")).toBe("2026-07-12")
  })

  it("et une date illisible ne fabrique pas un jour", () => {
    expect(jourDuCommerce("")).toBe("")
    expect(jourDuCommerce(null)).toBe("")
    expect(jourDuCommerce("pas une date")).toBe("")
    expect(jourDuCommerce(undefined)).toBe("")
  })

  it("« aujourd'hui », à 00 h 30 un dimanche", () => {
    const minuitPasse = Date.parse("2026-07-11T22:30:00Z")
    expect(aujourdHuiDuCommerce(null, minuitPasse)).toBe("2026-07-12")
    expect(nomDuJour(aujourdHuiDuCommerce(null, minuitPasse))).toBe("dimanche")
    // Ce que le tableau de bord affichait :
    expect(new Date(minuitPasse).toISOString().slice(0, 10)).toBe("2026-07-11")
  })
})

describe("la fenêtre de jours", () => {
  const now = Date.parse("2026-07-12T10:00:00Z")

  it("finit aujourd'hui, chez le commerçant, et remonte le temps", () => {
    expect(serieDeJours(3, null, now)).toEqual(["2026-07-10", "2026-07-11", "2026-07-12"])
    expect(serieDeJours(1, null, now)).toEqual(["2026-07-12"])
    expect(serieDeJours(0, null, now)).toEqual([])
    expect(serieDeJours(-5, null, now)).toEqual([])
  })

  it("le passage à l'heure d'hiver ne répète pas un jour", () => {
    // Dimanche 25 octobre 2026 dure 25 h à Paris. Avancer de 24 h en boucle puis
    // relire le jour ne peut pas produire deux fois la même clé.
    const apres = Date.parse("2026-10-27T10:00:00Z")
    const jours = serieDeJours(7, null, apres)
    expect(new Set(jours).size).toBe(jours.length)
    expect(jours[jours.length - 1]).toBe("2026-10-27")
  })

  it("et le passage à l'heure d'été non plus", () => {
    const apres = Date.parse("2026-03-31T10:00:00Z")
    const jours = serieDeJours(7, null, apres)
    expect(new Set(jours).size).toBe(jours.length)
    expect(jours[jours.length - 1]).toBe("2026-03-31")
  })

  it("appartenir à la fenêtre se lit avec la même règle", () => {
    const f = serieDeJours(3, null, now)
    expect(dansLaFenetre("2026-07-11T22:15:00Z", f)).toBe(true)   // 00h15 le 12
    expect(dansLaFenetre("2026-07-09T12:00:00Z", f)).toBe(false)
    expect(dansLaFenetre(null, f)).toBe(false)
  })
})

describe("l'étiquette du graphique ne dépend pas de l'horloge du lecteur", () => {
  it("elle lit les trois nombres de la clé", () => {
    expect(etiquetteDeJour("2026-07-11")).toBe("11/7")
    expect(etiquetteDeJour("2026-01-05")).toBe("5/1")
    expect(etiquetteDeJour("2026-12-31")).toBe("31/12")
  })

  it("le défaut de l'outre-mer : « 2026-07-11 » n'est plus relu comme un instant", () => {
    // `new Date("2026-07-11")` vaut minuit UTC. À la Martinique (UTC-4) et à
    // Tahiti (UTC-10) — deux fuseaux de FUSEAUX_PROPOSES — `getDate()` rendait 10.
    const parInstant = new Date("2026-07-11")
    expect(parInstant.getUTCDate()).toBe(11)
    expect(etiquetteDeJour("2026-07-11")).toBe("11/7")
    expect(formatDay("2026-07-11")).toBe("11/7")
  })

  it("et une clé qui n'en est pas une ne rend pas « NaN/NaN »", () => {
    for (const mauvais of ["", "hier", "2026-07", "2026-7-1", null, undefined]) {
      expect(etiquetteDeJour(mauvais as string)).toBe("")
      expect(nomDuJour(mauvais as string)).toBe("")
    }
  })

  it("le nom du jour se lit aussi littéralement", () => {
    expect(nomDuJour("2026-07-11")).toBe("samedi")
    expect(nomDuJour("2026-07-12")).toBe("dimanche")
  })
})

describe("le produit compte maintenant les bons jours", () => {
  const events = SERVICE.map(s => ({ scanned_at: s, device: "mobile", country: "FR" }))
  const now = Date.parse("2026-07-12T10:00:00Z")

  it("les statistiques d'un QR : la soirée se partage en deux", () => {
    const r = aggregateScanEvents(events, 3, now)
    expect(r.byDay).toEqual([
      { date: "2026-07-10", count: 0 },
      { date: "2026-07-11", count: 3 },
      { date: "2026-07-12", count: 3 },
    ])
    expect(r.total).toBe(6)
  })

  it("et « le meilleur jour » ne désigne plus un jour qui a absorbé la nuit suivante", () => {
    // Avant : samedi 6, dimanche 0 — le pic était un artefact du découpage.
    const r = aggregateScanEvents(events, 3, now)
    expect(r.peakDay!.count).toBe(3)
  })

  it("le graphique du tableau de bord : mêmes jours, mêmes chiffres", () => {
    const d = buildDailyData(events, [], now)
    const parEtiquette = Object.fromEntries(d.map(p => [p.date, p.scans]))
    expect(parEtiquette["11/7"]).toBe(3)
    expect(parEtiquette["12/7"]).toBe(3)
    expect(d.length).toBe(30)
  })

  it("un fuseau explicite traverse jusqu'aux chiffres", () => {
    // À Tahiti, le même instant tombe un jour plus tôt : les six scans s'y
    // rangent autrement. C'est bien le fuseau qui décide, pas une constante.
    const r = aggregateScanEvents(events, 3, now, "Pacific/Tahiti")
    expect(r.byDay.find(d => d.date === "2026-07-11")!.count).toBe(6)
  })

  it("et le nom du fichier exporté porte le jour du commerçant", () => {
    expect(nomDeFichierCsv("scans", new Date("2026-07-11T22:30:00Z"))).toBe("scans-2026-07-12.csv")
    expect(nomDeFichierCsv("scans", new Date("nawak"))).toBe("scans.csv")
  })
})

describe("la mention de fuseau se tait quand elle n'apprend rien", () => {
  const now = Date.parse("2026-07-12T10:00:00Z")

  it("même heure que le commerce : rien à dire", () => {
    expect(mentionFuseauDesStats("Europe/Paris", "Europe/Paris", now)).toBeNull()
    expect(mentionFuseauDesStats("Europe/Madrid", "Europe/Paris", now)).toBeNull()
  })

  it("ailleurs : on nomme la ville du fuseau, sans table à tenir à jour", () => {
    const m = mentionFuseauDesStats("America/New_York", "Europe/Paris", now)
    expect(m).toBe("Jours comptés à l'heure de Paris.")
    expect(mentionFuseauDesStats("Europe/Paris", "America/Martinique", now))
      .toBe("Jours comptés à l'heure de Martinique.")
  })

  it("et un fuseau inconnu ne fait pas crier au loup", () => {
    expect(mentionFuseauDesStats(null, "Europe/Paris", now)).toBeNull()
    expect(mentionFuseauDesStats("Mars/Olympus", "Europe/Paris", now)).toBeNull()
  })
})

describe("garde de classe : aucun jour montré n'est découpé sur l'horloge UTC", () => {
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

  // Le seul découpage UTC admis : un nom de dossier de stockage, que personne ne
  // lit. La raison est écrite dans le fichier lui-même, pas seulement ici.
  const RANGEMENT = "app/api/social/upload/route.ts"

  it("le découpage UTC d'un horodatage a disparu des jours affichés", () => {
    const coupe = /toISOString\(\)\s*\.\s*(slice\(0,\s*10\)|split\(["']T["']\)\s*\[\s*0\s*\])/
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === RANGEMENT) continue
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (coupe.test(l)) fautes.push(`${rel}:${i + 1} — ${l.slice(0, 100)}`)
      }
    }
    expect(fautes).toEqual([])
  })

  it("et l'exception dit pourquoi elle en est une", () => {
    const src = lire(RANGEMENT)
    expect(src).toContain("jamais un chiffre montré au commerçant")
  })

  it("les agrégations passent toutes par le module", () => {
    for (const [f, attendu] of [
      ["lib/scanStats.ts", "jourDuCommerce(e.scanned_at, fuseau)"],
      ["app/dashboard/analytics/analyticsAgg.ts", "jourDuCommerce(s.scanned_at, fuseau)"],
      ["app/dashboard/analytics/GoalsDashboard.tsx", "jourDuCommerce(c.clicked_at)"],
    ] as const) {
      expect(lire(f), `${f} découpe encore les jours dans son coin`).toContain(attendu)
    }
  })

  it("plus personne ne prend les dix premiers caractères d'un horodatage pour un jour", () => {
    // L'autre forme du même défaut : `scanned_at.slice(0, 10)`. Elle est plus
    // discrète que `toISOString()` et faisait exactement la même erreur.
    const coupe = /\b\w*(_at|At|_le|Date)\s*(\|\|\s*"")?\s*\)?\s*\.\s*slice\(0,\s*10\)/
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (coupe.test(l)) fautes.push(`${rel}:${i + 1} — ${l.slice(0, 100)}`)
      }
    }
    expect(fautes).toEqual([])
  })

  it("le module reprend la décision des horaires, il n'en invente pas une seconde", () => {
    const mod = lire("lib/jourDuCommerce.ts")
    expect(mod).toContain('from "./heureDuCommerce"')
    expect(mod, "un seul fuseau par défaut dans le produit").not.toMatch(/FUSEAU_DEFAUT\s*=\s*"/)
    expect(lire("lib/heureDuCommerce.ts")).toContain('export const FUSEAU_DEFAUT = "Europe/Paris"')
  })
})
