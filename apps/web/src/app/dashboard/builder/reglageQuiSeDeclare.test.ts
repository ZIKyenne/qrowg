// Ce qu'un réglage règle se déclare, il ne se devine pas à son nom — garde de classe.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F04). Dans la rangée
// d'icônes, l'onglet **Contenu** montrait « Taille (px) », « Par ligne »,
// « Espace intérieur » et « Largeur » — quatre réglages de forme, alors qu'un
// onglet Style existe juste à côté.
//
// **La règle existait, écrite avec sa raison, et marquée P0** — c'est le
// commentaire de `builderPanels` :
//
//     « Revue du 9 septembre (P0) : AUCUN réglage visuel dans Contenu. Un champ
//       d'apparence (forme, contour, fond, ombre, couleur, style, coins, cadre,
//       voile…) vit dans Style. »
//
// **Ce n'est pas la règle qui manquait, c'est la façon de la faire tenir.** Le
// panneau DEVINE, à partir du nom de la clé, contre une liste de mots exacts :
//
//     LAYOUT_FIELD_KEYS = { align, layout, width, height, columns, cols,
//                           disposition, orientation, size }
//
// `size` y est. `icon_size` n'y est pas. `columns` y est. `per_row` n'y est pas.
// Un bloc qui nomme son champ autrement passe à côté de la liste et tombe dans
// Contenu. **Vingt et un champs étaient dans ce cas.**
//
// **Et élargir la liste par suffixe ne marcherait pas** — c'est ce qui rend la
// devinette insoluble, pas seulement incomplète :
//
//   file_size   « Taille (optionnel) », placeholder « 2,4 Mo »   → CONTENU
//   team_size   « Taille équipe », placeholder « 5 personnes »   → CONTENU
//   icon_size   « Taille (px) », placeholder « 44 »              → MISE EN PAGE
//
// Trois clés en `_size`, deux destinations. Aucune règle sur le nom ne peut les
// séparer : la première est un poids de fichier, la deuxième un effectif, la
// troisième une dimension. Ce que le champ règle n'est pas dans son nom.
//
// La classe : **ce qu'un réglage règle se déclare.** `role` est facultatif — la
// devinette continue de ranger correctement les seize cents autres champs — mais
// quand un champ a parlé, elle ne tranche plus.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { BLOCK_DEFS } from "./blockDefs"
import { champDe } from "./builderPanels"

const SRC = path.join(__dirname, "../../..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

type Champ = { key: string; label: string; type?: string; role?: "contenu" | "miseEnPage" | "apparence" }

function tousLesChamps(): { bloc: string; champ: Champ }[] {
  const out: { bloc: string; champ: Champ }[] = []
  for (const [bloc, d] of Object.entries(BLOCK_DEFS as Record<string, { fields?: Champ[] }>))
    for (const champ of d.fields ?? []) out.push({ bloc, champ })
  return out
}

/**
 * Un libellé qui COMMENCE par un mot de forme nomme une propriété, pas un
 * contenu. Le test porte sur le début : « Colonne 1 — Titre » nomme le titre
 * d'un élément répété, pas un nombre de colonnes.
 */
const DIT_LA_FORME = /^(taille|largeur|hauteur|colonnes?|par ligne|espacement|espace|marges?|alignement|disposition|orientation|pleine largeur|trait entre|couleur|fond|ombre|contour|bordure|coins?|arrondi|police|opacité|dégradé|angle du dégradé|voile|halo|lueur|grain|flou|cadre)\b/i

/**
 * Deux champs dont le libellé dit « Taille » et qui sont pourtant du contenu :
 * ce que le commerçant ÉCRIT, et que la page affiche tel quel. Ils ne sont pas
 * une exception à la règle — ils sont la preuve qu'aucune règle sur le nom ne
 * peut remplacer une déclaration.
 */
const CONTENU_MALGRE_LE_MOT: Record<string, string> = {
  file_size: "le poids du fichier, écrit par le commerçant — « 2,4 Mo »",
  team_size: "l'effectif de l'entreprise — « 5 personnes »",
}

describe("la devinette, et ses limites", () => {
  it("trois clés en `_size`, deux destinations — le nom ne peut pas trancher", () => {
    const parCle = new Map(tousLesChamps().map(({ champ }) => [champ.key, champ]))
    for (const k of Object.keys(CONTENU_MALGRE_LE_MOT)) {
      expect(parCle.get(k), k).toBeTruthy()
      expect(champDe(parCle.get(k)!), `${k} : ${CONTENU_MALGRE_LE_MOT[k]}`).toBe("content")
      expect(parCle.get(k)!.role, "et il n'a rien eu à déclarer : la devinette a raison").toBeUndefined()
    }
    const icone = parCle.get("icon_size")!
    expect(icone.role, "celui-là a dû le dire").toBe("miseEnPage")
    expect(champDe(icone)).toBe("layout")
  })

  it("un champ qui déclare son rôle est cru sur parole", () => {
    expect(champDe({ key: "per_row", type: "select", role: "miseEnPage" } as never)).toBe("layout")
    expect(champDe({ key: "angle", type: "text", role: "apparence" } as never)).toBe("apparence")
    // Et la déclaration peut aussi RAMENER un champ dans Contenu.
    expect(champDe({ key: "radius", type: "select" } as never), "sans rôle, la devinette").toBe("apparence")
    expect(champDe({ key: "radius", type: "select", role: "contenu" } as never)).toBe("content")
  })

  it("sans rôle, la devinette d'origine n'a pas bougé", () => {
    expect(champDe({ key: "width", type: "select" } as never)).toBe("layout")
    expect(champDe({ key: "bg_color", type: "color" } as never)).toBe("apparence")
    expect(champDe({ key: "title", type: "text" } as never)).toBe("content")
    // « Rayon (km) » de la carte : un texte, clé `radius`, et pourtant du contenu.
    expect(champDe({ key: "radius", type: "text" } as never)).toBe("content")
  })
})

describe("garde de classe : aucun réglage de forme ne reste dans Contenu", () => {
  it("chaque champ dont le libellé dit la forme est rangé ailleurs", () => {
    const egares = tousLesChamps()
      .filter(({ champ }) => champDe(champ) === "content")
      .filter(({ champ }) => !(champ.key in CONTENU_MALGRE_LE_MOT))
      .filter(({ champ }) => !champ.label.includes("—") && DIT_LA_FORME.test(champ.label))
      .map(({ bloc, champ }) => `${bloc}.${champ.key} — « ${champ.label} »`)
    expect([...new Set(egares)], "déclarer `role` sur le champ").toEqual([])
  })

  it("les quatre champs du relevé ont quitté Contenu", () => {
    const parCle = new Map(tousLesChamps().map(({ champ }) => [champ.key, champ]))
    for (const [k, attendu] of [["icon_size", "layout"], ["per_row", "layout"], ["pad", "layout"], ["edge", "layout"]] as const) {
      expect(parCle.get(k), k).toBeTruthy()
      expect(champDe(parCle.get(k)!), `${k} : « ${parCle.get(k)!.label} »`).toBe(attendu)
    }
  })

  it("la règle de septembre tient toujours, et dit toujours pourquoi", () => {
    const p = lire("app/dashboard/builder/builderPanels.tsx")
    expect(p).toContain("AUCUN réglage visuel dans Contenu")
    expect(p, "la devinette reste, en second").toContain("isLayoutField(f.key) ? \"layout\" : isAppearanceField(f) ? \"apparence\" : \"content\"")
    expect(p, "mais la déclaration passe devant").toContain("f.role ? ROLE_VERS_ONGLET[f.role]")
  })

  it("le rôle est facultatif : il ne s'impose pas aux mille six cents autres", () => {
    const tous = tousLesChamps()
    const declares = tous.filter(({ champ }) => champ.role)
    expect(tous.length, "des champs déclarés dans le produit").toBeGreaterThan(1000)
    expect(declares.length, "et une poignée qui ont eu besoin de parler").toBeLessThan(80)
    expect(declares.length).toBeGreaterThan(15)
  })

  it("le balayage voit bien les libellés — sinon il ne prouve rien", () => {
    const tous = tousLesChamps()
    expect(tous.filter(({ champ }) => DIT_LA_FORME.test(champ.label)).length,
      "des libellés qui nomment une propriété").toBeGreaterThan(20)

    // Le détecteur sait dire oui — sinon il ne dirait jamais non.
    expect(DIT_LA_FORME.test("Taille (px)")).toBe(true)
    expect(DIT_LA_FORME.test("Par ligne")).toBe(true)
    // …et non à un libellé qui nomme un contenu.
    expect(DIT_LA_FORME.test("Nom complet")).toBe(false)
    expect(DIT_LA_FORME.test("Accroche")).toBe(false)
    // …et le tiret cadratin marque un sous-champ d'élément répété, pas un réglage.
    expect("Colonne 1 — Titre".includes("—")).toBe(true)
  })
})
