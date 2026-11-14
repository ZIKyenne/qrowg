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
import { sansCommentaires as codeSeul } from "@/lib/codeSeul"

const APP = path.join(__dirname, "..")
const SRC = path.join(APP, "..")
const lire = (p: string) => source(path.join(APP, p))

// ── Pourquoi ce fichier mémorise ses lectures ──────────────────────────────
//
// Ce balayage relit l'arborescence `app/` à chaque test : treize tests, une
// centaine de pages, et pour chacune ses `layout.tsx` empilés plus son graphe
// d'imports sur quatre niveaux. Les mêmes fichiers étaient donc relus des
// milliers de fois, et sur Windows chaque `readFileSync`/`existsSync` est un
// appel système qui coûte.
//
// Relevé du 5 novembre : la garde mettait 108 s, et le cliquet lui-même a
// dépassé le délai de 30 s. Trois fichiers neufs avaient suffi à faire basculer
// un test qui tenait à 28 s. C'est le pire mode de panne pour une garde : elle
// ralentit à chaque fichier que le produit gagne, donc elle tombera un jour
// chez quelqu'un qui n'a touché à rien — et la correction qui vient alors à
// l'esprit est d'augmenter le délai, ou de retirer le fichier de la suite. La
// garde serait perdue sans que personne ait décidé de la perdre.
//
// Les lectures sont donc MÉMORISÉES, pas allégées : le balayage ouvre les mêmes
// fichiers et prend les mêmes décisions. L'arborescence ne change pas pendant un
// passage, et les caches sont refaits à chaque exécution.

const CACHE_SRC = new Map<string, string>()
/** Le source d'un fichier, lu une seule fois par passage. */
function source(p: string): string {
  let s = CACHE_SRC.get(p)
  if (s === undefined) { s = fs.readFileSync(p, "utf8"); CACHE_SRC.set(p, s) }
  return s
}

const CACHE_FICHIER = new Map<string, boolean>()
/** `existsSync` + `isFile` mémorisés : c'est l'essentiel du coût de `resoudre`. */
function estUnFichier(p: string): boolean {
  let b = CACHE_FICHIER.get(p)
  if (b === undefined) { b = fs.existsSync(p) && fs.statSync(p).isFile(); CACHE_FICHIER.set(p, b) }
  return b
}

/** Les fichiers du produit portant l'un de ces noms, hors bancs d'essai. */
const CACHE_ECRANS = new Map<string, string[]>()
function ecrans(...noms: string[]): string[] {
  const cle = [...noms].sort().join("|")
  const connu = CACHE_ECRANS.get(cle)
  if (connu) return connu
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (noms.includes(n)) out.push(p)
    }
  }
  marcher(APP)
  CACHE_ECRANS.set(cle, out)
  return out
}

/** Les pages du produit. */
const pages = () => ecrans("page.tsx")

/** Le fichier que désigne un import — `@/…`, `./…`, `../…` — ou rien. */
const CACHE_RESOUDRE = new Map<string, string | null>()
function resoudre(dep: string, depuis: string): string | null {
  const cle = dep + "\u0000" + depuis
  if (CACHE_RESOUDRE.has(cle)) return CACHE_RESOUDRE.get(cle) ?? null
  const r = resoudreVraiment(dep, depuis)
  CACHE_RESOUDRE.set(cle, r)
  return r
}

function resoudreVraiment(dep: string, depuis: string): string | null {
  let base: string
  if (dep.startsWith("@/")) base = path.join(SRC, dep.slice(2))
  else if (dep.startsWith(".")) base = path.resolve(path.dirname(depuis), dep)
  else return null
  for (const c of [`${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx")])
    if (estUnFichier(c)) return c
  return null
}

/** Un fichier et tout ce qu'il compose, jusqu'à quatre niveaux. */
function composition(p: string, vus = new Set<string>(), prof = 0): Set<string> {
  if (vus.has(p) || prof > 4) return vus
  vus.add(p)
  for (const m of source(p).matchAll(/from "([^"]+)"/g)) {
    const q = resoudre(m[1], p)
    if (q) composition(q, vus, prof + 1)
  }
  return vus
}

/**
 * Ce qu'un navigateur assemble pour une page : la page, ce qu'elle compose, et
 * tous les `layout.tsx` empilés au-dessus d'elle — c'est ainsi que Next emboîte.
 */
const CACHE_PAGE = new Map<string, Set<string>>()
function laPageEntiere(p: string): Set<string> {
  const connu = CACHE_PAGE.get(p)
  if (connu) return connu
  const vus = composition(p)
  let d = path.dirname(p)
  for (;;) {
    const l = path.join(d, "layout.tsx")
    if (estUnFichier(l)) for (const f of composition(l)) vus.add(f)
    if (path.resolve(d) === path.resolve(APP)) break
    d = path.dirname(d)
  }
  CACHE_PAGE.set(p, vus)
  return vus
}

/** Les fichiers de cette page qui posent une région principale. */
/**
 * Le code, sans les commentaires.
 *
 * ── Le trou bouché au lot v199 ─────────────────────────────────────────────
 *
 * Un composant ajouté dans la mise en page racine expliquait, EN COMMENTAIRE,
 * pourquoi `<main>` doit porter `tabIndex={-1}`. Le balayage a lu ce commentaire
 * comme une région principale : **quarante-six pages se sont retrouvées avec
 * deux régions**, et la page 404 avec une région qu'elle n'a pas.
 *
 * Une garde qu'un commentaire fait crier apprend à ne plus commenter. Elle lit
 * donc le code, et le code seul.
 */
const CACHE_SANS = new Map<string, string>()
function sansCommentaires(src: string): string {
  let s = CACHE_SANS.get(src)
  if (s === undefined) { s = decommenter(src); CACHE_SANS.set(src, s) }
  return s
}

// Le décommenteur est partagé et testé (`lib/codeSeul`) : il attrape aussi le
// commentaire de FIN de ligne, ne confond pas `https://` avec un commentaire,
// et préserve les positions. Le cache, lui, reste ici : sans lui cette garde
// repassait des centaines de fois sur les mêmes fichiers (108 s → 2 s).
const decommenter = (src: string) => codeSeul(src)

const CACHE_PORTEURS = new Map<string, string[]>()
function porteursDeMain(p: string): string[] {
  const connu = CACHE_PORTEURS.get(p)
  if (connu) return connu
  const out = calculerPorteurs(p)
  CACHE_PORTEURS.set(p, out)
  return out
}

function calculerPorteurs(p: string): string[] {
  return [...laPageEntiere(p)]
    .filter(f => /<main[\s>]/.test(sansCommentaires(source(f))))
    .map(f => path.relative(SRC, f).split(path.sep).join("/"))
    .sort()
}

/** Le fichier d'une page, plus le client qu'elle délègue s'il y en a un. */
const CACHE_CORPS = new Map<string, string>()
function corpsDeLaPage(p: string): string {
  const connu = CACHE_CORPS.get(p)
  if (connu !== undefined) return connu
  let src = source(p)
  for (const m of src.matchAll(/from "\.\/(\w+Client)"/g)) {
    const q = path.join(path.dirname(p), `${m[1]}.tsx`)
    if (estUnFichier(q)) src += source(q)
  }
  CACHE_CORPS.set(p, src)
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
    // Ces deux lignes citaient `\n      <main>` — l'indentation ET l'absence
    // d'attribut. Le lot v199 a posé `id="contenu"` sur chaque région pour que
    // le lien d'évitement ait une cible : la garde interdisait donc la
    // correction. Recalée sur l'intention — une région principale est ouverte,
    // et elle est fermée.
    expect(home, "<main> ouvert").toMatch(/<main[\s>]/)
    expect(home, "…et fermé").toContain("</main>")
    expect(home, "le pied de page, lui, portait déjà son nom").toContain('<footer style={{ borderTop:"1px solid rgba(201,168,76,0.1)", position:"relative", zIndex:2 }} aria-label="Pied de page">')
    // `indexOf("<main>")` cherchait la balise SANS attribut : depuis qu'elle en
    // porte un, il rendait -1 et la tranche était vide. La garde passait alors
    // au vert pour la mauvaise raison — elle ne vérifiait plus rien.
    const i = home.search(/<main[\s>]/), j = home.indexOf("</main>")
    expect(i, "la région principale de l'accueil est introuvable").toBeGreaterThan(0)
    expect(home.slice(i, j), "le héros est dedans").toContain("QRMockup")
    // Le vrai pied de page, pas la phrase du commentaire qui le cite.
    expect(j, "le pied de page est dehors").toBeLessThan(home.indexOf("      <footer style={{"))
  })
})

// ── Dérogation écrite : deux porteurs, jamais deux régions ─────────────
//
// Ce balayage compte les porteurs de `<main>` STATIQUEMENT, dans tout ce qu'une
// page compose. Il ne sait pas lire une alternative : deux composants qui ne
// peuvent jamais se rendre ensemble lui en font compter deux.
//
// Le lot de l'essai de trente jours en a créé la première. `[slug]/page.tsx`
// rend l'écran de pause OU la page vivante, selon que l'essai du compte est
// écoulé ; un `return` sort entre les deux. À l'exécution il y a toujours
// exactement une région principale : l'intention de la garde est tenue, c'est sa
// méthode qui ne sait pas l'exprimer.
//
// La correction tentante — retirer le `<main>` de l'écran de pause — ferait
// taire la garde et PERDRAIT la région principale pour de vrai, sur la seule
// page qu'un inconnu atteint en scannant un QR imprimé. Le silence aurait coûté
// la chose même que la garde protège.
//
// La dérogation est donc écrite, nommée, et VÉRIFIÉE : `derogationTenue` relit
// la page et exige que l'exclusivité y soit encore — la condition, un `return`
// qui sort, puis la première branche, la seconde seulement après. Le jour où
// quelqu'un retire ce `return`, la dérogation devient fausse et la garde crie.
// Elle ne peut pas pourrir non plus : une dérogation dont la page n'a plus deux
// porteurs est signalée comme à RETIRER.
//
// Ce que cette vérification prouve, et ce qu'elle ne prouve pas : elle lit un
// ordre dans le fichier, elle n'exécute pas la page. Elle attrape la faute
// plausible — la sortie qui disparaît, un troisième porteur qui arrive — pas
// toutes les manières imaginables d'écrire deux branches qui se superposent.

type BranchesExclusives = {
  /** La condition qui ouvre la sortie, telle qu'elle est écrite dans la page. */
  condition: string
  /** Les composants rendus, dans l'ordre où la page les écrit. */
  branches: string[]
  /** Ce que le balayage doit trouver — ni plus, ni moins. */
  porteurs: string[]
}

const BRANCHES_EXCLUSIVES: Record<string, BranchesExclusives> = {
  "[slug]/page.tsx": {
    condition: "if (essaiExpire(",
    branches: ["PageEnPause", "PublicPageClient"],
    porteurs: ["app/[slug]/PageEnPause.tsx", "app/[slug]/PublicPageClient.tsx"],
  },
}

/** La page publiée — celle qu'un QR imprimé atteint. */
const laPagePubliee = () => pages().find(p => p.includes(`${path.sep}[slug]${path.sep}`))!

/**
 * Ce qui manque pour que la dérogation de `nom` soit encore vraie.
 *
 * Prend le source en argument plutôt que de le lire : la contre-épreuve lui
 * passe une version mutée, et une garde qui ne sait pas crier ne garde rien.
 */
function derogationTenue(src: string, nom: string, trouves: string[]): string[] {
  const d = BRANCHES_EXCLUSIVES[nom]
  if (!d) return [`${nom} : aucune dérogation déclarée`]
  const manques: string[] = []

  if (trouves.length < 2)
    manques.push("la page n'a plus deux porteurs : la dérogation est à RETIRER")
  const attendus = [...d.porteurs].sort()
  if (trouves.join(" + ") !== attendus.join(" + "))
    manques.push(`porteurs déclarés « ${attendus.join(" + ")} », trouvés « ${trouves.join(" + ")} »`)

  const iCond = src.indexOf(d.condition)
  if (iCond < 0) return [...manques, `la condition « ${d.condition} » a disparu de la page`]

  let precedent = iCond
  for (let rang = 0; rang < d.branches.length; rang++) {
    const tag = d.branches[rang]
    const i = src.indexOf(`<${tag}`, precedent)
    if (i < 0) { manques.push(`<${tag}> n'est plus rendu ici`); break }
    if (rang === 0 && !/\breturn\b/.test(src.slice(iCond, i)))
      manques.push(`aucun \`return\` entre la condition et <${tag}> : les deux branches peuvent se rendre ensemble`)
    precedent = i
  }
  return manques
}

describe("garde de classe : toute page du produit a une région principale, et une seule", () => {
  it("aucune page n'en manque — le cliquet du lot v156 est fermé", () => {
    const sans = pages().filter(p => porteursDeMain(p).length === 0)
      .map(p => path.relative(APP, p).split(path.sep).join("/"))
    expect(sans, "une page sans <main> s'écoute depuis le premier pixel").toEqual([])
  })

  it("…et aucune n'en a deux — un second plan principal n'en est plus un", () => {
    const doubles = pages()
      .map(p => [path.relative(APP, p).split(path.sep).join("/"), porteursDeMain(p)] as const)
      // Une page dont les porteurs sont des branches EXCLUSIVES porte une
      // dérogation écrite, et le test suivant exige qu'elle soit encore vraie.
      .filter(([nom, porteurs]) => porteurs.length > 1 && !BRANCHES_EXCLUSIVES[nom])
      .map(([nom, porteurs]) => `${nom} → ${porteurs.join(" + ")}`)
    expect(doubles, "une seule région principale par page").toEqual([])
    // C'est la raison pour laquelle `/creer` porte la sienne dans SON layout et
    // non dans la galerie de modèles : la même galerie, servie à
    // `/dashboard/templates`, est déjà dans le `<main>` de la coquille.
    const galerie = lire("dashboard/templates/page.tsx")
    expect(sansCommentaires(galerie), "la galerie ne pose pas de région : elle est posée AUTOUR d'elle").not.toMatch(/<main[\s>]/)
    expect(lire("creer/layout.tsx"), "…et /creer la pose").toMatch(/<main[\s>]/)
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
    expect(sansCommentaires(corpsDeLaPage(reglages)), "ni la page ni son client").not.toMatch(/<main[\s>]/)
    expect(porteursDeMain(reglages), "…la coquille du tableau de bord le porte")
      .toEqual(["app/dashboard/DashboardShell.tsx"])
    const duTableau = pages().filter(p => p.includes(`${path.sep}dashboard${path.sep}`))
    expect(duTableau.length, "des pages de tableau de bord").toBeGreaterThan(18)
    for (const p of duTableau)
      expect(porteursDeMain(p).length, path.relative(APP, p)).toBe(1)
  })

  it("…sauf là où c'est écrit, et alors c'est encore vrai", () => {
    for (const nom of Object.keys(BRANCHES_EXCLUSIVES)) {
      const p = pages().find(q => path.relative(APP, q).split(path.sep).join("/") === nom)
      expect(p, `${nom} : page déclarée introuvable — dérogation à retirer`).toBeTruthy()
      expect(derogationTenue(sansCommentaires(source(p!)), nom, porteursDeMain(p!)), nom).toEqual([])
    }
  })

  it("…et cette dérogation sait crier : contre-épreuve", () => {
    // Une dérogation qui ne crie jamais ressemble à une dérogation qui tient.
    const nom = "[slug]/page.tsx"
    const src = sansCommentaires(source(laPagePubliee()))
    const vrais = porteursDeMain(laPagePubliee())
    expect(derogationTenue(src, nom, vrais), "la vraie page tient").toEqual([])

    // 1. Le `return` de sortie retiré : les deux branches se rendraient ensemble.
    const j = src.indexOf("return", src.indexOf(BRANCHES_EXCLUSIVES[nom].condition))
    const sansSortie = src.slice(0, j) + src.slice(j + "return".length)
    expect(sansSortie, "la mutation n'a pas pris").not.toBe(src)
    expect(derogationTenue(sansSortie, nom, vrais).length, "une sortie disparue doit crier").toBeGreaterThan(0)

    // 2. Un troisième porteur apparu : il n'est couvert par aucune dérogation.
    expect(derogationTenue(src, nom, [...vrais, "app/[slug]/UnTroisieme.tsx"].sort()).length,
      "un porteur de plus doit crier").toBeGreaterThan(0)
  })

  it("il suit encore le client d'une page : la page publiée", () => {
    const publique = pages().find(p => p.includes(`${path.sep}[slug]${path.sep}`))!
    expect(sansCommentaires(fs.readFileSync(publique, "utf8")), "son fichier de page n'en a pas").not.toMatch(/<main[\s>]/)
    // Au lot v156 c'était « son client », au singulier. La page publiée en a
    // maintenant DEUX — la page vivante et l'écran de pause — et c'est l'un OU
    // l'autre. On lit donc la dérogation déclarée plus haut, dont les deux tests
    // précédents vérifient qu'elle est encore vraie, plutôt que de réécrire ici
    // une seconde liste qui divergerait de la première en silence.
    const nom = path.relative(APP, publique).split(path.sep).join("/")
    expect(BRANCHES_EXCLUSIVES[nom], `${nom} : dérogation introuvable`).toBeTruthy()
    expect(porteursDeMain(publique), "ses branches clientes le portent, et elles seules")
      .toEqual([...BRANCHES_EXCLUSIVES[nom].porteurs].sort())
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
