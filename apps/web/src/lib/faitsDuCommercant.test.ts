// La règle du 10 septembre, et le chemin qui lui échappait — garde de classe.
//
// `app/preuveNonInventee.test.ts` tient depuis le 10 septembre une règle :
// « le pré-remplissage donne la STRUCTURE et le TITRE, jamais l'AFFIRMATION ».
// Elle couvre les 34 modèles de page et les recettes de la création guidée.
// Elle n'a jamais été appliquée à la génération par IA.
//
// Relevé du 14 septembre — le brief que le prompt du produit demande pour
// « Le Comptoir, bistrot à Lyon », passé dans `aiBriefToTemplate` :
// 8 blocs, 14 affirmations inventées.
//
//     testimonials.name1        = « Marie L. »
//     testimonials.text1        = « La meilleure quenelle de Lyon. »
//     testimonials.stars1       = « 5 »
//     menu_section.item1_price  = « 18 € »
//     opening_hours.mon_fri     = « 12h-14h / 19h-22h »
//     google_maps_embed.address = « 14 rue des Marronniers, 69002 Lyon »
//     social_links.instagram    = « https://instagram.com »
//     cta_button.url            = « # »
//
// C'est mot pour mot l'exemple que la revue du 10 septembre citait — « Marie L.
// — La meilleure entrecôte de Paris » — revenu par une autre porte. Et pire que
// sur un modèle : la page est présentée comme la SIENNE, faite à partir de sa
// description. Les horaires inventés alimentent ensuite le badge public
// « Ouvert · ferme à 22 h » (lot v79) ; l'adresse inventée s'affiche en carte.
//
// La classe : aucun chemin du produit n'écrit une affirmation à la place du
// commerçant — et aucun chiffre n'entre dans sa page s'il ne vient pas de lui.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  CHAMPS_DE_PREUVE, CHAMPS_DE_FAIT,
  estUnePreuve, estUnFait, chiffresDe, motsDe, faitRelaye,
  nettoyerBloc, nettoyerLesBlocs, faitsAffirmes, phraseAComplete,
} from "./faitsDuCommercant"
import { aiBriefToTemplate, buildSystemPrompt } from "../app/dashboard/builder/ai-generate"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

// Le brief du relevé, tel que le prompt du produit le demande.
const BRIEF = {
  name: "Le Comptoir", tagline: "Bistrot de quartier à Lyon", badge: "Bistrot", ambiance: "velvet",
  sections: [
    { kind: "about", title: "Notre maison", text: "Une cuisine de marché, tous les jours.", items: [] },
    { kind: "menu", title: "Notre carte", text: "", items: [
      { label: "Quenelle de brochet", value: "18 €", detail: "sauce Nantua" },
      { label: "Tarte praline", value: "8 €", detail: "maison" }] },
    { kind: "testimonials", title: "Ils nous recommandent", text: "", items: [
      { label: "Marie L.", value: "5", detail: "La meilleure quenelle de Lyon." },
      { label: "Thomas B.", value: "5", detail: "Accueil parfait, on reviendra." }] },
    { kind: "hours", title: "Horaires", text: "", items: [
      { label: "Lun-Ven", value: "12h-14h / 19h-22h", detail: "" },
      { label: "Samedi", value: "19h-23h", detail: "" },
      { label: "Dimanche", value: "Fermé", detail: "" }] },
    { kind: "map", title: "Nous trouver", text: "14 rue des Marronniers, 69002 Lyon", items: [] },
    { kind: "social", title: "Suivez-nous", text: "", items: [{ label: "Instagram", value: "notre compte", detail: "" }] },
    { kind: "cta", title: "Réserver une table", text: "appelez-nous", items: [] },
  ],
}

describe("le cas du relevé, rejoué", () => {
  it("la page générée n'affirme plus rien à la place du commerçant", () => {
    const t = aiBriefToTemplate(BRIEF as any, "Bistrot de quartier à Lyon, cuisine de marché.")
    const affirmations = faitsAffirmes(t.blocks as any, "Bistrot de quartier à Lyon, cuisine de marché.")
    expect(affirmations.map(a => `${a.type}.${a.champ} = « ${a.valeur} »`), "14 avant le lot").toEqual([])
  })

  it("mais la structure de la page, elle, est intacte", () => {
    const t = aiBriefToTemplate(BRIEF as any)
    const types = t.blocks.map((b: any) => b.type)
    expect(types).toContain("menu_section")
    expect(types).toContain("opening_hours")
    expect(types).toContain("testimonials")
    const byType = Object.fromEntries(t.blocks.map((b: any) => [b.type, b.content]))
    // Les intitulés restent : c'est l'emplacement qu'on donne.
    expect(byType.menu_section.item1_name).toBe("Quenelle de brochet")
    expect(byType.menu_section.category).toBe("Notre carte")
    expect(byType.opening_hours.title).toBe("Horaires")
  })

  it("ce que le commerçant a écrit, lui, arrive bien dans sa page", () => {
    const description = "Bistrot à Lyon, 14 rue des Marronniers 69002. Quenelle 18 €, tarte 8 €. Service 12h-14h et 19h-22h, samedi 19h-23h."
    const t = aiBriefToTemplate(BRIEF as any, description)
    const byType = Object.fromEntries(t.blocks.map((b: any) => [b.type, b.content]))
    expect(byType.menu_section.item1_price).toBe("18 €")
    expect(byType.opening_hours.mon_fri).toBe("12h-14h / 19h-22h")
    expect(byType.google_maps_embed?.address).toBe("14 rue des Marronniers, 69002 Lyon")
    // La preuve, jamais : ses clients seuls peuvent la donner.
    expect(byType.testimonials.name1).toBe("")
    expect(byType.testimonials.stars1).toBe("")
  })
})

describe("preuve et fait ne se traitent pas pareil", () => {
  it("une preuve n'est jamais écrite, même si la description la contient", () => {
    const bloc = { type: "testimonials", content: { title: "Avis", name1: "Marie L.", text1: "Parfait", stars1: "5" } }
    const net = nettoyerBloc(bloc, "Marie L. dit que c'est parfait, 5 étoiles")
    expect(net.content.name1).toBe("")
    expect(net.content.text1).toBe("")
    expect(net.content.stars1).toBe("")
    expect(net.content.title, "le titre est une invite, pas une preuve").toBe("Avis")
  })

  it("un fait est gardé s'il vient de la description, effacé sinon", () => {
    const bloc = { type: "menu_section", content: { item1_name: "Soupe", item1_price: "8 €" } }
    expect(nettoyerBloc(bloc, "la soupe est à 8 €").content.item1_price).toBe("8 €")
    expect(nettoyerBloc(bloc, "on sert de la soupe").content.item1_price).toBe("")
    expect(nettoyerBloc(bloc).content.item1_price).toBe("")
    expect(nettoyerBloc(bloc, "la soupe est à 8 €").content.item1_name, "le nom du plat reste").toBe("Soupe")
  })

  it("les deux listes ne se recouvrent pas", () => {
    for (const type of Object.keys(CHAMPS_DE_PREUVE)) {
      expect(CHAMPS_DE_FAIT[type], `${type} classé dans les deux`).toBeUndefined()
    }
    expect(estUnePreuve("testimonials", "name1")).toBe(true)
    expect(estUnePreuve("testimonials", "title")).toBe(false)
    expect(estUnFait("opening_hours", "mon_fri")).toBe(true)
    expect(estUnFait("opening_hours", "note")).toBe(false)
  })
})

describe("un chiffre qui n'est pas dans sa description n'entre pas dans sa page", () => {
  it("tous les chiffres doivent s'y retrouver, pas seulement un", () => {
    expect(faitRelaye("12h-14h", "ouvert de 12h à 14h")).toBe(true)
    expect(faitRelaye("12h-14h", "ouvert à partir de 12h")).toBe(false)
    expect(faitRelaye("14 rue des Marronniers, 69002 Lyon", "au 14 rue des Marronniers 69002")).toBe(true)
    expect(faitRelaye("14 rue des Marronniers", "rue des Marronniers")).toBe(false)
  })

  it("sans chiffre, un mot porteur suffit — accents et casse pardonnés", () => {
    expect(faitRelaye("https://calendly.com/x", "réservez sur CALENDLY")).toBe(true)
    expect(faitRelaye("Fermé", "fermé le dimanche")).toBe(true)
    expect(faitRelaye("https://instagram.com", "on est sur Facebook")).toBe(false)
  })

  it("sans description, rien n'est relayé — on n'invente pas par défaut", () => {
    for (const d of [null, undefined, "", "   "]) {
      expect(faitRelaye("18 €", d as any), String(d)).toBe(false)
    }
    expect(faitRelaye("", "18 €")).toBe(false)
  })

  it("les briques de la règle se tiennent", () => {
    expect(chiffresDe("12h-14h / 19h-22h")).toEqual(["12", "14", "19", "22"])
    expect(chiffresDe("Fermé")).toEqual([])
    expect(motsDe("Fermé le dimanche")).toEqual(["ferme", "dimanche"])
    expect(motsDe("12 h")).toEqual([])
  })

  it("et rien ne casse sur des blocs abîmés", () => {
    expect(nettoyerLesBlocs(null)).toEqual([])
    expect(() => nettoyerBloc({ type: "menu_section", content: null as any })).not.toThrow()
    expect(faitsAffirmes(null)).toEqual([])
  })
})

describe("ce qu'on dit au commerçant", () => {
  it("nomme ce qui manque, et pourquoi c'est vide", () => {
    expect(phraseAComplete("menu_section", 2)).toContain("prix")
    expect(phraseAComplete("testimonials", 1)).toContain("avis")
    for (const t of ["opening_hours", "google_maps_embed", "inconnu"]) {
      expect(phraseAComplete(t, 1)).toContain("invente")
    }
  })
})

describe("garde de classe : aucun chemin n'écrit d'affirmation", () => {
  it("le prompt de l'IA énonce la règle au lieu de demander l'inverse", () => {
    const prompt = buildSystemPrompt()
    expect(prompt, "le prompt demandait encore une note 1-5 par avis").not.toContain("value=note 1-5")
    expect(prompt).toContain("N'INVENTE JAMAIS")
    expect(prompt, "le prompt demandait une section de preuve sociale").not.toContain("preuve sociale")
    expect(prompt, "le badge d'état revenait par le prompt").not.toContain("« ⭐ Recommandé », « Ouvert »")
  })

  it("le mapper passe par la règle, et la route lui donne la description", () => {
    const mapper = lire("app/dashboard/builder/ai-generate.ts")
    expect(mapper).toContain("nettoyerLesBlocs(blocks, description)")
    expect(mapper, "l'accueil du réseau servait de lien de secours").not.toContain("SOCIAL_FALLBACK[key]")
    expect(mapper, "le bouton pointait « # »").not.toContain('|| "#"')
    expect(lire("app/api/generate-page/route.ts")).toContain("aiBriefToTemplate(brief, description)")
  })

  it("et la règle des modèles reste tenue, par sa propre garde", () => {
    const garde = lire("app/preuveNonInventee.test.ts")
    expect(garde).toContain("PAGE_TEMPLATES")
    expect(garde).toContain("OBJECTIVES")
  })

  it("tout fabricant de blocs du produit est couvert par une garde", () => {
    // Les trois chemins qui composent une page à la place du client : modèles,
    // recettes de la création guidée, génération IA. Un quatrième apparaîtrait
    // sans garde — c'est exactement ce qui est arrivé à l'IA.
    const fabricants = [
      { fichier: "app/dashboard/builder/page-templates.ts", garde: "app/preuveNonInventee.test.ts" },
      { fichier: "app/dashboard/onboarding/objectives.ts", garde: "app/preuveNonInventee.test.ts" },
      { fichier: "app/dashboard/builder/ai-generate.ts", garde: "lib/faitsDuCommercant.test.ts" },
    ]
    for (const f of fabricants) {
      expect(fs.existsSync(path.join(SRC, f.fichier)), f.fichier).toBe(true)
      expect(lire(f.garde), `${f.fichier} sans garde`).toContain(path.basename(f.fichier, ".ts"))
    }
  })
})
