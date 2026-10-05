import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

// ═══════════════════════════════════════════════════════════════════════════════
// UN CHAMP DIT SON NOM (Q09).
//
// `nomQuiDesigne.test.ts`, la garde voisine, vérifie qu'une `<label>` posée sur un
// champ le DÉSIGNE. Elle ne voit pas le cas relevé par l'audit du 29 septembre :
// un champ sans étiquette du tout, dont le seul nom est son exemple de valeur.
//
//   « Dans l'éditeur, les intitulés visibles de plusieurs champs du profil ne sont
//     pas associés aux entrées, qui reposent sur leur texte indicatif. Un champ
//     hexadécimal de style et le champ de lien du QR présentent aussi des lacunes
//     de nommage. »
//
// Trois exemples mesurés en ouvrant le code :
//  • le champ « Lien à encoder » de /dashboard/qr-link n'avait qu'un `<p>` au-dessus
//    de lui — un lecteur d'écran annonçait « ex : monsite.fr » ;
//  • les quatorze champs du même écran (Wi-Fi, fiche contact, e-mail, SMS) idem ;
//  • deux sélecteurs de couleur du thème annonçaient littéralement « label »,
//    la chaîne, parce qu'un `aria-label="label"` avait perdu ses accolades.
//
// La règle : **tout champ de saisie porte un nom que l'arbre d'accessibilité voit.**
// Un `placeholder` donne un exemple de valeur ; il ne nomme pas le champ.
//
// Le reste du produit n'est pas encore à jour. Le nombre ci-dessous est un cliquet :
// il ne peut que descendre. Les écrans qui restent sont nommés dans le suivi
// d'audit, pour qu'on sache lesquels, et pourquoi.
// ═══════════════════════════════════════════════════════════════════════════════

const SRC = path.join(__dirname, "../..")

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

/** Fin de la balise ouverte en `i0` : le premier `>` hors accolade et hors chaîne. */
function finDeBalise(s: string, i0: number): number {
  let i = i0, prof = 0, chaine: string | null = null
  while (i < s.length) {
    const c = s[i]
    if (chaine) {
      if (c === "\\") { i += 2; continue }
      if (c === chaine) chaine = null
      i++; continue
    }
    if (c === '"' || c === "'" || c === "`") { chaine = c; i++; continue }
    if (c === "{") prof++
    else if (c === "}") prof--
    else if (c === ">" && prof === 0) return i
    i++
  }
  return -1
}

/** Les champs de saisie qu'aucun nom n'atteint. */
function champsSansNom(): string[] {
  const out: string[] = []
  for (const f of fichiers()) {
    const s = fs.readFileSync(f, "utf8")
    for (const m of s.matchAll(/<(input|select|textarea)\b/g)) {
      // Un commentaire qui PARLE d'un `<select>` n'en est pas un.
      const debutDeLigne = s.lastIndexOf(String.fromCharCode(10), m.index!) + 1
      if (s.slice(debutDeLigne, m.index!).includes("//")) continue
      const fin = finDeBalise(s, m.index!)
      if (fin < 0) continue
      const balise = s.slice(m.index!, fin + 1)

      // Un bouton n'est pas une saisie ; un champ caché n'est lu par personne.
      const type = (balise.match(/type="([a-z-]+)"/) || [])[1] || ""
      if (["hidden", "submit", "button", "reset"].includes(type)) continue
      // Le pot de miel anti-robot est délibérément retiré de l'arbre.
      if (/aria-hidden="true"/.test(balise)) continue
      // Une primitive qui reçoit les attributs de son appelant peut recevoir le nom.
      if (/\{\.\.\./.test(balise)) continue

      // Nommé directement.
      if (/aria-label[=\s]|aria-labelledby[=\s]/.test(balise)) continue
      // Nommé par une étiquette qui le désigne — identifiant littéral, ou expression.
      const idLitteral = balise.match(/\bid="([^"]+)"/)
      if (idLitteral && s.includes(`htmlFor="${idLitteral[1]}"`)) continue
      const idExpr = balise.match(/\bid=\{([^}]+)\}/)
      if (idExpr && s.includes(`htmlFor={${idExpr[1]}}`)) continue
      // `<Reglage>` tient l'identifiant pour son champ.
      if (/\bid=\{id\}/.test(balise)) continue
      // Englobé par une `<label>` encore ouverte.
      const avant = s.slice(Math.max(0, m.index! - 900), m.index!)
      if (avant.lastIndexOf("<label") > avant.lastIndexOf("</label>")) continue

      const ligne = s.slice(0, m.index!).split("\n").length
      out.push(`${f.replace(SRC, "").replace(/\\/g, "/")}:${ligne}`)
    }
  }
  return out
}

/**
 * Plafond, mesuré le 29 septembre 2026, une fois repris les trente et un champs
 * des écrans que l'audit nomme (l'écran QR par lien, les réglages de style de
 * l'éditeur, le calculateur de taille). **Ce nombre ne doit que descendre.**
 *
 * Ce qui reste, et pourquoi ce n'est pas fait ici : l'atelier d'impression (15),
 * le QR Studio (7), le profil (4), la fenêtre d'assistant (3)… Ce sont des écrans
 * denses, que l'audit ne cite pas, et qu'on ne touche pas en aveugle : chaque nom
 * demande de comprendre ce que le champ règle. Le suivi d'audit les liste.
 */
const CHAMPS_SANS_NOM = 40

describe("un champ de saisie dit son nom", () => {
  const sansNom = champsSansNom()

  it("le balayage trouve bien des champs — sinon il ne prouve rien", () => {
    // Garde-fou : une expression régulière cassée rendrait le cliquet muet.
    let total = 0
    for (const f of fichiers()) total += [...fs.readFileSync(f, "utf8").matchAll(/<(input|select|textarea)\b/g)].length
    expect(total, "aucun champ trouvé dans tout le produit").toBeGreaterThan(200)
  })

  it("les écrans repris par l'audit n'en laissent plus aucun", () => {
    const REPRIS = [
      "/app/dashboard/qr-link/page.tsx",        // le champ de lien du QR, et les 14 autres
      "/app/dashboard/builder/builderPanels.tsx", // les champs de style, dont l'hexadécimal
      "/app/outils/taille-qr-code/TailleClient.tsx",
    ]
    for (const ecran of REPRIS) {
      expect(sansNom.filter(c => c.startsWith(ecran)), ecran).toEqual([])
    }
  })

  it("plus aucun `aria-label` ne se nomme lui-même", () => {
    // Deux sélecteurs de couleur annonçaient la chaîne « label » au lieu de la
    // variable du même nom : les accolades manquaient.
    for (const f of fichiers()) {
      const s = fs.readFileSync(f, "utf8")
      expect(s, `${f} : un aria-label littéral qui ne nomme rien`).not.toContain('aria-label="label"')
    }
  })

  it("le reste du produit ne s'aggrave pas", () => {
    expect(sansNom.length, `champs sans nom :\n${sansNom.join("\n")}`).toBeLessThanOrEqual(CHAMPS_SANS_NOM)
  })
})
