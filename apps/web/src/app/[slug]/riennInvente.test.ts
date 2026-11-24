import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Le 6 septembre : la page publiée écrivait « 1 240 » quand personne n'avait saisi
// de compteur, et « Mon Serveur », « Ma Chaîne », « monpseudo », « Mon Entreprise »
// quand le commerçant avait rempli le lien sans le nom. Un client qui scannait le QR
// d'un restaurant pouvait lire « Mon Entreprise » sur sa carte de visite.
//
// La règle existe déjà dans le code, écrite en tête du bloc « profil » :
// « Anti-fake : aucun contenu inventé. Un champ vide est MASQUÉ. »
// Ce test l'étend à toute la page publiée.

const ICI = __dirname
// + les formulaires, déplacés dans le renderer partagé au rendu unique, lot 6.
const publique = ["PublicPageClient.tsx", "renduLegacy.tsx", "blocsPublics.tsx",
  "../dashboard/builder/shared-renderer/forms/FormulairesEnLigne.tsx", "../dashboard/builder/shared-renderer/forms/adaptateursFormulaires.tsx"]
  .map(f => readFileSync(join(ICI, f), "utf8")).join("\n")

/**
 * Les replis « champ vide → texte en dur » du rendu public.
 * On ne garde que ceux qui sont RENDUS : `{c.x || "…"}`. Les valeurs de réglage
 * (`c.columns || "3"`), les clés de suivi de clic et les libellés de boutons
 * passés en argument ne sont pas concernés.
 */
function replisAffiches(): { champ: string; texte: string }[] {
  const out: { champ: string; texte: string }[] = []
  for (const m of publique.matchAll(/\{(c\.[a-z_0-9]+)\s*\|\|\s*"([^"]{1,60})"\}/g)) {
    out.push({ champ: m[1], texte: m[2] })
  }
  return out
}

// Un texte qui décrit l'identité du commerçant : son nom, celui de son entreprise,
// de sa chaîne, de son événement, de son œuvre. Jamais un libellé de bouton.
const IDENTITE = /^(mon|ma|mes|nouveau|nouvelle)\b|^monpseudo$/i

describe("la page publiée n'écrit rien que le commerçant n'ait saisi", () => {
  it("le balayage voit bien les deux fichiers du rendu public", () => {
    // ~81 000 au lot 4 du rendu unique : l'ancien rendu ne tient plus que 14 blocs.
    // ~71 000 au lot 5 ; ~75 000 au lot 6, formulaires partagés compris.
    expect(publique.length).toBeGreaterThan(65_000)
  })

  it("aucune identité inventée : « Mon Serveur », « Ma Chaîne », « monpseudo »…", () => {
    const fautifs = replisAffiches()
      .filter(r => IDENTITE.test(r.texte.trim()))
      .map(r => `${r.champ} → « ${r.texte} »`)
    expect(fautifs).toEqual([])
  })

  it("aucun compteur ne se replie sur un nombre inventé", () => {
    // « 1 240 scans ce mois » s'affichait sur des pages où personne n'avait compté.
    const chiffres = replisAffiches()
      .filter(r => /^[\d\s.,]+$/.test(r.texte.trim()) && r.texte.trim() !== "0")
      .map(r => `${r.champ} → « ${r.texte} »`)
    expect(chiffres).toEqual([])
  })

  it("les libellés de boutons, eux, gardent bien un défaut", () => {
    // La règle vise l'identité et les données, pas les mots d'interface : un bouton
    // sans libellé serait un bouton muet.
    const labels = replisAffiches().filter(r => /^c\.(cta_)?label$|button_label/.test(r.champ))
    expect(labels.length).toBeGreaterThan(3)
  })
})

describe("le bloc profil reste la référence", () => {
  // Servi par le renderer partagé depuis la vague 15 ; l'ancien rendu, retiré au
  // point 4 de la vague 4, n'en garde plus de copie. La règle est donc EXÉCUTÉE.
  const ctx = (titrePrincipal: boolean): any => ({ theme: { bg: "#080808", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190", fontDisplay: "f", fontBody: "b" }, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {}, titrePrincipal })
  const rendre = async (content: Record<string, unknown>, titre = true) => {
    const { renderToStaticMarkup } = await import("react-dom/server")
    const { createElement } = await import("react")
    const { PublicProfile } = await import("../dashboard/builder/shared-renderer/blocks/profile")
    return renderToStaticMarkup(createElement(PublicProfile as any, { content, ctx: ctx(titre) }))
  }
  it("sans nom ni accroche, rien n'est inventé : ni texte, ni titre", async () => {
    const html = await rendre({})
    expect(html).not.toMatch(/<h1/)
    expect(html.replace(/<[^>]*>/g, "").trim()).toBe("")
  })
  it("avec un nom, il porte le <h1> de la page — et seulement si la page le lui confie", async () => {
    expect(await rendre({ name: "Chez Nénette", tagline: "Bistrot" })).toMatch(/<h1[^>]*>Chez Nénette<\/h1>/)
    expect(await rendre({ name: "Chez Nénette" }, false)).not.toMatch(/<h1/)
  })
})
