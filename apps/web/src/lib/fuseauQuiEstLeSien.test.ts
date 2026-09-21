// Un jour montré au commerçant est lu sur SON horloge — garde de classe.
//
// Relevé du 20 septembre. Le produit a posé la règle le 14 septembre, et elle a
// sa garde : **« un jour, c'est un jour chez le commerçant »**
// (`lib/horlogeDuCommercant.test.ts`). Son balayage interdit les deux façons de
// lire l'horloge de la machine — `getMonth()/getDate()/getHours()`, et
// `toLocaleDateString("fr-FR", { … })` sans fuseau.
//
// Mais il s'arrête là. À la ligne 224 :
//
//     if (/timeZone/.test(lignes.slice(i, i + 4).join(" "))) continue
//
// **Écrire un `timeZone`, n'importe lequel, suffit à passer.** Et trois dates
// montrées au commerçant en profitaient pour se fixer sur UTC — l'horloge de
// personne :
//
//   invitationsEquipe:168   la date d'expiration d'une invitation d'équipe
//   suppressionDeCompte:98  la date à laquelle son compte sera supprimé
//   verificationDns:127     la date à laquelle son domaine a été vérifié
//
// Ce n'est pas une nuance : Paris est à UTC+1 ou +2. Une invitation qui expire
// le 22 septembre à 01 h 00 heure de Paris vaut le 21 septembre à 23 h 00 en
// UTC — et le commerçant lisait **« expire le 21 septembre »**, la veille du
// vrai jour. Sur la date de suppression de son compte, la même erreur se lit
// autrement : il croit avoir un jour de moins pour changer d'avis.
//
// La quatrième occurrence, `datesContenu.ts`, est CORRECTE et reste : elle fixe
// midi UTC exprès, pour une date éditoriale qui n'appartient à aucun lieu —
// « jamais de décalage de jour », dit son commentaire.
//
// La classe : **une garde qui accepte n'importe quel fuseau ne garde pas le
// fuseau du commerçant.** Le sien a un nom : `FUSEAU_DEFAUT`, et un paramètre
// pour le dire quand on le connaît.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { FUSEAU_DEFAUT } from "./heureDuCommerce"
import { dateLisible } from "./jourDuCommerce"
import { phraseRegression } from "./verificationDns"

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

/**
 * Une date éditoriale n'appartient à aucun lieu : `datesContenu` fixe midi UTC
 * exprès, et son commentaire dit pourquoi. C'est la SEULE exception, et elle ne
 * concerne aucune date qui dépend du commerçant.
 */
const SANS_LIEU: Record<string, string> = {
  "lib/datesContenu.ts": "date de révision d'une page légale : midi UTC exprès, jamais de décalage de jour",
  // `nomDuJour` reçoit une CLÉ de jour — « 2026-09-22 » — déjà calculée dans le
  // fuseau du commerçant. La relire en UTC est la seule façon de ne pas la
  // décaler une seconde fois. C'est le module qui DÉFINIT son horloge.
  "lib/jourDuCommerce.ts": "lecture littérale d'une clé de jour déjà résolue dans le fuseau du commerçant",
}

/** Chaque date formatée en fixant UTC — l'horloge de personne. */
function datesEnUtc(): string[] {
  const out: string[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    if (rel in SANS_LIEU) continue
    fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (/^\s*(\/\/|\*)/.test(l)) return
      if (/toLocale(?:Date|Time)?String\(/.test(l) && /timeZone:\s*["']UTC["']/.test(l)) out.push(`${rel}:${i + 1}`)
      if (/new Intl\.DateTimeFormat\(/.test(l) && /timeZone:\s*["']UTC["']/.test(l)) out.push(`${rel}:${i + 1}`)
    })
  }
  return out
}

/** 22 septembre 2026, 01 h 00 à Paris — soit le 21 septembre 23 h 00 en UTC. */
const MINUIT_PASSE = new Date("2026-09-21T23:00:00.000Z")

describe("une heure de la nuit sépare les deux horloges", () => {
  it("le même instant n'est pas le même jour à Paris et en UTC", () => {
    const paris = dateLisible(MINUIT_PASSE, { day: "numeric", month: "long" }, FUSEAU_DEFAUT)
    const utc = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", day: "numeric", month: "long" }).format(MINUIT_PASSE)
    expect(paris).toBe("22 septembre")
    expect(utc, "c'est exactement la veille").toBe("21 septembre")
    expect(paris).not.toBe(utc)
  })

  it("et la phrase du domaine suit le commerçant, pas le serveur", () => {
    expect(phraseRegression(MINUIT_PASSE)).toContain("22 septembre")
    expect(phraseRegression(MINUIT_PASSE, "Pacific/Tahiti"), "un commerçant d'outre-mer a son jour à lui").toContain("21 septembre")
    expect(phraseRegression(null), "et une date absente ne fabrique pas de jour").not.toMatch(/\d{1,2} \w+ 20\d\d/)
  })

  it("le fuseau par défaut est celui du commerçant, pas celui du serveur", () => {
    expect(FUSEAU_DEFAUT).toBe("Europe/Paris")
    expect(FUSEAU_DEFAUT).not.toBe("UTC")
    // Un fuseau invalide retombe sur le sien, jamais sur celui de la machine.
    expect(dateLisible(MINUIT_PASSE, { day: "numeric", month: "long" }, "Pas/Un_Fuseau")).toBe("22 septembre")
  })
})

describe("garde de classe : aucune date du commerçant n'est fixée sur UTC", () => {
  it("plus aucune date montrée n'est lue sur l'horloge de personne", () => {
    expect(datesEnUtc(), "passer par `dateLisible`, qui prend le fuseau du commerçant").toEqual([])
  })

  it("les trois dates du relevé prennent un fuseau", () => {
    for (const [f, morceau] of [
      ["lib/invitationsEquipe.ts", "function enFrancais(d: Date, fuseau?: string | null)"],
      ["lib/suppressionDeCompte.ts", "function enFrancais(iso: string, fuseau?: string | null)"],
      ["lib/verificationDns.ts", "verifieLe: string | Date | null | undefined, fuseau?: string | null"],
    ] as const) {
      expect(lire(f), f).toContain(morceau)
      expect(lire(f), `${f} : par le geste commun`).toContain("dateLisible(")
    }
  })

  it("l'exception nommée l'est pour une raison, et ne grossit pas", () => {
    expect(Object.keys(SANS_LIEU).sort()).toEqual(["lib/datesContenu.ts", "lib/jourDuCommerce.ts"])
    const src = lire("lib/datesContenu.ts")
    expect(src, "la raison est écrite dans le fichier lui-même").toContain("jamais de décalage de jour")
    expect(src, "et elle fixe bien midi, pas minuit").toContain("T12:00:00.000Z")
    // La seconde exception n'est pas un passe-droit : c'est une clé déjà résolue.
    expect(lire("lib/jourDuCommerce.ts")).toContain("Même lecture littérale.")
  })

  it("le balayage voit bien les dates — sinon il ne prouve rien", () => {
    let formats = 0
    for (const f of fichiers()) formats += (fs.readFileSync(f, "utf8").match(/toLocale(?:Date|Time)?String\(|Intl\.DateTimeFormat\(/g) ?? []).length
    expect(formats, "des formatages de date dans le produit").toBeGreaterThan(10)
    // Le détecteur sait dire oui — sinon il ne dirait jamais non.
    const nu = 'return d.toLocaleDateString("fr-FR", { day: "numeric", timeZone: "UTC" })'
    expect(/toLocale(?:Date|Time)?String\(/.test(nu) && /timeZone:\s*["']UTC["']/.test(nu)).toBe(true)
    // La garde du 14 septembre tient toujours sa moitié — celle de l'horloge machine.
    expect(lire("lib/horlogeDuCommercant.test.ts")).toContain("un jour, c'est un jour chez le")
  })
})
