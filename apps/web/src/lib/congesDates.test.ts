// Le message de congés qui ne s'éteint jamais — garde de classe.
//
// Relevé du 13 septembre, au navigateur, bloc « Horaires » garni d'un contenu de
// vrai commerçant. Lundi 14 septembre 2026, 10 h, heure de Paris :
//
//     badge     : « Ouvert · ferme à 18h »
//     bannière  : « 📅 Fermé du 1er au 15 août »
//
// Deux affirmations contraires dans la même rangée, un mois après la fin des
// congés. La classe : le produit ne doit jamais présenter comme courante une
// période que le commerçant a lui-même datée et qui est passée — et il ne doit
// jamais deviner une période qu'on ne lui a pas donnée.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  etatDesConges, periodeDeConges, phraseCongesTermines, phrasePendantConges,
  jourEnFrancais, jourDeReouverture,
} from "./congesDates"
import { openStatus } from "@/app/dashboard/builder/types"
import { alertesPublication } from "@/app/dashboard/builder/AlertesPublication"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Lundi 14 septembre 2026, 10 h à Paris — l'instant du relevé. */
const RELEVE = new Date("2026-09-14T08:00:00Z")
const jour = (iso: string) => new Date(`${iso}T00:00:00Z`)

const BOUTIQUE = { mon_fri: "9h - 18h", saturday: "10h - 16h", sunday: "Fermé" }

describe("lire la date que le commerçant a écrite", () => {
  it("« du 1er au 15 août » — le mois du début vient de la fin", () => {
    const p = periodeDeConges("Fermé du 1er au 15 août", RELEVE)!
    expect(p.debut.toISOString().slice(0, 10)).toBe("2026-08-01")
    expect(p.fin.toISOString().slice(0, 10)).toBe("2026-08-15")
  })

  it("« du 24 décembre au 2 janvier » — le début est l'année d'avant la fin", () => {
    const p = periodeDeConges("Fermé du 24 décembre au 2 janvier", jour("2026-12-28"))!
    expect(p.debut.toISOString().slice(0, 10)).toBe("2026-12-24")
    expect(p.fin.toISOString().slice(0, 10)).toBe("2027-01-02")
  })

  it("lit aussi les chiffres, avec ou sans année", () => {
    expect(periodeDeConges("du 01/08 au 15/08", RELEVE)!.fin.toISOString().slice(0, 10)).toBe("2026-08-15")
    expect(periodeDeConges("du 01/08/2025 au 15/08/2025", RELEVE)!.fin.toISOString().slice(0, 10)).toBe("2025-08-15")
  })

  it("« jusqu'au 15 août » et « le 25 décembre »", () => {
    expect(periodeDeConges("Fermé jusqu’au 15 août", RELEVE)!.fin.toISOString().slice(0, 10)).toBe("2026-08-15")
    expect(periodeDeConges("Fermé le 25 décembre", jour("2026-12-20"))!.debut.toISOString().slice(0, 10)).toBe("2026-12-25")
  })

  it("choisit l'année la plus proche : août lu en septembre est passé, lu en juin il arrive", () => {
    expect(periodeDeConges("du 1er au 15 août", jour("2026-09-14"))!.fin.getUTCFullYear()).toBe(2026)
    expect(periodeDeConges("du 1er au 15 août", jour("2026-06-01"))!.fin.getUTCFullYear()).toBe(2026)
    expect(periodeDeConges("du 1er au 15 janvier", jour("2026-12-20"))!.fin.getUTCFullYear()).toBe(2027)
  })

  it("se tait sur tout ce qui n'est pas daté — le produit ne devine pas", () => {
    for (const t of [
      "Fermé cet été", "Congés annuels", "Fermé quelques jours", "Ouvert pendant les travaux",
      "Fermé du lundi au vendredi", "Réservation recommandée", "", "   ", null, undefined,
    ]) {
      expect(periodeDeConges(t as any, RELEVE), String(t)).toBeNull()
    }
  })

  it("refuse une date impossible plutôt que d'en inventer une", () => {
    expect(periodeDeConges("Fermé du 31 au 32 février", RELEVE)).toBeNull()
    expect(periodeDeConges("Fermé du 15 au 1er août", RELEVE)).toBeNull()   // fin avant début
  })
})

describe("où en est la période", () => {
  it("avant, pendant, terminée", () => {
    const t = "Fermé du 1er au 15 août"
    expect(etatDesConges(t, jour("2026-07-20")).etat).toBe("avant")
    expect(etatDesConges(t, jour("2026-08-07")).etat).toBe("pendant")
    expect(etatDesConges(t, jour("2026-09-14")).etat).toBe("terminee")
  })

  it("le dernier jour compte entièrement", () => {
    const t = "Fermé du 1er au 15 août"
    expect(etatDesConges(t, jour("2026-08-15")).etat).toBe("pendant")
    expect(etatDesConges(t, jour("2026-08-16")).etat).toBe("terminee")
  })

  it("compte les jours écoulés depuis la fin", () => {
    const e = etatDesConges("Fermé du 1er au 15 août", jour("2026-09-14"))
    expect(e.etat).toBe("terminee")
    expect(e.etat !== "aucune" && e.joursDepuis).toBe(30)
  })
})

describe("le badge et la bannière ne se contredisent plus", () => {
  it("pendant les congés, le badge annonce la réouverture — pas l'horaire habituel", () => {
    const c = { ...BOUTIQUE, exception: "Fermé du 1er au 15 août" }
    const st = openStatus(c, new Date("2026-08-10T08:00:00Z"))
    expect(st?.open).toBe(false)
    expect(st?.label).toBe("Fermé · réouverture le 16 août")
  })

  it("le jour de la réouverture, l'horaire habituel reprend la main", () => {
    const c = { ...BOUTIQUE, exception: "Fermé du 1er au 15 août" }
    // 17 août 2026 = lundi.
    expect(openStatus(c, new Date("2026-08-17T08:00:00Z"))?.label).toBe("Ouvert · ferme à 18h")
  })

  it("l'instant exact du relevé : plus de « Ouvert » sous une fermeture périmée", () => {
    const c = { ...BOUTIQUE, exception: "Fermé du 1er au 15 août" }
    // Le badge redit l'horaire habituel — c'est juste — et la bannière, elle,
    // n'est plus publiée (garde de rendu plus bas).
    expect(openStatus(c, RELEVE)?.label).toBe("Ouvert · ferme à 18h")
    expect(etatDesConges(c.exception, jour("2026-09-14")).etat).toBe("terminee")
  })

  it("un message sans date ne change rien au badge", () => {
    const c = { ...BOUTIQUE, exception: "Fermé cet été" }
    expect(openStatus(c, RELEVE)?.label).toBe("Ouvert · ferme à 18h")
  })
})

describe("ce qu'on en dit", () => {
  it("nomme les jours en français, sans code", () => {
    expect(jourEnFrancais(jour("2026-08-15"))).toBe("15 août")
    expect(jourEnFrancais(jour("2026-09-01"))).toBe("1er septembre")
  })

  it("la réouverture est le lendemain de la fin", () => {
    const p = periodeDeConges("du 1er au 15 août", RELEVE)!
    expect(jourEnFrancais(jourDeReouverture(p))).toBe("16 août")
    expect(phrasePendantConges(p)).toBe("Fermé · réouverture le 16 août")
  })

  it("le commerçant est prévenu, et sait pourquoi", () => {
    const e = etatDesConges("Fermé du 1er au 15 août", jour("2026-09-14"))
    expect(phraseCongesTermines(e)).toBe("Message d'exception terminé depuis 30 jours — il n'est plus affiché en ligne")
    expect(phraseCongesTermines(etatDesConges("Fermé du 1er au 15 août", jour("2026-08-16")))).toContain("hier")
    // Rien à dire tant que la période court, ou quand aucune date n'est lisible.
    expect(phraseCongesTermines(etatDesConges("Fermé du 1er au 15 août", jour("2026-08-07")))).toBeNull()
    expect(phraseCongesTermines(etatDesConges("Fermé cet été", RELEVE))).toBeNull()
  })

  it("l'alerte remonte près du bouton « Publier »", () => {
    const bloc = {
      id: "b1", type: "opening_hours", visible: true,
      content: { ...BOUTIQUE, exception: "Fermé du 1er au 15 août" },
    } as any
    const a = alertesPublication([bloc], jour("2026-09-14"))
    expect(a.map(x => x.texte)).toContain("Message d'exception terminé depuis 30 jours — il n'est plus affiché en ligne")
    expect(a[0].blocId).toBe("b1")
    // Période en cours : rien à signaler.
    expect(alertesPublication([bloc], jour("2026-08-07"))).toEqual([])
  })
})

describe("aucun rendu ne publie plus une période passée", () => {
  it.each([
    "app/[slug]/blocsPublics.tsx",
    "app/dashboard/builder/shared-renderer/blocks/opening_hours/index.tsx",
  ])("%s filtre la bannière", (f) => {
    const src = lire(f)
    expect(src).toContain("etatDesConges")
    expect(src).toContain('"terminee"')
    // La bannière ne se rend plus directement depuis le champ brut : ce qui est
    // affiché est une valeur QUI DÉPEND de l'état de la période.
    expect(src, "la bannière lit encore le champ sans le dater").not.toMatch(/\{\s*(c|h)\.exception\s*&&\s*\(/)
    const affichee = /const\s+(\w*[eE]xception\w*)\s*=\s*([^\n]*)/.exec(src)
    expect(affichee, "aucune valeur intermédiaire : la bannière sort du champ brut").toBeTruthy()
    expect(affichee![2], "la valeur affichée ne dépend pas de la période").toMatch(/[pP]erimee/)
  })

  it("le texte du commerçant n'est jamais effacé — seulement non publié", () => {
    const alertes = lire("app/dashboard/builder/AlertesPublication.tsx")
    expect(alertes).toContain("phraseCongesTermines")
    for (const f of ["app/[slug]/blocsPublics.tsx", "app/dashboard/builder/shared-renderer/blocks/opening_hours/index.tsx"]) {
      expect(lire(f), `${f} écrit dans le contenu`).not.toMatch(/c\.exception\s*=/)
    }
  })
})
