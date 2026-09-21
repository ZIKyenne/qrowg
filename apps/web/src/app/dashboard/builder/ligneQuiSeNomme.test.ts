// Une ligne qui se répète porte le nom de ce qu'elle contient — garde de classe.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F11, F12). La page
// affiche « Wi-Fi », « Prises », « Terrasse », « Chiens acceptés ». Le panneau,
// en face, affiche « Icône 1 » à « Icône 4 » — et deux emplacements vides de
// plus. Pour changer « Wi-Fi », il fallait ouvrir les lignes une par une.
//
// **Le produit avait déjà le bon geste.** `RepeaterEditor` ne montre que les
// lignes remplies plus une, donne « Ajouter un plat », et pose sur chaque ligne
// monter / descendre / supprimer. **Trente-neuf types de blocs l'utilisent.**
// Mais son en-tête disait « Plat 1 » : la même numérotation, dans le bon
// composant.
//
// **Et vingt-huit types de blocs ne l'utilisaient pas du tout** — dont la
// rangée d'icônes. Ils tombent dans la liste générique de champs, qui déroule
// les emplacements à plat, vides compris. C'est de là que viennent « Icône 5 »
// et « Icône 6 », visibles alors que la page n'en montre que quatre : F12.
//
// Ce lot fait deux choses et en laisse une :
//
//   fait     l'en-tête d'une ligne porte son contenu — les trente-neuf blocs
//            en profitent d'un coup.
//   fait     la rangée d'icônes rejoint `RepeaterEditor`, ce qui referme F11
//            et F12 sur le cas exact du relevé. Le rendu lisait déjà
//            `i5_image` / `i6_image` : la déclaration les rattrape, rien n'est
//            retiré.
//   laissé   les vingt-sept autres. Chacun a ses suffixes à lui — `cert_1`,
//            `link_1`, `transport1` — et les convertir en aveugle casserait
//            l'édition de vingt-sept types de blocs. Ils sont comptés, et ce
//            compte est un CLIQUET : il ne peut que descendre.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { nomDeLaLigne, NOM_MAX } from "./nomDeLaLigne"

const SRC = path.join(__dirname, "../../..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

const CHAMPS_ICONE = [{ suffix: "label" }, { suffix: "emoji" }, { suffix: "image", kind: "image" }] as const

/** Les types de blocs qui déclarent au moins trois emplacements d'un même préfixe. */
function blocsARepetition(): Record<string, number> {
  const defs = lire("app/dashboard/builder/blockDefs.ts")
  const out: Record<string, number> = {}
  for (const m of defs.matchAll(/\n {2}([a-z0-9_]+): \{/g)) {
    const debut = m.index! + m[0].length
    const fin = defs.indexOf("\n  },", debut)
    const corps = defs.slice(debut, fin < 0 ? undefined : fin)
    const parPrefixe = new Map<string, Set<number>>()
    for (const k of corps.matchAll(/key:\s*"([a-zA-Z_]+?)(\d+)(?:_[a-z_]+)?"/g)) {
      const s = parPrefixe.get(k[1]) ?? new Set<number>()
      s.add(Number(k[2])); parPrefixe.set(k[1], s)
    }
    let n = 0
    for (const s of parPrefixe.values()) if (s.size >= 3) n++
    if (n > 0) out[m[1]] = n
  }
  return out
}

/** Les types de blocs que le panneau confie à `RepeaterEditor`. */
function viaRepeteur(): Set<string> {
  const p = lire("app/dashboard/builder/builderPanels.tsx")
  const out = new Set<string>()
  for (const m of p.matchAll(/RepeaterEditor block=/g)) {
    const avant = p.slice(0, m.index!)
    const i = avant.lastIndexOf("if (block.type ===")
    if (i < 0) continue
    for (const t of avant.slice(i, avant.indexOf(")", i) + 1).matchAll(/"([a-z0-9_]+)"/g)) out.add(t[1])
  }
  return out
}

/** Ceux qui tombent encore dans la liste générique de champs. */
function sansRepeteur(): string[] {
  const p = lire("app/dashboard/builder/builderPanels.tsx")
  const dedies = new Set([...p.matchAll(/block\.type === "([a-z0-9_]+)"/g)].map(m => m[1]))
  return Object.keys(blocsARepetition()).filter(b => !dedies.has(b)).sort()
}

describe("ce qui nomme une ligne", () => {
  it("le premier texte saisi, dans l'ordre du panneau", () => {
    expect(nomDeLaLigne(CHAMPS_ICONE, { label: "Wi-Fi", emoji: "📶" }, "Point fort 1")).toBe("Wi-Fi")
    expect(nomDeLaLigne(CHAMPS_ICONE, { emoji: "🐕", label: "" }, "Point fort 4")).toBe("🐕")
  })

  it("une adresse ne nomme rien : personne ne reconnaît sa ligne à « https://… »", () => {
    const champs = [{ suffix: "url", kind: "url" }, { suffix: "name" }] as const
    expect(nomDeLaLigne(champs, { url: "https://resto.fr", name: "" }, "Lien 2")).toBe("Lien 2")
    expect(nomDeLaLigne(champs, { url: "https://resto.fr", name: "Notre carte" }, "Lien 2")).toBe("Notre carte")
    // Une image non plus.
    expect(nomDeLaLigne(CHAMPS_ICONE, { image: "data:image/png;base64,AAA" }, "Point fort 5")).toBe("Point fort 5")
  })

  it("une ligne encore vide garde son numéro — il faut bien l'appeler quelque chose", () => {
    expect(nomDeLaLigne(CHAMPS_ICONE, {}, "Point fort 6")).toBe("Point fort 6")
    expect(nomDeLaLigne(CHAMPS_ICONE, { label: "   " }, "Point fort 6")).toBe("Point fort 6")
    expect(nomDeLaLigne(CHAMPS_ICONE, null, "Point fort 6")).toBe("Point fort 6")
  })

  it("un nom trop long est coupé, et un retour à la ligne ne casse pas l'en-tête", () => {
    const long = "Terrasse chauffée ouverte toute l'année, côté jardin"
    const n = nomDeLaLigne(CHAMPS_ICONE, { label: long }, "x")
    expect(n.length).toBeLessThanOrEqual(NOM_MAX)
    expect(n.endsWith("…")).toBe(true)
    expect(nomDeLaLigne(CHAMPS_ICONE, { label: "Deux\nlignes" }, "x")).toBe("Deux lignes")
  })
})

describe("garde de classe : le panneau dit ce que la page montre", () => {
  it("l'en-tête d'une ligne répétée ne numérote plus", () => {
    const p = lire("app/dashboard/builder/builderPanels.tsx")
    expect(p).toContain("nomDeLaLigne(fields, it, `${noun} ${i}`)")
    expect(p, "plus d'en-tête numéroté écrit en dur").not.toContain(">{noun} {i}</span>")
    expect(p, "le numéro reste accessible au survol").toContain("title={`${noun} ${i}`}")
  })

  it("la rangée d'icônes du relevé passe par le répéteur", () => {
    const p = lire("app/dashboard/builder/builderPanels.tsx")
    expect(p).toContain('if (block.type === "icon_row")')
    expect(p).toContain('prefix="i" noun="Point fort" addLabel="Ajouter un point fort"')
    expect(p, "le texte d'abord : c'est lui qui nommera la ligne")
      .toContain('fields={[{ suffix: "label", placeholder: "Wi-Fi" }, { suffix: "emoji", placeholder: "📶" }, { suffix: "image", kind: "image" }]}')
    expect(viaRepeteur().has("icon_row")).toBe(true)
  })

  it("et ses deux derniers emplacements rattrapent l'image que le rendu lisait déjà", () => {
    const defs = lire("app/dashboard/builder/blockDefs.ts")
    for (const k of ["i5_image", "i6_image"]) expect(defs, k).toContain(`{ key: "${k}"`)
    expect(lire("app/dashboard/builder/shared-renderer/blocks/icon_row/index.tsx"),
      "le rendu les lisait avant qu'elles soient déclarées").toContain("safeImageUrl(src[`i${i}_image`])")
  })

  it("le cliquet : le nombre de blocs restés dans la liste générique ne grossit pas", () => {
    const restants = sansRepeteur()
    // 28 au relevé, 27 après la rangée d'icônes. Ce nombre ne peut que descendre.
    expect(restants.length, `restants : ${restants.join(", ")}`).toBeLessThanOrEqual(27)
    expect(restants, "la rangée d'icônes en est sortie").not.toContain("icon_row")
  })

  it("le balayage voit bien les répétitions — sinon il ne prouve rien", () => {
    const tous = blocsARepetition()
    expect(Object.keys(tous).length, "des blocs à emplacements répétés").toBeGreaterThan(50)
    expect(viaRepeteur().size, "et beaucoup passent déjà par le répéteur").toBeGreaterThan(30)
    // Le détecteur sait dire oui : la rangée d'icônes a bien six emplacements.
    expect(tous["icon_row"]).toBeGreaterThanOrEqual(1)
    // …et non à un bloc sans répétition.
    expect(tous["text_block"]).toBeUndefined()
  })
})
