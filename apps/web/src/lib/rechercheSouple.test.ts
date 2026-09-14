// Le produit exige les accents, puis ne les trouve plus — garde de classe.
//
// Relevé du 14 septembre. Les dix-huit recherches du produit — pages, QR,
// médias, modèles, blocs, messages reçus, palette de commandes, studio
// d'impression, et la FAQ de la page publique — filtraient toutes ainsi :
//
//     hay.toLowerCase().includes(q.toLowerCase())
//
// Ce qu'un commerçant tape, ce qu'il trouve :
//
//   « Café du Coin »    ← « cafe »          INTROUVABLE
//   « Menu Été 2026 »   ← « ete »           INTROUVABLE
//   « Réservations »    ← « reservation »   INTROUVABLE
//   « Crème brûlée »    ← « creme »         INTROUVABLE
//   « Naïve Déco »      ← « naive »         INTROUVABLE
//   « L'Épicerie »      ← « epicerie »      INTROUVABLE
//   « Le Comptoir »     ← « comptoir »      trouvée
//
// Sept sur neuf. Et l'ironie est complète : `lib/accents.ts` **impose** les
// accents au produit — « c'est la vitrine du commerçant qui a l'air bâclée » —
// et 638 des 2 931 libellés de blocs en portent un. Le produit force les accents
// dans le contenu, puis ne sait plus le retrouver.
//
// Deux autres formes du même défaut, mesurées ensuite :
//
//   « Café du Coin »    ← « cafe coin »     INTROUVABLE (ordre des mots)
//   « L'Épicerie »      ← « l'epicerie »    INTROUVABLE (apostrophe droite
//                                            contre apostrophe courbe)
//
// La classe : **une recherche compare ce qui se lit, pas ce qui est écrit.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  pliage, motsDeLaRecherche, correspond, correspondAuxChamps, filtreDe, phraseAucunResultat,
} from "./rechercheSouple"
import { SANS_ACCENT } from "./accents"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** L'ancienne règle, pour comparer. */
const ancienne = (hay: string, q: string) => hay.toLowerCase().includes(q.toLowerCase())

describe("les neuf cas du relevé", () => {
  const CAS: [string, string][] = [
    ["Café du Coin", "cafe"],
    ["Menu Été 2026", "ete"],
    ["Réservations", "reservation"],
    ["Crème brûlée", "creme"],
    ["Bar à Tapas", "tapas"],
    ["Naïve Déco", "naive"],
    ["Le Comptoir", "comptoir"],
    ["L’Épicerie", "epicerie"],
    ["Où manger ?", "ou manger"],
  ]

  it("les neuf se trouvent maintenant", () => {
    for (const [titre, saisie] of CAS) {
      expect(correspond(titre, saisie), `« ${titre} » ← « ${saisie} »`).toBe(true)
    }
  })

  it("et sept échouaient avec l'ancienne règle — sinon ce lot ne sert à rien", () => {
    const ratees = CAS.filter(([t, q]) => !ancienne(t, q))
    expect(ratees.length).toBe(7)
  })
})

describe("l'ordre des mots et l'apostrophe", () => {
  it("personne ne tape le titre exact dans l'ordre exact", () => {
    for (const [t, q] of [
      ["Café du Coin", "cafe coin"],
      ["Menu Été 2026", "menu 2026"],
      ["Carte des vins", "vins carte"],
      ["L’Épicerie Fine", "fine epicerie"],
    ] as [string, string][]) {
      expect(correspond(t, q), `« ${t} » ← « ${q} »`).toBe(true)
      expect(ancienne(t, q), "l'ancienne règle le trouvait déjà ?").toBe(false)
    }
  })

  it("les deux apostrophes sont la même", () => {
    expect(correspond("L’Épicerie", "l'epicerie")).toBe(true)
    expect(correspond("L'Atelier", "l’atelier")).toBe(true)
    expect(correspond("Menu d’hiver", "menu d'hiver")).toBe(true)
  })

  it("une lettre élidée n'est pas exigée", () => {
    // « l'atelier » cherche « atelier » : sans ça, une page nommée « Atelier du
    // Pain » resterait introuvable à qui met l'article.
    expect(motsDeLaRecherche("l’épicerie fine")).toEqual(["epicerie", "fine"])
    expect(correspond("Atelier du Pain", "l'atelier")).toBe(true)
    // Mais chercher une seule lettre reste une recherche.
    expect(motsDeLaRecherche("l")).toEqual(["l"])
  })
})

describe("ce qui doit rester faux", () => {
  it("une recherche qui ne correspond à rien ne trouve rien", () => {
    expect(correspond("Le Comptoir", "pizzeria")).toBe(false)
    expect(correspond("Menu", "menus")).toBe(false)
    expect(correspond("Café", "the")).toBe(false)
  })

  it("tous les mots doivent être là, pas seulement un", () => {
    expect(correspond("Café du Coin", "cafe brasserie")).toBe(false)
  })

  it("une recherche vide ne filtre rien", () => {
    expect(correspond("n'importe quoi", "")).toBe(true)
    expect(correspond("n'importe quoi", "   ")).toBe(true)
    expect(correspond("n'importe quoi", null)).toBe(true)
  })

  it("et un gisement vide ne répond à rien", () => {
    expect(correspond("", "cafe")).toBe(false)
    expect(correspond(null, "cafe")).toBe(false)
    expect(correspond(42, "cafe")).toBe(false)
  })
})

describe("le pliage", () => {
  it("accents, casse, ligatures, espaces insécables", () => {
    expect(pliage("Crème Brûlée & Œufs")).toBe("creme brulee & oeufs")
    expect(pliage("Naïve  Déco")).toBe("naive deco")
    expect(pliage("Où manger")).toBe("ou manger")
    expect(pliage("PIZZA Ça Va")).toBe("pizza ca va")
  })

  it("il est idempotent et ne casse sur rien", () => {
    const p = pliage("Crème Brûlée")
    expect(pliage(p)).toBe(p)
    expect(pliage("")).toBe("")
    expect(pliage(null)).toBe("")
    expect(pliage(undefined)).toBe("")
    expect(pliage(12)).toBe("")
  })

  it("les mots que lib/accents impose se retrouvent sans leur accent", () => {
    // La boucle est le cœur du relevé : ces mots-là sont EXIGÉS accentués dans
    // le produit, et c'est exactement eux qu'on ne trouvait plus.
    for (const [fautif, correct] of Object.entries(SANS_ACCENT)) {
      expect(correspond(correct, fautif), `« ${correct} » ← « ${fautif} »`).toBe(true)
    }
  })
})

describe("plusieurs champs, et le prédicat prêt à poser", () => {
  it("les champs se recollent", () => {
    expect(correspondAuxChamps(["Le Comptoir", "notre menu du midi"], "comptoir menu")).toBe(true)
    expect(correspondAuxChamps(["Le Comptoir", null, 42], "comptoir")).toBe(true)
    expect(correspondAuxChamps([], "comptoir")).toBe(false)
    expect(correspondAuxChamps(null as never, "")).toBe(true)
  })

  it("le filtre se pose dans un .filter()", () => {
    const pages = [{ titre: "Café du Coin" }, { titre: "Menu Été" }, { titre: "Bar" }]
    expect(pages.filter(filtreDe("cafe", p => [p.titre])).length).toBe(1)
    expect(pages.filter(filtreDe("", p => [p.titre])).length).toBe(3)
  })

  it("et l'écran sait dire qu'il n'a rien trouvé, en nommant la recherche", () => {
    expect(phraseAucunResultat("cafe", "Aucune page")).toBe("Aucune page pour « cafe ».")
    expect(phraseAucunResultat("", "Aucune page")).toBe("Aucune page.")
    expect(phraseAucunResultat("  ")).toBe("Aucun résultat.")
  })
})

describe("les dix-huit recherches sont branchées", () => {
  const ATTENDUS: [string, string][] = [
    ["app/dashboard/qr-codes/QRStudio.tsx", "correspondAuxChamps("],
    ["app/dashboard/qr-codes/QRStudioZero.tsx", "correspondAuxChamps("],
    ["app/dashboard/leads/LeadsClient.tsx", "correspondAuxChamps("],
    ["app/dashboard/assets/page.tsx", "correspond("],
    ["app/dashboard/templates/page.tsx", "correspondAuxChamps("],
    ["app/dashboard/builder/builderSearch.ts", "pliage("],
    ["app/dashboard/builder/CommandPalette.tsx", "correspondAuxChamps("],
    ["app/dashboard/builder/MobileBuilderShell.tsx", "correspondAuxChamps("],
    ["app/dashboard/builder/ImageUpload.tsx", "correspond("],
    ["app/dashboard/analytics/GoalsDashboard.tsx", "correspond("],
    ["app/dashboard/print-studio/PrintStudioClient.tsx", "correspondAuxChamps("],
  ]

  for (const [f, attendu] of ATTENDUS) {
    it(`${f.split("/").pop()}`, () => {
      expect(lire(f), `${f} filtre encore dans son coin`).toContain(attendu)
    })
  }

  it("et la recherche de blocs ne compare plus AUCUN champ en brut", () => {
    // `scoreBlock` compare six choses (libellé, description, catégorie, type,
    // synonymes). Il suffit qu'une seule reste en `toLowerCase()` pour que
    // « Réserver » redevienne introuvable à qui tape « reserver ».
    expect(lire("app/dashboard/builder/builderSearch.ts"),
      "un champ comparé en brut suffit à rater un libellé accentué").not.toContain("toLowerCase()")
  })

  it("la FAQ de la page publique aussi — c'est le VISITEUR qui cherche", () => {
    // Un client qui cherche « horaires » dans la FAQ d'un commerce : celui-là
    // n'a pas de seconde chance, il ferme la page.
    expect(lire("app/[slug]/blocsPublics.tsx")).toContain("correspondAuxChamps([it.q, it.a], q)")
    expect(lire("app/dashboard/builder/shared-renderer/models/informationsEtAnnonces.ts"))
      .toContain("correspondAuxChamps([it.q, it.a], q)")
  })
})

describe("garde de classe : une recherche compare ce qui se lit", () => {
  function fichiers(): string[] {
    const out: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
    }
    marcher(SRC)
    return out
  }

  it("plus aucun écran ne filtre en comparant des chaînes brutes", () => {
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/rechercheSouple.ts") continue
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (/toLowerCase\(\)\s*\.\s*includes\(/.test(l)) fautes.push(`${rel}:${i + 1} — ${l.slice(0, 90)}`)
      }
    }
    expect(fautes, "une recherche qui ignore les accents du produit").toEqual([])
  })

  it("et le balayage voit bien les recherches — sinon il ne prouve rien", () => {
    let vues = 0
    for (const f of fichiers()) {
      for (const l of fs.readFileSync(f, "utf8").split("\n")) {
        if (/correspond\(|correspondAuxChamps\(|pliage\(/.test(l) && !l.trim().startsWith("//")) vues++
      }
    }
    expect(vues).toBeGreaterThan(15)
  })

  it("le module n'a pas sa propre table d'accents", () => {
    // `lib/accents.ts` en tient déjà une, pour une autre raison (la rédaction).
    // Une seconde table dériverait. Ici, c'est `NFD` qui travaille.
    const mod = lire("lib/rechercheSouple.ts")
    expect(mod).toContain('normalize("NFD")')
    expect(mod, "les espaces insécables viennent du lot v103").toContain('from "./typographieFr"')
    for (const [i, ligne] of mod.split("\n").entries()) {
      const l = ligne.trim()
      if (l.startsWith("//") || l.startsWith("*")) continue
      expect(/é.*:.*"e"|à.*:.*"a"/.test(l),
        `rechercheSouple.ts:${i + 1} recopie une table d'accents`).toBe(false)
    }
  })
})
