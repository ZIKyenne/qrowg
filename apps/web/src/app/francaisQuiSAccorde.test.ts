import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { SECTEUR_DE, SECTEUR_DE_DEFAUT, SECTEURS, SECTEUR_LABEL } from "./creer/entry"
import { resolveSaveStatus, type SaveStatusFlags } from "./dashboard/builder/builderUx"
import { phraseAucunResultat } from "@/lib/rechercheSouple"

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const galerie = lire("dashboard/templates/page.tsx")
const contact = lire("contact/page.tsx")

// ═══════════════════════════════════════════════════════════════════════════════
// LE PRODUIT S'ACCORDE, ET S'ADRESSE À UNE SEULE PERSONNE (Q19).
//
// Relevé du 29 septembre : « Le sous-titre métier de la galerie comporte une faute
// d'accord ; certains pluriels sont assemblés maladroitement ; le contact mélange
// tutoiement et vouvoiement. »
//
// En mesurant, la faute d'accord s'est révélée bien plus large qu'une coquille :
// le bandeau écrivait « Ceux de la » suivi du libellé nu, et **dix-huit secteurs
// sur dix-neuf** en sortaient faux — « Ceux de la bars », « Ceux de la
// immobilier », « Ceux de la SaaS ». Seule « la restauration » tombait juste, et
// c'est le premier secteur de la liste : de quoi ne jamais remarquer le reste.
//
// La règle : **un article ne se devine pas d'un nom.** Genre, nombre et élision ne
// se calculent pas en français ; la forme complète s'écrit.
// ═══════════════════════════════════════════════════════════════════════════════

describe("Q19 — le bandeau d'arrivée s'accorde", () => {
  it("chaque secteur a sa forme complète, aucune oubliée", () => {
    const sans = SECTEURS.filter(s => s !== "Tous" && !SECTEUR_DE[s])
    expect(sans, "secteurs sans complément du nom").toEqual([])
    // Et pas de forme inventée pour un secteur qui n'existe plus.
    const inconnus = Object.keys(SECTEUR_DE).filter(s => !(SECTEURS as readonly string[]).includes(s))
    expect(inconnus).toEqual([])
  })

  it("chaque forme commence par un vrai complément du nom", () => {
    for (const [secteur, forme] of Object.entries(SECTEUR_DE)) {
      expect(forme, `${secteur} : « ${forme} »`).toMatch(/^(de la |des |de l’|du )/)
    }
    expect(SECTEUR_DE_DEFAUT).toMatch(/^de /)
  })

  it("la phrase rendue est juste pour les dix-neuf secteurs", () => {
    // Ce que lit vraiment le visiteur.
    for (const secteur of SECTEURS.filter(s => s !== "Tous")) {
      const phrase = `Ceux ${SECTEUR_DE[secteur]} d'abord`
      expect(phrase, `${secteur}`).not.toMatch(/Ceux de la (bars|cafés|freelances|consultants|coachs|agences|créateurs|musiciens|photographes|commerces|artisans|associations|immobilier|événementiel|SaaS|sport)/)
    }
    expect(`Ceux ${SECTEUR_DE.Bar} d'abord`).toBe("Ceux des bars d'abord")
    expect(`Ceux ${SECTEUR_DE.Immobilier} d'abord`).toBe("Ceux de l’immobilier d'abord")
    expect(`Ceux ${SECTEUR_DE.SaaS} d'abord`).toBe("Ceux du SaaS d'abord")
    expect(`Ceux ${SECTEUR_DE.Restaurant} d'abord`).toBe("Ceux de la restauration d'abord")
  })

  it("la galerie lit cette forme, et non plus le libellé nu", () => {
    expect(galerie).toContain("Ceux {SECTEUR_DE[fromEntry] ?? SECTEUR_DE_DEFAUT}")
    expect(galerie, "l'ancienne formule est revenue").not.toContain("Ceux de la {SECTEUR_LABEL")
  })

  it("le libellé nu reste disponible pour les autres usages", () => {
    // On n'a rien supprimé : `SECTEUR_LABEL` garde son rôle, il n'était
    // simplement pas fait pour être collé derrière « de la ».
    expect(SECTEUR_LABEL.Bar).toBe("bars")
    expect(Object.keys(SECTEUR_LABEL).length).toBe(Object.keys(SECTEUR_DE).length)
  })

  it("le décompte des autres modèles n'est plus supposé", () => {
    // « puis les 47 autres » tenait pour acquis qu'un SEUL modèle appartienne au
    // secteur. Depuis que le classement est réparé, « Bar » en compte deux.
    expect(galerie, "le décompte était figé").not.toContain("TEMPLATES.length - 1} autres")
    expect(galerie).toContain("countByMetier[fromEntry]")
    expect(galerie, "et le pluriel passe par la fonction commune").toContain('compte(Math.max(0, TEMPLATES.length')
  })
})

describe("Q19 — le produit vouvoie, d'un bout à l'autre", () => {
  it("le contact ne tutoie plus", () => {
    const texte = contact.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
    for (const forme of [/\bton message\b/, /\bvers toi\b/, /\btu acceptes\b/]) {
      expect(texte, `le contact tutoie encore : ${forme.source}`).not.toMatch(forme)
    }
  })

  it("et il vouvoie explicitement", () => {
    expect(contact).toContain("Merci pour votre message")
    expect(contact).toContain("vous acceptez notre")
  })

  it("le message de parrainage garde ses accents", () => {
    // Celui-là tutoie, et c'est voulu : ce n'est pas le produit qui parle, c'est
    // l'utilisateur qui écrit à un proche. Ce qui était fautif, ce sont les
    // accents manquants.
    const profil = lire("dashboard/profile/page.tsx")
    expect(profil).toContain("Crée ta première page gratuitement")
    expect(profil, "« Cree ta premiere » est revenu").not.toContain("Cree ta premiere")
  })
})

describe("Q19 — chaque état se distingue du voisin", () => {
  it("sauvegarde en cours, réussie, erreur, non enregistrée et création ne se confondent pas", () => {
    const base: SaveStatusFlags = { saving: false, saved: false, saveError: false, hasUnsaved: false }
    const etats = [
      resolveSaveStatus({ ...base, saving: true }),
      resolveSaveStatus({ ...base, saved: true }),
      resolveSaveStatus({ ...base, saveError: true, errorMessage: "Réseau indisponible" }),
      resolveSaveStatus({ ...base, hasUnsaved: true }),
      resolveSaveStatus({ ...base, creating: true }),
    ]
    const genres = etats.map(e => e.kind)
    expect(new Set(genres).size, "deux états portent le même genre").toBe(genres.length)
    const libelles = etats.map(e => e.label).filter(Boolean)
    expect(new Set(libelles).size, "deux états disent la même chose").toBe(libelles.length)
    // Et le ton les sépare aussi, pour qui ne lit pas le texte.
    expect(etats.find(e => e.kind === "error")!.tone).toBe("danger")
    expect(etats.find(e => e.kind === "saved")!.tone).toBe("success")
  })

  it("une erreur propose de réessayer, un succès n'invite à rien", () => {
    const base: SaveStatusFlags = { saving: false, saved: false, saveError: false, hasUnsaved: false }
    expect(resolveSaveStatus({ ...base, saveError: true, errorMessage: "Réseau indisponible" }).actionable).toBe(true)
    expect(resolveSaveStatus({ ...base, saved: true }).actionable).toBe(false)
    expect(resolveSaveStatus({ ...base, hasUnsaved: true }).actionable, "on doit pouvoir enregistrer").toBe(true)
  })

  it("l'absence de résultat se dit avec la recherche qui n'a rien donné", () => {
    expect(phraseAucunResultat("cafe", "Aucun modèle")).toBe("Aucun modèle pour « cafe ».")
    expect(phraseAucunResultat("", "Aucun modèle")).toBe("Aucun modèle.")
    expect(phraseAucunResultat("   ")).toBe("Aucun résultat.")
  })
})
