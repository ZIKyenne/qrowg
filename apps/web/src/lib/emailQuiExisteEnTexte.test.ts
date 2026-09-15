// Un e-mail que le produit envoie existe aussi en texte — garde de classe.
//
// Relevé du 15 septembre. Le produit envoie **quatorze** e-mails — neuf par le
// client Resend, cinq par appel direct à son API :
//
//   le message reçu sur une page          l'accusé de réception au visiteur
//   le premier scan d'un QR               le rapport hebdomadaire
//   le rapport programmé                  la bienvenue
//   l'abonnement (deux fois)              l'invitation d'équipe
//   le formulaire de contact              la relance à 48 h
//   l'expiration d'un QR                  l'alerte de quota
//   les QR imprimés coupés
//
// **Aucun n'avait de version texte.** `html`, et rien d'autre.
//
// Un courriel HTML sans alternative texte est un courriel qui :
//
//  · part avec un point de spam en plus — c'est une règle de filtrage
//    universelle, et le produit vit de ce que le message ARRIVE. Le pire cas est
//    celui qui rapporte : « vous avez reçu un message sur votre page » ;
//  · s'affiche vide, ou en balises brutes, partout où le texte est préféré —
//    montre connectée, client d'entreprise verrouillé, lecteur d'écran en mode
//    texte, connexion qui refuse de charger les images ;
//  · laisse l'aperçu de la boîte de réception se remplir tout seul, souvent avec
//    « QR owg », le premier texte que le gabarit rencontre.
//
// La classe : **un e-mail que le produit envoie existe aussi en texte.**
//
// Et la version texte est **tirée du même HTML**, pas écrite à côté : une
// seconde rédaction dérive, et un jour les deux ne disent plus la même chose.
//
// ── Et en écrivant cette garde, elle a trouvé autre chose ────────────────────
//
// `typoFr` — la règle qui met les espaces insécables du français — ne connaissait
// pas les entités HTML. Le `;` qui termine une entité ressemble à une ponctuation
// française, et la règle glissait une espace fine devant :
//
//     escapeHtml("Bar & Co")          →  Bar &amp; Co        (juste)
//     emailH1("… sur Bar &amp; Co")   →  Bar &amp ; Co       (cassé)
//
// Le commerçant recevait un e-mail intitulé « Nouveau message sur Bar &amp ; Co ».
// Son propre nom, abîmé par la règle censée bien écrire son français — et abîmé
// **uniquement** quand il contient une esperluette, un guillemet, une apostrophe :
// exactement ce que `escapeHtml` produit à partir de ce qu'il a tapé.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { texteDeLEmail, emailShell, emailH1, emailP, emailButton } from "./emailLayout"
import { typoFr } from "./typographieFr"
import { escapeHtml } from "./escapeHtml"

const SRC = path.join(__dirname, "..")

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

/** Chaque envoi du produit : par le client Resend, ou par son API directe. */
function envois(): { fichier: string; ligne: number; corps: string }[] {
  const out: { fichier: string; ligne: number; corps: string }[] = []
  for (const f of fichiers()) {
    const s = fs.readFileSync(f, "utf8")
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    for (const m of s.matchAll(/emails\.send\(|fetch\("https:\/\/api\.resend\.com\/emails"/g)) {
      out.push({ fichier: rel, ligne: s.slice(0, m.index!).split("\n").length, corps: s.slice(m.index!, m.index! + 1000) })
    }
  }
  return out
}

describe("la version texte, tirée du même HTML", () => {
  it("un lien mène quelque part — le libellé seul ne mène nulle part", () => {
    const t = texteDeLEmail(emailButton("Voir mes messages", "https://qrowg.com/dashboard/leads"))
    expect(t).toContain("Voir mes messages (https://qrowg.com/dashboard/leads)")
    // Un lien dont le libellé EST l'adresse ne se répète pas.
    expect(texteDeLEmail('<a href="https://qrowg.com">https://qrowg.com</a>')).toBe("https://qrowg.com")
  })

  it("aucune balise ne survit, et les entités redeviennent des lettres", () => {
    const html = emailShell({ preheader: "Aperçu caché", content: emailH1("Bonjour&nbsp;Jean") + emailP("Un &amp; deux &rsquo;trois&rsquo;") })
    const t = texteDeLEmail(html)
    expect(t, "pas une balise").not.toMatch(/<[a-z/]/i)
    expect(t).toContain("Un & deux ’trois’")
    expect(t, "l'aperçu redit le sujet : il n'a rien à faire dans le corps").not.toContain("Aperçu caché")
  })

  it("elle garde la mise en lignes, sans trous", () => {
    const t = texteDeLEmail(emailH1("Titre") + emailP("Une phrase.") + emailP("Une autre."))
    expect(t.split("\n")[0]).toBe("Titre")
    expect(t).toContain("Une phrase.")
    expect(t, "jamais trois sauts de ligne d'affilée").not.toMatch(/\n\n\n/)
    expect(t.startsWith(" ") || t.endsWith(" "), "ni espace au début ni à la fin").toBe(false)
  })

  it("et elle ne lève jamais — un envoi ne doit pas échouer à cause de son texte", () => {
    for (const v of ["", null, undefined, 42, {}, "<p>pas fermé", "<a href=>x</a>"]) {
      expect(() => texteDeLEmail(v as string)).not.toThrow()
    }
    expect(texteDeLEmail("" as string)).toBe("")
  })

  it("sur un vrai e-mail du produit, elle dit ce que dit la page", () => {
    const html = emailShell({
      preheader: "Nouveau message sur votre page",
      content: `${emailH1("Nouveau message")}${emailP("Jean vous a écrit.")}${emailButton("Voir dans mes messages →", "https://qrowg.com/dashboard/leads")}`,
    })
    const t = texteDeLEmail(html)
    expect(t).toContain("Nouveau message")
    expect(t).toContain("Jean vous a écrit.")
    expect(t).toContain("https://qrowg.com/dashboard/leads")
    expect(t, "et le pied de page mène toujours au réglage").toContain("https://qrowg.com/dashboard/settings")
    expect(t.length, "un corps qui dit vraiment quelque chose").toBeGreaterThan(60)
  })
})

describe("le nom du commerçant arrive entier", () => {
  it("une entité HTML traverse la règle de typographie sans être touchée", () => {
    expect(typoFr("Bar &amp; Co")).toBe("Bar &amp; Co")
    expect(typoFr("Menu &laquo; été &raquo; et plus")).toBe("Menu &laquo; été &raquo; et plus")
    expect(typoFr("Trois &#38; quatre")).toBe("Trois &#38; quatre")
    expect(typoFr("Cinq &#x26; six")).toBe("Cinq &#x26; six")
  })

  it("et la règle fait toujours son travail sur le reste de la phrase", () => {
    // Le remède ne doit pas éteindre le mal qu'il soigne.
    const t = typoFr("Vraiment ? Oui ! 80% et 12€ et « ceci » : voilà")
    expect(t, "plus une seule espace ordinaire devant un signe double").not.toMatch(/ [;!?%€»]/)
    expect(t, "ni un signe collé à son mot").not.toMatch(/[^\s\u202F\u00A0][;!?]|\d[%€]/)
    expect(t, "et la phrase est intacte").toContain("voilà")
    expect(typoFr(typoFr("Vraiment ? Oui !")), "idempotente").toBe(typoFr("Vraiment ? Oui !"))
  })

  it("le cas réel : un nom échappé, posé dans un e-mail", () => {
    const titre = emailH1(`Nouveau message sur ${escapeHtml("Bar & Co")}`)
    expect(titre, "l'entité est restée entière").toContain("Bar &amp; Co")
    expect(titre).not.toContain("&amp ;")
    // Et une fois rendu en texte, le lecteur lit bien le nom.
    expect(texteDeLEmail(titre)).toContain("Bar & Co")
  })

  it("aucune entité cassée ne subsiste dans les gabarits d'e-mail", () => {
    const ecrans = [
      emailShell({ preheader: escapeHtml("Menu « été » & terrasse"), content: emailP(escapeHtml("L'Épi & Co")) }),
      emailH1(escapeHtml("Café & Thé")),
      emailButton(escapeHtml("Voir « tout » & plus"), "https://qrowg.com"),
    ]
    for (const e of ecrans) expect(e, e.slice(0, 60)).not.toMatch(/&[a-zA-Z#0-9]+[\s\u202F\u00A0];/)
  })
})

describe("garde de classe : aucun envoi n'est muet en texte", () => {
  it("chaque e-mail du produit porte sa version texte", () => {
    const fautes = envois()
      .filter(e => !/\btext:/.test(e.corps))
      .map(e => `${e.fichier}:${e.ligne}`)
    expect(fautes, "ajouter text: texteDeLEmail(html)").toEqual([])
  })

  it("et elle est tirée du HTML, jamais réécrite à côté", () => {
    const fautes = envois()
      .filter(e => /\btext:/.test(e.corps) && !/text:\s*texteDeLEmail\(/.test(e.corps))
      .map(e => `${e.fichier}:${e.ligne}`)
    expect(fautes, "deux rédactions finissent par ne plus dire la même chose").toEqual([])
  })

  it("le gabarit garde son aperçu de boîte de réception", () => {
    // Sans lui, l'aperçu se remplit du premier texte rencontré — « QR owg ».
    const html = emailShell({ preheader: "Trois scans hier", content: emailP("x") })
    expect(html).toContain("display:none")
    expect(html).toContain("Trois scans hier")
  })

  it("le balayage voit bien les envois — sinon il ne prouve rien", () => {
    const tous = envois()
    expect(tous.length, "des envois dans le produit").toBeGreaterThan(12)
    expect(new Set(tous.map(e => e.fichier)).size, "et répartis sur plusieurs chemins").toBeGreaterThan(8)
    expect(tous.filter(e => /api\.resend\.com/.test(e.corps)).length, "dont des appels directs à l'API").toBeGreaterThan(3)
  })
})
