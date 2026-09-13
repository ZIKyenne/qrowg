// L'heure du commerce, pas celle du téléphone — garde de classe.
//
// Relevé du 13 septembre au navigateur, modèle « Bistrot français »
// (Lun-Ven 12h-14h30 et 19h-23h), même instant réel, trois fuseaux :
//
//     Europe/Paris      → « Ferme bientôt · à 23h »
//     America/New_York  → « Fermé · ouvre à 19h »      ← le service tournait
//     Asia/Tokyo        → « Fermé · ouvre à 12h »      ← et mauvais jour
//
// La classe : tout ce que le produit calcule à partir d'une heure de commerce
// doit se lire dans le fuseau DU COMMERCE. Le badge « Ouvert / Fermé », le
// surlignage « Aujourd'hui », dans l'éditeur comme sur la page publiée.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  FUSEAU_DEFAUT, FUSEAUX_PROPOSES, chezLeCommerce, fuseauDuBloc, fuseauValide,
  memeHeureQue, mentionFuseau,
} from "./heureDuCommerce"
import { openStatus } from "@/app/dashboard/builder/types"

const SRC = path.join(__dirname, "..")

/** Les fichiers qui rendent le bloc « horaires », page publiée et éditeur. */
const RENDUS_HORAIRES = [
  "app/[slug]/blocsPublics.tsx",
  "app/dashboard/builder/shared-renderer/blocks/opening_hours/index.tsx",
  "app/dashboard/builder/builderPreview.tsx",
]

const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

// Le bistrot du modèle : lundi midi et soir.
const BISTROT = { mon_fri: "12h - 14h30, 19h - 23h", saturday: "19h - 23h30", sunday: "Fermé" }
// Lundi 14 septembre 2026, 20 h 30 UTC = 22 h 30 à Paris, 16 h 30 à New York,
// 5 h 30 le mardi à Tokyo.
const INSTANT = new Date("2026-09-14T20:30:00Z")

describe("lire l'heure là où est le commerce", () => {
  it("donne le bon jour et la bonne minute dans chaque fuseau", () => {
    expect(chezLeCommerce(INSTANT, "Europe/Paris")).toEqual({ jour: 1, minutes: 22 * 60 + 30 })
    expect(chezLeCommerce(INSTANT, "America/New_York")).toEqual({ jour: 1, minutes: 16 * 60 + 30 })
    expect(chezLeCommerce(INSTANT, "Asia/Tokyo")).toEqual({ jour: 2, minutes: 5 * 60 + 30 })
  })

  it("suit l'heure d'été toute seule", () => {
    // Paris : UTC+2 en août, UTC+1 en janvier. Aucune table de décalage à tenir.
    expect(chezLeCommerce(new Date("2026-08-01T12:00:00Z"), "Europe/Paris").minutes).toBe(14 * 60)
    expect(chezLeCommerce(new Date("2026-01-15T12:00:00Z"), "Europe/Paris").minutes).toBe(13 * 60)
  })

  it("passe minuit sans se tromper de jour", () => {
    // Dimanche 23 h UTC = lundi 1 h à Paris.
    expect(chezLeCommerce(new Date("2026-09-13T23:00:00Z"), "Europe/Paris")).toEqual({ jour: 1, minutes: 60 })
    // Lundi 2 h UTC = dimanche 22 h à New York.
    expect(chezLeCommerce(new Date("2026-09-14T02:00:00Z"), "America/New_York")).toEqual({ jour: 0, minutes: 22 * 60 })
  })

  it("retombe sur le fuseau par défaut quand celui du bloc ne vaut rien", () => {
    expect(fuseauDuBloc({})).toBe(FUSEAU_DEFAUT)
    expect(fuseauDuBloc({ fuseau: "  " })).toBe(FUSEAU_DEFAUT)
    expect(fuseauDuBloc({ fuseau: "Mars/Olympus" })).toBe(FUSEAU_DEFAUT)
    expect(fuseauDuBloc({ fuseau: "Indian/Reunion" })).toBe("Indian/Reunion")
  })

  it("tous les fuseaux proposés dans l'éditeur existent vraiment", () => {
    for (const tz of FUSEAUX_PROPOSES) expect(fuseauValide(tz), tz).toBe(true)
    expect(FUSEAUX_PROPOSES).toContain(FUSEAU_DEFAUT)
  })
})

describe("le badge dit la même chose partout dans le monde", () => {
  it("le bistrot parisien est ouvert, quel que soit le téléphone qui regarde", () => {
    // Le défaut suffit : le commerçant n'a rien réglé, la page reste juste.
    const st = openStatus(BISTROT, INSTANT)
    expect(st?.open).toBe(true)
    expect(st?.label).toBe("Ferme bientôt · à 23h")
  })

  it("et le fuseau du bloc décide, pas le fuseau de la machine", () => {
    const paris = openStatus(BISTROT, INSTANT, "Europe/Paris")
    const tokyo = openStatus(BISTROT, INSTANT, "Asia/Tokyo")
    expect(paris?.open).toBe(true)
    // À Tokyo il est 5 h 30 du matin, mardi : le même commerce y serait fermé.
    expect(tokyo?.open).toBe(false)
    // Ce qui prouve que le calcul suit bien le fuseau qu'on lui donne.
    expect(paris?.label).not.toBe(tokyo?.label)
  })

  it("un commerce d'outre-mer règle son fuseau et le badge suit", () => {
    // La Réunion (UTC+4) : à 20 h 30 UTC il y est 0 h 30, mardi — fermé.
    const st = openStatus({ ...BISTROT, fuseau: "Indian/Reunion" }, INSTANT)
    expect(st?.open).toBe(false)
  })
})

describe("le visiteur sait à quelle heure il lit", () => {
  it("ne prévient pas quand c'est la même heure", () => {
    expect(memeHeureQue(INSTANT, "Europe/Paris", "Europe/Madrid")).toBe(true)
    expect(memeHeureQue(INSTANT, "Europe/Paris", "Europe/Paris")).toBe(true)
  })

  it("prévient quand ce n'en est pas la même", () => {
    expect(memeHeureQue(INSTANT, "Europe/Paris", "America/New_York")).toBe(false)
    expect(memeHeureQue(INSTANT, "Europe/Paris", "Asia/Tokyo")).toBe(false)
  })

  it("distingue deux fuseaux qui marquent la même heure un jour différent", () => {
    // Kiritimati (UTC+14) et Tahiti (UTC-10) affichent « 10:30 » au même instant,
    // mais l'un est mardi et l'autre lundi : pour un badge qui se calcule sur le
    // jour de la semaine, ce n'est pas la même heure.
    expect(chezLeCommerce(INSTANT, "Pacific/Kiritimati").jour).toBe(2)
    expect(chezLeCommerce(INSTANT, "Pacific/Tahiti").jour).toBe(1)
    expect(memeHeureQue(INSTANT, "Pacific/Kiritimati", "Pacific/Tahiti")).toBe(false)
  })

  it("se tait quand le navigateur ne dit pas son fuseau", () => {
    expect(memeHeureQue(INSTANT, "Europe/Paris", null)).toBe(true)
    expect(memeHeureQue(INSTANT, "Europe/Paris", "n'importe quoi")).toBe(true)
  })

  it("nomme le lieu, sans code technique", () => {
    expect(mentionFuseau("Europe/Paris")).toBe("heure de Paris")
    expect(mentionFuseau("America/New_York")).toBe("heure de New York")
    expect(mentionFuseau("Mars/Olympus")).toBe("heure de Paris")
  })
})

describe("aucun rendu d'horaires ne lit plus l'horloge du visiteur", () => {
  it.each(RENDUS_HORAIRES)("%s", (f) => {
    const src = lire(f)
    expect(src, "openStatus appelé sans fuseau").not.toMatch(/openStatus\(c,\s*(new Date\(\)|maintenant)\s*\)/)
    expect(src, "le jour surligné vient encore du téléphone").not.toContain("new Date().getDay()")
    expect(src).toContain("fuseauDuBloc")
  })

  it("openStatus lui-même ne touche plus getDay ni getHours", () => {
    const types = lire("app/dashboard/builder/types.ts")
    const bloc = types.slice(types.indexOf("export function openStatus("), types.indexOf("// ── vCard"))
    expect(bloc).not.toContain("now.getDay()")
    expect(bloc).not.toContain("now.getHours()")
    expect(bloc).toContain("chezLeCommerce(")
  })

  it("le commerçant peut changer ce fuseau sans nous écrire", () => {
    const defs = lire("app/dashboard/builder/blockDefs.ts")
    const bloc = defs.slice(defs.indexOf("opening_hours: {"), defs.indexOf("contact_form: {"))
    expect(bloc).toContain('key: "fuseau"')
    expect(bloc).toContain("FUSEAUX_PROPOSES")
  })
})
