// pasDEmojiDecoratif — lot v188.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Mesuré au navigateur le 27 septembre, sur les 54 pages publiques :
// **748 emojis**. Quarante sur la seule page d'accueil, cinquante-deux sur la
// page des usages. Ils ne décoraient pas : ils servaient d'ICÔNES — ⚡ pour
// « éditeur simple », 🔄 pour « QR dynamique », 🍽️ pour « restaurant ».
//
// C'est le premier signal qu'une page a été générée plutôt que dessinée, et
// pour des raisons qui ne sont pas d'humeur :
//
//   • **Un emoji n'est pas dessiné par le produit.** Il vient d'Apple, de Google
//     ou de Microsoft, autrement sur chaque appareil. Une charte noir et or se
//     retrouve avec du rouge, du bleu et du vert qu'elle n'a pas choisis. Le
//     relevé de contraste du lot v187 a d'ailleurs dû les EXCLURE : leur couleur
//     n'obéit à personne, pas même à `color`.
//   • **Il ne tient pas l'échelle** : illisible à 14 px, pixellisé à 44.
//   • **Le produit avait déjà `lucide-react`**, employé dans le tableau de bord
//     mais pas sur le site vitrine.
//
// ── Ce que cette garde tient ───────────────────────────────────────────────
//
// 1. Aucun champ de données du SITE VITRINE ne porte un pictogramme comme
//    icône. Les données nomment un concept (« restaurant », « reservation »),
//    et `components/ui/Icone.tsx` décide du dessin, en un seul endroit.
// 2. Le vocabulaire ne contient pas de nom mort : chaque concept déclaré est
//    employé quelque part, sinon la table enfle et ment.
// 3. Tout nom employé dans les données existe dans le vocabulaire — sinon
//    l'icône ne se dessine pas, en silence.
//
// ── Ce qu'elle ne tient PAS, volontairement ────────────────────────────────
//
// La page publiée d'un commerçant (`app/[slug]/`) et l'éditeur gardent leurs
// pictogrammes : ce sont le CONTENU du commerçant et son catalogue de blocs,
// pas la vitrine du produit. Le lot v182 a déjà posé cette frontière — « le
// produit ne pose pas son or sur la page de ses clients » — et elle vaut dans
// les deux sens.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { ICONES } from "./Icone"

const SRC = path.resolve(__dirname, "../..")

/** Un pictogramme, au sens d'Unicode. */
const PICTO = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u

/**
 * Le SITE VITRINE : ce qu'un inconnu voit avant d'être client.
 *
 * Le tableau de bord, l'éditeur et la page publiée sont dehors — pour la raison
 * écrite plus haut, pas par commodité. Le banc d'essai aussi : il n'est regardé
 * par personne.
 */
function estVitrine(rel: string): boolean {
  // ── Le trou que ce lot a bouché (v193) ───────────────────────────────────
  //
  // Ces deux fichiers vivent dans le dossier de l'éditeur, mais leur champ
  // `emoji` s'affiche sur le SITE PUBLIC : `/examples` et `/creer` lisent le
  // catalogue de modèles. La garde les excluait avec tout `app/dashboard/`.
  //
  // Résultat : le lot v188 a converti les rendus de `/examples` en `<Icone>`
  // sans convertir les données qui les alimentent. `Icone` ne dessine rien sur
  // un nom inconnu — **trente-quatre cartes se sont retrouvées sans icône**, et
  // la garde est restée verte, parce que la donnée fautive était hors de son
  // périmètre alors que son rendu était dedans.
  //
  // Une garde dont le périmètre suit les DOSSIERS plutôt que les CHEMINS DE
  // DONNÉES rate ce genre de chose. Le périmètre suit désormais l'usage.
  if (rel.startsWith("app/dashboard/")) return false
  if (rel.startsWith("app/[slug]/")) return false
  if (rel.startsWith("app/e2e-harness/")) return false
  if (rel.startsWith("app/api/")) return false
  if (/\.test\./.test(rel)) return false
  // Sections retirées de l'accueil : conservées comme archive, rendues nulle
  // part. Une garde qui les compte crie sur ce que personne ne voit.
  if (rel === "app/homeSectionsRetirees.tsx") return false
  // `creer/entry.ts` fabrique les BLOCS de la page d'un commerçant : son
  // contenu s'affiche chez lui, pas sur la vitrine. Même frontière que
  // `app/[slug]/`, pour la même raison.
  if (rel === "app/creer/entry.ts") return false
  return true
}

function fichiers(): string[] {
  const out: string[] = []
  ;(function walk(d: string) {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(tsx|ts)$/.test(e.name)) out.push(p)
    }
  })(SRC)
  return out
}

/**
 * Les champs de données qui nomment une icône.
 *
 * La frontière `\b` n'est pas décorative : sans elle, `ic` attrapait la fin de
 * `fontVariantNumeric: "tabular-nums"` et la garde annonçait un nom d'icône
 * inconnu sur une propriété de typographie. Une garde qui crie à tort s'éteint.
 */
const CHAMP_ICONE = /(?:^|[^A-Za-z])(?:icon|emoji)\s*:\s*"([^"]{1,24})"/g

export function champsIcone() {
  const out: { fichier: string; ligne: number; valeur: string; picto: boolean }[] = []
  for (const abs of fichiers()) {
    const rel = path.relative(SRC, abs).replace(/\\/g, "/")
    if (!estVitrine(rel)) continue
    const src = fs.readFileSync(abs, "utf8")
    let m: RegExpExecArray | null
    const re = new RegExp(CHAMP_ICONE.source, "g")
    while ((m = re.exec(src))) {
      out.push({
        fichier: rel,
        ligne: src.slice(0, m.index).split("\n").length,
        valeur: m[1],
        picto: PICTO.test(m[1]),
      })
    }
  }
  return out
}

/**
 * Les catalogues de modèles : leur champ `emoji` s'affiche sur le SITE PUBLIC
 * (`/examples`, `/creer`) alors que les fichiers vivent dans le dossier de
 * l'éditeur. Seule l'icône DU MODÈLE est concernée — celle qui accompagne son
 * `label`. Les pictogrammes à l'intérieur de ses blocs sont le contenu de la
 * page d'un commerçant, et gardent leur place.
 */
const CATALOGUES = ["app/dashboard/builder/page-templates.ts", "app/dashboard/builder/templatesStudio.ts"]

export function iconesDeModele() {
  const out: { fichier: string; ligne: number; valeur: string; picto: boolean }[] = []
  for (const rel of CATALOGUES) {
    const src = fs.readFileSync(path.join(SRC, rel), "utf8")
    src.split("\n").forEach((l, i) => {
      const m = l.match(/label: "[^"]*", emoji: "([^"]{1,24})"/)
      if (m) out.push({ fichier: rel, ligne: i + 1, valeur: m[1], picto: PICTO.test(m[1]) })
    })
  }
  return out
}

describe("le site vitrine dessine ses icônes, il ne les emprunte pas", () => {
  it("l'icône de chaque modèle est un concept, pas un pictogramme", () => {
    // ── Le trou que ce lot a bouché (v193) ─────────────────────────────────
    //
    // Le lot v188 a converti les RENDUS de `/examples` en `<Icone>` sans
    // convertir les DONNÉES qui les alimentent : le catalogue vit dans le
    // dossier de l'éditeur, que la garde excluait en bloc. `Icone` ne dessine
    // rien sur un nom inconnu — **trente-quatre cartes se sont retrouvées sans
    // icône**, et la garde est restée verte.
    //
    // Une garde dont le périmètre suit les DOSSIERS plutôt que les chemins de
    // DONNÉES rate exactement ça.
    const c = iconesDeModele()
    expect(c.length, "aucune icône de modèle lue — l'extraction est aveugle").toBeGreaterThan(25)
    expect(
      c.filter(x => x.picto).map(x => `${x.fichier}:${x.ligne} → ${x.valeur}`),
      "un modèle porte un pictogramme comme icône : il ne se dessinera pas sur /examples",
    ).toEqual([])
    const connus = new Set(Object.keys(ICONES))
    expect(
      c.filter(x => !connus.has(x.valeur)).map(x => `${x.fichier}:${x.ligne} → « ${x.valeur} »`),
      "l'icône d'un modèle n'existe pas dans le vocabulaire : rien ne sera dessiné",
    ).toEqual([])
  })

  it("le relevé trouve des champs d'icône (sinon il est aveugle)", () => {
    const c = champsIcone()
    expect(c.length, "aucun champ d'icône trouvé — l'extraction ne lit plus les fichiers").toBeGreaterThan(80)
    expect(new Set(c.map(x => x.fichier)).size).toBeGreaterThan(5)
  })

  it("aucun champ d'icône ne contient un pictogramme", () => {
    expect(
      champsIcone().filter(x => x.picto).map(x => `${x.fichier}:${x.ligne} → ${x.valeur}`),
      "un emoji sert d'icône sur le site vitrine ; nommez le concept et laissez components/ui/Icone.tsx le dessiner",
    ).toEqual([])
  })

  it("chaque nom employé existe dans le vocabulaire", () => {
    // Uniquement dans les fichiers qui DESSINENT avec `Icone`. Ailleurs, un
    // champ nommé `icon` peut porter tout autre chose : `ActionRow` y range une
    // couleur. La garde annonçait « nom d'icône inconnu » sur `var(--accent)` —
    // elle criait sur du CSS.
    // Un nom inconnu ne dessine RIEN : le défaut serait invisible en revue et
    // visible en production. C'est exactement le genre de silence que cette
    // série traque depuis le lot v170.
    const connus = new Set(Object.keys(ICONES))
    const dessinent = new Set(
      champsIcone().map(x => x.fichier)
        .filter(f => fs.readFileSync(path.join(SRC, f), "utf8").includes('from "@/components/ui/Icone"')),
    )
    const inconnus = champsIcone()
      .filter(x => dessinent.has(x.fichier) && !connus.has(x.valeur))
      .map(x => `${x.fichier}:${x.ligne} → « ${x.valeur} »`)
    expect(inconnus, "un nom d'icône n'existe pas dans le vocabulaire : rien ne sera dessiné").toEqual([])
  })

  it("le vocabulaire ne garde pas de nom mort", () => {
    // Une table qui enfle sans qu'on retire rien finit par ne plus dire la
    // vérité — la cause que cette série poursuit depuis le lot v151.
    const employes = new Set(champsIcone().map(x => x.valeur))
    // Les données des guides et des usages alimentent aussi le vocabulaire.
    // Ceux qu'on pose directement dans le JSX, hors champ de données.
    for (const abs of fichiers()) {
      const rel = path.relative(SRC, abs).replace(/\\/g, "/")
      if (!estVitrine(rel)) continue
      const src = fs.readFileSync(abs, "utf8")
      for (const m of src.matchAll(/<Icone[^>]*\snom="([^"]+)"/g)) employes.add(m[1])
    }
    for (const x of iconesDeModele()) employes.add(x.valeur)
    const morts = Object.keys(ICONES).filter(n => !employes.has(n))
    expect(morts, "ces concepts ne sont employés nulle part — retirez-les du vocabulaire").toEqual([])
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  it("un emoji réintroduit serait vu", () => {
    const faux = [{ fichier: "faux.tsx", ligne: 1, valeur: "🍕", picto: PICTO.test("🍕") }]
    expect(faux.filter(x => x.picto).length).toBe(1)
  })

  it("un nom de concept n'est pas pris pour un pictogramme", () => {
    // Le pendant : la garde doit aussi savoir se taire.
    for (const n of ["restaurant", "reservation", "qr", "avis"]) expect(PICTO.test(n)).toBe(false)
  })
})
