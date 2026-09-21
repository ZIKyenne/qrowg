// Une page a une charpente — garde de classe.
//
// Relevé du 21 septembre, sur la page publiée — la suite du lot v155, qui avait
// rendu leur niveau aux titres. Les titres donnent un PLAN ; encore faut-il
// savoir où commence le contenu.
//
// La page qu'un client atteint en scannant un QR code n'avait **aucun repère de
// structure** : ni `<main>`, ni `<nav>`, ni `<footer>`. Tout était
// `<body><div><div>…`.
//
// Ce que cela coûte, concrètement :
//
//   · un lecteur d'écran propose normalement « aller au contenu principal ».
//     Sans `<main>`, cette commande ne donne rien : on écoute la page depuis le
//     premier pixel, l'animation d'ouverture comprise.
//   · le bloc « navigation par ancres » EST un menu — des liens vers les
//     sections de la page — et rien ne le disait. On ne pouvait ni y sauter ni
//     le passer.
//   · la mention « Créé avec QRowg » se lisait comme du contenu du commerçant,
//     alors que c'est le pied de page du produit.
//
// **Et le produit savait déjà** : l'accueil porte
// `<footer aria-label="Pied de page">` depuis longtemps. Un endroit le faisait.
//
// La classe : **une page a une charpente.** Trois balises, aucun pixel déplacé.
//
// Ce qui reste, compté : trente-quatre pages du produit n'ont pas encore de
// `<main>` — surtout le tableau de bord, qui est derrière une connexion. La
// page publiée et l'accueil, elles, sont celles qu'un inconnu atteint.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const APP = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(APP, p), "utf8")

/** Les pages du produit, hors bancs d'essai. */
function pages(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (n === "page.tsx") out.push(p)
    }
  }
  marcher(APP)
  return out
}

/** Le fichier d'une page, plus le client qu'elle délègue s'il y en a un. */
function corpsDeLaPage(p: string): string {
  let src = fs.readFileSync(p, "utf8")
  for (const m of src.matchAll(/from "\.\/(\w+Client)"/g)) {
    const q = path.join(path.dirname(p), `${m[1]}.tsx`)
    if (fs.existsSync(q)) src += fs.readFileSync(q, "utf8")
  }
  return src
}

describe("garde de classe : la page publiée a une charpente", () => {
  const client = lire("[slug]/PublicPageClient.tsx")

  it("le contenu du commerçant est une région principale", () => {
    expect(client, "<main> ouvert").toContain("\n        <main>")
    expect(client, "…et fermé").toContain("\n        </main>")
    // Les blocs sont DEDANS : c'est tout l'intérêt.
    const i = client.indexOf("<main>"), j = client.indexOf("</main>")
    expect(i, "<main> présent").toBeGreaterThan(0)
    expect(client.slice(i, j), "les blocs de la page").toContain("{blocks.map((block, idx) => {")
    expect(client.slice(i, j), "et l'état « page en préparation »").toContain("Cette page est en préparation")
  })

  it("ce qui n'est pas du commerçant se dit — le pied de page", () => {
    const i = client.indexOf("<footer"), j = client.indexOf("</footer>")
    expect(i, "<footer> présent").toBeGreaterThan(0)
    expect(client.slice(i, j)).toContain("Créé avec QRowg")
    // …et il est HORS du contenu principal.
    expect(i, "le pied de page suit la région principale").toBeGreaterThan(client.indexOf("</main>"))
  })

  it("le bloc d'ancres est une navigation, et elle est nommée", () => {
    const nav = lire("dashboard/builder/shared-renderer/blocks/anchor_nav/index.tsx")
    expect(nav).toContain('<nav aria-label="Sections de la page"')
    expect(nav, "et refermée").toContain("</nav>")
    expect(nav, "les liens y sont").toContain("entries.map((e, i) =>")
  })

  it("exactement un <h1>, et la page le dit", () => {
    expect(client).toContain("Exactement un <h1> par page")
    expect(client).toContain("titrePrincipal: h1Owner === block.id")
  })
})

describe("garde de classe : l'accueil aussi", () => {
  it("son contenu est une région principale, son pied de page était déjà nommé", () => {
    const home = lire("HomeClient.tsx")
    expect(home, "<main> ouvert").toContain("\n      <main>")
    expect(home, "…et fermé").toContain("\n      </main>")
    expect(home, "le pied de page, lui, portait déjà son nom").toContain('<footer style={{ borderTop:"1px solid rgba(201,168,76,0.1)", position:"relative", zIndex:2 }} aria-label="Pied de page">')
    const i = home.indexOf("<main>"), j = home.indexOf("</main>")
    expect(home.slice(i, j), "le héros est dedans").toContain("QRMockup")
    // Le vrai pied de page, pas la phrase du commentaire qui le cite.
    expect(j, "le pied de page est dehors").toBeLessThan(home.indexOf("      <footer style={{"))
  })
})

describe("le cliquet : les pages sans région principale", () => {
  it("leur nombre ne peut que descendre", () => {
    const sans = pages().filter(p => !corpsDeLaPage(p).includes("<main"))
      .map(p => path.relative(APP, p).split(path.sep).join("/"))
    // 36 au relevé, 34 depuis que la page publiée et l'accueil ont la leur.
    // Le reste est surtout le tableau de bord, derrière une connexion : moins
    // urgent qu'une page qu'un inconnu atteint en scannant.
    expect(sans.length, `restantes : ${sans.slice(0, 6).join(", ")}…`).toBeLessThanOrEqual(34)
    expect(sans.length, "il en reste — sinon ce cliquet n'aurait plus de sens").toBeGreaterThan(0)
  })

  it("le balayage voit bien les pages — sinon il ne prouve rien", () => {
    const toutes = pages()
    expect(toutes.length, "des pages dans le produit").toBeGreaterThan(40)
    expect(toutes.some(p => p.endsWith(`${path.sep}[slug]${path.sep}page.tsx`)), "dont la page publiée").toBe(true)
    // Le détecteur sait dire oui : la page publiée passe par son client, et
    // c'est là que vit son `<main>`.
    const publique = toutes.find(p => p.includes(`${path.sep}[slug]${path.sep}`))!
    expect(corpsDeLaPage(publique), "la page publiée compte comme couverte").toContain("<main>")
    expect(fs.readFileSync(publique, "utf8"), "…alors que son fichier de page n'en a pas").not.toContain("<main")
  })
})
