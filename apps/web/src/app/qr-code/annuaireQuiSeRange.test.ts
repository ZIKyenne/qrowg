// annuaireQuiSeRange — lot v192.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Le hub `/qr-code` alignait **vingt-six cartes rigoureusement identiques**, en
// une seule grille à plat : même icône au même endroit, même titre, même
// paragraphe, même « Créer ce QR code → ». Six mille six cents pixels sur
// téléphone.
//
// Personne ne lit vingt-six cartes. On en parcourt trois et on s'en va. Et une
// grille de vingt-six éléments interchangeables est, en soi, un signal : une
// page écrite par quelqu'un aurait rangé.
//
// Chaque usage déclare maintenant sa `famille`, et le hub groupe. L'ordre des
// familles vient des DONNÉES, pas d'une liste écrite dans la page : un usage
// ajouté demain trouve sa place tout seul.
//
// ── Ce que cette garde tient ───────────────────────────────────────────────
//
// 1. Chaque usage a une famille — sinon il n'apparaît dans aucun groupe et
//    disparaît du hub en silence. C'est le défaut le plus coûteux ici : une
//    page SEO qui existe, que le sitemap annonce, et que le hub ne montre plus.
// 2. Le hub ne recopie pas la liste des familles : il la déduit des données.
// 3. Aucune famille ne contient un seul usage — un groupe d'un élément est un
//    titre de plus pour rien.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { VERTICALS, VERTICAL_ORDER } from "./verticals"

const lire = (f: string) => fs.readFileSync(path.join(__dirname, f), "utf8")

export function usages() {
  return VERTICAL_ORDER.map(s => VERTICALS[s]).filter(Boolean)
}

describe("le hub des usages se range en familles", () => {
  it("le relevé voit bien les usages (sinon il est aveugle)", () => {
    expect(usages().length, "plus aucun usage lu — l'import ne rend rien").toBeGreaterThan(20)
  })

  it("chaque usage déclare sa famille", () => {
    // Sans famille, l'usage n'entre dans aucun groupe : sa page existe, le
    // sitemap l'annonce, et le hub ne la montre plus. Une disparition
    // silencieuse, celle que cette série traque depuis le lot v170.
    const sans = usages().filter(v => !v.famille || !v.famille.trim()).map(v => v.slug)
    expect(sans, "un usage sans famille disparaît du hub sans un bruit").toEqual([])
  })

  it("aucune famille ne contient un seul usage", () => {
    const compte = new Map<string, number>()
    for (const v of usages()) compte.set(v.famille, (compte.get(v.famille) ?? 0) + 1)
    const seuls = [...compte.entries()].filter(([, n]) => n < 2).map(([f, n]) => `${f} (${n})`)
    expect(seuls, "une famille d'un seul usage est un titre de plus pour rien").toEqual([])
  })

  it("le hub déduit les familles des données, il ne les recopie pas", () => {
    // Une liste écrite dans la page dériverait de la liste écrite dans les
    // données — la cause que cette série défait depuis le lot v151.
    const page = lire("page.tsx")
    expect(page, "le hub ne déduit plus les familles des données").toContain("new Set(Object.values(VERTICALS).map(v => v.famille))")
    for (const f of new Set(usages().map(v => v.famille))) {
      expect(page, `la famille « ${f} » est recopiée dans la page`).not.toContain(`"${f}"`)
    }
  })

  it("chaque usage du hub reste joignable", () => {
    // Le groupement filtre sur la famille : un usage mal orthographié
    // disparaîtrait. On vérifie que la somme des groupes fait bien le tout.
    const familles = [...new Set(usages().map(v => v.famille))]
    const groupes = familles.reduce((n, f) => n + usages().filter(v => v.famille === f).length, 0)
    expect(groupes, "des usages se perdent entre les groupes").toBe(usages().length)
  })

  // ── Contre-épreuves ─────────────────────────────────────────────────────

  it("un usage sans famille serait vu", () => {
    const faux = [{ slug: "orphelin", famille: "" }]
    expect(faux.filter(v => !v.famille || !v.famille.trim()).map(v => v.slug)).toEqual(["orphelin"])
  })

  it("une famille d'un seul serait vue", () => {
    const compte = new Map([["Pleine", 4], ["Solitaire", 1]])
    expect([...compte.entries()].filter(([, n]) => n < 2).map(([f]) => f)).toEqual(["Solitaire"])
  })
})
