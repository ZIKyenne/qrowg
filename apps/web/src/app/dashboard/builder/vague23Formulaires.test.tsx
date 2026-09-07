import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { renderToStaticMarkup } from "react-dom/server"
import { BlockPreview } from "./builderPreview"
import { RenduLegacy } from "../../[slug]/renduLegacy"
import { BLOCK_DEFS } from "./blockDefs"
import { CHAMPS_FORMULAIRE, telephoneDirect } from "@/lib/leadForms"
import { quoteFormModel, reservationFormModel, bookingRequestFormModel, registerFormModel } from "./shared-renderer/forms/leadFormModels"

// ═══════════════════════════════════════════════════════════════════════════════
// VAGUE 23 — LES FORMULAIRES.
//
// Un formulaire est le seul bloc où le visiteur ÉCRIT. Le commerçant le règle
// dans le builder — « Champ téléphone : oui », « Champ délai souhaité : oui » —
// et juge sur l'aperçu. Or les listes de champs étaient écrites DEUX fois, en
// toutes lettres : une fois dans la page publiée, une fois dans l'aperçu. Les
// deux copies avaient dérivé, toujours dans le même sens :
//
//   contact_form     l'aperçu ignorait « Champ téléphone » : le commerçant
//                    l'activait, rien ne bougeait, il le remettait sur « non ».
//   reservation_form la page demandait 4 champs, l'aperçu en montrait 3.
//   quote_form       « Délai souhaité » avait été rebranché sur la page le
//                    6 septembre et n'était jamais arrivé dans l'aperçu.
//   booking_request  l'aperçu écrivait « Type d événement », sans apostrophe.
//   event_register   « S inscrire gratuitement », « Je m inscris ».
//
// Ce test ne lit pas le code : il RENDIT les deux côtés et compare ce qu'un œil
// verrait. Une liste réécrite à la main quelque part le fait échouer.
// ═══════════════════════════════════════════════════════════════════════════════

const theme: any = {
  bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F",
  text: "#F5F0E8", muted: "#A8A190", fontDisplay: "Fraunces, serif", fontBody: "DM Sans, sans-serif",
}

/** React échappe &, ', " … dans le texte. On compare des libellés lisibles. */
function lisible(html: string): string {
  return html
    .replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
}
const apercu = (type: string, content: Record<string, any>) =>
  lisible(renderToStaticMarkup(<BlockPreview block={{ id: "b1", type, content, position: 0 } as any} theme={theme} dayMode={false} />))
const page = (type: string, content: Record<string, any>) =>
  lisible(renderToStaticMarkup(<RenduLegacy block={{ id: "b1", type, content, position: 0 } as any} theme={theme} pageId="p1" ownerEmail="a@b.co" totalViews={0} />))

/** Tous les libellés que ces cinq formulaires savent produire, réglages compris.
 *  Sert à vérifier les ABSENCES : un champ désactivé ne doit apparaître nulle part. */
const TOUS_LES_LIBELLES = (() => {
  const out = new Set<string>()
  const reglages = [{}, { show_phone: "yes" }, { show_phone: "no" }, { show_budget: "yes" }, { show_deadline: "yes" }, { show_company: "yes" }]
  for (const modele of Object.values(CHAMPS_FORMULAIRE)) for (const r of reglages) for (const f of modele(r)) out.add(f.label)
  return [...out]
})()

/** Les libellés attendus apparaissent, dans l'ordre ; les autres n'apparaissent pas. */
function verifie(html: string, attendus: string[], ou: string) {
  const positions = attendus.map(l => [l, html.indexOf(l)] as const)
  for (const [l, i] of positions) expect(i, `${ou} : « ${l} » manquant`).toBeGreaterThan(-1)
  for (let k = 1; k < positions.length; k++) {
    expect(positions[k][1], `${ou} : « ${positions[k][0] }» avant « ${positions[k - 1][0]} »`).toBeGreaterThan(positions[k - 1][1])
  }
  for (const l of TOUS_LES_LIBELLES) {
    if (attendus.includes(l)) continue
    // « Nom » est contenu dans « Nom complet » et « Nom / Organisation » : on ne
    // cherche l'absence que des libellés qui ne sont le morceau d'aucun attendu.
    if (attendus.some(a => a.includes(l))) continue
    expect(html.includes(l), `${ou} : « ${l} » ne devrait pas être là`).toBe(false)
  }
}

// Chaque combinaison de réglages qui change la liste des champs.
const CAS: Array<[string, Record<string, any>, string]> = [
  ["contact_form", {}, "réglages par défaut"],
  ["contact_form", { show_phone: "yes" }, "champ téléphone activé"],
  ["contact_form", { show_phone: "no" }, "champ téléphone désactivé"],
  ["reservation_form", {}, "réglages par défaut"],
  ["quote_form", {}, "réglages par défaut"],
  ["quote_form", { show_phone: "no" }, "sans téléphone"],
  ["quote_form", { show_budget: "yes" }, "avec budget"],
  ["quote_form", { show_deadline: "yes" }, "avec délai souhaité"],
  ["quote_form", { show_phone: "no", show_budget: "yes", show_deadline: "yes" }, "budget et délai, sans téléphone"],
  ["booking_request", {}, "réglages par défaut"],
  ["event_register", {}, "réglages par défaut"],
  ["event_register", { show_phone: "yes" }, "avec téléphone"],
  ["event_register", { show_company: "yes" }, "avec société"],
  ["event_register", { show_phone: "yes", show_company: "yes" }, "téléphone et société"],
]

// Les listes ci-dessus sont vérifiées CONTRE leadForms.ts : elles prouvent que
// l'aperçu et la page disent la même chose, pas que cette chose est la bonne. Ces
// quelques listes-ci sont donc écrites en dur, d'après ce que la page publiée
// demandait avant la vague — un réglage effacé de leadForms les fait tomber.
const ATTENDUS_FIGES: Array<[string, Record<string, any>, string[]]> = [
  ["contact_form", { show_phone: "yes" }, ["Nom", "Email", "Téléphone", "Message"]],
  ["contact_form", {}, ["Nom", "Email", "Message"]],
  ["reservation_form", {}, ["Nom", "Téléphone", "Date souhaitée", "Nb personnes"]],
  ["quote_form", {}, ["Nom complet", "Email", "Téléphone", "Description du projet"]],
  ["quote_form", { show_budget: "yes", show_deadline: "yes" }, ["Nom complet", "Email", "Téléphone", "Budget estimé", "Délai souhaité", "Description du projet"]],
  ["booking_request", {}, ["Nom / Organisation", "Email", "Type d'événement", "Date souhaitée", "Message"]],
  ["event_register", { show_phone: "yes", show_company: "yes" }, ["Prénom & Nom", "Email", "Téléphone", "Société"]],
]

describe("vague 23 - les champs de chaque formulaire, ecrits noir sur blanc", () => {
  for (const [type, contenu, attendus] of ATTENDUS_FIGES) {
    it(`${type} ${JSON.stringify(contenu)}`, () => {
      expect(CHAMPS_FORMULAIRE[type](contenu).map(f => f.label)).toEqual(attendus)
    })
  }
})

describe("vague 23 - l'apercu d'un formulaire montre les champs que la page demandera", () => {
  for (const [type, contenu, quoi] of CAS) {
    it(`${type} — ${quoi}`, () => {
      const attendus = CHAMPS_FORMULAIRE[type](contenu).map(f => f.label)
      expect(attendus.length, "un formulaire sans champ").toBeGreaterThan(1)
      verifie(apercu(type, contenu), attendus, `aperçu ${type}`)
      verifie(page(type, contenu), attendus, `page ${type}`)
    })
  }

  it("le detecteur echouerait si l'apercu retombait sur une liste ecrite a la main", () => {
    // Sans cette vérification, `verifie` pourrait ne rien chercher du tout.
    expect(() => verifie("<div>Nom</div><div>Email</div>", ["Nom", "Email", "Téléphone"], "faux"))
      .toThrow()
    expect(() => verifie("<div>Email</div><div>Nom</div>", ["Nom", "Email"], "faux")).toThrow()
    expect(() => verifie("<div>Nom</div><div>Email</div><div>Budget estimé</div>", ["Nom", "Email"], "faux")).toThrow()
  })

  it("l'apostrophe des libelles n'est pas perdue en chemin", () => {
    // « Type d événement », « S inscrire », « Je m inscris » : trois coquilles que
    // seul le commerçant voyait, dans son propre aperçu.
    expect(apercu("booking_request", {})).toContain("Type d'événement")
    const inscription = apercu("event_register", {})
    expect(inscription).toContain("S'inscrire gratuitement")
    expect(inscription).toContain("Je m'inscris")
    // Et le même contrôle sur tout l'aperçu : ces trois-là n'étaient pas seuls.
    // (« Ajoutez vos plateformes d écoute », trouvé par cette ligne.)
    const source = readFileSync(fileURLToPath(new URL("./builderPreview.tsx", import.meta.url)), "utf8")
    const avalees = source.match(/\b(?:[dlmnsctj]|qu) (?:a|e|i|o|u|é|è|ê|h|y)[a-zàâçéèêëîïôûùüÿ]{2,}/g) ?? []
    expect(avalees, "apostrophes avalées dans l'aperçu").toEqual([])
  })
})

describe("vague 23 - le telephone direct d'un restaurant n'est plus un reglage mort", () => {
  // Le panneau de reservation_form propose « Téléphone direct » depuis toujours.
  // Personne ne le lisait : ni l'aperçu, ni la page. Le détecteur de réglages
  // morts ne le voyait pas non plus — la clé `phone` est lue par d'autres blocs
  // (angle mort nº 2 de reglagesMorts.test.ts). Le restaurateur donnait son
  // numéro et le visiteur ne l'a jamais eu.
  const AVEC = { title: "Réserver une table", phone: "+33 1 23 45 67 89" }

  it("le numero saisi apparait dans l'apercu ET sur la page", () => {
    expect(apercu("reservation_form", AVEC)).toContain("+33 1 23 45 67 89")
    expect(page("reservation_form", AVEC)).toContain("+33 1 23 45 67 89")
  })

  it("sur la page, c'est un lien appelable", () => {
    expect(page("reservation_form", AVEC)).toContain('href="tel:+33123456789"')
  })

  it("sans numero, aucune mention n'est inventee", () => {
    for (const html of [apercu("reservation_form", {}), page("reservation_form", {})]) {
      expect(html).not.toContain("appelez directement")
    }
    expect(telephoneDirect({ phone: "   " }), "un numéro d'espaces n'est pas un numéro").toBe("")
  })

  it("le champ visiteur « Telephone » reste un AUTRE champ que le numero du commerce", () => {
    // Même clé `phone`, deux sens : celui du panneau est le numéro du restaurant,
    // celui du formulaire est celui du client qui réserve. Les confondre
    // pré-remplirait le formulaire du visiteur avec le numéro du commerce.
    const html = page("reservation_form", AVEC)
    expect(html, "le champ visiteur doit rester vide").toContain('aria-label="Téléphone"')
    expect(html).not.toContain('value="+33 1 23 45 67 89"')
  })
})

describe("vague 23 - les modeles prepares ne peuvent plus deriver de la page", () => {
  // Ces modèles (infrastructure inactive) réécrivaient les mêmes listes une
  // TROISIÈME fois. Deux avaient déjà dérivé : le devis ignorait « Délai
  // souhaité », la réservation ignorait « Téléphone ».
  it("le devis suit les trois reglages", () => {
    expect(quoteFormModel({ show_deadline: "yes" }).fields.map(f => f.key)).toContain("deadline")
    expect(quoteFormModel({}).fields.map(f => f.key)).not.toContain("deadline")
    expect(quoteFormModel({ show_phone: "no" }).fields.map(f => f.key)).not.toContain("phone")
  })
  it("chaque modele rend exactement les champs de leadForms", () => {
    const paires: Array<[string, (c: any) => any]> = [
      ["quote_form", quoteFormModel], ["reservation_form", reservationFormModel],
      ["booking_request", bookingRequestFormModel], ["event_register", registerFormModel],
    ]
    for (const [type, modele] of paires) {
      for (const reglage of [{}, { show_phone: "yes" }, { show_phone: "no" }, { show_budget: "yes" }, { show_deadline: "yes" }, { show_company: "yes" }]) {
        expect(modele(reglage).fields.map((f: any) => f.label), `${type} ${JSON.stringify(reglage)}`)
          .toEqual(CHAMPS_FORMULAIRE[type](reglage).map(f => f.label))
      }
    }
  })
  it("les deux premiers champs restent les champs requis", () => {
    // Contrat de LeadFormPublic : required = fields.slice(0, 2). Réordonner la
    // liste changerait ce qui est obligatoire — d'où l'ordre vérifié plus haut.
    for (const m of [quoteFormModel({}), reservationFormModel({}), bookingRequestFormModel({}), registerFormModel({})]) {
      expect(m.fields.slice(0, 2).every(f => f.required)).toBe(true)
      expect(m.fields.slice(2).some(f => f.required)).toBe(false)
    }
  })
})

describe("vague 23 - le panneau de reservation ecrit un francais correct", () => {
  it("le bouton par defaut porte son accent", () => {
    // Un bloc neuf publiait un bouton « Reserver ». Le commerçant ne le corrigeait
    // pas : il ne l'avait pas écrit.
    const def: any = BLOCK_DEFS.reservation_form
    expect(def.defaultContent.button_label).toBe("Réserver")
    expect(def.fields.find((f: any) => f.key === "button_label").placeholder).toBe("Réserver")
    expect(def.fields.find((f: any) => f.key === "phone").label).toBe("Téléphone direct")
  })
})
