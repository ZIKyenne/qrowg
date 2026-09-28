// policeDeTitre — lot v195.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Le code réclamait « Fraunces » pour chaque titre du produit — 37 fois, écrit
// à la main. Et `globals.css` renvoyait ce nom, par @font-face, vers
// `inter-latin.woff2` : le fichier de la police de CORPS.
//
// Autrement dit : le produit n'avait qu'**un seul dessin**, du titre du héros
// au pied de page. Une hiérarchie typographique qui ne tient que par la taille
// et la graisse — et c'est l'un des traits qui font dire « ça a été généré ».
//
// L'alias était une décision assumée (une seule requête réseau). Elle a
// simplement cessé d'être relue : personne ne voyait plus, en lisant
// `fontFamily: "Fraunces, serif"`, que rien de tout cela n'arrivait.
//
// ── Ce que le lot a fait ───────────────────────────────────────────────────
//
// Les titres du produit lisent `var(--police-titre)`, déclaré une seule fois
// dans `:root`, et qui pointe vers 'Lora' — déjà self-hostée pour les thèmes
// commerçants, donc aucun fichier nouveau.
//
// L'alias « Fraunces » RESTE, mais du seul côté commerçant : c'est le défaut de
// `theme.fontDisplay`, et le retirer renverrait les pages publiées sans police
// déclarée vers la police système du visiteur. C'est la frontière des lots v182
// (« le produit ne pose pas son or sur la page de ses clients »), v188 et v191,
// prise une fois de plus.
//
// ── Ce que cette garde tient ───────────────────────────────────────────────
//
// Elle ne compte pas des occurrences : elle tient l'INTENTION — qu'une police
// de titre reste une police de titre. Le cœur est le test « ne résout pas vers
// le fichier du corps » : c'est le défaut exact, et il se vérifie sur la source
// du produit, pas sur une liste écrite à la main.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const SRC = path.resolve(__dirname, "..")
const CSS = fs.readFileSync(path.join(SRC, "app/globals.css"), "utf8")
const FONTS = path.resolve(SRC, "../public/fonts")

// ── Lecture de la feuille de style ─────────────────────────────────────────

/** Toutes les @font-face : famille → fichiers source déclarés. */
export function familles(): Map<string, string[]> {
  const m = new Map<string, string[]>()
  for (const b of CSS.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)) {
    const nom = b[1].match(/font-family\s*:\s*['"]([^'"]+)['"]/)?.[1]
    const src = b[1].match(/src\s*:\s*url\(\s*['"]?([^'")]+)/)?.[1]
    if (!nom || !src) continue
    m.set(nom, [...(m.get(nom) ?? []), src])
  }
  return m
}

/** La plage de graisses déclarée pour une famille (la plus large des @font-face). */
export function graisses(famille: string): [number, number] | null {
  let min = Infinity, max = -Infinity
  for (const b of CSS.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)) {
    if (b[1].match(/font-family\s*:\s*['"]([^'"]+)['"]/)?.[1] !== famille) continue
    const g = b[1].match(/font-weight\s*:\s*(\d+)(?:\s+(\d+))?/)
    if (!g) continue
    min = Math.min(min, +g[1]); max = Math.max(max, +(g[2] ?? g[1]))
  }
  return max < 0 ? null : [min, max]
}

/** La première famille nommée par un jeton de :root. */
export function premiereFamille(jeton: string): string | null {
  const v = CSS.match(new RegExp(`${jeton}\\s*:\\s*([^;]+);`))?.[1]
  return v?.trim().match(/^['"]([^'"]+)['"]/)?.[1] ?? null
}

/** La famille que `body` emploie : la police du corps, lue et non écrite. */
export function familleDuCorps(): string | null {
  const b = CSS.match(/\nbody\s*\{([\s\S]*?)\}/)?.[1]
  return b?.match(/font-family\s*:\s*['"]([^'"]+)['"]/)?.[1] ?? null
}

// ── Lecture du code du produit ─────────────────────────────────────────────

/**
 * Le périmètre : l'habillage du PRODUIT.
 *
 * Tout ce qui appartient au commerçant en sort — sa page publiée, les thèmes,
 * les modèles, le studio d'impression, le sélecteur de police du QR Studio.
 * Une police y est un CHOIX du commerçant, pas une décision du produit.
 *
 * `dashboard/templates/page.tsx` sort aussi : ce sont des données de thèmes.
 * C'est l'inverse de l'exception du lot v194 sur le même fichier — là-bas on
 * visait son rendu, ici ses données. Le périmètre suit ce qu'on mesure.
 */
const HORS_PERIMETRE = [
  "app/[slug]/PublicPageClient.tsx",
  "app/[slug]/renduLegacy.tsx",
  "app/[slug]/og/route.tsx",
  "app/dashboard/builder/",
  "app/dashboard/print-studio/",
  "app/dashboard/templates/TemplatePreviewModal.tsx",
  "app/dashboard/templates/page.tsx",
  "app/dashboard/qr-codes/QRStudio.tsx",
  "app/dashboard/qr-codes/supportsImprimables.ts",
  "app/e2e-harness/",
  "app/globals.css",
]

export function fichiersDuProduit(): string[] {
  const out: string[] = []
  ;(function walk(d: string) {
    for (const e of fs.readdirSync(path.join(SRC, d), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const rel = d ? `${d}/${e.name}` : e.name
      if (e.isDirectory()) walk(rel)
      else if (/\.(tsx|ts|css)$/.test(e.name)) out.push(rel)
    }
  })("")
  return out.filter(r => !/\.test\./.test(r) && !HORS_PERIMETRE.some(x => r.startsWith(x)))
}

/**
 * Les familles de TITRAGE : celles que le dépôt self-héberge pour les thèmes,
 * plus « Fraunces », le nom historique. Les familles de CORPS ('Inter',
 * 'DM Sans', 'JetBrains Mono') n'en font pas partie — ce lot ne les vise pas,
 * et les inclure ferait crier la garde sur du code parfaitement sain.
 */
export function famillesDeTitrage(): string[] {
  const corps = new Set([familleDuCorps(), "DM Sans", "JetBrains Mono"])
  return [...familles().keys()].filter(f => !corps.has(f))
}

/**
 * Les emplois LÉGITIMES d'une famille de titrage nommée en clair, motivés.
 *
 * Ce n'est pas une liste de fichiers tolérés : c'est ce qui, dans ce produit, a
 * le droit de porter son propre nom de police. Le test « aucun emploi n'est
 * devenu faux » vérifie la raison, pas seulement le nom du fichier.
 */
const EMPLOIS: Record<string, string> = {
  "components/IntroOverlay.tsx":
    "animation d'intro entièrement auto-contenue (CSS scopé sous #qw-intro, @font-face inclus) et qu'AUCUNE page ne rend — vitrineCalme l'interdit sur l'accueil",
}

/** Toute déclaration de police, dans le produit, qui nomme une famille de titrage. */
export function policesNommeesALaMain() {
  const cibles = famillesDeTitrage()
  const out: { fichier: string; ligne: number; extrait: string }[] = []
  for (const rel of fichiersDuProduit()) {
    if (rel in EMPLOIS) continue
    const src = fs.readFileSync(path.join(SRC, rel), "utf8")
    src.split("\n").forEach((l, i) => {
      // Une DÉCLARATION de police, pas une mention en commentaire ou en donnée.
      for (const m of l.matchAll(/(?:fontFamily\s*:|font-family\s*:)\s*([^,;\n}]*(?:,[^;\n}]*)*)/g)) {
        const valeur = m[1]
        for (const f of cibles) {
          if (valeur.includes(f)) out.push({ fichier: rel, ligne: i + 1, extrait: l.trim().slice(0, 110) })
        }
      }
    })
  }
  return out
}

/** Les graisses écrites dans un objet de style qui emploie --police-titre. */
export function graissesDesTitres() {
  const out: { fichier: string; poids: number }[] = []
  for (const rel of fichiersDuProduit()) {
    if (!/\.tsx$/.test(rel)) continue
    const src = fs.readFileSync(path.join(SRC, rel), "utf8")
    let i = 0
    while ((i = src.indexOf("var(--police-titre)", i)) !== -1) {
      // Les bornes de l'objet de style : on remonte au `{` non apparié, on
      // redescend jusqu'à son pendant. Jamais une fenêtre de N caractères —
      // c'est l'aveuglement des lots v182, v185, v187 et v189.
      let d = 0, a = i
      while (a > 0) { a--; if (src[a] === "}") d++; else if (src[a] === "{") { if (d === 0) break; d-- } }
      let e = 0, b = i
      while (b < src.length) { if (src[b] === "{") e++; else if (src[b] === "}") { if (e === 0) break; e-- } b++ }
      for (const g of src.slice(a, b).matchAll(/fontWeight\s*:\s*(\d+)/g)) out.push({ fichier: rel, poids: +g[1] })
      i = b
    }
  }
  return out
}

describe("la police des titres en est une", () => {
  it("le relevé lit bien la feuille et le code (sinon il est aveugle)", () => {
    expect(familles().size, "plus aucune @font-face lue").toBeGreaterThan(10)
    expect(fichiersDuProduit().length, "plus aucun fichier dans le périmètre").toBeGreaterThan(40)
    expect(graissesDesTitres().length, "plus aucun titre employant le jeton").toBeGreaterThan(20)
    expect(famillesDeTitrage().length, "plus aucune famille de titrage reconnue").toBeGreaterThan(5)
  })

  it("le jeton --police-titre est déclaré, une seule fois", () => {
    const n = [...CSS.matchAll(/--police-titre\s*:/g)].length
    expect(n, `--police-titre déclaré ${n} fois ; une famille écrite deux fois finit par diverger`).toBe(1)
    expect(premiereFamille("--police-titre"), "--police-titre ne nomme aucune famille").toBeTruthy()
  })

  it("la police des titres ne résout PAS vers le fichier de la police du corps", () => {
    // Le défaut de ce lot, en une ligne. Tant que ce test passe, le produit a
    // deux dessins ; le jour où il casse, il n'en a plus qu'un — et personne ne
    // le verrait à la lecture, puisque le code dirait toujours « titre ».
    const titre = premiereFamille("--police-titre")!
    const corps = familleDuCorps()!
    const fT = familles().get(titre) ?? []
    const fC = familles().get(corps) ?? []
    expect(fT.length, `la famille « ${titre} » n'a aucune @font-face`).toBeGreaterThan(0)
    expect(fC.length, `la famille de corps « ${corps} » n'a aucune @font-face`).toBeGreaterThan(0)
    const communs = fT.filter(x => fC.includes(x))
    expect(
      communs,
      `« ${titre} » et « ${corps} » partagent un fichier : la police de titre est un alias de la police de corps`,
    ).toEqual([])
  })

  it("le fichier de la police des titres existe vraiment", () => {
    const titre = premiereFamille("--police-titre")!
    for (const src of familles().get(titre)!) {
      const f = path.join(FONTS, path.basename(src))
      expect(fs.existsSync(f), `${src} déclaré mais absent de public/fonts`).toBe(true)
      expect(fs.statSync(f).size, `${src} est vide`).toBeGreaterThan(1000)
    }
  })

  it("la police des titres couvre le français", () => {
    // Les accents, l'œ, les guillemets et l'apostrophe typographique. Sans ça,
    // un titre retomberait caractère par caractère sur la police système — et
    // le défaut ne se verrait que sur les mots accentués.
    const titre = premiereFamille("--police-titre")!
    const plages = [...CSS.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)]
      .filter(b => b[1].match(/font-family\s*:\s*['"]([^'"]+)['"]/)?.[1] === titre)
      .map(b => b[1].match(/unicode-range\s*:\s*([^;]+);/)?.[1] ?? "")
      .join(",")
    for (const [nom, plage] of [
      ["les accents latins (é à ç ù ô)", "U+0000-00FF"],
      ["la ligature œ", "U+0152-0153"],
      ["l'apostrophe typographique et les tirets", "U+2000-206F"],
    ]) {
      expect(plages, `${titre} ne déclare pas ${nom}`).toContain(plage)
    }
  })

  it("aucun titre n'écrit une graisse que la police ne sait pas dessiner", () => {
    // Un 800 écrit pour une police qui plafonne à 700 est ramené en silence par
    // le navigateur : le nombre au code ne dit plus ce qui s'affiche. Le plafond
    // est LU dans la @font-face, jamais recopié ici.
    const titre = premiereFamille("--police-titre")!
    const g = graisses(titre)
    expect(g, `« ${titre} » ne déclare aucune graisse`).not.toBeNull()
    const [min, max] = g!
    const hors = graissesDesTitres()
      .filter(x => x.poids < min || x.poids > max)
      .map(x => `${x.fichier} → ${x.poids} (${titre} : ${min}–${max})`)
    expect([...new Set(hors)], "une graisse écrite sort de ce que la police sait dessiner").toEqual([])
  })

  it("aucun fichier du produit ne nomme une police de titre à la main", () => {
    const hors = policesNommeesALaMain().map(x => `${x.fichier}:${x.ligne} → ${x.extrait}`)
    expect(
      hors,
      "une famille de titre écrite dans un composant ; employez var(--police-titre)",
    ).toEqual([])
  })

  it("aucun emploi écrit n'est devenu faux", () => {
    // Un registre qui ne se vérifie jamais finit par tout autoriser. Chaque
    // emploi doit encore porter une famille de titrage — et, pour IntroOverlay,
    // la raison elle-même doit rester vraie : le composant n'est rendu nulle
    // part. Le jour où on le branche, sa police devient une police du produit.
    const morts: string[] = []
    for (const f of Object.keys(EMPLOIS)) {
      const abs = path.join(SRC, f)
      if (!fs.existsSync(abs)) { morts.push(`${f} : fichier disparu`); continue }
      const src = fs.readFileSync(abs, "utf8")
      if (!famillesDeTitrage().some(x => src.includes(x))) morts.push(`${f} : plus aucune famille de titrage`)
    }
    expect(morts, "emploi sans objet — retirez-le du registre").toEqual([])

    const rendus = fichiersDuProduit()
      .filter(r => /\.tsx$/.test(r) && !(r in EMPLOIS))
      .filter(r => /<IntroOverlay\b/.test(fs.readFileSync(path.join(SRC, r), "utf8")))
    expect(rendus, "IntroOverlay est désormais rendu : sa police n'est plus une exception").toEqual([])
  })

  it("l'approche des titres est un jeton, pas un nombre recopié", () => {
    // Elle tient à la police : -0,02em serrait la grotesque, c'est trop pour une
    // serif. Les deux se changent ensemble ou pas du tout.
    const n = [...CSS.matchAll(/--approche-titre\s*:/g)].length
    expect(n, "--approche-titre doit être déclaré une seule fois").toBe(1)
    const sansJeton = graissesDesTitres().length
    expect(sansJeton, "aucun titre ne lit plus le jeton").toBeGreaterThan(20)
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  it("un jeton pointé vers le fichier du corps serait vu", () => {
    const fT = ["/fonts/inter-latin.woff2"]
    const fC = ["/fonts/inter-latin.woff2", "/fonts/inter-latinext.woff2"]
    expect(fT.filter(x => fC.includes(x))).toEqual(["/fonts/inter-latin.woff2"])
  })

  it("une famille de titre écrite à la main serait vue", () => {
    const l = `<h2 style={{ fontFamily: "Lora, serif", fontSize: 44 }}>Titre</h2>`
    const trouve = [...l.matchAll(/(?:fontFamily\s*:|font-family\s*:)\s*([^,;\n}]*(?:,[^;\n}]*)*)/g)]
      .some(m => famillesDeTitrage().some(f => m[1].includes(f)))
    expect(trouve).toBe(true)
  })

  it("la police du CORPS nommée à la main n'est PAS signalée", () => {
    // Le pendant. Sans lui, la garde interdirait du code sain et finirait par
    // être contournée — c'est ce qui est arrivé à `exemplesReels` au lot v190.
    const l = `<p style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Texte</p>`
    const trouve = [...l.matchAll(/(?:fontFamily\s*:|font-family\s*:)\s*([^,;\n}]*(?:,[^;\n}]*)*)/g)]
      .some(m => famillesDeTitrage().some(f => m[1].includes(f)))
    expect(trouve).toBe(false)
  })

  it("une graisse hors plage serait vue", () => {
    const faux = [{ fichier: "app/X.tsx", poids: 800 }, { fichier: "app/Y.tsx", poids: 700 }]
    expect(faux.filter(x => x.poids > 700).map(x => x.poids)).toEqual([800])
  })
})
