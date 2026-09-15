// Un robot n'est pas un client — garde de classe.
//
// Relevé du 13 septembre (voir lib/robots.ts) : la redirection `/q/<code>`
// écrivait une ligne dans `scans` à chaque requête, y compris quand son propre
// `parseDevice` avait déjà répondu « bot ». Un commerçant qui collait son lien
// dans un groupe WhatsApp récoltait un « scan » par aperçu, et le déclencheur
// SQL incrémentait les compteurs pour de bon.
//
// La classe est plus large qu'un fichier : elle a DEUX faces.
//   · À l'écriture — tout endroit qui insère une ligne comptée doit d'abord
//     demander `estUnRobot` sur l'en-tête `User-Agent`.
//   · À la lecture — tout endroit qui compte des `scans` ou des `page_views`
//     pour montrer un chiffre (ou remplir un quota) doit écarter les lignes
//     `device: "bot"` déjà écrites : elles restent en base, elles ne doivent
//     plus peser.
//
// Cette garde balaie l'arbre et vérifie les deux faces sur TOUS les fichiers,
// y compris ceux qui n'existent pas encore.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { estUnRobot, ligneDeRobot, APPAREIL_ROBOT } from "@/lib/robots"
import { aggregateScanEvents, parseDevice, type ScanEvent } from "@/lib/scanStats"

const SRC = path.join(__dirname, "..")

/** Les tables dont une ligne devient un chiffre montré au commerçant. */
const TABLES_COMPTEES = ["scans", "page_views", "instant_scan_events", "block_clicks", "page_events"] as const
/** Celles qui portent la colonne `device` : leur historique se répare à la lecture. */
const TABLES_AVEC_APPAREIL = ["scans", "page_views"] as const

function tousLesFichiers(dir: string, acc: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name === "node_modules" || e.name === ".next") continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) tousLesFichiers(p, acc)
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) acc.push(p)
  }
  return acc
}

const FICHIERS = tousLesFichiers(SRC).map(p => ({ chemin: path.relative(SRC, p), code: fs.readFileSync(p, "utf8") }))

describe("le jugement lui-même", () => {
  it("reconnaît un aperçu de lien et laisse passer un téléphone", () => {
    expect(estUnRobot("WhatsApp/2.23.20.0")).toBe(true)
    expect(estUnRobot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true)
    expect(estUnRobot(null)).toBe(true)
    expect(estUnRobot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")).toBe(false)
  })

  it("reconnaît une ligne déjà écrite, quelle que soit la casse", () => {
    expect(ligneDeRobot("bot")).toBe(true)
    expect(ligneDeRobot("BOT")).toBe(true)
    expect(ligneDeRobot("mobile")).toBe(false)
    expect(ligneDeRobot(null)).toBe(false)
  })

  it("le mot filtré est exactement celui que parseDevice écrit", () => {
    expect(parseDevice("Mozilla/5.0 (compatible; bingbot/2.0)")).toBe(APPAREIL_ROBOT)
  })
})

describe("à la lecture : l'historique cesse de peser", () => {
  const ev = (device: string, jour: string): ScanEvent => ({ scanned_at: `2026-09-${jour}T10:00:00Z`, device, country: "FR" })
  const NOW = Date.parse("2026-09-13T12:00:00Z")

  it("les lignes « bot » sortent du total, du graphe, des appareils et des pays", () => {
    const s = aggregateScanEvents(
      [ev("mobile", "12"), ev("bot", "12"), ev("bot", "13"), ev("desktop", "13")],
      7, NOW,
    )
    expect(s.total).toBe(2)
    expect(s.byDevice.some(d => d.device === "bot")).toBe(false)
    expect(s.byCountry.reduce((n, c) => n + c.count, 0)).toBe(2)
    expect(s.byDay.reduce((n, d) => n + d.count, 0)).toBe(2)
  })

  it("ce qui est retiré est compté, pas effacé en silence", () => {
    expect(aggregateScanEvents([ev("bot", "12"), ev("bot", "13")], 7, NOW).robots).toBe(2)
    expect(aggregateScanEvents([ev("mobile", "12")], 7, NOW).robots).toBe(0)
  })

  it("un compte qui n'a reçu que des robots n'affiche pas un pic", () => {
    const s = aggregateScanEvents([ev("bot", "12"), ev("bot", "12"), ev("bot", "13")], 7, NOW)
    expect(s.total).toBe(0)
    expect(s.peakDay).toBeNull()
    expect(s.robots).toBe(3)
  })
})

describe("à l'écriture : aucune insertion sans ce jugement", () => {
  it.each(TABLES_COMPTEES)("toute insertion dans « %s » demande d'abord estUnRobot", (table) => {
    const fautifs = FICHIERS
      .filter(f => new RegExp(`from\\("${table}"\\)[\\s\\S]{0,80}\\.insert`).test(f.code))
      .filter(f => !f.code.includes("estUnRobot"))
      .map(f => f.chemin)
    expect(fautifs, `Ces fichiers écrivent dans « ${table} » sans distinguer un client d'un programme : ${fautifs.join(", ")}`).toEqual([])
  })
})

describe("à la lecture : aucun chiffre sans ce filtre", () => {
  it.each(TABLES_AVEC_APPAREIL)("chaque requête sur « %s » écarte les lignes robots", (table) => {
    const fautifs: string[] = []
    for (const f of FICHIERS) {
      const lectures = f.code.match(new RegExp(`from\\("${table}"\\)`, "g"))?.length ?? 0
      if (!lectures) continue
      // Une insertion gardée par `estUnRobot` compte pour une occurrence légitime.
      const insertions = f.code.match(new RegExp(`from\\("${table}"\\)[\\s\\S]{0,80}\\.insert`, "g"))?.length ?? 0
      const filtres = f.code.match(/\.neq\("device", APPAREIL_ROBOT\)/g)?.length ?? 0
      // Un filtre POSITIF écarte aussi les robots : `.eq("device", d)` où `d`
      // parcourt une liste de valeurs qui ne contient pas « bot » ne peut pas
      // en ramener une. C'est ce que fait la fiche d'un QR depuis le lot v128,
      // qui compte par appareil DANS la base au lieu de rapatrier les lignes.
      // La garde s'ancre sur l'intention — « aucun robot dans un chiffre » —
      // pas sur la forme `.neq`. Le test suivant vérifie que ces listes
      // n'admettent jamais le robot : sans lui, ce compte rendrait aveugle.
      const positifs = f.code.match(/\.eq\("device", /g)?.length ?? 0
      if (filtres + insertions + positifs < lectures) fautifs.push(`${f.chemin} (${lectures} requête(s), ${filtres} filtre(s))`)
    }
    expect(fautifs, `Ces fichiers comptent des lignes « ${table} » sans écarter les robots — il manque .neq("device", APPAREIL_ROBOT) : ${fautifs.join(", ")}`).toEqual([])
  })

  it("et une liste d'appareils autorisés ne laisse jamais entrer le robot", () => {
    // Le filtre positif ne protège que si la liste exclut « bot ». S'il suffisait
    // d'écrire `.eq("device", …)` pour satisfaire la garde, elle ne prouverait
    // plus rien : ce test est la contrepartie.
    const listes: string[] = []
    for (const f of FICHIERS) {
      for (const m of f.code.matchAll(/const APPAREILS = (\[[^\]]*\])/g)) listes.push(`${f.chemin} → ${m[1]}`)
    }
    expect(listes.length, "au moins une liste d'appareils dans le produit").toBeGreaterThan(0)
    for (const l of listes) expect(l, l).not.toContain(`"${APPAREIL_ROBOT}"`)
  })

  // `instant_scan_events` fait exception EN CONNAISSANCE DE CAUSE : ses lignes
  // sont lues entières pour que `aggregateScanEvents` puisse dire au commerçant
  // combien d'aperçus ont été écartés. Le filtre est en JavaScript, pas en SQL —
  // et le test du bloc précédent le prouve.
  it("instant_scan_events est filtré en JavaScript, et c'est écrit", () => {
    const lecteur = FICHIERS.find(f => f.chemin.includes(path.join("api", "qr-instant", "stats")))
    expect(lecteur).toBeTruthy()
    expect(lecteur!.code).toContain("aggregateScanEvents")
  })
})
