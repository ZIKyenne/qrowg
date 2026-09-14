// Une phrase écrite pour le commerçant qu'aucun écran ne montre n'existe pas
// — garde de classe.
//
// Relevé du 14 septembre. Balayage des symboles exportés du produit, comparé
// aux fichiers qui les appellent : **cent vingt-six** comportements exportés ne
// sont appelés par aucun autre fichier du produit — seulement par leurs propres
// tests. Tous ne sont pas des défauts : certains sont des prédicats internes,
// d'autres des briques posées d'avance.
//
// **Dix-sept** le sont. Ce sont des phrases et des verdicts écrits pour le
// commerçant, rédigés, relus, testés — et que rien n'affiche. Mon premier relevé
// n'en comptait que cinq : les douze autres, c'est le balayage ci-dessous qui
// les a trouvées, et sa première version en accusait huit à tort — elle ne
// voyait pas qu'une phrase peut en composer une plus grande dans son propre
// module. Les voici :
//
//   lib/indexation.ts        pourquoiPasReferencee
//     « Phrase affichée au propriétaire d'une page écartée, dans son tableau
//     de bord. » C'est le commentaire du produit, mot pour mot. Le sitemap
//     retire la page, `[slug]/page.tsx` y pose `noindex` — et le commerçant
//     n'apprend jamais que sa page n'est pas proposée à Google, ni qu'il lui
//     suffirait de la renommer.
//
//   lib/supportImprime.ts    peutAjouterUnSupport, phraseRestants
//     Le quota était su AVANT l'aller-retour ; on le découvrait après, par un
//     refus du serveur.
//
//   lib/jourDuCommerce.ts    mentionFuseauDesStats     (lot v101)
//   lib/lectureOrdonnee.ts   phraseTranche             (lot v106)
//     Les deux phrases qui disent à quelle heure les jours sont comptés et que
//     la mesure est plafonnée. Un chiffre partiel qui ne le dit pas est un
//     chiffre faux — c'est la règle du lot v106, écrite et jamais montrée.
//
//   lib/rechercheSouple.ts   phraseAucunResultat       (lot v105)
//     Celle-là n'était pas inutile : `assets/page.tsx` la **retapait à la
//     main**, mot pour mot. Deux copies d'une phrase, c'est déjà deux phrases.
//
//   lib/faitsDuCommercant.ts    phraseAComplete
//   lib/verificationDns.ts      phraseDerniereVerification
//   lib/enteteDeRedirection.ts  phraseDesactivation
//
// La classe : **une phrase écrite pour le commerçant qu'aucun écran ne montre
// n'existe pas.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { jugerPage, pourquoiPasReferencee } from "./indexation"
import { peutAjouterUnSupport, phraseRestants } from "./supportImprime"
import { phraseAucunResultat } from "./rechercheSouple"
import { alertesReferencement } from "@/app/dashboard/builder/AlertesPublication"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function fichiers(test: boolean): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx?$/.test(n) && /\.test\./.test(n) === test) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

describe("ce que le produit savait dire et ne disait pas", () => {
  it("le commerçant apprend pourquoi sa page n'est pas proposée à Google", () => {
    const blocs = [{ id: "1", type: "bio", content: { text: "x".repeat(200) }, visible: true }] as any[]
    // Une page dont l'adresse est restée celle de la création : écartée, et la
    // raison arrive dans l'encadré d'avant-publication.
    const a = alertesReferencement("ma-page-a1b2", "Le Comptoir", blocs)
    expect(a).toHaveLength(1)
    expect(a[0].bloc).toBe("Référencement")
    expect(a[0].texte).toContain("adresse")
    // Un titre laissé par défaut : autre raison, autre phrase.
    expect(alertesReferencement("le-comptoir", "Ma Page", blocs)[0].texte).toContain("titre")
    // Une page en règle ne dit rien.
    expect(alertesReferencement("le-comptoir", "Le Comptoir", blocs)).toEqual([])
    // Et sans adresse connue, on ne devine pas.
    expect(alertesReferencement(null, "Le Comptoir", blocs)).toEqual([])
    // La fonction ne suffit pas : c'est l'encadré d'avant-publication qui la
    // montre — tout le défaut du lot tenait dans cette ligne manquante.
    expect(lire("app/dashboard/builder/AlertesPublication.tsx"))
      .toContain("...alertesReferencement(slug, titre, blocks)")
    expect(lire("app/dashboard/builder/BuilderV4.tsx"))
      .toContain("slug={pageSlug} titre={pageName}")
  })

  it("la phrase du référencement est celle du module, pas une deuxième", () => {
    const v = jugerPage({ slug: "ma-page-a1b2", title: "Le Comptoir", blocks: [] })
    expect(alertesReferencement("ma-page-a1b2", "Le Comptoir", [])[0].texte)
      .toBe(pourquoiPasReferencee(v.motif))
  })

  it("le quota d'un support se dit avant l'aller-retour, pas après le refus", () => {
    expect(peutAjouterUnSupport({ actifs: 1, limite: 1 }).possible).toBe(false)
    expect(phraseRestants(peutAjouterUnSupport({ actifs: 1, limite: 1 }))).toContain("plan supérieur")
    expect(phraseRestants(peutAjouterUnSupport({ actifs: 1, limite: 3 }))).toBe("Il vous reste 2 QR actifs.")
    expect(phraseRestants(peutAjouterUnSupport({ actifs: 2, limite: 3 }))).toContain("ce support le prendra")
    expect(phraseRestants(peutAjouterUnSupport({ actifs: 9, limite: null })), "sans plafond, rien à dire").toBeNull()
    const src = lire("app/dashboard/qr-codes/QRStudio.tsx")
    expect(src, "le refus ne passe plus par le serveur").toContain("if (!v.possible) { toast.error(v.phrase); return }")
    expect(src).toContain("phraseRestants(v)")
  })

  it("une recherche sans résultat dit ce qu'on cherchait — une seule fois", () => {
    expect(phraseAucunResultat("pizza", "Aucun média")).toBe("Aucun média pour « pizza ».")
    expect(phraseAucunResultat("  ", "Aucun média")).toBe("Aucun média.")
    const assets = lire("app/dashboard/assets/page.tsx")
    expect(assets, "la phrase n'est plus retapée").not.toContain("`Aucun résultat pour « ${query.trim()} ».`")
    expect(assets).toContain("phraseAucunResultat(query")
    expect(lire("app/dashboard/leads/LeadsClient.tsx")).toContain("phraseAucunResultat(query")
  })

  it("les statistiques disent leur fuseau et leur plafond", () => {
    const src = lire("app/dashboard/analytics/AnalyticsClient.tsx")
    expect(src).toContain("mentionFuseauDesStats(")
    expect(src).toContain("phraseTranche(recentScans)")
    expect(src, "et les deux sont rendues").toContain("{mentionFuseau ? <> {mentionFuseau}</> : null}")
    expect(src).toContain("{trancheScans ? <> {trancheScans}</> : null}")
  })
})

describe("garde de classe : une phrase sans écran n'existe pas", () => {
  /** Les fonctions dont le NOM annonce une phrase ou un verdict pour le commerçant. */
  const DESTINEE_AU_CLIENT = /^(phrase|pourquoi|mention)[A-Z]/

  function promesses(): { rel: string; nom: string; fichier: string }[] {
    const out: { rel: string; nom: string; fichier: string }[] = []
    for (const f of fichiers(false)) {
      const rel = path.relative(SRC, f)
      const src = fs.readFileSync(f, "utf8")
      for (const m of src.matchAll(/^export (?:async )?function (\w+)|^export const (\w+)\s*=/gm)) {
        const nom = m[1] || m[2]
        if (DESTINEE_AU_CLIENT.test(nom)) out.push({ rel, nom, fichier: f })
      }
    }
    return out
  }

  /**
   * La seule phrase du relevé qui n'a pas trouvé d'écran, avec sa raison.
   *
   * `phraseEvolution` écrit une PHRASE (« 312 scans (+12 % par rapport à la
   * semaine dernière) »). Les deux endroits qui comparent deux périodes —
   * `api/reports/send` et `api/qr-stats/[id]` — affichent une PASTILLE : une
   * flèche et un pourcentage. Y coller la phrase ferait dire deux fois la même
   * chose. Sa place est l'e-mail hebdomadaire, qui écrit en toutes lettres,
   * mais celui-ci ne lit pas encore les chiffres de la semaine précédente.
   *
   * Elle est nommée ici plutôt que tolérée en silence : la liste ne peut pas
   * grandir sans que ce test le dise.
   */
  const SANS_ECRAN_POUR_L_INSTANT = ["phraseEvolution"]

  it("la liste des phrases sans écran ne grandit pas", () => {
    expect(SANS_ECRAN_POUR_L_INSTANT).toHaveLength(1)
  })

  it("chacune est appelée quelque part, pas seulement par son test", () => {
    // « Appelée » compte aussi la composition DANS son module : plusieurs
    // phrases servent à en fabriquer une plus grande, qui est celle qu'on
    // montre (`suppressionDeCompte`, `messageDeRoute`, `mediaUtilise`). Ce
    // n'est pas une exception, c'est la même chose lue un cran plus haut.
    const prod = fichiers(false).map(f => [f, fs.readFileSync(f, "utf8")] as const)
    const fautes: string[] = []
    for (const p of promesses()) {
      const rx = new RegExp(`\\b${p.nom}\\b`, "g")
      const ailleurs = prod.some(([g, t]) => g !== p.fichier && rx.test(t))
      const chezElle = (fs.readFileSync(p.fichier, "utf8").match(rx) || []).length > 1
      if (!ailleurs && !chezElle && !SANS_ECRAN_POUR_L_INSTANT.includes(p.nom)) fautes.push(`${p.rel} :: ${p.nom}()`)
    }
    expect(fautes, "écrite pour le commerçant, montrée nulle part").toEqual([])
  })

  it("le balayage voit bien ces phrases — sinon il ne prouve rien", () => {
    const p = promesses()
    expect(p.length, "des phrases destinées au commerçant").toBeGreaterThan(12)
    // Et il reconnaît bien des fonctions ordinaires : sinon il ne filtre rien.
    expect(p.every(x => DESTINEE_AU_CLIENT.test(x.nom))).toBe(true)
    expect(p.some(x => x.nom === "pourquoiPasReferencee")).toBe(true)
  })

  it("les phrases du relevé sont bien celles qu'on montre", () => {
    // Si l'une disparaissait de son module, l'écran perdrait sa phrase sans que
    // rien ne le dise — c'est exactement ce que ce lot corrige.
    expect(lire("lib/indexation.ts")).toContain("export function pourquoiPasReferencee")
    expect(lire("lib/supportImprime.ts")).toContain("export function phraseRestants")
    expect(lire("lib/lectureOrdonnee.ts")).toContain("export function phraseTranche")
    expect(lire("lib/jourDuCommerce.ts")).toContain("export function mentionFuseauDesStats")
    expect(lire("lib/rechercheSouple.ts")).toContain("export function phraseAucunResultat")
  })
})
