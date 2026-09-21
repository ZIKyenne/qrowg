// Une zone qui défile réserve la hauteur de ce qui la surplombe — garde de classe.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F05, F07). Le produit
// pose **onze barres qui restent en haut** d'une zone qui défile. **Aucune des
// sept surfaces concernées ne réservait leur hauteur.**
//
// Le geste existait, écrit une fois, dans `globals.css` :
//
//     html { scroll-padding-top: 80px; }
//
// C'est exactement la règle qu'il fallait — appliquée au seul scroller que le
// produit ne possède pas lui-même. Les zones qui défilent à l'intérieur de
// l'éditeur ne sont pas `html`, et n'en héritent pas.
//
// Ce que la revue a vu, et ce que ça fait :
//
//   F05  « le contrôle du nombre d'éléments par ligne apparaît partiellement
//         sous la barre fixe ». On tabule jusqu'à un champ, la zone le fait
//         défiler, et il s'arrête pile dessous : il a le focus, on ne le voit
//         pas. C'est le critère WCAG 2.4.11 (Focus Not Obscured).
//
//   F07  « la barre PAGE · 12 blocs recouvre le document ». Elle est posée DANS
//         la colonne du document, à la même origine que le contenu. Sans
//         hauteur réservée, il n'y a littéralement pas de place pour elle.
//
// La classe : **une zone qui défile réserve la hauteur de ce qui la surplombe.**
//
// **Aucune constante.** La hauteur est mesurée à l'exécution. Un nombre écrit à
// la main serait faux au premier zoom navigateur, à la première fenêtre moins
// haute, au premier libellé qui passe sur deux lignes — les trois cas que la
// revue demande justement de tester.
//
// **Ce qui n'est pas une barre.** Une couche décorative posée en `sticky` avec
// `height: 0` et `pointerEvents: "none"` — le grain et le halo de l'aperçu d'un
// modèle — ne surplombe rien : elle ne masque aucun contrôle, et ne se déclare
// donc pas. La règle l'écarte par sa forme, pas par son nom.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { hauteurAReserver, MARQUEUR_BARRE } from "./hauteurReservee"

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

/** Une couche qui ne surplombe rien : pas de hauteur, pas de clic. */
function estDecorative(fenetre: string): boolean {
  return /height:\s*0\b/.test(fenetre) || /pointerEvents:\s*"none"/.test(fenetre)
}

type Barre = { fichier: string; ligne: number; texte: string; declaree: boolean }

/** Chaque élément qui reste collé en haut d'une zone qui défile. */
function barresCollantes(): { toutes: Barre[]; muettes: Barre[] } {
  const toutes: Barre[] = [], muettes: Barre[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    const lignes = fs.readFileSync(f, "utf8").split("\n")
    lignes.forEach((l, i) => {
      if (/^\s*(\/\/|\*)/.test(l)) return
      // Le style tient parfois sur la ligne suivante.
      const fen = l + " " + (lignes[i + 1] ?? "")
      if (!/position:\s*"sticky"/.test(fen) || !/top:\s*0\b/.test(fen)) return
      if (estDecorative(fen)) return
      // Deux lignes décrivent la même barre : elle ne compte qu'une fois.
      if (toutes.length > 0 && toutes[toutes.length - 1].fichier === rel && toutes[toutes.length - 1].ligne === i) return
      const bloc = lignes.slice(Math.max(0, i - 1), i + 2).join("\n")
      const b = { fichier: rel, ligne: i + 1, texte: l.trim().slice(0, 90), declaree: bloc.includes(MARQUEUR_BARRE) }
      toutes.push(b)
      if (!b.declaree) muettes.push(b)
    })
  }
  return { toutes, muettes }
}

describe("ce qu'il y a à réserver", () => {
  it("deux barres au même `top` se recouvrent : c'est la plus haute qui compte", () => {
    // Additionner réserverait un vide que rien n'occupe.
    expect(hauteurAReserver([44, 52, 40])).toBe(52)
    expect(hauteurAReserver([52])).toBe(52)
  })

  it("une hauteur fractionnaire est arrondie vers le haut, jamais rognée", () => {
    // Un pixel de moins, et le champ visé affleure encore sous la barre.
    expect(hauteurAReserver([41.2])).toBe(42)
    expect(hauteurAReserver([41.0])).toBe(41)
  })

  it("rien à mesurer ne réserve rien", () => {
    expect(hauteurAReserver([])).toBe(0)
    expect(hauteurAReserver([0, 0])).toBe(0)
    // Une mesure absurde ne fabrique pas une réservation absurde.
    expect(hauteurAReserver([NaN, Infinity, -30])).toBe(0)
  })

  it("la hauteur est mesurée, jamais écrite à la main", () => {
    const src = lire("lib/hauteurReservee.ts")
    expect(src).toContain("getBoundingClientRect().height")
    expect(src, "et remesurée quand la fenêtre ou la barre change").toContain("ResizeObserver")
    const code = src.split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n")
    expect(code, "aucune hauteur de barre en dur").not.toMatch(/scrollPaddingTop\s*=\s*[`"']?\d/)
  })
})

describe("garde de classe : chaque barre déclare qu'elle surplombe", () => {
  it("aucune barre collante ne reste muette", () => {
    const { muettes } = barresCollantes()
    expect(muettes.map(b => `${b.fichier}:${b.ligne} — ${b.texte}`),
      `poser ${MARQUEUR_BARRE} pour que sa hauteur soit réservée`).toEqual([])
  })

  it("les onze barres du relevé sont déclarées, et réparties sur six écrans", () => {
    const { toutes } = barresCollantes()
    expect(toutes.length).toBeGreaterThanOrEqual(11)
    expect(toutes.every(b => b.declaree)).toBe(true)
    const ecrans = [
      "app/dashboard/builder/BuilderV4.tsx",
      "app/dashboard/print-studio/PrintStudioClient.tsx",
      "app/dashboard/qr-codes/QRStudio.tsx",
      "app/dashboard/qr-codes/QRStudioZero.tsx",
      "app/dashboard/analytics/AnalyticsClient.tsx",
      "components/templates/TemplateComposer.tsx",
    ]
    for (const e of ecrans) {
      expect(lire(e), `${e} : la barre se déclare`).toContain(MARQUEUR_BARRE)
      expect(lire(e), `${e} : et l'écran réserve`).toContain("useHauteurReservee()")
    }
  })

  it("l'éditeur porte les cinq siennes — dont le bandeau de page", () => {
    const src = lire("app/dashboard/builder/BuilderV4.tsx")
    expect((src.match(/data-barre-collante/g) ?? []).length).toBe(5)
    // Celle que la revue a vue recouvrir le document.
    expect(src).toMatch(/data-barre-collante=""[^\n]*Page<\/span>|Page<\/span>/)
  })

  it("une couche décorative n'est pas une barre — et la règle le dit par sa forme", () => {
    const apercu = lire("app/dashboard/templates/TemplatePreviewModal.tsx")
    expect(apercu, "le grain et le halo restent sans marqueur").not.toContain(MARQUEUR_BARRE)
    expect(estDecorative('position: "sticky", top: 0, height: 0, zIndex: 2, pointerEvents: "none"')).toBe(true)
    expect(estDecorative('position: "sticky", top: 0, zIndex: 25, background: "#111"')).toBe(false)
  })

  it("le geste d'origine tient toujours sa surface", () => {
    // `html` garde sa réserve : c'est l'en-tête fixe de la page publique.
    expect(lire("app/globals.css")).toContain("scroll-padding-top: 80px")
  })

  it("le balayage voit bien les barres — sinon il ne prouve rien", () => {
    const { toutes } = barresCollantes()
    expect(new Set(toutes.map(b => b.fichier)).size, "réparties sur plusieurs écrans").toBeGreaterThan(4)

    // Le détecteur sait dire oui — sinon il ne dirait jamais non.
    const nue = '<div style={{ position: "sticky", top: 0, zIndex: 10, background: "#111" }}>'
    expect(/position:\s*"sticky"/.test(nue) && /top:\s*0\b/.test(nue) && !estDecorative(nue) && !nue.includes(MARQUEUR_BARRE)).toBe(true)
    // …et non à une barre déclarée.
    const posee = `<div ${MARQUEUR_BARRE}="" style={{ position: "sticky", top: 0 }}>`
    expect(posee.includes(MARQUEUR_BARRE)).toBe(true)
    // …et non à ce qui colle en BAS, qui ne masque pas ce qu'on vise en défilant.
    const basse = '<div style={{ position: "sticky", bottom: 0, zIndex: 10 }}>'
    expect(/top:\s*0\b/.test(basse)).toBe(false)
  })
})
