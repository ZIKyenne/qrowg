// Une limite qui coupe sans se voir — garde de classe.
//
// Relevé du 14 septembre. Vingt-huit endroits coupent du texte côté serveur
// avec `.slice(0, n)`. Deux écrans seulement portent une limite de saisie.
//
//   api/qr-instant:85     label.trim().slice(0, 80)      le nom d'un QR
//   api/pages/create:52   title.trim().slice(0, 80)      le titre d'une page
//   api/qr-label:14       label.trim().slice(0, 60)      le nom d'un support
//   api/qr-support:41     label.trim().slice(0, 60)      idem, à la création
//   api/leads:34-37       name 200, email 200, phone 60, message 3000
//
// Le commerçant tape, l'écran accepte, la base garde le début. Au rechargement
// le nom est coupé en plein mot. Sur le formulaire public, c'est le message
// d'un prospect qui s'arrête au milieu d'une phrase — et une adresse de plus de
// 200 caractères devient une adresse à laquelle on ne peut plus répondre.
//
// Pire que la coupe : `leads.data` est borné à 8 Ko d'un bloc, et un objet trop
// gros n'est pas tronqué, il est JETÉ (`objetBorne(...) ?? {}`). Un visiteur
// bavard sur un seul champ faisait perdre au commerçant les réponses de tous
// les autres.
//
// La classe : **une limite qui coupe sans se voir n'est pas une limite, c'est
// une perte.** Le nombre est nommé une fois dans `lib/limitesDeSaisie` ; la
// route l'applique, l'écran l'affiche, et ils ne peuvent plus diverger.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  LIMITES, limite, coupe, champBorne, tropLong, resteAEcrire,
  compteurDeSaisie, limiteDuChampPublic, type CleDeLimite,
} from "./limitesDeSaisie"
import { texte } from "./bornes"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function fichiers(ext: RegExp): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (ext.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

describe("le plafond, nommé une fois", () => {
  it("la coupe du produit est un seul geste", () => {
    // `bornes.texte` n'a plus sa propre copie : c'est la même fonction.
    expect(texte).toBe(coupe)
    expect(coupe("  Vitrine  ", 60)).toBe("Vitrine")
    expect(coupe("   ", 60)).toBeNull()      // vide -> null, pas ""
    expect(coupe(42, 60)).toBeNull()         // pas une chaîne -> null
    expect(coupe("abcdef", 3)).toBe("abc")
  })

  it("un champ nommé coupe à son plafond, et à aucun autre", () => {
    const long = "x".repeat(400)
    expect(champBorne(long, "nomDeSupport")).toHaveLength(60)
    expect(champBorne(long, "nomDeQr")).toHaveLength(80)
    expect(champBorne(long, "titreDePage")).toHaveLength(80)
    expect(champBorne(long, "leadTelephone")).toHaveLength(60)
    expect(limite("sousDomaine")).toBe(30)
  })

  it("deux « label » ne sont pas le même champ", () => {
    // qr_codes.label (le support imprimé) et instant_qrs.label (le QR direct)
    // portent le même mot en base sans être la même chose.
    expect(LIMITES.nomDeSupport).not.toBe(LIMITES.nomDeQr)
  })

  it("ce qu'il reste à écrire, et ce qui dépasse déjà", () => {
    expect(tropLong("x".repeat(60), "nomDeSupport")).toBe(false)
    expect(tropLong("x".repeat(61), "nomDeSupport")).toBe(true)
    expect(tropLong(" " + "x".repeat(60) + " ", "nomDeSupport")).toBe(false) // les bords ne comptent pas
    expect(resteAEcrire("abc", "nomDeSupport")).toBe(57)
    expect(resteAEcrire("abc", 10)).toBe(7)
  })

  it("le compteur se tait tant qu'il ne sert à rien", () => {
    expect(compteurDeSaisie("x".repeat(10), "nomDeSupport")).toBeNull()
    expect(compteurDeSaisie("x".repeat(59), "nomDeSupport")).toBe("1 caractère restant")
    expect(compteurDeSaisie("x".repeat(58), "nomDeSupport")).toBe("2 caractères restants")
    expect(compteurDeSaisie("x".repeat(60), "nomDeSupport")).toBe("Limite atteinte")
    expect(compteurDeSaisie("x".repeat(63), "nomDeSupport")).toBe("3 caractères de trop : la fin sera coupée")
  })

  it("un champ libre du formulaire public reçoit le plafond de sa colonne", () => {
    expect(limiteDuChampPublic("email")).toBe(LIMITES.leadEmail)
    expect(limiteDuChampPublic("Mail")).toBe(LIMITES.leadEmail)
    expect(limiteDuChampPublic("phone")).toBe(LIMITES.leadTelephone)
    expect(limiteDuChampPublic("numero")).toBe(LIMITES.leadTelephone)
    expect(limiteDuChampPublic("name")).toBe(LIMITES.leadNom)
    expect(limiteDuChampPublic("message")).toBe(LIMITES.leadMessage)
    expect(limiteDuChampPublic("commentaire", true)).toBe(LIMITES.leadMessage)
    // Tout le reste part dans `leads.data`, borné en bloc à 8 Ko côté route :
    // douze champs à ce plafond restent largement dessous.
    expect(limiteDuChampPublic("budget")).toBe(LIMITES.champDeFormulaire)
    expect(LIMITES.champDeFormulaire * 12).toBeLessThan(8_000)
  })
})

describe("les endroits du relevé lisent maintenant la table", () => {
  it("le formulaire public — celui qui ramène les prospects", () => {
    const api = lire("app/api/leads/route.ts")
    expect(api).toContain('champBorne(body.name, "leadNom")')
    expect(api).toContain('champBorne(body.email, "leadEmail")')
    expect(api).toContain('champBorne(body.phone, "leadTelephone")')
    expect(api).toContain('champBorne(body.message, "leadMessage")')
    const ecran = lire("app/[slug]/blocsPublics.tsx")
    expect(ecran).toContain('maxLength={limite("leadNom")}')
    expect(ecran).toContain('maxLength={limite("leadEmail")}')
    expect(ecran).toContain("limiteDuChampPublic(f.key, f.area)")
    expect(ecran, "le reste se dit avant la coupe").toContain("compteurDeSaisie(")
  })

  it("le nom d'un support, des deux côtés", () => {
    expect(lire("app/api/qr-label/route.ts")).toContain('champBorne(label, "nomDeSupport")')
    expect(lire("app/api/qr-support/route.ts")).toContain('champBorne(label, "nomDeSupport")')
    expect(lire("app/dashboard/analytics/SupportPanel.tsx")).toContain('maxLength={limite("nomDeSupport")}')
  })

  it("le nom d'un QR et le titre d'une page", () => {
    expect(lire("app/api/qr-instant/route.ts")).toContain('champBorne(body?.label, "nomDeQr")')
    expect(lire("app/api/qr-instant/bulk/route.ts")).toContain('champBorne(r?.label, "nomDeQr")')
    expect(lire("app/api/pages/create/route.ts")).toContain('champBorne(body?.title, "titreDePage")')
    expect(lire("app/dashboard/builder/BuilderV4.tsx")).toContain('maxLength={limite("titreDePage")}')
  })

  it("le sous-domaine, qui avait déjà raison, ne l'écrit plus deux fois", () => {
    const route = lire("app/api/subdomain/route.ts")
    const m = /Maximum (\d+) caractères/.exec(route)
    expect(m, "la route dit toujours son plafond").toBeTruthy()
    expect(Number(m![1]), "et c'est celui de la table").toBe(LIMITES.sousDomaine)
    expect(lire("app/dashboard/subdomain/SubdomainPanel.tsx")).toContain('maxLength={limite("sousDomaine")}')
  })
})

describe("garde de classe : une limite se voit", () => {
  /** Les noms qui portent le corps de la requête dans un fichier de route. */
  function nomsDuCorps(src: string): Set<string> {
    const noms = new Set<string>()
    for (const m of src.matchAll(/const\s+(\w+)\s*=\s*await\s+req\.json\(\)/g)) noms.add(m[1])
    for (const m of src.matchAll(/const\s*\{([^}]*)\}\s*=\s*await\s+req\.json\(\)/g))
      for (const part of m[1].split(",")) {
        const n = part.split(":").pop()!.trim().replace(/=.*$/, "").trim()
        if (/^\w+$/.test(n)) noms.add(n)
      }
    return noms
  }

  /** Une coupe à la main sur du texte reçu dans le corps de la requête. */
  function coupesALaMain(): string[] {
    const out: string[] = []
    for (const f of fichiers(/\.ts$/)) {
      const rel = path.relative(SRC, f)
      if (!/^app\/api\//.test(rel)) continue
      const src = fs.readFileSync(f, "utf8")
      const noms = nomsDuCorps(src)
      if (!noms.size) continue
      src.split("\n").forEach((l, i) => {
        for (const m of l.matchAll(/([\w?.$]+)\s*(?:\.trim\(\))?\s*\.(?:slice|substring)\(\s*0\s*,\s*(\d+)\s*\)/g)) {
          const racine = m[1].split(/[?.]/)[0]
          if (noms.has(racine)) out.push(`${rel}:${i + 1} — ${m[1]}.slice(0, ${m[2]})`)
        }
      })
    }
    return out
  }

  it("aucune route ne coupe du texte reçu avec un nombre écrit à la main", () => {
    expect(coupesALaMain(), "le plafond doit venir de LIMITES, via champBorne").toEqual([])
  })

  it("aucun écran n'écrit une limite de saisie en chiffres", () => {
    const fautes: string[] = []
    for (const f of fichiers(/\.tsx$/)) {
      fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
        if (/maxLength=\{\s*\d+\s*\}|maxLength="\d+"/.test(l))
          fautes.push(`${path.relative(SRC, f)}:${i + 1}`)
      })
    }
    expect(fautes, "maxLength doit lire limite(...)").toEqual([])
  })

  it("le balayage voit bien les deux bouts — sinon il ne prouve rien", () => {
    // Une garde qui ne regarde plus rien passe au vert toute seule.
    let routes = 0, ecrans = 0, corps = 0
    for (const f of fichiers(/\.ts$/)) {
      const rel = path.relative(SRC, f)
      if (!/^app\/api\//.test(rel)) continue
      const src = fs.readFileSync(f, "utf8")
      if (nomsDuCorps(src).size) corps++
      if (/champBorne\(/.test(src)) routes++
    }
    for (const f of fichiers(/\.tsx$/))
      ecrans += (fs.readFileSync(f, "utf8").match(/maxLength=\{/g) || []).length
    expect(corps, "des routes qui lisent un corps JSON").toBeGreaterThan(20)
    expect(routes, "des routes qui passent par la table").toBeGreaterThan(5)
    expect(ecrans, "des champs qui portent une limite").toBeGreaterThan(7)
  })

  it("aucune entrée de la table ne dort", () => {
    // Un plafond que personne n'applique n'est pas une règle, c'est un souhait.
    const tout = [...fichiers(/\.tsx?$/)].map(f => fs.readFileSync(f, "utf8")).join("\n")
    const orphelines = (Object.keys(LIMITES) as CleDeLimite[])
      .filter(c => !new RegExp(`["']${c}["']|LIMITES\\.${c}\\b`).test(tout.replace(lire("lib/limitesDeSaisie.ts"), "")))
    expect(orphelines, "nommée dans la table, appliquée nulle part").toEqual([])
  })
})
