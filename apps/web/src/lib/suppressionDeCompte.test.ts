// Le produit prévient mieux pour une page que pour tout — garde de classe.
//
// Relevé du 14 septembre, les deux écrans côte à côte.
//
//   SUPPRIMER UNE PAGE (lot v84) :
//     · 4 QR imprimables : Table 1, Table 2, Table 3, Table 4
//     · 1 420 scans enregistrés · 3 800 vues de la page · 12 messages reçus
//     · Ces codes sont peut-être déjà collés ou distribués : ils cesseront de
//       fonctionner définitivement. […] il faudrait réimprimer les supports.
//     + il faut RECOPIER le titre de la page pour débloquer le bouton.
//
//   SUPPRIMER TOUT LE COMPTE :
//     · « La suppression de votre compte effacera définitivement toutes vos
//        pages, QR codes et données analytics. Cette action est irréversible. »
//     + il faut recopier son e-mail.
//
// Une phrase, aucun chiffre. Et six choses que l'écran ne disait pas alors que
// `api/account/delete` les FAIT :
//
//   NON — le nombre de QR imprimés qui cesseront de fonctionner
//   NON — que ces codes sont dehors et qu'il faudra réimprimer
//   NON — que l'équipe est supprimée et ses membres perdent l'accès
//   NON — que l'abonnement en cours est résilié
//   NON — que les domaines personnalisés cessent de résoudre
//   NON — que l'adresse publique redevient libre
//
// La classe : plus la destruction est grande, plus le produit en dit — jamais
// l'inverse. Et sur une même chose détruite, une seule formulation.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  consequencesDuCompte, avertissementsDuCompte, phraseCodesDuCompte,
  phraseEquipe, phraseAbonnement, phraseDomaines, phraseAdressePublique,
} from "./suppressionDeCompte"
import { phraseCodesImprimes, consequencesDeSuppression } from "./suppressionDePage"
import { getPlan } from "./plans"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

// Le compte du relevé : 6 pages, 11 QR imprimés, une équipe de 3, deux domaines,
// un abonnement Business payé jusqu'en mars.
const COMPTE = {
  pages: 6, qrs: 11, scans: 4820, vues: 12400, messages: 63,
  membres: 3, domaines: 2, sousDomaine: "lecomptoir",
  plan: "business", finDePeriode: "2027-03-04",
}

describe("ce qui disparaît est nommé et chiffré", () => {
  it("le cas du relevé : cinq lignes, avec des nombres", () => {
    const l = consequencesDuCompte(COMPTE)
    expect(l[0]).toBe("6 pages publiées")
    expect(l[1]).toBe("11 QR imprimables")
    expect(l.some(x => /4\s820 scans enregistrés/.test(x)), l.join(" | ")).toBe(true)
    expect(l.some(x => /12\s400 vues de page/.test(x))).toBe(true)
    expect(l).toContain("63 messages reçus")
  })

  it("au singulier quand il n'y en a qu'un", () => {
    const l = consequencesDuCompte({ pages: 1, qrs: 1, scans: 1, vues: 1, messages: 1 })
    expect(l).toEqual(["1 page publiée", "1 QR imprimable", "1 scan enregistré", "1 vue de page", "1 message reçu"])
  })

  it("on ne parle pas de ce qui n'existe pas", () => {
    expect(consequencesDuCompte({ pages: 2, qrs: 0, scans: 0, vues: 0, messages: 0 })).toEqual(["2 pages publiées"])
    expect(consequencesDuCompte({})).toEqual([])
    expect(consequencesDuCompte(null)).toEqual([])
    expect(consequencesDuCompte({ pages: -3, qrs: NaN as any })).toEqual([])
  })
})

describe("les cinq choses que l'écran ne disait pas", () => {
  it("les codes déjà dehors — la MÊME phrase que pour une page", () => {
    expect(phraseCodesDuCompte(11)).toBe(phraseCodesImprimes(11))
    expect(phraseCodesDuCompte(11)).toContain("réimprimer")
    expect(phraseCodesDuCompte(0), "sans QR, rien à dire").toBeNull()
  })

  it("l'équipe perd l'accès — ce que fait `teams.delete` dans la route", () => {
    expect(phraseEquipe(3)).toContain("3 membres")
    expect(phraseEquipe(3)).toContain("perdront")
    expect(phraseEquipe(1)).toContain("1 membre de votre équipe perdra")
    expect(phraseEquipe(0)).toBeNull()
  })

  it("l'abonnement est résilié, et la période payée n'est pas remboursée", () => {
    const p = phraseAbonnement("business", "2027-03-04")!
    // Le libellé est celui du produit, pas celui qu'on croit : `business`
    // s'affiche « Multi-sites » dans `lib/plans`.
    expect(p).toContain(getPlan("business").label)
    expect(p).toContain("4 mars 2027")
    expect(p).toContain("remboursée")
    // Sans date connue, on ne l'invente pas.
    expect(phraseAbonnement("pro", null)).toContain("immédiatement")
    expect(phraseAbonnement("pro", null)).not.toMatch(/\d{4}/)
    // Un compte gratuit n'a rien à résilier.
    expect(phraseAbonnement("free", "2027-03-04")).toBeNull()
    expect(phraseAbonnement(null)).toBeNull()
  })

  it("les domaines pointeront dans le vide", () => {
    expect(phraseDomaines(2)).toContain("2 domaines")
    expect(phraseDomaines(1)).toContain("Votre domaine personnalisé")
    expect(phraseDomaines(0)).toBeNull()
  })

  it("et l'adresse publique redevient libre — contrairement à un code de QR", () => {
    const p = phraseAdressePublique("lecomptoir")!
    expect(p).toContain("lecomptoir.qrowg.com")
    expect(p).toContain("quelqu'un d'autre")
    for (const v of [null, undefined, "", "  "]) expect(phraseAdressePublique(v), String(v)).toBeNull()
  })

  it("les cinq arrivent dans l'ordre où on les lit", () => {
    const a = avertissementsDuCompte(COMPTE)
    expect(a).toHaveLength(5)
    expect(a[0]).toContain("réimprimer")
    expect(a[1]).toContain("équipe")
    expect(a[2]).toContain("abonnement")
    expect(a[3]).toContain("DNS")
    expect(a[4]).toContain("qrowg.com")
    // Un compte gratuit, sans équipe ni domaine, n'en lit qu'une.
    expect(avertissementsDuCompte({ qrs: 2, plan: "free" })).toHaveLength(1)
    expect(avertissementsDuCompte({})).toEqual([])
  })
})

describe("l'écran de suppression a bien changé", () => {
  const reglages = lire("app/dashboard/settings/page.tsx")
  const bloc = reglages.slice(reglages.indexOf('id="danger"'), reglages.indexOf("Supprimer définitivement mon compte"))

  it("la phrase générique sans un chiffre a disparu", () => {
    expect(bloc, "une phrase, aucun chiffre")
      .not.toContain("effacera définitivement toutes vos pages, QR codes et données analytics")
  })

  it("il lit ce qui disparaîtrait AVANT de le faire disparaître", () => {
    expect(reglages).toContain("lireCeQuiDisparait(supabase, user.id")
    expect(bloc).toContain("consequencesDuCompte(ceQuiDisparait)")
    expect(bloc).toContain("avertissementsDuCompte(ceQuiDisparait)")
  })

  it("et le bouton reste bloqué tant que l'e-mail n'est pas écrit", () => {
    expect(reglages).toContain("disabled={deleteConfirm !== profile?.email}")
  })

  it("la lecture ne compte que ce que le compte POSSÈDE", () => {
    const lecture = lire("app/dashboard/settings/ceQuiDisparaitDuCompte.ts")
    expect(lecture).toContain('from("teams").select("id").eq("owner_id", userId)')
    expect(lecture, "les équipes dont il est seulement membre ne disparaissent pas")
      .not.toContain("accessibleOwnerIds(")
    expect(lecture, "les compteurs doivent exclure les robots, comme partout").toContain("APPAREIL_ROBOT")
  })
})

describe("garde de classe : plus la destruction est grande, plus on en dit", () => {
  it("le compte annonce au moins autant de lignes qu'une seule page", () => {
    const page = consequencesDeSuppression({
      supports: [{ label: "Table 1", short_code: "ab1" }], scans: 1420, vues: 3800, messages: 12,
    })
    const compte = consequencesDuCompte(COMPTE)
    expect(compte.length, "supprimer tout en dirait moins que supprimer une page")
      .toBeGreaterThanOrEqual(page.length)
  })

  it("et il en dit plus encore : équipe, abonnement, domaines, adresse", () => {
    expect(avertissementsDuCompte(COMPTE).length)
      .toBeGreaterThan([phraseCodesImprimes(4)].filter(Boolean).length)
  })

  it("une seule formulation pour les codes déjà collés", () => {
    // Le module du compte délègue au lot v84 au lieu d'écrire la sienne.
    const src = lire("lib/suppressionDeCompte.ts")
    expect(src).toContain('from "./suppressionDePage"')
    // Hors commentaires : l'en-tête cite la phrase du lot v84 en relevé.
    const code = src.split("\n").filter(l => !l.trim().startsWith("//") && !l.trim().startsWith("*")).join("\n")
    expect(code, "une deuxième formulation des codes imprimés").not.toContain("réimprimer")
  })

  it("les deux routes de suppression demandent une confirmation écrite", () => {
    const compte = lire("app/api/account/delete/route.ts")
    expect(compte, "l'e-mail tapé doit correspondre").toContain('typed !== (user.email ?? "").toLowerCase()')
    const dash = lire("app/dashboard/DashboardClient.tsx")
    expect(dash).toContain("confirmationValide(")
  })
})
