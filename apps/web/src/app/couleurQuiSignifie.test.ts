// couleurQuiSignifie — lot v191.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Revue du 27 septembre, relevé au navigateur sur les 54 pages : **53 teintes
// distinctes hors gris et hors or**. La charte du produit est noire et or.
//
// En les regardant une par une, la plupart avaient une raison :
//
//   • le vert et le rouge disent « inclus » et « pas inclus », « ça marche » et
//     « ça casse » — c'est de la couleur SÉMANTIQUE ;
//   • les pastilles du studio QR sont des choix de couleur : leur teinte est le
//     CONTENU du bouton, pas sa décoration ;
//   • les vignettes de modèles portent le vrai thème du modèle.
//
// Le défaut était ailleurs : **la couleur employée comme décor.**
//
//   • Sur `/features`, quatre chiffres portaient quatre couleurs — vert, bleu,
//     or, violet. Pourquoi « Vues » en bleu et « QR actifs » en violet ? Aucune
//     raison. De la couleur parce que de la couleur.
//   • Sur l'accueil, chaque métier imposait sa teinte à TOUTE l'interface :
//     l'onglet, la bordure de carte, le badge, l'étiquette. Orange pour
//     Restaurant, violet pour Artiste, rose pour Événement. Le site changeait
//     d'identité à chaque clic.
//
// ── La règle posée ─────────────────────────────────────────────────────────
//
// **L'habillage du PRODUIT reste à la charte. Ce qui appartient au commerçant
// garde ses couleurs.**
//
// La maquette de téléphone dans la section des métiers garde donc l'orange du
// restaurant : c'est l'aperçu de SA page, et c'est vrai. L'onglet qui la
// sélectionne, lui, est doré : c'est une commande du produit.
//
// C'est la même frontière que le lot v182 (« le produit ne pose pas son or sur
// la page de ses clients ») et que le lot v188 pour les icônes — prise dans
// l'autre sens.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

/** Le dossier `app/` : les dossiers visés vivent dessous, pas sous `src/`. */
const SRC = path.resolve(__dirname)

/** Une teinte franche : ni gris, ni presque-noir, ni presque-blanc. */
export function estChromatique(hex: string): boolean {
  const h = hex.replace("#", "")
  const n = h.length === 3 ? h.split("").map(c => parseInt(c + c, 16)) : [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  const [r, g, b] = n.map(v => v / 255)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  const l = (mx + mn) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (s < 0.25 || l < 0.12 || l > 0.92) return false
  // L'or de la charte, et ses voisins.
  let teinte = 0
  if (d) {
    if (mx === r) teinte = ((g - b) / d) % 6
    else if (mx === g) teinte = (b - r) / d + 2
    else teinte = (r - g) / d + 4
  }
  teinte = (Math.round(teinte * 60) + 360) % 360
  return !(teinte >= 30 && teinte <= 58)
}

/**
 * Les emplois LÉGITIMES d'une teinte franche, nommés et motivés.
 *
 * Ce n'est pas une liste de fichiers tolérés : c'est la liste de ce qui, dans
 * ce produit, a le droit de ne pas être doré — parce que la couleur y porte un
 * sens ou appartient au commerçant.
 */
const EMPLOIS: Record<string, string> = {
  "homeSections/UseCases.tsx":
    "la maquette de téléphone montre la page du commerçant, avec SA couleur ; l'habillage autour est doré",
  "homeSections/QRStudioLive.tsx":
    "les pastilles sont des choix de couleur : la teinte est le contenu du bouton",
  "features/page.tsx":
    "les trois styles de QR (Classique, Or, Néon) sont des choix de couleur, et la maquette d'éditeur montre une page de commerçant",
  "homeSections/Templates.tsx":
    "chaque vignette porte le vrai thème de son modèle",
  "homeSections/Analytics.tsx":
    "la maquette de statistiques montre l'écran du commerçant",
  "qr-code/[usage]/page.tsx":
    "le point de douleur est écrit en rouge, la solution en clair : la couleur dit lequel est lequel",
  "outils/testeur-qr-code/TesteurClient.tsx":
    "rouge et vert disent si le QR passe le test",
  "contact/page.tsx":
    "l'orange prévient que le message approche de la limite de caractères",
}

const DOSSIERS = ["homeSections", "features", "examples", "qr-code", "outils", "guides", "contact", "upgrade", "security"]

export function teintesFranches() {
  const out: { fichier: string; ligne: number; hex: string }[] = []
  const fichiers: string[] = []
  ;(function collecte(rel: string) {
    const abs = path.join(SRC, rel)
    if (!fs.existsSync(abs)) return
    if (fs.statSync(abs).isDirectory()) {
      for (const e of fs.readdirSync(abs).sort()) collecte(path.join(rel, e))
    } else if (/\.tsx$/.test(rel) && !/\.test\./.test(rel)) fichiers.push(rel.split(path.sep).join("/"))
  })("")
  for (const rel of fichiers) {
    // Chemins en barres obliques, toujours : `path.join` en rend des
    // inverses sous Windows, et le relèvé ne reconnaissait alors AUCUN
    // dossier — il lisait zéro fichier et se déclarait content. Une garde
    // aveugle ne garde rien ; c'est le premier test de ce fichier qui le dit.
    const dossier = rel.split("/")[0]
    if (rel !== "HomeClient.tsx" && !DOSSIERS.includes(dossier)) continue
    const src = fs.readFileSync(path.join(SRC, rel), "utf8")
    src.split("\n").forEach((l, i) => {
      for (const m of l.matchAll(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g)) {
        if (estChromatique(m[0])) out.push({ fichier: rel, ligne: i + 1, hex: m[0] })
      }
    })
  }
  return out
}

describe("la couleur dit quelque chose, ou elle n'est pas là", () => {
  it("le relevé trouve des teintes (sinon il est aveugle)", () => {
    const t = teintesFranches()
    expect(t.length, "aucune teinte franche trouvée — l'extraction ne lit plus les fichiers").toBeGreaterThan(5)
  })

  it("le tri sait distinguer une teinte franche d'un neutre", () => {
    for (const h of ["#A78BFA", "#F97316", "#F43F5E", "#39FF8F", "#2563EB"]) expect(estChromatique(h), h).toBe(true)
    for (const h of ["#F5F0E8", "#080808", "#8A8478", "#A7A69F", "#151210", "#fff"]) expect(estChromatique(h), h).toBe(false)
    // L'or de la charte n'est pas une entorse à la charte.
    for (const h of ["#C9A84C", "#D4AF45"]) expect(estChromatique(h), h).toBe(false)
  })

  it("chaque teinte franche est dans un emploi écrit", () => {
    const hors = teintesFranches()
      .filter(x => !(x.fichier in EMPLOIS))
      .map(x => `${x.fichier}:${x.ligne} → ${x.hex}`)
    expect(
      hors,
      "une teinte franche apparaît hors d'un emploi écrit ; si elle a une raison, inscrivez-la dans EMPLOIS, sinon employez var(--accent)",
    ).toEqual([])
  })

  it("aucun emploi écrit n'est devenu inutile", () => {
    // Sans ça, le registre ne fait que grossir — et un registre qui ne se vide
    // jamais finit par autoriser tout.
    const presents = new Set(teintesFranches().map(x => x.fichier))
    const morts = Object.keys(EMPLOIS).filter(f => !presents.has(f))
    expect(morts, "emploi sans teinte correspondante — retirez-le du registre").toEqual([])
  })

  // ── Contre-épreuve ──────────────────────────────────────────────────────

  it("une teinte posée dans un fichier non inscrit serait vue", () => {
    const faux = { fichier: "outils/page.tsx", ligne: 1, hex: "#7C3AED" }
    expect(estChromatique(faux.hex)).toBe(true)
    expect(faux.fichier in EMPLOIS).toBe(false)
  })
})
