import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join, extname, basename } from "node:path"

// primitivesGardees — la garde qui manquait en juillet.
//
// ── Ce qu'elle existe pour empêcher ────────────────────────────────────────
//
// Trois audits mobiles (13, 14 et 15 juillet 2026) ont produit
// `components/mobile/` : designTokens, BottomSheet, MobileDock, BigSlider,
// ColorPicker, et onze moteurs purs testés. Le 5 octobre, aucun de ces fichiers
// n'existait plus. Une refonte les a emportés, et pas un test n'a rougi — parce
// qu'aucun ne disait « cet écran doit utiliser cette feuille ».
//
// Un test d'EXISTENCE n'aurait rien changé : il se satisfait d'un fichier vide.
// Celle-ci vérifie l'USAGE.
//
// ── Et ce qu'elle a trouvé le jour où elle a été écrite ────────────────────
//
// Dix tests e2e du builder mobile étaient rouges, et personne ne les lançait.
// Le banc affichait « ⚠️ Une erreur est survenue » dès qu'on ouvrait un
// panneau : `MobileBottomSheet` plaçait `if (!open) return null` AVANT
// `useCallback` et `useDialogue`. Trois hooks fermée, cinq ouverte — React
// refuse. Ouvrir un panneau dans l'éditeur mobile faisait tomber l'écran.
//
// Le dépôt n'a AUCUNE configuration ESLint (un `eslint --fix` traîne dans la
// configuration lint-staged, sans que l'outil soit installé), donc
// `react-hooks/rules-of-hooks` n'a jamais rien dit. D'où le troisième bloc
// ci-dessous : il ne remplace pas ESLint, il ferme la porte par laquelle on
// vient de passer.

const RACINE = join(__dirname, "..", "..")
const relatif = (f: string) => f.replace(RACINE, "").split("\\").join("/")

function* sources(dossier: string): Generator<string> {
  const entrees = readdirSync(dossier, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  for (const e of entrees) {
    const f = join(dossier, e.name)
    if (e.isDirectory()) { if (e.name === "node_modules") continue; yield* sources(f) }
    else if ([".ts", ".tsx"].includes(extname(e.name))) yield f
  }
}

const estTest = (f: string) => /\.test\.|\.spec\./.test(f)
const TOUS = [...sources(RACINE)]
const PRODUCTION = TOUS.filter(f => !estTest(f))

describe("les primitives mobiles sont utilisées, pas seulement présentes", () => {
  const dossierMobile = join(RACINE, "components", "mobile")
  const primitives = readdirSync(dossierMobile).sort()
    .filter(n => [".ts", ".tsx"].includes(extname(n)) && !estTest(n))
    .map(n => basename(n, extname(n)))
    .sort()

  it("il y a bien des primitives à défendre", () => {
    // Sans cette borne, supprimer le dossier rendrait la garde muette — très
    // exactement ce qui s'est passé en juillet.
    expect(primitives.length).toBeGreaterThan(0)
    expect(primitives).toContain("MobileSheet")
    expect(primitives).toContain("feuilleMobile")
  })

  // Deux règles, et pas une seule : la première version exigeait que CHAQUE
  // primitive soit importée depuis l'extérieur du dossier. Elle a immédiatement
  // accusé `feuilleMobile` — le moteur pur que `MobileSheet` consomme, et c'est
  // exactement son rôle. Une règle qui interdit la composition interne pousse à
  // tout aplatir dans un seul fichier.
  const importePar = (p: string, fichiers: string[]) =>
    fichiers.some(f => {
      const src = readFileSync(f, "utf8")
      return src.includes(`components/mobile/${p}`) || src.includes(`"./${p}"`) || src.includes(`'./${p}'`)
    })

  it("aucune primitive n'est orpheline", () => {
    const orphelines = primitives.filter(p => !importePar(p, PRODUCTION.filter(f => !f.endsWith(`${p}.ts`) && !f.endsWith(`${p}.tsx`))))
    expect(
      orphelines,
      "primitive que personne n'importe : soit elle sert, soit elle part. " +
      "C'est celle-là que la prochaine refonte supprimera sans bruit.",
    ).toEqual([])
  })

  it("le dossier est atteint depuis la production, pas seulement de l'intérieur", () => {
    // La vraie protection : un dossier `components/mobile/` entièrement
    // auto-référent serait mort sans qu'aucun test ne le dise. C'est, au mot
    // près, ce qui est arrivé aux primitives de juillet.
    const dehors = PRODUCTION.filter(f => !f.includes(join("components", "mobile")))
    const atteintes = primitives.filter(p => importePar(p, dehors))
    expect(
      atteintes.length,
      "aucune primitive mobile n'est importée par un écran : le dossier ne sert à rien.",
    ).toBeGreaterThan(0)
  })
})

describe("une seule implémentation de feuille montante", () => {
  // Reconnaître une feuille par sa FORME, pas par son nom : chercher
  // « MobileBottomSheet » ne trouvait que deux fichiers et m'a fait écrire que
  // la feuille « ne servait qu'à un écran ». En cherchant la forme — une
  // surface ancrée en bas, positionnée, pleine largeur, qui se comporte en
  // dialogue — il y en avait HUIT.
  const ressembleAUneFeuille = (src: string) =>
    /bottom:\s*0/.test(src) &&
    /position:\s*["']?(fixed|absolute)/.test(src) &&
    /aria-modal|role="dialog"|useDialogue/.test(src) &&
    /left:\s*0\b/.test(src) && /right:\s*0\b/.test(src)

  // Inventaire gelé le 5 octobre 2026. DETTE : cette liste n'a le droit que de
  // raccourcir. Chaque écran migré vers `MobileSheet` en retire une ligne.
  const HERITAGE = [
    "/app/dashboard/builder/BuilderV4.tsx",
    "/app/dashboard/print-studio/PrintStudioClient.tsx",
    "/app/dashboard/qr-codes/QRStudio.tsx",
    "/app/dashboard/templates/TemplatePreviewModal.tsx",
    "/components/EnTeteSite.tsx",
    "/components/MobileNav.tsx",          // barre de navigation, pas une feuille
    "/components/mobile/MobileSheet.tsx", // LA primitive
  ]
  const COMPTE_AU_5_OCTOBRE = HERITAGE.length

  const trouvees = PRODUCTION.filter(f => ressembleAUneFeuille(readFileSync(f, "utf8"))).map(relatif)

  it("la garde voit bien quelque chose", () => {
    expect(trouvees.length).toBeGreaterThan(0)
  })

  it("aucune nouvelle surface ancrée en bas n'est apparue", () => {
    const nouvelles = trouvees.filter(f => !HERITAGE.includes(f))
    expect(
      nouvelles,
      "nouvelle feuille écrite à la main : utilisez `components/mobile/MobileSheet`. " +
      "Cinq écrans ont déjà chacun la leur, avec cinq verrous de défilement différents.",
    ).toEqual([])
  })

  it("le compte ne remonte pas", () => {
    expect(trouvees.length).toBeLessThanOrEqual(COMPTE_AU_5_OCTOBRE)
  })
})

describe("aucun hook appelé après un retour anticipé", () => {
  // La règle de React : un composant appelle le MÊME nombre de hooks à chaque
  // rendu. `if (!open) return null` placé avant un `useCallback` la viole, et
  // le composant tombe dès que la condition change.
  //
  // ── Ce que cette garde attrape, et ce qu'elle laisse passer ──────────────
  //
  // Elle lit les accolades pour suivre la profondeur. Elle signale un appel de
  // hook au PREMIER niveau du corps d'une fonction, situé après un `return` du
  // premier niveau, ou après un `return` contenu dans un `if` d'une seule
  // ligne — les deux formes qui produisent le défaut.
  //
  // Elle NE lit PAS le code : une chaîne de caractères contenant « return »
  // pourrait la tromper, et un retour anticipé caché dans une construction plus
  // tordue lui échapperait. Ce n'est pas ESLint, et je ne le prétends pas.
  // C'est la porte par laquelle on vient de passer, fermée.

  /**
   * Commentaires et chaînes remplacés par des espaces, longueurs conservées.
   *
   * Sans cela, la garde lisait le mot « return » DANS un commentaire et
   * accusait un fichier qu'on venait de réparer. Une garde qui accuse à tort
   * est pire qu'une garde absente : on apprend à la contourner.
   *
   * Limite connue et assumée : une expression régulière littérale contenant
   * une accolade (`/\{/`) tromperait le compteur de profondeur. Ce dépôt n'en
   * a pas dans un corps de composant, et traiter ce cas demanderait un vrai
   * analyseur — ce que ce fichier ne prétend pas être.
   */
  const sansCommentairesNiChaines = (src: string): string => {
    const out = src.split("")
    let i = 0
    const blanchir = (de: number, a: number) => { for (let k = de; k < a && k < out.length; k++) if (out[k] !== "\n") out[k] = " " }
    while (i < src.length) {
      const c = src[i], d = src[i + 1]
      if (c === "/" && d === "/") { let j = src.indexOf("\n", i); if (j < 0) j = src.length; blanchir(i, j); i = j; continue }
      if (c === "/" && d === "*") { let j = src.indexOf("*/", i + 2); j = j < 0 ? src.length : j + 2; blanchir(i, j); i = j; continue }
      if (c === '"' || c === "'" || c === "`") {
        let j = i + 1
        while (j < src.length) {
          if (src[j] === "\\") { j += 2; continue }
          if (src[j] === c) { j++; break }
          j++
        }
        blanchir(i + 1, j - 1)
        i = j; continue
      }
      i++
    }
    return out.join("")
  }

  const hooksApresRetour = (source: string): string[] => {
    const src = sansCommentairesNiChaines(source)
    const soucis: string[] = []
    const regexComposant = /(?:export\s+)?function\s+([A-Z]\w*)\s*\(/g
    let m: RegExpExecArray | null
    while ((m = regexComposant.exec(src))) {
      // La liste de paramètres d'abord : `function F({ open })` ouvre une
      // accolade de DÉSTRUCTURATION, pas le corps. La première version de ce
      // détecteur prenait l'une pour l'autre et ne voyait rien — c'est la
      // contre-épreuve de ce fichier qui l'a dit, pas moi.
      let i = m.index + m[0].length - 1      // sur la parenthèse ouvrante
      let parens = 0
      for (; i < src.length; i++) {
        if (src[i] === "(") parens++
        else if (src[i] === ")") { parens--; if (parens === 0) { i++; break } }
      }
      const ouvrante = src.indexOf("{", i)
      if (ouvrante < 0) continue
      let profondeur = 0
      let retourVu = -1
      for (let i = ouvrante; i < src.length; i++) {
        const c = src[i]
        if (c === "{") { profondeur++; continue }
        if (c === "}") { profondeur--; if (profondeur === 0) break; continue }
        if (profondeur !== 1) continue
        if (retourVu < 0 && src.startsWith("return", i) && /\s/.test(src[i - 1] ?? " ")) retourVu = i
        if (retourVu >= 0 && i > retourVu) {
          const reste = src.slice(i, i + 40)
          const h = /^\buse[A-Z]\w*\s*\(/.exec(reste)
          if (h) soucis.push(`${m[1]} — ${h[0].trim()} après un retour anticipé`)
        }
      }
    }
    return soucis
  }

  it("la garde reconnaît le défaut qu'elle vient de corriger", () => {
    // Contre-épreuve : la forme exacte de l'ancien `MobileBottomSheet`.
    const fautif = `
export function Feuille({ open }) {
  const r = useRef(null)
  if (!open) return null
  const f = useCallback(() => {}, [])
  return <div />
}`
    expect(hooksApresRetour(fautif).length).toBeGreaterThan(0)
  })

  it("elle ne crie pas sur un composant normal", () => {
    const sain = `
export function Feuille({ open }) {
  const r = useRef(null)
  const f = useCallback(() => {}, [])
  if (!open) return null
  return <div />
}`
    expect(hooksApresRetour(sain)).toEqual([])
  })

  it("aucun composant du dépôt n'appelle de hook après un retour anticipé", () => {
    const soucis: string[] = []
    for (const f of PRODUCTION) {
      if (extname(f) !== ".tsx") continue
      for (const s of hooksApresRetour(readFileSync(f, "utf8"))) soucis.push(`${relatif(f)} :: ${s}`)
    }
    expect(soucis, soucis.join("\n")).toEqual([])
  })
})
