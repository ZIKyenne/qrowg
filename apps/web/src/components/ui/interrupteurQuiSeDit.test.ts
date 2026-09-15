// Un interrupteur dit ce qu'il commande, et s'il est allumé — garde de classe.
//
// Relevé du 15 septembre. `components/ui/Switch.tsx` existe, et son propre
// commentaire dit pourquoi il a été écrit : « interrupteur ACCESSIBLE
// (role="switch" + aria-checked, clavier natif) — **corrige les toggles maison
// sans sémantique** ».
//
// Il est utilisé dans **un seul écran** : les Réglages. (Et la page de démo des
// composants, qui ne compte pas.)
//
// Pendant ce temps, quinze interrupteurs sont refaits à la main, chacun avec sa
// piste, sa pastille et sa transition. Deux le font bien — la bascule
// mensuel/annuel des tarifs, et la même sur la page d'abonnement. **Treize ne
// disaient rien du tout** :
//
//   profile/page.tsx                      2   préférences du compte
//   builder/builderPanels.tsx             6   effets de thème, animation d'entrée
//   qr-codes/QRStudio.tsx                 2   fond transparent, options d'export
//   builder/BuilderV4.tsx                 2   réglages d'un bloc
//   analytics/ReportSubscriptionPanel.tsx 1   rapport programmé
//
// Un lecteur d'écran annonçait « bouton ». Pas « interrupteur », pas « activé »,
// pas « désactivé ». La personne ne savait **ni ce que le bouton commandait, ni
// dans quel état il était** — et l'appuyer ne lui apprenait rien, puisque rien
// n'était annoncé après non plus.
//
// Dans le même balayage, **dix-huit autres boutons n'avaient aucun nom** : la
// caméra qui change la photo de profil, le crayon d'une redirection, la croix
// d'un formulaire, le « ⋯ » d'une ligne de QR, la pastille de couleur d'accent.
// Sept cent cinquante-sept boutons en avaient un ; ceux-là, non.
//
// La classe : **un interrupteur dit ce qu'il commande, et s'il est allumé.**
//
// `propsInterrupteur` ne touche pas au dessin : chaque écran garde sa piste et sa
// pastille — 36×20 ici, 44×32 là, ce sont des choix de mise en page, pas des
// gestes. Il ne réunit que ce qui doit être dit.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { propsInterrupteur } from "./interrupteur"

const SRC = path.join(__dirname, "../..")
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

/** Fin de la balise ouverte en `i0` : le premier `>` hors accolade et hors chaîne. */
function finDeBalise(s: string, i0: number): number {
  let i = i0, prof = 0, chaine: string | null = null
  while (i < s.length) {
    const c = s[i]
    if (chaine) {
      if (c === "\\") { i += 2; continue }
      if (c === chaine) chaine = null
    } else if (c === '"' || c === "'" || c === "`") chaine = c
    else if (c === "{") prof++
    else if (c === "}") prof--
    else if (c === ">" && prof === 0) return i
    i++
  }
  return -1
}

/** Fin (exclue) de l'élément `<nom …>…</nom>` commencé en `debut`. */
function finDElement(s: string, debut: number, nom: string): number {
  const f = finDeBalise(s, debut + 1 + nom.length)
  if (f < 0) return -1
  if (s[f - 1] === "/") return f + 1
  let prof = 1, i = f + 1
  while (i < s.length && prof) {
    const o = s.indexOf("<" + nom, i), c = s.indexOf("</" + nom, i)
    if (c < 0) return -1
    if (o >= 0 && o < c) {
      const f2 = finDeBalise(s, o + 1 + nom.length)
      if (f2 < 0) return -1
      if (s[f2 - 1] !== "/") prof++
      i = f2 + 1
    } else { prof--; i = s.indexOf(">", c) + 1 }
  }
  return i
}

type Bouton = { fichier: string; ligne: number; tag: string; dedans: string }

function boutons(): Bouton[] {
  const out: Bouton[] = []
  for (const f of fichiers()) {
    const s = fs.readFileSync(f, "utf8")
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    for (const m of s.matchAll(/<button\b/g)) {
      const fe = finDElement(s, m.index!, "button")
      if (fe < 0) continue
      const ft = finDeBalise(s, m.index! + m[0].length)
      out.push({
        fichier: rel, ligne: s.slice(0, m.index!).split("\n").length,
        tag: s.slice(m.index!, ft + 1),
        dedans: s.slice(ft + 1, fe - "</button>".length),
      })
    }
  }
  return out
}

/** Un bouton porte-t-il un nom qu'une aide technique puisse lire ? */
function nomme(b: Bouton): boolean {
  if (/aria-label|aria-labelledby|\btitle=|propsInterrupteur\(/.test(b.tag)) return true
  const sansBalises = b.dedans.replace(/<[^<>]*>/g, "")
  if (/\{/.test(sansBalises)) return true          // une expression peut porter le libellé
  return sansBalises.replace(/\s+/g, "") !== ""
}

/**
 * La signature d'un interrupteur fait main : une pastille ronde, posée en absolu,
 * **qui glisse** — c'est ce glissement qui distingue un interrupteur d'un point
 * décoratif centré dans une case (la grille de position de la bannière, la
 * pastille d'une carte d'appel à l'action, la vignette d'un modèle).
 */
function estUnInterrupteur(b: Bouton): boolean {
  return /position:\s*["']?absolute/.test(b.dedans)
    && /borderRadius:\s*"50%"/.test(b.dedans)
    && /\bleft:/.test(b.dedans)
    && /transition:\s*["']left/.test(b.dedans)
}

describe("ce qu'un interrupteur doit dire", () => {
  it("son nom et son état, jamais l'un sans l'autre", () => {
    expect(propsInterrupteur("Grain", true)).toEqual({
      type: "button", role: "switch", "aria-checked": true, "aria-label": "Grain",
    })
    expect(propsInterrupteur("Grain", false)["aria-checked"]).toBe(false)
    expect(propsInterrupteur("Grain", 0 as unknown as boolean)["aria-checked"], "une valeur molle décide quand même").toBe(false)
  })

  it("un interrupteur verrouillé par le plan reste annoncé, mais inactif", () => {
    const p = propsInterrupteur("Fond transparent", false, true)
    expect(p["aria-disabled"], "il existe, il se lit, il ne s'actionne pas").toBe(true)
    expect(p["aria-label"]).toBe("Fond transparent")
    expect(propsInterrupteur("x", false, false)["aria-disabled"], "sinon l'attribut n'est pas là du tout").toBeUndefined()
  })

  it("le module ne touche pas au dessin — c'est tout l'intérêt", () => {
    const src = lire("components/ui/interrupteur.ts")
    expect(src, "aucun style, aucune classe").not.toMatch(/style|className|background/)
    expect(src).toContain('role: "switch"')
  })
})

describe("garde de classe : ce qui s'actionne se nomme", () => {
  it("aucun interrupteur du produit ne cache son état", () => {
    const fautes = boutons()
      .filter(estUnInterrupteur)
      .filter(b => !/role="switch"|propsInterrupteur\(/.test(b.tag))
      .map(b => `${b.fichier}:${b.ligne}`)
    expect(fautes, "passer par propsInterrupteur(nom, allume) — le dessin reste à l'écran").toEqual([])
  })

  it("et aucun bouton n'est muet", () => {
    const fautes = boutons().filter(b => !nomme(b)).map(b => `${b.fichier}:${b.ligne}`)
    expect(fautes, "un bouton sans nom s'annonce « bouton », et rien d'autre").toEqual([])
  })

  it("celui qui annonce un état le tient de son état, pas d'une constante", () => {
    // Un `aria-checked` figé serait pire que rien : il mentirait à chaque bascule.
    for (const b of boutons().filter(estUnInterrupteur)) {
      const m = /aria-checked=\{([^}]*)\}/.exec(b.tag)
      if (m) expect(m[1].trim(), `${b.fichier}:${b.ligne}`).not.toMatch(/^(true|false)$/)
    }
  })

  it("le balayage voit bien les boutons — sinon il ne prouve rien", () => {
    const tous = boutons()
    expect(tous.length, "des boutons dans le produit").toBeGreaterThan(700)
    expect(tous.filter(estUnInterrupteur).length, "et des interrupteurs faits main").toBeGreaterThan(10)
    expect(tous.filter(nomme).length, "et presque tous portent un nom").toBeGreaterThan(700)
    let appels = 0
    for (const f of fichiers()) appels += (fs.readFileSync(f, "utf8").match(/propsInterrupteur\(/g) ?? []).length
    expect(appels, "et le module sert vraiment").toBeGreaterThan(10)
  })
})
