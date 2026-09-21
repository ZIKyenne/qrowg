// Un e-mail échappe ce qu'il cite — garde de classe.
//
// Relevé du 21 septembre, en suite de la passe de sécurité du lot v159. Le
// produit envoie neuf e-mails, et tous citent quelque chose qu'une personne a
// tapé : le nom d'un commerce, le message d'un visiteur, le titre d'une page.
//
// ── Ce que le fichier disait, et ce que le code faisait ─────────────────────
//
// `lib/emailLayout.ts` se contredisait. Sa première ligne :
//
//     « Les valeurs dynamiques (nom, etc.) doivent etre echappees par l'appelant. »
//
// et la note de `emailShell`, cinquante lignes plus bas :
//
//     « l'appelant les fabrique avec emailH1, emailP, emailButton — qui
//       échappent ce qu'il faut là où il faut. »
//
// **Aucune des trois n'échappait quoi que ce soit.** Vérifié en fabriquant les
// e-mails avec une charge hostile : `emailH1`, `emailP` et les deux entrées de
// `emailButton` la rendaient brute.
//
// ── Ce que cela valait, dit honnêtement ─────────────────────────────────────
//
// **Aucun e-mail du produit n'était fautif.** Les douze appelants échappaient
// tous avant d'appeler — vérifié un par un. Ce n'était donc pas une faille : ce
// que je décris ici, c'est une sûreté qui tenait à ce que chacun s'en souvienne,
// dans un fichier qui donnait deux consignes opposées sur qui devait se souvenir.
//
// Et le produit s'était déjà brûlé exactement là : au lot v126, `emailShell`
// attendait un aperçu « déjà échappé » ; deux appelants sur quatre l'avaient
// oublié, dont celui du formulaire de contact — un nom saisi par n'importe qui
// sur internet, dans un e-mail que l'équipe reçoit. La coquille a cessé ce
// jour-là de faire porter ce contrat à ses appelants. Les trois primitives, non.
//
// ── La classe ──────────────────────────────────────────────────────────────
//
// **Ce qui est du TEXTE est échappé là où il est posé, une fois.** Le titre et
// le libellé d'un bouton sont du texte : ils sont échappés dans la primitive.
// L'adresse d'un bouton est une adresse : son schéma est vérifié par la règle
// du produit (`lib/schemaDeLien`, partagée avec les liens d'une page publiée
// depuis ce lot). `emailP` reste du HTML — c'est sa raison d'être, ses appelants
// lui passent vraiment un chiffre en gras ou un lien — et il est nommé comme
// l'exception, au lieu d'être noyé dans une consigne générale.
//
// La garde ci-dessous ne lit pas le code : elle FABRIQUE chaque e-mail du
// produit avec une charge hostile dans chaque champ qu'une personne remplit, et
// regarde ce qui sort.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { emailShell, emailH1, emailP, emailButton, texteDeLEmail } from "./emailLayout"
import { escapeHtml } from "./escapeHtml"
import { schemaAdmis, SCHEMAS_ADMIS } from "./schemaDeLien"
import { emailPremierScan, contenuPremierScan } from "./premierScan"
import { buildSubscriptionEmail } from "./subscriptionEmail"

/** Ce qu'un visiteur mal intentionné tape dans un champ. */
const PIEGE = '<img src=x onerror="alert(1)">"><b>PIEGE</b>'
/** Ce qui prouve que la charge est sortie NUE. */
const NU = /<img src=x onerror|<b>PIEGE<\/b>/

describe("garde de classe : ce qu'un e-mail cite d'une personne sort échappé", () => {
  it("les primitives de TEXTE échappent elles-mêmes", () => {
    expect(emailH1(PIEGE), "le titre").not.toMatch(NU)
    expect(emailButton(PIEGE, "https://qrowg.com"), "le libellé d'un bouton").not.toMatch(NU)
    expect(emailButton("Voir", PIEGE), "l'adresse d'un bouton").not.toMatch(NU)
    expect(emailShell({ preheader: PIEGE, content: "x" }), "l'aperçu (lot v126)").not.toMatch(NU)
    expect(emailShell({ brandName: PIEGE, content: "x" }), "le nom de marque (lot v126)").not.toMatch(NU)
    // …et le texte reste lisible : échapper n'est pas effacer.
    expect(emailH1("Bar & Co")).toContain("Bar &amp; Co")
    expect(texteDeLEmail(emailH1("Bar & Co")), "et le lecteur lit le vrai nom").toContain("Bar & Co")
  })

  it("`emailP` reste du HTML — c'est l'exception, et elle est nommée", () => {
    // Ses appelants lui passent VRAIMENT du HTML : l'échapper afficherait les
    // balises au lieu du chiffre en gras. La responsabilité reste donc chez
    // l'appelant, et le fichier le dit à cet endroit précis.
    expect(emailP("<strong>12</strong> scans"), "le HTML voulu passe").toContain("<strong>12</strong>")
    const src = fs.readFileSync(path.join(__dirname, "emailLayout.ts"), "utf8")
    expect(src, "et c'est écrit juste au-dessus").toMatch(/PARAGRAPHE : du HTML, volontairement/)
  })

  it("les e-mails que le produit fabrique, avec une charge hostile dans chaque champ", () => {
    const nus: string[] = []
    const essai = (nom: string, html: string) => { if (NU.test(html)) nus.push(nom) }
    essai("premierScan(nom)", emailPremierScan({ nom: PIEGE, titrePage: "ok" }))
    essai("premierScan(titre de page)", emailPremierScan({ nom: "ok", titrePage: PIEGE }))
    essai("contenuPremierScan", contenuPremierScan({ nom: PIEGE, titrePage: PIEGE }))
    essai("abonnement(nom)", buildSubscriptionEmail({ name: PIEGE, plan: "pro", billing: "monthly" }).html)
    essai("abonnement(essai)", buildSubscriptionEmail({ name: PIEGE, plan: "pro", billing: "yearly", trialDays: 14 }).html)
    expect(nus, "une charge hostile ne sort jamais nue").toEqual([])
  })

  it("le détecteur sait dire oui — sinon il ne dirait jamais non", () => {
    // Sans ceci, une garde qui ne voit plus rien passerait pour une garde verte.
    expect(NU.test(`<h1>${PIEGE}</h1>`), "la charge nue est reconnue").toBe(true)
    expect(NU.test(`<h1>${escapeHtml(PIEGE)}</h1>`), "…et la charge échappée ne l'est pas").toBe(false)
    expect(emailP(PIEGE), "emailP, lui, la laisse passer — et c'est voulu").toMatch(NU)
  })
})

describe("l'adresse d'un bouton passe par la règle du produit", () => {
  it("un schéma inconnu ne devient pas un lien — le message reste lisible", () => {
    for (const mauvaise of ["javascript:alert(1)", "vbscript:msgbox(1)", "data:text/html,<script>alert(1)</script>", ""]) {
      const html = emailButton("Voir mes statistiques", mauvaise)
      expect(html, `« ${mauvaise.slice(0, 30)} » ne fait pas un lien`).not.toContain("<a href")
      expect(html, "…et le libellé reste là").toContain("Voir mes statistiques")
    }
  })

  it("les adresses des onze boutons du produit passent toutes", () => {
    for (const bonne of [
      "https://qrowg.com/dashboard/analytics", "https://qrowg.com/dashboard/qr-link",
      "https://qrowg.com/dashboard/leads", "https://qrowg.com/upgrade",
      "https://qrowg.com/team/accept?token=abc", "mailto:contact@qrowg.com", "tel:+33123456789",
    ]) {
      expect(schemaAdmis(bonne), bonne).toBe(true)
      expect(emailButton("Voir", bonne), bonne).toContain(`<a href="${bonne.replace(/&/g, "&amp;")}"`)
    }
  })

  it("la règle des schémas est à UN endroit — trois copies avant ce lot", () => {
    const partagee = fs.readFileSync(path.join(__dirname, "schemaDeLien.ts"), "utf8")
    expect(partagee).toContain("SCHEMAS_ADMIS")
    expect(SCHEMAS_ADMIS.source, "quatre schémas, et rien d'autre").toBe("^(https?:|mailto:|tel:|sms:)")
    // Les trois endroits la prennent là, ils ne la réécrivent plus.
    const racine = path.join(__dirname, "..")
    for (const [fichier, quoi] of [
      ["app/dashboard/builder/types.ts", "les liens d'une page publiée"],
      ["app/dashboard/builder/shared-renderer/models/packsEtTarifs.ts", "les cartes de tarifs"],
      ["lib/emailLayout.ts", "les boutons des e-mails"],
    ] as const) {
      const src = fs.readFileSync(path.join(racine, fichier), "utf8")
      expect(src, `${quoi} : importe la règle`).toMatch(/from "(@\/lib|\.)\/schemaDeLien"/)
      expect(src, `${quoi} : ne la réécrit pas`).not.toMatch(/=\s*\/\^\(https\?\|mailto/)
    }
  })

  it("la règle sait dire non — et laisse passer ce qui n'a pas de schéma", () => {
    expect(schemaAdmis("javascript:alert(1)")).toBe(false)
    expect(schemaAdmis("file:///etc/passwd")).toBe(false)
    expect(schemaAdmis("data:text/html,x")).toBe(false)
    expect(schemaAdmis("https://qrowg.com")).toBe(true)
    // Une adresse sans schéma ne peut rien exécuter : elle passe, et c'est à
    // l'appelant de la compléter (`destinationUtile` le fait pour les pages).
    expect(schemaAdmis("exemple.fr/page"), "un domaine nu").toBe(true)
    expect(schemaAdmis("/interne"), "un chemin interne").toBe(true)
    expect(schemaAdmis(""), "rien du tout").toBe(false)
    expect(schemaAdmis(42 as never), "ce qui n'est pas du texte").toBe(false)
  })
})

describe("le balayage voit bien les e-mails — sinon il ne prouve rien", () => {
  /** Les fichiers du produit qui fabriquent un e-mail. */
  function fabricants(): string[] {
    const out: string[] = []
    const racine = path.join(__dirname, "..")
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "node_modules" && n !== ".next") marcher(p) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n) && /emailShell\(/.test(fs.readFileSync(p, "utf8"))) out.push(p)
      }
    }
    marcher(racine)
    return out.map(p => path.relative(racine, p).split(path.sep).join("/"))
  }

  it("les neuf envois sont bien là, et aucun ne pré-échappe un titre", () => {
    const f = fabricants()
    expect(f.length, "des fabricants d'e-mail dans le produit").toBeGreaterThanOrEqual(8)
    const racine = path.join(__dirname, "..")
    const fautifs: string[] = []
    for (const rel of f) {
      const src = fs.readFileSync(path.join(racine, rel), "utf8")
      // Un appelant qui échappe AVANT `emailH1` ferait « Bar &amp;amp ; Co ».
      for (const m of src.matchAll(/emailH1\(([^\n]*)\)/g))
        if (/\besc\(|escapeHtml\(/.test(m[1])) fautifs.push(`${rel} → ${m[1].slice(0, 46)}`)
    }
    expect(fautifs, "le titre est échappé par la primitive, une seule fois").toEqual([])
  })
})
