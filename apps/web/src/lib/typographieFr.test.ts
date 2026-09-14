// Le produit parle français, ses espaces aussi — garde de classe.
//
// Relevé du 14 septembre, en balayant toutes les chaînes du produit et en
// classant l'espace qui précède chaque signe double :
//
//   signe   espace insécable   espace ordinaire   aucune espace
//     %             0                  65              453
//     €             0                 148              101
//     ?             0               2 256               92
//     !             0                  71               19
//     «             0                 297                0
//
// **Zéro.** Pas une seule espace insécable dans tout le produit.
//
// Deux défauts, pas un :
//
// 1) 453 « 12% » et 101 « 12€ » n'ont pas d'espace du tout — et le produit s'en
//    sait : 65 endroits écrivent « 12 % ». Le même signe s'écrit de deux façons
//    dans le même écran.
//
// 2) Les 2 256 autres ont une espace ORDINAIRE, qui casse. Sur un téléphone —
//    là où le commerçant lit ses alertes — une confirmation se rend ainsi :
//
//        Supprimer « Menu du midi »
//        ?
//
//    ou une jauge de quota :
//
//        Vous en êtes à 1 240 / 1 500 vues (82
//        %)
//
// On ne corrige pas 3 000 chaînes à la main. On corrige les QUATRE endroits par
// lesquels les phrases du produit passent pour être rendues : l'infobulle, la
// confirmation, la coquille des e-mails, et le module des chiffres. Une phrase
// écrite n'importe où traverse l'un des quatre.
//
// La classe : **la ponctuation double du produit porte une espace insécable, et
// une seule fonction la pose.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { typoFr, typographieCorrecte, ecartsDeTypographie, FINE, INSECABLE } from "./typographieFr"
import { pourcentage } from "./chiffresLisibles"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Rend les espaces invisibles lisibles dans un message d'échec. */
const montre = (s: string) => s.replace(/ /g, "[F]").replace(/ /g, "[N]")

describe("les deux cas du relevé", () => {
  it("la confirmation dont le « ? » partait seul à la ligne", () => {
    const avant = "Supprimer « Menu du midi » ?"
    const apres = typoFr(avant)
    expect(apres).toBe(`Supprimer «${INSECABLE}Menu du midi${INSECABLE}»${FINE}?`)
    expect(apres, montre(apres)).not.toContain(" ?")
    expect(apres).not.toContain("« ")
  })

  it("la jauge dont le « % » partait seul", () => {
    const apres = typoFr("Vous en êtes à 1 240 / 1 500 vues (82%) ce mois-ci.")
    expect(apres).toContain(`82${FINE}%`)
  })

  it("et « 12€ », qui n'avait pas d'espace du tout", () => {
    expect(typoFr("12€ par mois")).toBe(`12${INSECABLE}€ par mois`)
    expect(typoFr("facturé 120 € par an")).toBe(`facturé 120${INSECABLE}€ par an`)
  })

  it("le deux-points en prend une aussi — mais pas une heure", () => {
    expect(typoFr("Horaires : 12:30 - 14:00")).toBe(`Horaires${INSECABLE}: 12:30 - 14:00`)
    expect(typoFr("Page créée en brouillon : limite atteinte."))
      .toBe(`Page créée en brouillon${INSECABLE}: limite atteinte.`)
  })

  it("l'exclamation aussi", () => {
    expect(typoFr("Bravo ! Votre page est en ligne.")).toBe(`Bravo${FINE}! Votre page est en ligne.`)
    expect(typoFr("Bravo! Votre page est en ligne.")).toBe(`Bravo${FINE}! Votre page est en ligne.`)
  })
})

describe("ce à quoi elle ne touche pas", () => {
  it("une adresse web garde son « ? » et ses « : »", () => {
    const u = "https://qrowg.com/dashboard?tab=pages"
    expect(typoFr(`Voir ${u} pour la suite.`)).toContain(u)
    expect(typoFr(`Voir ${u}`)).toBe(`Voir ${u}`)
  })

  it("une adresse e-mail non plus", () => {
    expect(typoFr("Écrivez à bonjour@qrowg.com")).toBe("Écrivez à bonjour@qrowg.com")
  })

  it("mais la phrase qui l'entoure, si", () => {
    const r = typoFr("Écrivez à bonjour@qrowg.com !")
    expect(r).toBe(`Écrivez à bonjour@qrowg.com${FINE}!`)
  })

  it("les balises HTML des e-mails traversent intactes", () => {
    const r = typoFr('<a href="https://x.fr?a=1" style="color:#fff">82%</a>')
    expect(r).toContain('<a href="https://x.fr?a=1" style="color:#fff">')
    expect(r).toContain(`82${FINE}%`)
  })

  it("et une valeur interpolée déjà posée par React n'est pas du texte", () => {
    // `{x}` dans une chaîne de gabarit : on ne réécrit pas ce qu'on ne lit pas.
    expect(typoFr("reste {n} jours")).toBe("reste {n} jours")
  })

  it("ni un « ?? » ni un « !! » ne sont de la ponctuation double", () => {
    expect(typoFr("Quoi ?? Vraiment !!")).not.toContain(`?${FINE}?`)
  })

  it("une entrée qui n'est pas une chaîne ne casse rien", () => {
    expect(typoFr(null)).toBe("")
    expect(typoFr(42)).toBe("")
    expect(typoFr("")).toBe("")
  })
})

describe("elle est idempotente — c'est ce qui permet de l'appliquer au rendu", () => {
  const PHRASES = [
    "Supprimer « Menu du midi » ?",
    "Vous en êtes à 82% de votre quota.",
    "Horaires : 12:30",
    "Bravo ! 12€ économisés.",
    "Rien reçu ? Regardez dans les indésirables, puis réessayez.",
    "Voir https://qrowg.com/a?b=1 ou écrire à x@y.fr !",
  ]

  it("passer deux fois donne le même résultat", () => {
    for (const p of PHRASES) {
      const une = typoFr(p)
      expect(typoFr(une), `${montre(p)} n'est pas stable`).toBe(une)
    }
  })

  it("et le résultat n'a plus aucun écart", () => {
    for (const p of PHRASES) {
      expect(ecartsDeTypographie(typoFr(p)), montre(p)).toEqual([])
      expect(typographieCorrecte(typoFr(p))).toBe(true)
    }
  })

  it("le détecteur voit bien les défauts du relevé", () => {
    // Sans ça, une garde qui ne détecte rien passerait pour un succès.
    expect(ecartsDeTypographie("82% atteint")).toContain("espace manquante avant %")
    expect(ecartsDeTypographie("12€")).toContain("espace manquante avant €")
    expect(ecartsDeTypographie("Vraiment ?")).toContain("espace ordinaire là où il faut une insécable")
    expect(ecartsDeTypographie("Supprimer « x »")).toContain("espace ordinaire après «")
  })
})

describe("les quatre points de rendu l'appliquent", () => {
  it("l'infobulle", () => {
    expect(lire("components/Toast.tsx")).toContain("{typoFr(t.msg)}")
  })

  it("la confirmation — message, titre et boutons", () => {
    const src = lire("components/ui/Confirm.tsx")
    expect(src).toContain("{typoFr(opts.message)}")
    expect(src).toContain("title={typoFr(opts.title ?? \"Confirmer\")}")
    expect(src.split("typoFr(").length - 1, "les quatre textes de la boîte").toBeGreaterThanOrEqual(4)
  })

  it("la coquille des e-mails", () => {
    const src = lire("lib/emailLayout.ts")
    expect(src).toContain("${typoFr(txt)}")
    expect(src).toContain("${typoFr(html)}")
    expect(src).toContain("${typoFr(label)}")
  })

  it("et le module des chiffres écrit lui-même sa fine insécable", () => {
    expect(pourcentage(4, 1000)).toBe(`0,4${FINE}%`)
    expect(pourcentage(4, 1000)).not.toContain(" %")
    expect(lire("lib/chiffresLisibles.ts")).toContain('import { FINE } from "./typographieFr"')
  })
})

describe("garde de classe : une seule fonction pose ces espaces", () => {
  function fichiers(): string[] {
    const out: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
    }
    marcher(SRC)
    return out
  }

  const AUTORISES = new Set(["lib/typographieFr.ts", "lib/chiffresLisibles.ts"])

  it("le CARACTÈRE insécable ne s'écrit qu'à un endroit", () => {
    // Un caractère invisible collé en dur ailleurs, c'est une règle qui se met à
    // vivre à deux endroits — et personne ne le voit dans un diff. Le relevé en
    // comptait zéro dans tout le produit : il doit en rester zéro hors du module.
    const INVISIBLE = new RegExp(`[${FINE}${INSECABLE}]|\\\\u00A0|\\\\u202F`)
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (AUTORISES.has(rel)) continue
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (INVISIBLE.test(l)) fautes.push(`${rel}:${i + 1}`)
      }
    }
    expect(fautes, "l'espace insécable se pose dans lib/typographieFr, pas ailleurs").toEqual([])
  })

  it("et l'entité `&nbsp;` reste réservée au HTML, où elle se voit", () => {
    // Le produit en avait déjà 21, toutes dans du HTML qu'il fabrique (e-mails,
    // blocs de page). Là, l'entité est la bonne orthographe : elle est lisible
    // dans le code et elle survit à l'échappement. Dans une phrase d'interface,
    // en revanche, elle s'afficherait telle quelle — « Bravo&nbsp;! ».
    const fautes: string[] = []
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      if (!/&nbsp;/.test(src)) continue
      const faitDuHtml = /dangerouslySetInnerHTML|&laquo;|&raquo;|<strong|<span|style="/.test(src)
      if (!faitDuHtml) fautes.push(path.relative(SRC, f))
    }
    expect(fautes, "`&nbsp;` dans une phrase d'interface s'afficherait tel quel").toEqual([])
  })

  it("le module ne pose pas une espace ordinaire là où il faut une insécable", () => {
    const mod = lire("lib/typographieFr.ts")
    for (const [i, ligne] of mod.split("\n").entries()) {
      const l = ligne.trim()
      if (l.startsWith("//") || l.startsWith("*") || !l.includes("replace(")) continue
      expect(/`\$1 [;!?%€:»]/.test(l),
        `typographieFr.ts:${i + 1} pose une espace qui casse`).toBe(false)
    }
  })

  it("le balayage voit bien les phrases du produit — sinon il ne prouve rien", () => {
    let phrases = 0
    for (const f of fichiers()) {
      for (const l of fs.readFileSync(f, "utf8").split("\n")) {
        if (/["'`][^"'`]{15,}[?!][ "'`]/.test(l) && !l.trim().startsWith("//")) phrases++
      }
    }
    expect(phrases).toBeGreaterThan(30)
  })

  it("et les deux espaces du module sont bien celles que le français demande", () => {
    expect(FINE).toBe(" ")      // fine insécable : ; ! ? %
    expect(INSECABLE).toBe(" ") // insécable : deux-points, guillemets, unités
    expect(FINE).not.toBe(" ")
    expect(INSECABLE).not.toBe(" ")
  })
})
