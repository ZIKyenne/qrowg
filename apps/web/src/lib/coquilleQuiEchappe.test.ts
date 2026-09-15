// Une coquille qui reçoit du texte l'échappe elle-même — garde de classe.
//
// Relevé du 15 septembre. `emailShell` prend quatre entrées. Deux sont du HTML
// par nature — `content` et `footer`, que l'appelant fabrique avec `emailH1`,
// `emailP`, `emailButton`. **Deux sont du texte** : l'aperçu de boîte de
// réception (`preheader`) et le nom de la marque (`brandName`).
//
// Les deux étaient injectées **brutes** dans le HTML, en comptant sur l'appelant :
//
//   notifierProprietaireLead   preheader: `… « ${esc(page.title)} »`      échappé
//   reports/send               preheader: `… · ${esc(params.period)}`     échappé
//   api/team                   preheader: `${inviter} vous invite …`      NON
//   api/contact                preheader: `Message de ${cleanName}`       NON
//
// **Deux sur quatre.** Et celui du formulaire de contact porte un nom saisi par
// n'importe qui sur internet, dans un e-mail que l'équipe reçoit. L'aperçu vit
// dans un `<div style="display:none">` : un nom qui contient `</div>` referme le
// bloc, et tout ce qui suit devient du HTML visible — un lien, une image, un faux
// message — **dans un courriel qui vient vraiment de QRowg**.
//
// `brandName` portait la même faiblesse sous forme de commentaire : « (deja
// echappe) ». Un contrat que l'appelant peut oublier n'est pas une protection,
// c'est une note d'intention.
//
// La classe : **une coquille qui reçoit du texte l'échappe elle-même.** On ne
// répare pas deux appels : on retire le choix.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { emailShell, emailH1, emailP, emailButton, texteDeLEmail } from "./emailLayout"
import { escapeHtml } from "./escapeHtml"

const SRC = path.join(__dirname, "..")
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

/** Une charge qui referme le bloc caché et pose du HTML visible derrière. */
const HOSTILE = `Bar & Co</div><a href="http://mechant.tld">Cliquez ici</a>`

describe("ce que la coquille reçoit comme texte", () => {
  it("un aperçu hostile ressort inerte", () => {
    const html = emailShell({ preheader: HOSTILE, content: emailP("Bonjour.") })
    expect(html, "le lien injecté ne doit pas être un lien").not.toMatch(/<a href="http:\/\/mechant\.tld"/)
    expect(html, "il est là, mais comme du texte").toContain("&lt;a href=&quot;http://mechant.tld&quot;&gt;")
    expect(html, "et le bloc caché n'est pas refermé par la charge").toContain("&lt;/div&gt;")
  })

  it("le nom de la marque aussi — il n'est plus « déjà échappé » par contrat", () => {
    const html = emailShell({ preheader: "x", brandName: HOSTILE, content: emailP("y") })
    expect(html).not.toMatch(/<a href="http:\/\/mechant\.tld"/)
    // Et un nom ordinaire arrive entier, lu comme il s'écrit.
    const propre = emailShell({ preheader: "x", brandName: "Bar & Co", content: emailP("y") })
    expect(propre).toContain("Bar &amp; Co")
    expect(texteDeLEmail(propre)).toContain("Bar & Co")
  })

  it("et échapper deux fois abîme le nom — c'est pourquoi les appelants ne le font plus", () => {
    // Ce test ne protège pas : il montre ce que la garde de balayage empêche.
    // Une protection posée deux fois n'est pas deux fois plus sûre ; le
    // commerçant lirait « Bar &amp;amp; Co » dans l'aperçu de sa boîte.
    const double = emailShell({ preheader: escapeHtml("Bar & Co"), content: emailP("x") })
    expect(double, "la double protection se voit").toContain("&amp;amp;")
    const simple = emailShell({ preheader: "Bar & Co", content: emailP("x") })
    expect(simple, "une seule, et le nom se lit").toContain("Bar &amp; Co")
    expect(simple).not.toContain("&amp;amp;")
  })

  it("un aperçu tient sur une ligne, et ne devient pas un roman", () => {
    const html = emailShell({ preheader: "Trois\nlignes\tet des espaces   ", content: emailP("x") })
    const bloc = /display:none[^>]*">([^<]*)</.exec(html)?.[1] ?? ""
    expect(bloc, "ni retour à la ligne ni tabulation").toBe("Trois lignes et des espaces")
    const long = emailShell({ preheader: "a".repeat(400), content: emailP("x") })
    const coupe = /display:none[^>]*">([^<]*)</.exec(long)?.[1] ?? ""
    expect(coupe.length, "les clients en montrent 100 à 140 signes").toBeLessThanOrEqual(160)
  })

  it("mais `content` reste du HTML — c'est sa raison d'être", () => {
    const html = emailShell({ preheader: "x", content: `${emailH1("Titre")}${emailButton("Ouvrir", "https://qrowg.com")}` })
    expect(html, "le titre est bien rendu, pas affiché en balises").toContain("<h1")
    expect(html).toContain('href="https://qrowg.com"')
  })
})

describe("garde de classe : le texte s'échappe à la source", () => {
  it("la coquille échappe ses deux entrées de texte", () => {
    const src = lire("lib/emailLayout.ts")
    expect(src).toContain("escapeHtml(brandName)")
    expect(src, "l'aperçu est nettoyé puis échappé, dans la coquille").toMatch(/const preheader = escapeHtml\(/)
  })

  it("et plus aucun appelant ne s'en charge — sinon l'un des deux abîme le nom", () => {
    const fautes: string[] = []
    for (const f of fichiers()) {
      const s = fs.readFileSync(f, "utf8")
      const rel = path.relative(SRC, f).split(path.sep).join("/")
      if (rel === "lib/emailLayout.ts") continue
      for (const m of s.matchAll(/(preheader|brandName):\s*([^\n]*)/g)) {
        if (/\b(esc|escapeHtml)\(/.test(m[2])) fautes.push(`${rel} — ${m[1]}`)
      }
    }
    expect(fautes, "la coquille échappe déjà : le faire deux fois donne « &amp;amp; »").toEqual([])
  })

  it("les quatre appelants qui portaient du contenu de quelqu'un sont couverts", () => {
    // Deux échappaient, deux non. Aujourd'hui aucun n'a à y penser.
    for (const [f, morceau] of [
      ["app/api/contact/route.ts", "preheader: `Message de ${cleanName}`"],
      ["app/api/team/route.ts", "preheader: `${inviter} vous invite sur QRowg`"],
      ["lib/notifierProprietaireLead.ts", "preheader: `${label} sur votre page « ${page.title} »`"],
      ["app/api/reports/send/route.ts", "preheader: `Vos performances QRowg · ${params.period}`"],
    ] as const) {
      expect(lire(f), f).toContain(morceau)
    }
  })

  it("le balayage voit bien les coquilles — sinon il ne prouve rien", () => {
    let appels = 0
    for (const f of fichiers()) appels += (fs.readFileSync(f, "utf8").match(/emailShell\(/g) ?? []).length
    expect(appels, "des e-mails qui passent par la coquille").toBeGreaterThan(10)
    expect(lire("lib/emailLayout.ts")).toContain('import { escapeHtml } from "./escapeHtml"')
  })
})
