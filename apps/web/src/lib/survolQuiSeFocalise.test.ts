// Ce qui n'apparaît qu'au survol n'existe ni au clavier ni au doigt — garde de classe.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F10, second volet). La
// revue le dit en une phrase : « L'aperçu doit être disponible autrement qu'au
// seul survol. » Le produit a bien un aperçu — un encart qui s'ouvre à côté de
// la ligne du catalogue et montre ce que le bloc donnera. Il s'ouvre ainsi :
//
//     onMouseEnter={e => { …; showPopover(type, e) }}
//     onMouseLeave={…  hidePopover() }}
//
// Et **seulement ainsi.** Pas de `onFocus`. Sur un téléphone ou une tablette il
// n'y a pas de survol : l'aperçu n'existe pas. Au clavier, on tabule sur la
// ligne, on l'entend annoncée, et l'aperçu ne vient jamais. C'est le critère
// WCAG 1.4.13 (Content on Hover or Focus).
//
// **Dix endroits révélaient quelque chose au seul survol. Aucun n'avait de
// contrepartie au focus.** Et trois ne révélaient pas une infobulle : des
// COMMANDES.
//
//   BuilderV4 (plan)          la barre d'actions d'un bloc et sa poignée :
//                             dupliquer, masquer, supprimer, déplacer — quatre
//                             commandes qui n'apparaissaient qu'à la souris.
//   ImageUpload               la croix qui retire une image de la bibliothèque.
//   InsertBetweenBlocks       le « + » qui insère un bloc entre deux autres.
//
// Une infobulle qu'on ne voit pas est une gêne. Une commande qu'on ne voit pas
// n'existe pas.
//
// La classe : **ce qui apparaît au survol apparaît aussi au focus.**
//
// Ce qui n'en est pas : un survol qui change une couleur, une ombre, une
// échelle. Il ne révèle rien — il souligne ce qui est déjà là, et le focus a
// déjà son propre trait (`:focus-visible`, `globals.css`). La règle les écarte
// par leur forme : ils ne touchent qu'à `e.currentTarget`.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function fichiers(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

/** Le texte complet d'une balise ouvrante, accolades et chaînes respectées. */
function balises(src: string): { ligne: number; tag: string; texte: string }[] {
  const out: { ligne: number; tag: string; texte: string }[] = []
  const re = /<([A-Za-z][\w.]*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    let i = re.lastIndex, prof = 0, fin = -1
    const stop = Math.min(src.length, i + 6000)
    while (i < stop) {
      const c = src[i]
      if (c === "{") prof++
      else if (c === "}") prof--
      else if ((c === '"' || c === "'" || c === "`") && prof === 0) {
        const q = c; i++
        while (i < src.length && src[i] !== q) { if (src[i] === "\\") i++; i++ }
      } else if (c === ">" && prof === 0) { fin = i; break }
      i++
    }
    if (fin < 0) continue
    out.push({ ligne: src.slice(0, m.index).split("\n").length, tag: m[1], texte: src.slice(m.index, fin + 1).replace(/\n/g, " ") })
  }
  return out
}

/** Le survol touche un élément qu'il ne possède pas : il révèle. */
const REVELE_AILLEURS = /querySelector|nextElementSibling|previousElementSibling|parentElement|\.children\[/
const CACHABLE = /opacity|display|visibility/

/**
 * …ou il pose un état que le rendu lit pour décider d'afficher autre chose.
 * L'état est cherché dans TOUT le fichier : il passe souvent par une variable
 * intermédiaire (`const shown = mobile || active`).
 */
function etatQuiRevele(handler: string, fichier: string): string | null {
  const m = /\b(?:set([A-Z]\w*)|show([A-Z]\w*))\(/.exec(handler)
  if (!m) return null
  const brut = m[1] ?? m[2]
  const etat = brut[0].toLowerCase() + brut.slice(1)
  // Le test porte sur un RENDU conditionné, pas sur une couleur : `{x && <`,
  // `{x ? <`, ou la même chose via une variable intermédiaire (`const shown =
  // mobile || active`). Un `background: chaud ? a : b` ne révèle rien.
  const gates = [etat]
  const inter = new RegExp(`const (\\w+) = [^\\n]*\\b${etat}\\b`, "g")
  for (const m of fichier.matchAll(inter)) gates.push(m[1])
  const lu = gates.some(g =>
    new RegExp(`\\{\\s*${g}\\s*&&\\s*[(<]`).test(fichier)
    || new RegExp(`\\{\\s*${g}\\s*\\?\\s*[(<]`).test(fichier)
    || new RegExp(`\\{\\s*${g}\\b[^\\n{}]{0,50}&&\\s*[(<]`).test(fichier))
  return lu ? etat : null
}

/**
 * La carte des pays. Son infobulle de survol ne porte AUCUNE information qui ne
 * soit déjà dans le tableau juste en dessous — « Pays · Vues · Scans », douze
 * lignes, lisible au clavier comme au doigt. La carte est une seconde vue des
 * mêmes chiffres, pas leur seul accès : WCAG 1.4.13 ne s'applique pas à un
 * contenu qui existe ailleurs sous une forme atteignable.
 *
 * Et un tracé SVG de `react-simple-maps` n'est pas focusable : lui poser un
 * `tabIndex` ajouterait cent quatre-vingts arrêts de tabulation avant le
 * tableau — le remède serait pire.
 */
const DEJA_AILLEURS: Record<string, string> = {
  "app/dashboard/analytics/GeoPanel.tsx": "les mêmes chiffres sont dans le tableau « Pays · Vues · Scans » sous la carte",
}

type Survol = { fichier: string; ligne: number; tag: string; pourquoi: string; auFocus: boolean }

function survolsQuiRevelent(): Survol[] {
  const out: Survol[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    const src = fs.readFileSync(f, "utf8")
    for (const b of balises(src)) {
      const i = b.texte.indexOf("onMouseEnter=")
      if (i < 0) continue
      const handler = b.texte.slice(i, i + 300)
      let pourquoi = ""
      if (REVELE_AILLEURS.test(handler) && CACHABLE.test(handler)) pourquoi = "révèle un élément voisin"
      else {
        const e = etatQuiRevele(handler, src)
        if (e) pourquoi = `pose « ${e} », que le rendu lit`
      }
      if (!pourquoi) continue
      if (rel in DEJA_AILLEURS) continue
      out.push({ fichier: rel, ligne: b.ligne, tag: b.tag, pourquoi, auFocus: b.texte.includes("onFocus=") })
    }
  }
  return out
}

describe("ce qui compte comme une révélation", () => {
  it("un survol qui ne touche que son propre élément ne révèle rien", () => {
    const decoratif = 'onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)" }}'
    expect(REVELE_AILLEURS.test(decoratif)).toBe(false)
    expect(etatQuiRevele(decoratif, "")).toBeNull()
  })

  it("…mais toucher un voisin pour le rendre visible, oui", () => {
    const h = 'onMouseEnter={e => { const b = e.currentTarget.querySelector(".del") as HTMLElement; if (b) b.style.opacity = "1" }}'
    expect(REVELE_AILLEURS.test(h) && CACHABLE.test(h)).toBe(true)
  })

  it("…et poser un état que le rendu lit, aussi — même par une variable intermédiaire", () => {
    const fichier = 'const [active, setActive] = useState(false)\nconst shown = mobile || active\n{shown && <button>+</button>}'
    expect(etatQuiRevele("onMouseEnter={() => setActive(true)}", fichier)).toBe("active")
    // Un état qui ne sert qu'à peindre n'est pas une révélation.
    expect(etatQuiRevele("onMouseEnter={() => setChaud(true)}", "background: chaud")).toBeNull()
  })
})

describe("garde de classe : le focus voit ce que le survol montre", () => {
  // Lot v165 : ce balayage lit tout l'arbre du produit. Seul, il prend deux
  // secondes ; dans la suite complète, sur une machine chargée, il dépassait le
  // délai par défaut et la suite tombait — alors que rien n'était cassé. Un
  // délai explicite vaut mieux qu'un test qui échoue selon l'humeur de la
  // machine : une garde qui flanche au hasard cesse d'être crue.
  it("chaque survol qui révèle a sa contrepartie au focus", () => {
    const muets = survolsQuiRevelent().filter(s => !s.auFocus)
    expect(muets.map(s => `${s.fichier}:${s.ligne} <${s.tag}> — ${s.pourquoi}`),
      "ajouter onFocus / onBlur à côté de onMouseEnter / onMouseLeave").toEqual([])
  }, 60_000)

  it("l'aperçu du catalogue s'ouvre au focus, dans ses deux listes", () => {
    const v4 = lire("app/dashboard/builder/BuilderV4.tsx")
    expect((v4.match(/onFocus=\{e => showPopover\(type, e\)\} onBlur=\{hidePopover\}/g) ?? []),
      "la liste par catégorie et la liste de recherche").toHaveLength(2)
    expect(v4, "et il accepte les deux sortes d'événement")
      .toContain("showPopover = useCallback((type: string, e: React.MouseEvent | React.FocusEvent)")
  })

  it("les trois COMMANDES du relevé s'atteignent au clavier", () => {
    const v4 = lire("app/dashboard/builder/BuilderV4.tsx")
    expect(v4, "la barre d'actions d'un bloc et sa poignée").toContain("onFocus={e => commandesDuBloc(e.currentTarget, true)}")
    expect(v4, "et le geste est écrit une fois").toContain("const commandesDuBloc = useCallback(")
    expect(lire("app/dashboard/builder/ImageUpload.tsx"), "la croix d'une image").toMatch(/onFocus=\{e => \{ const b = e\.currentTarget\.querySelector\("\.del"\)/)
    expect(lire("app/dashboard/builder/InsertBetweenBlocks.tsx"), "le « + » d'insertion").toContain("onFocus={() => setActive(true)}")
  })

  it("quitter vers un enfant ne referme pas ce qu'on vient d'atteindre", () => {
    // Tabuler du cadre vers son bouton « Dupliquer » émet un blur sur le cadre :
    // sans ce contrôle, la barre disparaîtrait au moment de l'atteindre.
    for (const f of ["app/dashboard/builder/BuilderV4.tsx", "app/dashboard/builder/ImageUpload.tsx", "app/dashboard/builder/InsertBetweenBlocks.tsx"])
      expect(lire(f), f).toContain("contains(e.relatedTarget as Node)")
  })

  it("la carte des pays est nommée, et son tableau existe vraiment", () => {
    expect(Object.keys(DEJA_AILLEURS)).toEqual(["app/dashboard/analytics/GeoPanel.tsx"])
    const geo = lire("app/dashboard/analytics/GeoPanel.tsx")
    expect(geo, "le tableau qui porte les mêmes chiffres").toContain('["Pays", "Vues", "Scans", ""]')
    expect(geo, "et il en montre douze lignes").toContain("byCountry.slice(0, 12)")
  })

  it("le balayage voit bien les survols — sinon il ne prouve rien", () => {
    let survols = 0
    for (const f of fichiers()) survols += (fs.readFileSync(f, "utf8").match(/onMouseEnter=/g) ?? []).length
    expect(survols, "des survols dans le produit").toBeGreaterThan(60)
    const reveles = survolsQuiRevelent()
    expect(reveles.length, "dont une poignée qui révèlent").toBeGreaterThan(6)
    expect(reveles.length, "et la grande majorité qui ne font que peindre").toBeLessThan(survols / 2)
  })
})
