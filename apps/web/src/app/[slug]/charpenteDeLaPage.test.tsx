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
// ── Ce que ce lot-ci a corrigé, et qui était faux ───────────────────────────
//
// Ce fichier annonçait, au lot v156 : « trente-quatre pages du produit n'ont pas
// encore de `<main>` — surtout le tableau de bord, qui est derrière une
// connexion, donc moins urgent qu'une page qu'un inconnu atteint. »
//
// **Les deux moitiés de cette phrase étaient fausses**, et c'est le balayage qui
// mentait, pas le produit. Il suivait une page jusqu'à son `./XxxClient` — et
// rien d'autre. Or une page Next est COMPOSÉE : de ses `layout.tsx` empilés, et
// des composants qu'elle importe.
//
//     les vingt et une pages du tableau de bord     → `DashboardShell`  <main>
//     les trois pages légales                       → `LegalLayout`     <main>
//     la page d'un modèle d'exemple                 → son composant     <main>
//
// Vingt-cinq des trente-quatre AVAIENT leur région principale. Il en restait
// neuf — et ce sont exactement celles qu'un inconnu atteint : les quatre pages
// d'authentification, et `contact`, `creer`, `examples`, `features`, `upgrade`.
// Le tableau de bord était fait ; c'est la vitrine qui ne l'était pas.
//
// Les neuf sont réparées au lot v158, sans déplacer un pixel : un `<div>` de
// contenu renommé là où il y en avait un, un `<main>` posé autour des sections
// là où il n'y en avait pas. Le cliquet devient donc une garde pleine —
// **zéro** — et le balayage suit désormais ce que la page compose.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const APP = path.join(__dirname, "..")
const SRC = path.join(APP, "..")
const lire = (p: string) => fs.readFileSync(path.join(APP, p), "utf8")

/** Les fichiers du produit portant l'un de ces noms, hors bancs d'essai. */
function ecrans(...noms: string[]): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (noms.includes(n)) out.push(p)
    }
  }
  marcher(APP)
  return out
}

/** Les pages du produit. */
const pages = () => ecrans("page.tsx")

/** Le fichier que désigne un import — `@/…`, `./…`, `../…` — ou rien. */
function resoudre(dep: string, depuis: string): string | null {
  let base: string
  if (dep.startsWith("@/")) base = path.join(SRC, dep.slice(2))
  else if (dep.startsWith(".")) base = path.resolve(path.dirname(depuis), dep)
  else return null
  for (const c of [`${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx")])
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  return null
}

/** Un fichier et tout ce qu'il compose, jusqu'à quatre niveaux. */
function composition(p: string, vus = new Set<string>(), prof = 0): Set<string> {
  if (vus.has(p) || prof > 4) return vus
  vus.add(p)
  for (const m of fs.readFileSync(p, "utf8").matchAll(/from "([^"]+)"/g)) {
    const q = resoudre(m[1], p)
    if (q) composition(q, vus, prof + 1)
  }
  return vus
}

/**
 * Ce qu'un navigateur assemble pour une page : la page, ce qu'elle compose, et
 * tous les `layout.tsx` empilés au-dessus d'elle — c'est ainsi que Next emboîte.
 */
function laPageEntiere(p: string): Set<string> {
  const vus = composition(p)
  let d = path.dirname(p)
  for (;;) {
    const l = path.join(d, "layout.tsx")
    if (fs.existsSync(l)) for (const f of composition(l)) vus.add(f)
    if (path.resolve(d) === path.resolve(APP)) break
    d = path.dirname(d)
  }
  return vus
}

/** Les fichiers de cette page qui posent une région principale. */
function porteursDeMain(p: string): string[] {
  return [...laPageEntiere(p)]
    .filter(f => /<main[\s>]/.test(fs.readFileSync(f, "utf8")))
    .map(f => path.relative(SRC, f).split(path.sep).join("/"))
    .sort()
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

describe("garde de classe : toute page du produit a une région principale, et une seule", () => {
  it("aucune page n'en manque — le cliquet du lot v156 est fermé", () => {
    const sans = pages().filter(p => porteursDeMain(p).length === 0)
      .map(p => path.relative(APP, p).split(path.sep).join("/"))
    expect(sans, "une page sans <main> s'écoute depuis le premier pixel").toEqual([])
  })

  it("…et aucune n'en a deux — un second plan principal n'en est plus un", () => {
    const doubles = pages()
      .map(p => [path.relative(APP, p).split(path.sep).join("/"), porteursDeMain(p)] as const)
      .filter(([, porteurs]) => porteurs.length > 1)
      .map(([nom, porteurs]) => `${nom} → ${porteurs.join(" + ")}`)
    expect(doubles, "une seule région principale par page").toEqual([])
    // C'est la raison pour laquelle `/creer` porte la sienne dans SON layout et
    // non dans la galerie de modèles : la même galerie, servie à
    // `/dashboard/templates`, est déjà dans le `<main>` de la coquille.
    const galerie = lire("dashboard/templates/page.tsx")
    expect(galerie, "la galerie ne pose pas de région : elle est posée AUTOUR d'elle").not.toContain("<main")
    expect(lire("creer/layout.tsx"), "…et /creer la pose").toContain("<main style=")
  })

  it("les neuf du lot v158 portent bien la leur, chacune dans son fichier", () => {
    for (const [page, porteur] of [
      ["auth/login/page.tsx", "app/auth/login/page.tsx"],
      ["auth/signup/page.tsx", "app/auth/signup/page.tsx"],
      ["auth/forgot-password/page.tsx", "app/auth/forgot-password/page.tsx"],
      ["auth/reset-password/page.tsx", "app/auth/reset-password/page.tsx"],
      ["contact/page.tsx", "app/contact/page.tsx"],
      ["examples/page.tsx", "app/examples/page.tsx"],
      ["features/page.tsx", "app/features/page.tsx"],
      ["upgrade/page.tsx", "app/upgrade/page.tsx"],
      ["creer/page.tsx", "app/creer/layout.tsx"],
    ] as const) expect(porteursDeMain(path.join(APP, page)), page).toEqual([porteur])
  })
})

describe("le balayage suit ce que la page COMPOSE — c'est là que v156 se trompait", () => {
  it("il traverse un import `@/composant` : les pages légales", () => {
    // Leur fichier n'a aucun `<main>` ; il vit dans `@/components/legal-layout`.
    const legal = path.join(APP, "legal", "page.tsx")
    expect(fs.readFileSync(legal, "utf8"), "le fichier de la page n'en a pas").not.toContain("<main")
    expect(porteursDeMain(legal), "…mais le composant qu'elle compose, si").toEqual(["components/legal-layout.tsx"])
  })

  it("il remonte les layouts empilés : le tableau de bord", () => {
    // Vingt et une pages, aucune n'écrit `<main>`, toutes en ont un.
    const reglages = path.join(APP, "dashboard", "settings", "page.tsx")
    expect(corpsDeLaPage(reglages), "ni la page ni son client").not.toContain("<main")
    expect(porteursDeMain(reglages), "…la coquille du tableau de bord le porte")
      .toEqual(["app/dashboard/DashboardShell.tsx"])
    const duTableau = pages().filter(p => p.includes(`${path.sep}dashboard${path.sep}`))
    expect(duTableau.length, "des pages de tableau de bord").toBeGreaterThan(18)
    for (const p of duTableau)
      expect(porteursDeMain(p).length, path.relative(APP, p)).toBe(1)
  })

  it("il suit encore le client d'une page : la page publiée", () => {
    const publique = pages().find(p => p.includes(`${path.sep}[slug]${path.sep}`))!
    expect(fs.readFileSync(publique, "utf8"), "son fichier de page n'en a pas").not.toContain("<main")
    expect(porteursDeMain(publique), "son client le porte, depuis le lot v156")
      .toEqual(["app/[slug]/PublicPageClient.tsx"])
  })

  it("il voit aussi les écrans qui ne sont pas des `page.tsx`", () => {
    // Une page introuvable et une page en erreur, ce sont deux écrans qu'un
    // inconnu atteint — le premier en scannant un QR code périmé. Le balayage
    // ne les voyait pas : ils ne s'appellent pas `page.tsx`.
    const autres = ecrans("not-found.tsx", "error.tsx", "global-error.tsx", "loading.tsx")
    expect(autres.length, "des écrans d'erreur et d'attente").toBeGreaterThan(3)
    const sans = autres.filter(p => porteursDeMain(p).length === 0)
      .map(p => path.relative(APP, p).split(path.sep).join("/"))
    // Une seule reste, et pour une raison écrite : la page 404 générale porte,
    // en plus de son contenu, la mention « © QRowg » en position absolue. Lui
    // donner sa région demande d'ENVELOPPER son contenu — donc d'ajouter un
    // élément au milieu d'un conteneur `flex` centré, donc de revérifier la
    // mise en page à l'œil. Les quatre autres n'avaient rien autour de leur
    // contenu : leur conteneur racine EST la région, il a été renommé.
    expect(sans, "la 404 générale attend son tour").toEqual(["not-found.tsx"])
    expect(fs.readFileSync(path.join(APP, "not-found.tsx"), "utf8"), "et c'est bien ce pied de page qui la retient")
      .toContain('<div style={{ position: "absolute", bottom: 24')
    // Le tableau de bord, lui, n'a rien à renommer : sa coquille porte déjà.
    expect(porteursDeMain(path.join(APP, "dashboard", "error.tsx")))
      .toEqual(["app/dashboard/DashboardShell.tsx"])
  })

  it("le balayage sait dire non — sinon il ne dirait jamais oui", () => {
    expect(pages().length, "des pages dans le produit").toBeGreaterThan(40)
    // Un import qui ne mène à rien ne fait pas passer une page.
    expect(resoudre("next/headers", path.join(APP, "layout.tsx")), "un paquet externe").toBeNull()
    expect(resoudre("@/composant-qui-nexiste-pas", path.join(APP, "layout.tsx"))).toBeNull()
    // …et un fichier sans région principale n'est pas compté comme porteur.
    const seul = path.join(APP, "dashboard", "settings", "page.tsx")
    expect(porteursDeMain(seul)).not.toContain("app/dashboard/settings/page.tsx")
    // L'ANCIEN balayage, celui du lot v156 : il ne voyait que `./XxxClient`.
    // Gardé ici pour que la correction reste démontrable, pas seulement écrite.
    const aveugle = pages().filter(p => !corpsDeLaPage(p).includes("<main")).length
    expect(aveugle, "l'ancien balayage en voyait des dizaines sans région").toBeGreaterThan(20)
    expect(pages().filter(p => porteursDeMain(p).length === 0).length, "le nouveau, aucune").toBe(0)
  })
})
