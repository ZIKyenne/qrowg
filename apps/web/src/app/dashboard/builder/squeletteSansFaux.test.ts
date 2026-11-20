import { describe, it, expect } from "vitest"
import { INITIAL_BLOCKS } from "./builderConstants"
import { aiBriefToTemplate } from "./ai-generate"
import { OBJECTIVES, SECTORS, composeRecipe } from "../onboarding/objectives"
import { exemplesRestants } from "./valeursDExemple"

// Garde (20 nov.) — « Partir d'une page vide » crée la page en base avec le
// squelette de l'éditeur. « Mon Nom », « Mon activité » et « Bienvenue sur ma
// page ! » y étaient de VRAIS contenus : publiés tels quels, ils affichaient un
// faux nom au client qui scanne. Le squelette n'écrit plus rien à la place du
// commerçant ; l'éditeur montre « Ajoutez votre nom… » sur un champ vide, et la
// page publiée le masque.

/** Réglages et libellé d'action : pas du contenu qui parle à la place du commerçant. */
const REGLAGES = new Set(["label", "url", "style"])
const DEMONSTRATION = /^(mon|ma|mes|votre)\b|bienvenue|lorem|jean dupont/i

describe("le squelette d'une page neuve n'invente rien", () => {
  it("aucun texte de démonstration enregistré", () => {
    for (const b of INITIAL_BLOCKS)
      for (const [k, v] of Object.entries(b.content)) {
        if (REGLAGES.has(k)) continue
        expect(String(v ?? ""), `${b.type}.${k}`).toBe("")
      }
  })
  it("le détecteur reconnaît les anciens textes", () => {
    for (const t of ["Mon Nom", "Mon activité", "Bienvenue sur ma page !"]) expect(DEMONSTRATION.test(t), t).toBe(true)
    for (const b of INITIAL_BLOCKS) for (const v of Object.values(b.content)) expect(DEMONSTRATION.test(String(v)), String(v)).toBe(false)
  })
  it("l'IA sans nom ne publie pas « Mon activité »", () => {
    expect(aiBriefToTemplate({ sections: [] }).blocks[0].content.name).toBe("")
  })
})

describe("l'onboarding n'invente pas le nom du commerce", () => {
  it("aucune recette, avec ou sans secteur, ne nomme le profil", () => {
    for (const o of OBJECTIVES) for (const sec of [undefined, ...SECTORS]) {
      const p = composeRecipe(o, sec).blocks.find(b => b.type === "profile")
      if (p) expect(p.content.name, `${o.key} × ${sec?.key}`).toBe("")
    }
  })
  it("ses plats et produits d'exemple sont signalés avant publication", () => {
    expect(exemplesRestants({ item1_name: "Entrée du jour" }).length).toBe(1)
    expect(exemplesRestants({ name: "Produit phare" }).length).toBe(1)
    expect(exemplesRestants({ item1_name: "Tartare de saumon maison" })).toEqual([])
    // Une accroche générique de recette n'est pas un faux fait.
    expect(exemplesRestants({ tagline: "Notre carte du moment" })).toEqual([])
  })
})
