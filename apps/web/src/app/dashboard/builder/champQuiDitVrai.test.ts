// Un champ est jugé par la règle qui décidera vraiment — garde de classe.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F01, F02). Le panneau de
// droite validait trois sortes de saisies avec ses propres expressions, alors
// que le produit a déjà une règle pour chacune — et que ce sont celles-là qui
// décident de ce qui part en ligne. Les verdicts se contredisaient :
//
//   « # »                  champ : « ✓ Format valide » (vert)
//                          bloc  : « Le bouton n'a pas de lien : il ne sera pas
//                                    publié. »
//
//   « a@b.fr?subject=X »   champ : « valide » ; `lienEmail` rend `null`, et le
//                          bouton « Écrire » n'est pas dessiné.
//
//   « 3949 »               champ : « Numéro trop court » ; le produit fabrique
//                          `tel:3949` sans broncher.
//
// Et la règle de l'adresse e-mail — celle qui refuse « ?bcc= », écrite au lot
// v114 avec sa raison — était recopiée **six fois** ailleurs, chaque fois en
// version plus permissive : le formulaire public (deux fois), la machine de
// formulaire partagée, la destination d'un QR, l'accusé de réception. Le
// visiteur pouvait donc déposer une adresse que le produit refuserait ensuite
// d'utiliser pour lui répondre.
//
// La classe : **un champ est jugé par la règle qui décidera vraiment**, et il
// n'y a qu'une règle par question.
//
// Second volet (F02) : **un conseil n'est pas un refus.** « Un peu court » en
// orange sur un nom de commerce de onze lettres venait d'un plancher absolu
// (`Math.max(12, …)`) posé sur une règle relative (15 % du conseillé). Rien
// n'empêche un nom court ; l'éditeur poussait à rallonger une enseigne.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { jugerLaSaisie, jugerLaLongueur, natureDuChamp } from "./jugementDuChamp"
import { destinationUtile } from "./types"
import { adresseEmailValide, lienTelephone, lienEmail } from "@/lib/lienDeContact"
import { mentionBoutonSansLien, boutonsSansLien } from "./boutonSansLien"

const SRC = path.join(__dirname, "../../..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

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

/** Toute expression qui prétend reconnaître une adresse e-mail à elle seule. */
const REGLE_EMAIL_ECRITE_A_LA_MAIN = /@\[\^\\s@\]|\[\^\\s@\]\+@/

describe("les trois contradictions du relevé", () => {
  it("« # » : le champ dit maintenant ce que le bloc dit déjà", () => {
    const bloc = { cta_label: "Voir la carte", cta_url: "#" }
    expect(mentionBoutonSansLien(boutonsSansLien("instagram_feed", bloc)),
      "l'aperçu le refusait déjà").toContain("ne sera pas publié")
    const j = jugerLaSaisie("url", "cta_url", "#")
    expect(j?.ton, "et le champ ne le déclare plus valide").toBe("refus")
    expect(destinationUtile("#"), "c'est bien la règle du produit qui tranche").toBeNull()
    // Une ancre NOMMÉE, elle, mène quelque part : la règle sait les distinguer.
    expect(jugerLaSaisie("url", "cta_url", "#horaires")?.ton).toBe("ok")
    expect(jugerLaSaisie("url", "cta_url", "#horaires")?.phrase).toContain("section de cette page")
  })

  it("« a@b.fr?subject=X » : ce que le bouton refusera n'est plus annoncé valide", () => {
    const piege = "contact@resto.fr?subject=Bonjour"
    expect(lienEmail(piege), "le bouton « Écrire » ne sera pas dessiné").toBeNull()
    expect(jugerLaSaisie("text", "email", piege)?.ton).toBe("refus")
    expect(jugerLaSaisie("text", "email", "contact@resto.fr")?.ton).toBe("ok")
  })

  it("« 3949 » : l'éditeur ne refuse plus ce que la page accepte", () => {
    expect(lienTelephone("3949"), "le produit en fait un lien d'appel").toBe("tel:3949")
    expect(jugerLaSaisie("text", "phone", "3949")?.ton, "l'éditeur disait « trop court »").toBe("ok")
    expect(jugerLaSaisie("text", "phone", "appelez-nous")?.ton, "mais rien d'appelable reste un refus").toBe("refus")
  })

  it("un champ vide ne reçoit aucun reproche", () => {
    for (const v of ["", "   "]) {
      expect(jugerLaSaisie("url", "cta_url", v)).toBeNull()
      expect(jugerLaSaisie("text", "email", v)).toBeNull()
    }
  })

  it("« Tester ↗ » n'est offert que sur ce qui s'ouvre dans un onglet", () => {
    expect(jugerLaSaisie("url", "u", "resto.fr")?.tester, "et sur l'adresse normalisée").toBe("https://resto.fr")
    expect(jugerLaSaisie("url", "u", "#horaires")?.tester).toBeUndefined()
    expect(jugerLaSaisie("url", "u", "tel:0102030405")?.tester).toBeUndefined()
  })
})

describe("un conseil n'est pas un refus", () => {
  it("« Grain & Cie » ne reçoit plus rien", () => {
    expect(jugerLaLongueur("Grain & Cie".length, 50), "onze lettres, un nom de commerce").toBeNull()
  })

  it("le seuil vient du champ, pas d'un plancher venu d'ailleurs", () => {
    // 15 % de 50 = 8 : en dessous, un conseil ; jamais une alerte.
    expect(jugerLaLongueur(7, 50)?.ton).toBe("conseil")
    expect(jugerLaLongueur(8, 50)).toBeNull()
    expect(lire("app/dashboard/builder/builderPanels.tsx")).not.toContain("Math.max(12,")
  })

  it("« trop long » reste une contrainte, parce que le produit coupe", () => {
    const l = jugerLaLongueur(51, 50)
    expect(l?.ton).toBe("contrainte")
    expect(l?.phrase).toContain("coupé sur mobile")
    expect(jugerLaLongueur(201)?.ton, "et sur un texte libre aussi").toBe("contrainte")
  })

  it("et le panneau ne peint plus un conseil de la couleur d'une alerte", () => {
    const p = lire("app/dashboard/builder/builderPanels.tsx")
    expect(p).toContain('l?.ton === "contrainte" ? "#F59E0B" : MUTED')
    expect(p).toContain('l?.ton === "contrainte" ? "var(--danger)" : MUTED')
    expect(p, "plus de phrase écrite dans l'écran").not.toContain('"Un peu court"')
  })
})

describe("garde de classe : une question, une règle", () => {
  it("le panneau n'écrit plus aucune règle de validation", () => {
    const p = lire("app/dashboard/builder/builderPanels.tsx")
    expect(p, "la destination").not.toContain('/^(https?:\\/\\/|mailto:|tel:|\\/|#)/i')
    expect(REGLE_EMAIL_ECRITE_A_LA_MAIN.test(p), "l'adresse").toBe(false)
    expect(p, "le numéro").not.toContain('.replace(/\\D/g, "").length >= 6')
    expect(p, "il demande son verdict au produit").toContain("jugerLaSaisie(field.type, field.key")
  })

  it("plus personne n'écrit sa propre règle d'adresse e-mail", () => {
    const copies: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f).split(path.sep).join("/")
      if (rel === "lib/lienDeContact.ts") continue
      fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
        if (/^\s*(\/\/|\*)/.test(l)) return
        if (REGLE_EMAIL_ECRITE_A_LA_MAIN.test(l)) copies.push(`${rel}:${i + 1}`)
      })
    }
    expect(copies, "`adresseEmailValide` porte la règle, et sa raison").toEqual([])
  })

  it("les cinq endroits du relevé passent par elle", () => {
    for (const [f, morceau] of [
      ["app/[slug]/blocsPublics.tsx", "!!adresseEmailValide(email)"],
      ["app/[slug]/blocsPublics.tsx", "!!adresseEmailValide(emailVal)"],
      ["app/dashboard/builder/shared-renderer/forms/leadFormMachine.ts", "!adresseEmailValide(emailVal)"],
      ["app/api/qr-destination/qrDestination.ts", 'adresseEmailValide(value.replace("mailto:", ""))'],
      ["lib/accuseReceptionLead.ts", "adresseEmailValide(s) !== null"],
    ] as const) expect(lire(f), f).toContain(morceau)
  })

  it("le module de jugement ne fabrique aucune règle à lui", () => {
    const src = lire("app/dashboard/builder/jugementDuChamp.ts")
    const code = src.split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n")
    expect(code, "aucune expression de validation écrite ici").not.toMatch(/=\s*\/\^.*\/[gimsuy]*\s*$/m)
    for (const regle of ["destinationUtile(", "adresseEmailValide(", "lienTelephone("]) {
      expect(code, `il appelle ${regle}`).toContain(regle)
    }
  })

  it("le balayage voit bien les adresses — sinon il ne prouve rien", () => {
    let appels = 0
    for (const f of fichiers()) appels += (fs.readFileSync(f, "utf8").match(/adresseEmailValide\(/g) ?? []).length
    expect(appels, "des jugements d'adresse dans le produit").toBeGreaterThan(5)
    // Le détecteur sait dire oui — sinon il ne dirait jamais non.
    const nu = 'const ok = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v)'
    expect(REGLE_EMAIL_ECRITE_A_LA_MAIN.test(nu)).toBe(true)
    // …et non à une ligne qui se contente d'appeler la règle.
    expect(REGLE_EMAIL_ECRITE_A_LA_MAIN.test("const ok = !!adresseEmailValide(v)")).toBe(false)
    // La nature d'un champ se lit bien, sinon rien ne serait jamais jugé.
    expect(natureDuChamp("url", "cta_url")).toBe("destination")
    expect(natureDuChamp("text", "email_dest")).toBe("email")
    expect(natureDuChamp("text", "whatsapp_numero")).toBe("telephone")
    expect(natureDuChamp("text", "title")).toBeNull()
  })
})
