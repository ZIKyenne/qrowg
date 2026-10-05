import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  DIMENSIONS_MESUREES, NON_MESURE, COMPTEURS, COMPTEURS_ORDONNES,
  promesseMesure, detailMesure, limiteMesure,
} from "./ceQueMesureLeProduit"

const SRC = join(__dirname, "..")
const lire = (p: string) => readFileSync(join(SRC, p), "utf8")
const accueil = [
  lire("app/HomeClient.tsx"),
  ...readdirSync(join(SRC, "app/homeSections")).sort().map(f => lire(join("app/homeSections", f))),
].join("\n")
const suivi = lire("app/api/track/route.ts")
const redirection = lire("app/q/[code]/route.ts")

// ═══════════════════════════════════════════════════════════════════════════════
// LA MESURE DIT CE QU'ELLE MESURE (Q20, Q30).
//
// Q20 — « Sachez exactement qui scanne » sur l'accueil, « Voyez qui scanne, quand
// et avec quoi » sur la grille tarifaire. Le produit ne sait pas QUI : il
// n'enregistre ni nom, ni e-mail, ni numéro.
//
// Q30 — « Vues », « Visites », « Scans », « Scans QR » désignaient parfois la même
// chose d'un panneau à l'autre, et rien n'expliquait à un commerçant la différence
// entre une lecture de QR, une requête de redirection et une visite de page.
//
// Ces gardes tiennent les deux bouts : les mots de la vitrine ne dépassent pas ce
// que le code écrit, et ce que le code écrit est décrit quelque part.
// ═══════════════════════════════════════════════════════════════════════════════

describe("Q20 — la vitrine ne promet plus une identité", () => {
  it("« qui scanne » a disparu des promesses", () => {
    const sansCommentaires = accueil.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
    expect(sansCommentaires, "l'accueil promet encore de savoir qui scanne")
      .not.toMatch(/(Sachez|Voyez|Savoir|Connaissez)[^."]{0,20}qui scanne/i)
  })

  it("les deux phrases viennent de la source unique", () => {
    expect(accueil).toContain("promesseMesure()")
    expect(accueil).toContain("detailMesure()")
    expect(accueil, "la limite doit accompagner la promesse").toContain("limiteMesure()")
  })

  it("et ce qu'elles disent est vérifiable", () => {
    expect(promesseMesure()).toBe("Voyez d’où viennent vos scans")
    expect(promesseMesure(), "elle ne doit pas parler d'identité").not.toMatch(/qui\b|identit|personne/i)
    expect(limiteMesure()).toMatch(/agrégées/)
    expect(limiteMesure()).toMatch(/jamais l’identité/)
  })

  it("le détail ne nomme que des dimensions réellement enregistrées", () => {
    const connues = DIMENSIONS_MESUREES.map(d => d.nom.toLowerCase())
    for (const mot of ["source", "appareil", "ville", "pays"]) {
      expect(detailMesure().toLowerCase(), `« ${mot} » est annoncé`).toContain(mot)
      expect(connues, `« ${mot} » doit être une dimension déclarée`).toContain(mot)
    }
  })

  it("ce qui est déclaré non mesuré ne l'est effectivement pas", () => {
    // On ne lit pas le fichier entier — il contient une page de démonstration
    // avec des blocs « téléphone » qui n'ont rien à voir avec la mesure. Seules
    // les CHARGES écrites en base comptent.
    const charges = [
      ...suivi.matchAll(/insertTracked\(admin, "(\w+)", \{([\s\S]*?)\n\s*\}/g),
      ...redirection.matchAll(/from\("(scans)"\)\.insert\(\{([\s\S]*?)\}\)/g),
    ].map(m => [m[1], m[2]] as const)

    expect(charges.length, "aucune écriture trouvée : la garde ne garde rien").toBeGreaterThanOrEqual(3)
    for (const [table, corps] of charges) {
      for (const champ of ["email", "full_name", "visitor_name", "phone", "nom", "prenom"]) {
        expect(corps, `l'écriture dans ${table} porte un champ « ${champ} »`)
          .not.toMatch(new RegExp(`\\b${champ}\\s*:`))
      }
    }
    expect(NON_MESURE.join(" ")).toMatch(/nom, l’adresse e-mail/)
  })
})

describe("Q20 — et elle n'oublie pas ce qu'elle garde", () => {
  it("chaque dimension déclarée est vraiment écrite par l'un des deux chemins", () => {
    const ecrit = suivi + redirection
    for (const d of DIMENSIONS_MESUREES) {
      // `utm` est écrit sous trois noms (utm_source, utm_campaign, utm_medium).
      const cle = d.cle === "utm" ? "utm_source" : d.cle
      expect(ecrit, `« ${d.nom} » est annoncé mais jamais écrit`).toContain(cle)
    }
  })

  it("l'empreinte d'appareil est déclarée, et pas maquillée en anonymat", () => {
    // Elle existe : la redirection écrit `ip_hash`. La taire serait mentir par
    // omission, l'appeler « anonyme » serait mentir tout court (la CNIL distingue
    // pseudonymisation et anonymisation).
    expect(redirection).toContain("ip_hash")
    const empreinte = DIMENSIONS_MESUREES.find(d => d.cle === "ip_hash")
    expect(empreinte, "l'empreinte d'appareil n'est pas déclarée").toBeTruthy()
    expect(empreinte!.desc).toMatch(/salée/)
    expect(empreinte!.desc, "elle distingue un appareil : il faut le dire").toMatch(/distingue un appareil/)
    expect(NON_MESURE.join(" "), "on ne peut pas prétendre l'anonymat").not.toMatch(/anonym/i)
  })

  it("les dimensions réservées au scan sont marquées comme telles", () => {
    const auScan = DIMENSIONS_MESUREES.filter(d => d.quand === "scan seulement").map(d => d.cle)
    expect(auScan).toContain("city")
    expect(auScan).toContain("ip_hash")
    // Et elles ne doivent pas être écrites par le suivi d'une simple vue.
    for (const cle of ["city", "ip_hash", "browser"]) {
      expect(suivi, `/api/track écrit ${cle}, qui est annoncé « scan seulement »`).not.toContain(`${cle}:`)
    }
  })
})

describe("Q30 — un compteur, un mot, une définition", () => {
  it("chaque compteur porte une définition et sa limite", () => {
    for (const c of COMPTEURS_ORDONNES) {
      expect(c.nom.length, `${c.nom} : nom vide`).toBeGreaterThan(2)
      expect(c.definition.length, `${c.nom} : définition trop courte`).toBeGreaterThan(40)
      expect(c.limite.length, `${c.nom} : limite trop courte`).toBeGreaterThan(40)
    }
  })

  it("le scan dit qu'on compte une requête, pas une caméra", () => {
    // Le reproche exact de l'audit : « Un serveur observe une requête ; il ne
    // voit pas chaque ouverture de caméra. »
    expect(COMPTEURS.scans.definition).toMatch(/redirection/)
    expect(COMPTEURS.scans.limite).toMatch(/requête, pas une caméra/)
  })

  it("la vue se distingue du scan", () => {
    expect(COMPTEURS.vues.definition).toMatch(/quelle que soit la façon/)
    expect(COMPTEURS.vues.limite).toMatch(/rechargement/)
    expect(COMPTEURS.vues.nom).not.toBe(COMPTEURS.scans.nom)
  })

  it("la session est présentée comme une estimation", () => {
    expect(COMPTEURS.sessions.definition).toMatch(/estimé/)
    expect(COMPTEURS.sessions.limite).toMatch(/compte pour une session de plus/)
  })

  it("deux compteurs ne portent jamais le même mot", () => {
    const noms = COMPTEURS_ORDONNES.map(c => c.nom)
    expect(new Set(noms).size).toBe(noms.length)
  })

  it("« Visites » ne désigne plus ce que le reste appelle « Vues »", () => {
    const exp = lire("app/dashboard/analytics/ExportPanel.tsx")
    expect(exp).toContain("label: COMPTEURS.vues.nom")
    expect(exp, "le mot était écrit à la main").not.toContain('label: "Visites"')
    expect(exp, "et l'export promettait un « device » anglais").not.toContain("source, device, pays")
  })

  it("les définitions sont affichées là où on lit les chiffres", () => {
    const ecran = lire("app/dashboard/analytics/AnalyticsClient.tsx")
    expect(ecran).toContain("<DefinitionsPanel />")
    const panneau = lire("app/dashboard/analytics/DefinitionsPanel.tsx")
    expect(panneau, "le panneau doit lire la source, pas recopier").toContain("COMPTEURS_ORDONNES")
    expect(panneau).toContain("DIMENSIONS_MESUREES")
    expect(panneau).toContain("NON_MESURE")
    expect(panneau, "il ne doit rien calculer").not.toMatch(/useState|useMemo|fetch\(/)
  })
})
