import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { BLOCK_DEFS } from "../dashboard/builder/blockDefs"

// L'ancien rendu (`renduLegacy.tsx`) est supprimé au point 4 de la vague 4 (24 nov.).
const page = ["PublicPageClient.tsx"].map(f => readFileSync(join(__dirname, f), "utf8")).join("\n")

// Ce que voit le CLIENT qui scanne, quand le commerçant a ajouté un bloc sans le
// remplir. Constaté en rendant les 178 types de blocs un par un, tels qu'ils
// sortent de la bibliothèque : cinq d'entre eux envoyaient leur texte d'exemple
// sur la page d'un vrai commerce — « Mon titre », « Jean Dupont, Fondateur & CEO »,
// « React, Design, Marketing »…
//
// Les exemples ont leur place : dans le `placeholder` du champ, côté éditeur.
// Jamais dans le contenu par défaut, qui part tel quel en ligne.

/** Mots qui trahissent un texte d'exemple laissé dans un contenu par défaut. */
const DEMO = /jean dupont|marie |sophie |mon titre|titre principal|sous-titre accrocheur|bienvenue sur ma page|lorem|react, design|mes competences|votre texte|texte ici/i

describe("aucun texte d'exemple ne part chez le client", () => {
  it("les contenus par défaut n'en contiennent aucun", () => {
    const coupables: string[] = []
    for (const [type, def] of Object.entries(BLOCK_DEFS)) {
      for (const [champ, valeur] of Object.entries(def.defaultContent || {})) {
        if (typeof valeur === "string" && DEMO.test(valeur)) coupables.push(`${type}.${champ} = « ${valeur} »`)
      }
    }
    expect(coupables, "à déplacer dans le placeholder du champ").toEqual([])
  })

  it("les exemples restent disponibles là où ils servent : dans l'éditeur", () => {
    // On n'a rien perdu au passage : ces cinq blocs guident toujours la saisie.
    for (const t of ["bio", "skills", "heading", "hero_banner", "founder_message"]) {
      const champs = (BLOCK_DEFS[t]?.fields || []) as any[]
      expect(champs.some(f => f.placeholder), `${t} n'a plus aucun exemple de saisie`).toBe(true)
    }
  })

  it("la page publique n'invente aucun nom ni aucun poste", () => {
    // « {c.name || "Jean Dupont"} » affichait un faux fondateur sur une vraie page.
    expect(page).not.toMatch(/\|\| "Jean Dupont"/)
    expect(page).not.toMatch(/\|\| "Fondateur/)
    expect(page).not.toMatch(/\|\| "Titre"/)
  })
})

describe("un bloc vide ne laisse pas de trou dans la page", () => {
  // Ces cinq blocs sont servis par le renderer partagé : la garde EXÉCUTE leur
  // rendu public (elle lisait le texte de l'ancien rendu, retiré au point 4 de
  // la vague 4). Vide → rien du tout ; rempli → la page montre le texte.
  const B = "../dashboard/builder/shared-renderer/blocks/"
  const ctx: any = { theme: { bg: "#080808", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190", fontDisplay: "f", fontBody: "b" }, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {} }
  const rendre = async (chemin: string, nom: string, content: Record<string, unknown>) => {
    const { renderToStaticMarkup } = await import("react-dom/server")
    const { createElement } = await import("react")
    const C = (await import(/* @vite-ignore */ B + chemin))[nom]
    return renderToStaticMarkup(createElement(C, { content, ctx }))
  }
  const CAS: [string, string, string, Record<string, unknown>][] = [
    ["la présentation", "bio/PublicBio", "PublicBio", { text: "Boulangerie depuis 1952" }],
    ["les compétences, titre compris", "skills/PublicSkills", "PublicSkills", { tags: "Pain au levain, Viennoiseries" }],
    ["le titre", "heading/PublicHeading", "PublicHeading", { text: "Nos pains" }],
    ["le mot du fondateur", "founder_message", "PublicFounderMessage", { message: "Bienvenue chez nous", name: "Lucie" }],
    ["la bannière d'accueil", "hero_banner", "PublicHeroBanner", { title: "Le Fournil" }],
  ]
  for (const [quoi, chemin, nom, rempli] of CAS) {
    it(`${quoi} : vide, rien ; rempli, le texte`, async () => {
      expect(await rendre(chemin, nom, {}), `${quoi} à vide`).toBe("")
      const texte = String(Object.values(rempli)[0]).split(",")[0]
      expect(await rendre(chemin, nom, rempli), `${quoi} rempli`).toContain(texte)
    })
  }
})
