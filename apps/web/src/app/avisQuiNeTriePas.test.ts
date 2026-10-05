import { describe, it, expect } from "vitest"
import { VERTICALS } from "./qr-code/verticals"
import { OBJECTIVES } from "./dashboard/onboarding/objectives"

// 5 octobre. `/qr-code/avis-google` porte 43 % des impressions du site. En relisant
// ce qu'elle promettait, on a trouvé autre chose qu'un problème de référencement :
// le titre disait « Transformez vos clients SATISFAITS en avis Google », et quatre
// autres pages reprenaient la même mécanique — « dirigez vos clients satisfaits
// vers votre fiche ».
//
// Or les règles de contenu de Google Maps (section « Manipulation des notes »)
// interdisent explicitement de « décourager ou interdire les avis négatifs, ou de
// solliciter sélectivement les avis positifs auprès des clients ».
// Source : support.google.com/contributionpolicy/answer/7400114, consultée le
// 5 octobre 2026.
//
// Le produit n'a jamais trié personne : le bloc `google_review` est un lien vers la
// fiche du commerçant, point. C'était la promesse écrite qui décrivait une pratique
// interdite — et qui exposait nos clients, pas nous. Un commerçant qui suit cette
// consigne à la lettre risque la suppression de ses avis.
//
// Règle : la promesse décrit un CHEMIN PLUS COURT vers la fiche, jamais un TRI des
// personnes à qui on le propose. Décrire le problème (« des clients ravis qui ne
// laissent jamais d'avis ») reste permis : c'est un constat, pas une méthode.

const SATISFACTION = /satisfait(e?s)?|contents?|contentes?|ravis?|heureux|heureuse/i
const AVIS = /avis|review/i

/** Les champs qui PROMETTENT. `pain` en est exclu : il décrit le problème vécu. */
function promesses(): { ou: string; texte: string }[] {
  const out: { ou: string; texte: string }[] = []
  for (const v of Object.values(VERTICALS)) {
    out.push({ ou: `${v.slug}.metaTitle`, texte: v.metaTitle })
    out.push({ ou: `${v.slug}.metaDescription`, texte: v.metaDescription })
    out.push({ ou: `${v.slug}.h1`, texte: v.h1 })
    out.push({ ou: `${v.slug}.intro`, texte: v.intro })
    out.push({ ou: `${v.slug}.ctaTitle`, texte: v.ctaTitle })
    v.problems.forEach((p, i) => out.push({ ou: `${v.slug}.problems[${i}].gain`, texte: p.gain }))
    v.features.forEach((f, i) => out.push({ ou: `${v.slug}.features[${i}]`, texte: `${f.title} ${f.desc}` }))
    v.steps.forEach((s, i) => out.push({ ou: `${v.slug}.steps[${i}]`, texte: s }))
    v.faq.forEach((f, i) => out.push({ ou: `${v.slug}.faq[${i}].a`, texte: f.a }))
  }
  for (const o of OBJECTIVES) {
    out.push({ ou: `objectif ${o.key}.desc`, texte: o.desc })
    out.push({ ou: `objectif ${o.key}.cta`, texte: o.cta })
  }
  return out
}

describe("la promesse d'avis ne trie pas les clients", () => {
  it("aucune promesse ne conditionne la demande d'avis à la satisfaction du client", () => {
    const champs = promesses()
    // Sans cette borne, la règle se tairait le jour où une refonte vide les données.
    expect(champs.length).toBeGreaterThan(200)

    const fautifs = champs.filter(c => AVIS.test(c.texte) && SATISFACTION.test(c.texte))
    expect(fautifs.map(c => `${c.ou} — « ${c.texte} »`)).toEqual([])
  })

  it("une question de la page avis-google énonce la règle de Google", () => {
    // La page ne se contente pas d'éviter la faute : elle prévient le commerçant,
    // parce que c'est lui qui perdrait ses avis.
    const faq = VERTICALS["avis-google"].faq
    const regle = faq.find(f => /sélectivement|négatifs/i.test(f.a))
    expect(regle, "la FAQ avis-google doit expliquer l'interdiction de solliciter sélectivement").toBeDefined()
    expect(regle!.a).toMatch(/positifs/i)
  })

  it("le constat du problème reste permis", () => {
    // Garde-fou de la garde : si la règle devenait si large qu'elle interdise de
    // décrire le problème, elle ferait réécrire une phrase juste.
    const pains = Object.values(VERTICALS).flatMap(v => v.problems.map(p => p.pain))
    expect(pains.some(p => AVIS.test(p) && SATISFACTION.test(p))).toBe(true)
  })
})
