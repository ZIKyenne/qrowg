import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { HEBERGEMENT, reassuranceHebergement, phraseHebergement } from "@/lib/editeur"

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const legal = lire("legal/page.tsx")
const securite = lire("security/page.tsx")
const accueil = [
  lire("HomeClient.tsx"),
  ...readdirSync(join(__dirname, "homeSections")).sort().map(f => lire(join("homeSections", f))),
].join("\n")

// ═══════════════════════════════════════════════════════════════════════════════
// LES PAGES DE CONFIANCE DISENT CE QUI EST VÉRIFIÉ (Q12, Q13).
//
// Q12 — les mentions légales renvoyaient vers la plateforme européenne de
// règlement en ligne des litiges. La Commission européenne l'a arrêtée le
// 20 juillet 2025 : le lien ne menait plus nulle part.
//
// Q13 — « Hébergé en Europe » sur l'accueil, « hébergement en Europe » dans la
// description de la page Sécurité, et la même promesse dans les données
// structurées. Trois paragraphes plus bas, cette même page Sécurité écrit que
// l'application est servie depuis Washington. L'inventaire existait déjà
// (`lib/editeur.ts`) : ce sont les phrases courtes qui ne le lisaient pas.
//
// La règle : **une promesse publique n'est jamais plus large que l'inventaire.**
// ═══════════════════════════════════════════════════════════════════════════════

describe("Q12 — plus de recours qui n'existe plus", () => {
  it("le lien vers la plateforme européenne fermée a disparu", () => {
    for (const [nom, src] of [["/legal", legal], ["/security", securite], ["accueil", accueil]] as const) {
      expect(src, `${nom} pointe encore vers la plateforme ODR`).not.toContain("ec.europa.eu/consumers/odr")
    }
  })

  it("et la page dit ce qui s'est passé, au lieu de se taire", () => {
    expect(legal).toContain("20 juillet 2025")
    expect(legal, "il reste une voie de réclamation").toContain("mailto:contact@qrowg.com")
  })

  it("aucun médiateur n'a été inventé pour remplir la section", () => {
    // Désigner un médiateur suppose une convention signée. En écrire un sans
    // convention serait une fausse promesse de recours.
    expect(legal).not.toMatch(/médiateur\s+(de la consommation\s+)?[«"]/i)
    expect(legal).not.toMatch(/CNPM|MEDICYS|Devigny|AME CONSO/i)
  })
})

describe("Q13 — la promesse d'hébergement ne dépasse pas l'inventaire", () => {
  it("l'inventaire nomme les deux régions, et elles diffèrent", () => {
    expect(HEBERGEMENT.donnees).toBeTruthy()
    expect(HEBERGEMENT.application).toBeTruthy()
    expect(HEBERGEMENT.donnees).not.toBe(HEBERGEMENT.application)
    expect(phraseHebergement()).toContain(HEBERGEMENT.donnees!)
    expect(phraseHebergement(), "l'application ne doit pas être passée sous silence").toContain(HEBERGEMENT.application!)
  })

  it("la phrase courte ne parle que des données", () => {
    expect(reassuranceHebergement()).toBe("Données hébergées dans l’Union européenne")
    expect(reassuranceHebergement(), "elle ne doit pas englober l'application").not.toMatch(/application|servie|tout/i)
  })

  it("plus personne n'écrit « hébergé en Europe » tout court", () => {
    // La formule laissait entendre que TOUT l'était. Elle ne vaut que pour la base.
    for (const [nom, src] of [["accueil", accueil], ["/security", securite]] as const) {
      const sansCommentaires = src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
      expect(sansCommentaires, `${nom} promet encore l'Europe pour tout`)
        .not.toMatch(/[Hh]ébergé en Europe|hébergement en Europe/)
    }
  })

  it("l'accueil et les données structurées lisent l'inventaire", () => {
    expect(accueil).toContain("reassuranceHebergement()")
    expect(lire("../lib/landingJsonLd.ts")).toContain("reassuranceHebergement()")
  })

  it("la description de /security dit la même chose que l'inventaire", () => {
    // Elle est écrite en toutes lettres — la garde SEO mesure sa longueur dans le
    // fichier, et ne sait pas dérouler un appel de fonction. C'est donc ici qu'on
    // vérifie qu'elle n'a pas divergé : même portée, les données et rien d'autre.
    const desc = securite.match(/const DESC = "([^"]*)"/)?.[1]
    expect(desc, "la description de /security a disparu").toBeTruthy()
    expect(desc, "elle doit rester bornée aux données").toContain("données hébergées dans l’UE")
    expect(reassuranceHebergement().toLowerCase()).toContain("données hébergées dans l’union européenne")
    expect(desc, "elle ne doit pas englober l'application").not.toMatch(/en Europe|tout|application/i)
  })

  it("si les données quittaient l'UE, la phrase courte le dirait", () => {
    // On ne peut pas muter la constante : on vérifie que la phrase DÉPEND bien du
    // drapeau, et non d'un texte figé à côté de lui.
    const src = lire("../lib/editeur.ts")
    expect(src).toContain("return HEBERGEMENT.donneesDansUE")
    expect(src).toContain('"Hébergement détaillé sur la page Sécurité"')
  })
})
