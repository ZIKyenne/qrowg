// Ce qui se clique s'atteint au clavier — garde de classe.
//
// Relevé du 20 septembre. Le produit pose **cent cinq** `onClick` sur des
// éléments qui ne sont pas des commandes — `<div>`, `<span>`, `<p>`, `<img>`.
// Un tel élément n'entre pas dans l'ordre de tabulation et ne répond ni à
// Entrée ni à Espace : au clavier, il n'existe pas.
//
// Le produit connaît le geste, et il dit pourquoi
// (`lib/useFermetureModale.carteCliquable`) :
//
//     « Rend une carte cliquable utilisable au clavier, sans en faire un
//       <button> (impossible ici : ces cartes contiennent déjà des boutons
//       imbriqués). »
//
// Il l'avait écrit pour les trois fiches de « Créer un QR », et il y est resté.
// Une garde antérieure avait fait le même constat sur une seule tuile —
// « un `<div onClick>` : la fenêtre existait, s'annonçait modale, et personne
// au clavier ne pouvait l'ouvrir » (`fenetreQuiEnEstUne.test.ts`).
//
// **Vingt-quatre éléments restaient inatteignables.** Cinq sont de vraies
// commandes et prennent le geste :
//
//   assets/page:184,202        les vignettes de la bibliothèque de fichiers
//   avatar/AvatarStudio:279    le choix d'un modèle d'avatar
//   builder/ImageUpload:131    la zone « déposez une image »
//   domains/DnsChecker:184     la ligne de diagnostic qui se déplie
//
// La classe : **ce qui se clique s'atteint au clavier.**
//
// **Trois frontières, écrites comme des règles et non comme des passe-droits.**
// Un voile de fermeture n'a pas à être atteignable : la veille (lot v139) lui a
// donné Échap, qui est la sortie clavier d'une couche. Un canevas d'édition a
// son propre modèle — les flèches déplacent, Suppr supprime, Échap désélectionne
// — et transformer chaque élément dessiné en bouton annoncerait des dizaines de
// commandes sans donner le moyen de les atteindre ; la vraie réponse est une
// liste des éléments, une décision de produit et non un correctif mécanique. Et
// une primitive qui transmet le `onClick` qu'on lui passe ne décide de rien :
// c'est son appelant qui répond.
//
// **Deux restent, nommées, avec ce qu'il faudrait faire.** Une action secondaire
// vit À L'INTÉRIEUR d'un bouton : « Corriger » dans l'indicateur de lisibilité,
// la croix qui vide les filtres de la galerie. Un bouton dans un bouton n'est
// pas du HTML valide, et l'action interne n'est atteignable d'aucune façon. Les
// sortir demande de changer la mise en page — le parent devient une carte
// (`carteCliquable`) et l'action devient un vrai `<button>` à côté. Ce lot ne le
// fait pas ; il les nomme, et vérifie que la liste ne grossit pas.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { carteCliquable } from "./useFermetureModale"

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

/**
 * Un canevas d'édition a son propre modèle clavier — flèches, Suppr, Échap —
 * décrit dans `builder/raccourcisClavier.ts` et `builder/builderCanvas.ts`.
 * Chaque bloc dessiné n'est pas une commande de plus : c'est un objet d'un
 * plan. Lui poser `role="button"` annoncerait des dizaines de commandes sans
 * donner le moyen de les parcourir.
 */
const CANEVAS: Record<string, string> = {
  "app/dashboard/builder/BuilderV4.tsx": "plan de l'éditeur : sélection au clavier par raccourcis, pas par tabulation",
  "app/dashboard/builder/MobileBuilderShell.tsx": "le même plan, sur téléphone",
  "app/dashboard/print-studio/PrintStudioClient.tsx": "mise en page libre : les flèches déplacent l'élément sélectionné",
}

/** Une primitive qui transmet le `onClick` qu'on lui passe ne décide de rien. */
const TRANSMET: Record<string, string> = {
  "components/SmartImage.tsx": "reçoit `onClick` en propriété et le repasse à l'`<img>` : c'est l'appelant qui répond",
}

/**
 * Une action secondaire posée DANS un bouton. Le HTML l'interdit et le clavier
 * ne l'atteint pas. La sortir change la mise en page : le parent devient une
 * carte (`carteCliquable`), l'action un vrai `<button>` à côté.
 */
const DANS_UN_BOUTON: Record<string, string> = {
  "app/dashboard/qr-codes/QRStudioZero.tsx": "« Corriger » dans l'indicateur de lisibilité",
  "app/dashboard/templates/page.tsx": "la croix qui vide les filtres, dans le bouton « Filtrer »",
}

const NON_COMMANDE = /<(div|span|p|li|section|article|img|h[1-6]|td|tr|label|a)\b/g

/** Le texte complet d'une balise ouvrante, accolades et chaînes respectées. */
function balises(src: string): { ligne: number; tag: string; texte: string }[] {
  const out: { ligne: number; tag: string; texte: string }[] = []
  NON_COMMANDE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = NON_COMMANDE.exec(src)) !== null) {
    let i = NON_COMMANDE.lastIndex, prof = 0, fin = -1
    const stop = Math.min(src.length, i + 4000)
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

/** Un voile de fermeture : la veille lui a donné Échap, qui EST sa sortie clavier. */
function estUnVoile(t: string): boolean {
  return /position\s*:\s*['"](?:fixed|absolute)['"]/.test(t) && /inset\s*:\s*['"]?0/.test(t)
}

const ATTEIGNABLE = /role="(button|link|tab|option|menuitem|switch|checkbox|radio)"|tabIndex|carteCliquable|onKeyDown|onKeyUp|aria-hidden/

type Clic = { fichier: string; ligne: number; texte: string }

function clicsSansClavier(): { tous: Clic[]; muets: Clic[] } {
  const tous: Clic[] = [], muets: Clic[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    const src = fs.readFileSync(f, "utf8")
    for (const b of balises(src)) {
      if (!/\bonClick=/.test(b.texte)) continue
      if (b.tag === "a" && /\bhref=/.test(b.texte)) continue
      tous.push({ fichier: rel, ligne: b.ligne, texte: b.texte.slice(0, 95) })
      if (ATTEIGNABLE.test(b.texte)) continue
      if (estUnVoile(b.texte)) continue
      // Un `onClick` qui ne fait qu'arrêter la propagation n'agit sur rien :
      // c'est le cadre d'une fenêtre, pas une commande.
      if (/onClick=\{\(?e\)?\s*=>\s*e\.stopPropagation\(\)\}/.test(b.texte)) continue
      if (rel in CANEVAS || rel in TRANSMET || rel in DANS_UN_BOUTON) continue
      muets.push({ fichier: rel, ligne: b.ligne, texte: b.texte.slice(0, 95) })
    }
  }
  return { tous, muets }
}

describe("le geste que le produit avait déjà écrit", () => {
  it("`carteCliquable` rend une carte atteignable et activable", () => {
    let fait = 0
    const p = carteCliquable(() => { fait++ })
    expect(p.role).toBe("button")
    expect(p.tabIndex, "elle entre dans l'ordre de tabulation").toBe(0)
    for (const key of ["Enter", " "]) {
      let empeche = false
      p.onKeyDown({ key, preventDefault: () => { empeche = true } } as unknown as React.KeyboardEvent)
      expect(empeche, `${key} ne fait pas défiler la page à la place`).toBe(true)
    }
    expect(fait, "Entrée et Espace font ce que le clic fait").toBe(2)
    p.onKeyDown({ key: "a", preventDefault: () => {} } as unknown as React.KeyboardEvent)
    expect(fait, "et une lettre ne déclenche rien").toBe(2)
  })

  it("et il dit pourquoi il n'en fait pas un `<button>`", () => {
    expect(lire("lib/useFermetureModale.ts")).toContain("ces cartes contiennent déjà des boutons imbriqués")
  })
})

describe("garde de classe : plus rien ne se clique sans s'atteindre", () => {
  it("aucun élément cliquable n'est hors de portée du clavier", () => {
    const { muets } = clicsSansClavier()
    expect(muets.map(c => `${c.fichier}:${c.ligne} — ${c.texte}`),
      "passer par `carteCliquable`, ou en faire un vrai `<button>`").toEqual([])
  })

  it("les cinq commandes du relevé portent le geste, nommément", () => {
    for (const [f, morceau] of [
      ["app/dashboard/assets/page.tsx", 'className="dam-card" {...carteCliquable(() => toggleSel(a))} aria-pressed={isSel(a)}'],
      ["app/dashboard/avatar/AvatarStudio.tsx", "{...carteCliquable(() => set({ index: i }))}"],
      ["app/dashboard/builder/ImageUpload.tsx", "{...carteCliquable(() => setPickerOpen(true))}"],
      ["app/dashboard/domains/DnsChecker.tsx", "...carteCliquable(() => setExpanded(isOpen ? null : check.id)), \"aria-expanded\": isOpen"],
    ] as const) expect(lire(f), f).toContain(morceau)
    // La seconde vignette de la bibliothèque, en liste plutôt qu'en grille.
    expect((lire("app/dashboard/assets/page.tsx").match(/carteCliquable\(\(\) => toggleSel\(a\)\)/g) ?? []),
      "la grille ET la liste").toHaveLength(2)
  })

  it("une ligne sans détail ne devient pas une fausse commande", () => {
    // `hasDetail` est faux : rien à déplier, donc rien à annoncer ni à focuser.
    expect(lire("app/dashboard/domains/DnsChecker.tsx")).toContain("{...(hasDetail ? { ...carteCliquable(")
  })

  it("les trois frontières sont des règles écrites, et ne grossissent pas", () => {
    expect(Object.keys(CANEVAS).sort()).toEqual([
      "app/dashboard/builder/BuilderV4.tsx",
      "app/dashboard/builder/MobileBuilderShell.tsx",
      "app/dashboard/print-studio/PrintStudioClient.tsx",
    ])
    expect(Object.keys(TRANSMET)).toEqual(["components/SmartImage.tsx"])
    // Le canevas a bien un modèle clavier à lui — sinon la frontière serait un alibi.
    const r = lire("app/dashboard/builder/raccourcisClavier.ts")
    expect(r).toContain('t.key === "Escape"')
    expect(r).toMatch(/action: "supprimerBloc"/)
    expect(lire("app/dashboard/builder/builderCanvas.ts")).toContain("resolveCanvasShortcut")
    // La primitive transmet vraiment, elle ne décide pas.
    expect(lire("components/SmartImage.tsx")).toContain("onClick={onClick}")
  })

  it("les deux actions coincées dans un bouton sont nommées, et restent deux", () => {
    expect(Object.keys(DANS_UN_BOUTON).sort()).toEqual([
      "app/dashboard/qr-codes/QRStudioZero.tsx",
      "app/dashboard/templates/page.tsx",
    ])
    for (const f of Object.keys(DANS_UN_BOUTON)) {
      expect(lire(f), `${f} : l'action est toujours là, et toujours dans le bouton`)
        .toMatch(/<span onClick=\{\(?e\)? => \{ ?e\.stopPropagation\(\)/)
    }
  })

  it("le balayage voit bien les clics — sinon il ne prouve rien", () => {
    const { tous } = clicsSansClavier()
    expect(tous.length, "des éléments non-commande cliquables dans le produit").toBeGreaterThan(80)
    expect(new Set(tous.map(c => c.fichier)).size).toBeGreaterThan(20)

    // Le détecteur sait dire oui — sinon il ne dirait jamais non.
    const nu = '<div onClick={() => toggleSel(a)} style={{ borderRadius: 14 }}>'
    expect(/\bonClick=/.test(nu) && !ATTEIGNABLE.test(nu) && !estUnVoile(nu)).toBe(true)
    // …et non à ce qui porte déjà le geste.
    const porte = '<div {...carteCliquable(() => toggleSel(a))} style={{ borderRadius: 14 }}>'
    expect(ATTEIGNABLE.test(porte)).toBe(true)
    // …et il lit la balise entière, pas la ligne : le `onClick` d'un enfant
    // n'est pas celui du parent.
    const parent = balises('<div style={{ gap: 8 }}>\n  <button onClick={f}>Oui</button>\n</div>')[0]
    expect(/\bonClick=/.test(parent.texte), "la balise du parent s'arrête à son propre `>`").toBe(false)
  })
})
