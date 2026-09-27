import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// ─────────────────────────────────────────────────────────────────────────────
// CIBLES AU POUCE — ce que ce fichier fait, et ce qu'il ne fait pas.
//
// ── La phrase qu'il fallait retirer (lot v186) ──────────────────────────────
//
// Cet en-tête annonçait, depuis des mois :
//
//   « relevé au navigateur (Chromium, 360 px et 390 px, mode tactile), en
//     testant chaque commande avec `elementFromPoint` au centre de sa boîte :
//     le seul test qui dise "ce doigt-là atteint bien CE bouton" »
//
// C'était faux. Ce fichier lit des fichiers source et y cherche des chaînes de
// caractères ; `elementFromPoint` n'apparaissait que dans cette phrase. Il ne
// pouvait dire d'aucun doigt qu'il atteint quoi que ce soit.
//
// Le 27 septembre, la mesure réelle — celle qui vit maintenant dans
// `e2e/ciblesAuPouce.spec.ts` — a trouvé **117 commandes sous 44 px** sur le
// site public, dont l'EN-TÊTE ENTIER, plafonné à 32 px par `.qf-entete a`, une
// règle plus spécifique que la primitive. Pendant ce temps ce fichier était au
// vert : il vérifie que le TEXTE de `.ui-btn--sm` dit 44 px, et le texte le
// disait. Une garde qui lit du CSS ne peut pas voir quelle règle gagne.
//
// Une garde qui décrit une méthode qu'elle n'applique pas est pire qu'une garde
// absente : elle rend confiant.
//
// ── Ce que ce fichier est, honnêtement ─────────────────────────────────────
//
// Un REGISTRE des correctifs déjà posés, chacun épinglé à sa source, pour qu'on
// ne les défasse pas sans s'en apercevoir. Ce n'est pas un balayage : il ne voit
// que les endroits qu'on a pensé à y écrire. Le balayage, lui, se fait au
// navigateur sur les 53 pages du sitemap.
//
// S'y ajoute, en fin de fichier, la seule chose qu'une lecture de source fasse
// mieux qu'un navigateur : vérifier qu'aucune règle ne CONTREDIT le plancher —
// c'est exactement le défaut qui a échappé à tout le monde ici.
//
// Ce qui était mesuré avant ces corrections :
//   /examples            filtres métier ......................  32 px de haut
//   /features            styles Classic / Gold / Neon ........  28 px
//   /generateur-qr-code  pastilles de couleur ................  36 × 36
//   /upgrade             interrupteur Mensuel / Annuel .......  44 × 24
//   /creer + /dashboard/templates  favori ...................  38 × 38
//                                  Aperçu / Utiliser ........  38 px de haut
//                                  Filtrer ..................  37 px
//   éditeur (barre du haut)  Retour ..........................  30 × 24
//                            Annuler / Rétablir ..............  28 × 28
//                            Modèles .........................  32 × 24
//   guide de l'éditeur       pastilles d'étape ...............  14 × 40
//
// 44 px est le minimum tenable au pouce ; 24 px le plancher absolu (WCAG 2.5.8)
// réservé aux commandes qui doublent une action déjà disponible en grand.
//
// Ce nombre ne s'écrit plus ici : il est déclaré une seule fois, dans
// `globals.css`, sous le nom `--cible-pouce`. Il l'était auparavant à DEUX
// endroits, 44 dans ce fichier et 32 dans la règle `.qf-entete` — et c'est le
// 32 qui gagnait. Un nombre recopié dérive comme une population recopiée.
// ─────────────────────────────────────────────────────────────────────────────

const ici = dirname(fileURLToPath(import.meta.url))
const lire = (...p: string[]) => readFileSync(join(ici, ...p), "utf8")

describe("tout ce qui se tape au pouce fait au moins 44 px", () => {
  it("les filtres métier d'Exemples ne font plus 32 px", () => {
    const css = lire("examples", "page.tsx")
    const regle = css.split("\n").find(l => l.includes(".filter-btn {"))
    expect(regle, "règle .filter-btn introuvable").toBeTruthy()
    expect(regle).toContain("min-height:44px")
  })

  it("les styles de QR de la page Fonctionnalités ne font plus 28 px", () => {
    const src = lire("features", "page.tsx")
    // La garde citait le style en ligne d'un bouton devenu `<ButtonLink>` au lot
    // v182. Ce qu'elle veut — 44 px au pouce — est maintenant tenu par la
    // primitive elle-même : sa plus petite taille est passée de 38 à 44 px dans
    // le même lot, parce qu'elle était sous le plancher que le produit s'impose.
    // On vérifie donc les deux : la page utilise la primitive, et la primitive
    // tient 44.
    expect(src).toContain("<ButtonLink")
    const css = lire("globals.css")
    expect(css).toMatch(/\.ui-btn--sm \{[^}]*min-height: 44px/)
    expect(css).toMatch(/\.ui-btn--md \{[^}]*min-height: 4[6-9]px/)
  })

  it("les pastilles de couleur du générateur font 44 px", () => {
    const src = lire("generateur-qr-code", "GeneratorClient.tsx")
    expect(src).not.toContain("width: 36, height: 36")
    expect(src.match(/width: 44, height: 44/g)?.length ?? 0).toBeGreaterThanOrEqual(3)
    // Les segments Style et Correction d'erreur montaient à 40 : 44 aussi.
    expect(src).not.toContain("flex: 1, minHeight: 40,")
  })

  it("l'interrupteur annuel de la page Tarifs se tape sur 44 px", () => {
    const src = lire("upgrade", "page.tsx")
    // Le dessin reste 44 × 24 ; c'est le bouton porteur qui fait 44 × 44.
    expect(src).toContain('width: 44, height: 44, margin: "-10px 0"')
    expect(src).toContain('role="switch"')
  })

  it("les commandes des cartes de modèles font 44 px sur téléphone", () => {
    const src = lire("dashboard", "templates", "page.tsx")
    expect(src).toContain("width: isMobile ? 44 : 32, height: isMobile ? 44 : 32")   // favori (32 px sur PC depuis le lot P2)
    expect(src).toContain('{ flex: "none", width: 44, minHeight: 44')                // Aperçu
    expect(src.match(/minHeight: isMobile \? 44 : undefined/g)?.length ?? 0).toBe(2)  // Utiliser (libre + verrouillé)
    expect(src).toContain("gap: 9, minHeight: 44")                                    // Filtrer
  })

  it("la barre du haut de l'éditeur se tape au pouce sur téléphone", () => {
    const src = lire("dashboard", "builder", "BuilderV4.tsx")
    expect(src).toContain("{ width: 44, height: 44, fontSize: 19 }")                   // Retour
    // 40 px au pouce ; 32 px à la souris depuis P2-14 (elles faisaient 28 px).
    expect(src.match(/width: isMobile \? 40 : 32, height: isMobile \? 40 : 32/g)?.length ?? 0).toBe(2)
    expect(src).toContain("{ minHeight: 40, justifyContent: \"center\" }")             // Modèles
    // La barre mesure 50 px sur téléphone (56 sur PC, comme la coquille) : assez haute pour ces cibles.
    expect(src).toContain("style={{ height: isMobile ? 50 : 56, background: \"var(--bg)\"")
  })

  it("« Publier » ne descend pas sous 44 px sur téléphone", () => {
    const css = lire("globals.css")
    const i = css.indexOf(".da-btn-primary--sm { padding")
    expect(i, "classe .da-btn-primary--sm introuvable").toBeGreaterThan(-1)
    const suite = css.slice(i, i + 460)
    expect(suite).toMatch(/@media \(max-width: 1024px\) \{\s*\.da-btn-primary--sm \{ min-height: 44px; \}/)
  })

  it("les mentions de réassurance cliquables de l'accueil font 44 px", () => {
    const src = lire("HomeClient.tsx")
    // « Chiffré » et « Hébergé en Europe » mènent à /security : 15 px de haut.
    expect(src).toContain('const stLien: React.CSSProperties = { ...st, minHeight: 44, margin: "-14px 0" }')
    expect(src).toContain('<Link key={t} href={href} style={stLien}')
  })

  it("le nom de la page garde sa place dans la barre de l'éditeur", () => {
    const src = lire("dashboard", "builder", "BuilderV4.tsx")
    // Le vide extensible partageait la place restante avec le champ du nom :
    // 33 px de large sur un écran de 360 px, soit trois lettres visibles.
    expect(src).toContain('{!isMobile && <div style={{ flex: 1 }} />}')
    expect(src).not.toMatch(/\n {10}<div style=\{\{ flex: 1 \}\} \/>/)
    // « ou partir d'un modèle de page complet » : 14 px de haut.
    expect(src).toContain('style={{ width: "100%", minHeight: 44, display: "flex"')
  })

  it("les appels à l'action de la page Fonctionnalités font 44 px", () => {
    // Trois styles en ligne étaient cités ici. Les trois boutons sont passés sur
    // la primitive au lot v182 ; leur hauteur ne s'écrit plus sur la page, elle
    // vient de `.ui-btn`. La garde vérifie donc la source réelle de la hauteur,
    // et qu'il ne reste aucune hauteur écrite à la main sous 44 px.
    const src = lire("features", "page.tsx")
    expect(src).toContain("<ButtonLink")
    for (const h of src.match(/minHeight:\s*(\d+)/g) ?? []) {
      expect(Number(h.split(":")[1]), `hauteur ${h} sous le plancher du pouce`).toBeGreaterThanOrEqual(44)
    }
  })

  it("les pastilles d'étape du guide font au moins 24 px de large", () => {
    const src = lire("dashboard", "builder", "BuilderWelcome.tsx")
    expect(src).toContain("width: 24, minWidth: 24, height: 40")
    // Elles ne doivent pas se toucher : 4 px d'écart au minimum.
    expect(src).toContain('<div style={{ display: "flex", gap: 4 }}>')
  })
})


// ─────────────────────────────────────────────────────────────────────────────
// LE PLANCHER, ET CE QUI LE CONTREDIT
//
// La partie qu'une lecture de source fait mieux qu'un navigateur : un navigateur
// dit ce qui est rendu SUR LES PAGES VISITÉES ; le fichier de styles dit ce qui
// est écrit, y compris pour des écrans qu'aucun test n'ouvre.
// ─────────────────────────────────────────────────────────────────────────────

const CSS = () => lire("globals.css").replace(/\/\*[\s\S]*?\*\//g, "")

/** Le plancher, lu là où il est déclaré — jamais recopié dans une assertion. */
export function plancherDuPouce(): number {
  const m = CSS().match(/--cible-pouce:\s*(\d+)px/)
  expect(m, "le jeton --cible-pouce a disparu de globals.css").not.toBeNull()
  return Number(m![1])
}

/**
 * Un sélecteur qui vise une COMMANDE (et pas un bloc d'affichage).
 *
 * On reconnaît l'élément interactif dans le sélecteur, ou le mot `btn` dans une
 * classe. Ce n'est pas une liste de sélecteurs connus : c'est une forme, donc
 * une règle écrite demain est couverte sans qu'on y pense.
 */
export function viseUneCommande(sel: string): boolean {
  return /(^|[\s>+~])(a|button|summary)(\s*[:.[]|\s|$)/.test(sel) || /btn/.test(sel) || /\[role="button"\]/.test(sel)
}

/** Les règles qui posent une hauteur en dur sous le plancher, sur une commande. */
export function contradictions() {
  const out: { sel: string; prop: string; px: number }[] = []
  const plancher = plancherDuPouce()
  for (const m of CSS().matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const d of m[2].matchAll(/(min-height|height)\s*:\s*(\d+(?:\.\d+)?)px/g)) {
      const px = parseFloat(d[2])
      if (px >= plancher) continue
      for (const sel of m[1].split(",").map(x => x.trim()).filter(Boolean)) {
        if (viseUneCommande(sel)) out.push({ sel, prop: d[1], px })
      }
    }
  }
  return out
}

/**
 * Les deux exceptions, nommées et motivées.
 *
 * Un bouton-icône ne porte pas de libellé : il double toujours une action
 * disponible ailleurs en grand, ce qui est précisément le cas que WCAG 2.5.8
 * autorise à descendre jusqu'à 24 px. Ils vivent dans les surfaces denses du
 * tableau de bord ; la mesure au navigateur confirme qu'aucun n'apparaît sous
 * le plancher sur le site public.
 */
const DEROGATIONS: Record<string, string> = {
  ".da-btn-icon": "bouton-icône dense, double une action libellée ailleurs (≥ 24 px, WCAG 2.5.8)",
  ".da-btn-icon--lg": "idem, taille intermédiaire",
}

describe("le plancher du pouce est dit une seule fois, et rien ne le contredit", () => {
  it("le jeton existe et vaut 44", () => {
    expect(plancherDuPouce()).toBe(44)
  })

  it("aucun autre endroit ne redit le plancher avec un autre nombre", () => {
    // Le défaut de ce lot : `.qf-entete` annonçait « 32 px est la règle interne »
    // à côté d'un fichier qui disait 44. Les deux étaient sincères.
    const css = CSS()
    const declarations = [...css.matchAll(/--cible-pouce:\s*(\d+)px/g)].map(m => m[1])
    expect(declarations, "le plancher est déclaré plusieurs fois").toHaveLength(1)
  })

  it("aucune règle ne pose une commande sous le plancher", () => {
    const fautives = contradictions()
      .filter(c => !(c.sel in DEROGATIONS))
      .map(c => `${c.sel} → ${c.prop}: ${c.px}px`)
    expect(
      fautives,
      "une règle place une commande sous le plancher du pouce ; si c'est voulu, inscrivez-la dans DEROGATIONS avec sa raison",
    ).toEqual([])
  })

  it("aucune dérogation ne survit à la règle qu'elle excusait", () => {
    // Sans ceci, le registre grossit et ne se vide jamais : une dérogation
    // devenue inutile est une porte laissée ouverte.
    const presentes = new Set(contradictions().map(c => c.sel))
    const mortes = Object.keys(DEROGATIONS).filter(s => !presentes.has(s))
    expect(mortes, "dérogation sans règle correspondante — retirez-la").toEqual([])
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  it("une règle fautive serait vue", () => {
    expect(viseUneCommande(".qf-entete a")).toBe(true)
    expect(viseUneCommande("header button")).toBe(true)
    expect(viseUneCommande(".ui-btn--sm")).toBe(true)
    expect(viseUneCommande("summary")).toBe(true)
  })

  it("un bloc d'affichage n'est pas pris pour une commande", () => {
    // Le pendant : sans ça, la garde crierait sur toutes les cartes du produit.
    expect(viseUneCommande(".ex-card")).toBe(false)
    expect(viseUneCommande(".skeleton")).toBe(false)
    expect(viseUneCommande(".qf-tile")).toBe(false)
  })

  it("le relevé n'est pas vide (sinon il ne prouve rien)", () => {
    // `contradictions()` doit trouver les dérogations elles-mêmes : si elle ne
    // trouve plus rien, c'est peut-être que l'extraction ne lit plus le CSS.
    expect(contradictions().length).toBeGreaterThan(0)
  })
})
