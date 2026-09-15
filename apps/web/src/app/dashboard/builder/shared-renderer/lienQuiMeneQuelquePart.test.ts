// Un lien sans destination ne se publie pas — garde de classe.
//
// Relevé du 15 septembre. Le rendu public legacy porte, en tête de fichier, une
// phrase écrite après coup :
//
//   « Le rendu public repliait chaque href sur une ancre morte à trente
//     endroits. Le commerçant remplit « Commander », oublie l'adresse — et la
//     page publiait quand même un bouton bien visible : le visiteur clique, la
//     page se recharge, rien ne se passe. Il en conclut que le commerce ne
//     fonctionne pas. Un bouton absent est moins grave. »
//
// Ce défaut a été corrigé là-bas : `LienPublic` est utilisé trente fois dans
// `renduLegacy`. **Puis le rendu partagé l'a réintroduit douze fois.**
//
//   cta_button · limited_offer · tickets_left · packs · quick_contact
//   CarteMembre · product_catalog · favorite_links · discography · concerts
//   app_download (deux fois)
//
// Tous écrivaient `href={x.link.href || "#"}`. Or le modèle dit déjà la vérité :
// `CtaLink.href` est `string | null` — nullable exprès, pour que la vue puisse
// décider de ne rien publier. Et six de ces douze appellent `SmartCta`, un
// composant dont la première ligne est `if (u.mode === "editor" || !href)
// return <div aria-disabled>` : **ils passaient « # » à un composant qui savait
// exactement quoi faire de l'absence.** Le repli désarmait la protection.
//
// Trois modèles mentaient à la source, en annonçant `visible: true` pour un lien
// dont l'adresse pouvait être nulle : `appDownload`, `compteursEtOffres`,
// `contactEtAction`.
//
// La classe : **un lien sans destination ne se publie pas** — et l'absence se
// transmet, elle ne se remplace pas par un caractère.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { appDownloadViewModel } from "./models/appDownload"
import { ctaOptionnel } from "./models/compteursEtOffres"
import { destinationUtile } from "../types"

const RENDU = __dirname
const SRC = path.join(__dirname, "../../../..")

function fichiers(racine: string, ext = /\.tsx$/): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) marcher(p)
      else if (ext.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(racine)
  return out
}

/** Les vues du rendu public : celles qui posent une ancre sur la page publiée. */
function vuesPubliques(): string[] {
  return [
    ...fichiers(RENDU),
    ...fichiers(path.join(SRC, "app/[slug]")),
  ]
}

describe("l'absence de destination se transmet", () => {
  it("un modèle n'annonce pas « visible » pour un lien qui ne mène nulle part", () => {
    const sans = appDownloadViewModel({ ios_url: "", android_url: "" })
    expect(sans.ios, "pas d'adresse, pas de lien").toBeNull()
    // « # » passait pour une adresse : `extHref` normalise, il ne juge pas.
    const diese = appDownloadViewModel({ ios_url: "#" })
    expect(diese.ios, "« # » ne mène nulle part : ce n'est pas un lien").toBeNull()
    expect(diese.visible, "et sans lien, pas de bloc").toBe(false)
    const faux = appDownloadViewModel({ ios_url: "javascript:alert(1)" })
    expect(faux.ios, "ni une adresse au schéma inconnu").toBeNull()
    const avec = appDownloadViewModel({ ios_url: "apps.apple.com/app/x" })
    expect(avec.ios?.href).toBe("https://apps.apple.com/app/x")
    expect(avec.ios?.visible, "une adresse, un lien visible").toBe(true)
  })

  it("et un bouton d'appel à l'action sans adresse le dit aussi", () => {
    const vide = ctaOptionnel({ cta_label: "Commander", cta_url: "" }, "cta")
    expect(vide?.link.href, "le libellé est là, l'adresse non").toBeNull()
    expect(vide?.link.visible, "le modèle ne promet pas un bouton qui ne mène nulle part").toBe(false)
    const plein = ctaOptionnel({ cta_label: "Commander", cta_url: "monsite.fr" }, "cta")
    expect(plein?.link.visible).toBe(true)
  })

  it("une adresse au schéma inconnu est une absence, pas une adresse fabriquée", () => {
    expect(destinationUtile("javascript:alert(1)")).toBeNull()
    expect(destinationUtile("data:text/html,<script>")).toBeNull()
    expect(destinationUtile("   ")).toBeNull()
    expect(destinationUtile("#")).toBeNull()
    expect(destinationUtile("monsite.fr"), "et une vraie adresse passe").toBe("https://monsite.fr")
  })
})

describe("garde de classe : aucune ancre morte sur une page publiée", () => {
  it("plus un seul href ne se replie sur « # »", () => {
    const fautes: string[] = []
    for (const f of vuesPubliques()) {
      const s = fs.readFileSync(f, "utf8")
      s.split("\n").forEach((l, i) => {
        if (/^\s*(\/\/|\*)/.test(l)) return
        if (/href=\{[^}]*\|\|\s*"#"\}/.test(l)) {
          fautes.push(`${path.relative(SRC, f).split(path.sep).join("/")}:${i + 1}`)
        }
      })
    }
    expect(fautes, "laisser l'absence remonter : le composant sait ne rien publier").toEqual([])
  })

  it("le composant partagé accepte l'absence — c'est pour ça qu'il la gère", () => {
    const src = fs.readFileSync(path.join(RENDU, "primitives/LayoutSurface.tsx"), "utf8")
    expect(src, "le type dit la vérité").toContain("href: string | null")
    expect(src, "et le comportement suit").toContain('if (u.mode === "editor" || !href) return <div aria-disabled="true"')
  })

  it("et celui des CTA refuse une adresse que la règle n'admet pas", () => {
    const src = fs.readFileSync(path.join(RENDU, "primitives/BlockCtaLink.tsx"), "utf8")
    expect(src).toContain("const cible = destinationUtile(href)")
    expect(src).toContain("if (!cible) return null")
  })

  it("le balayage voit bien les ancres — sinon il ne prouve rien", () => {
    let ancres = 0, fichiersVus = 0
    for (const f of vuesPubliques()) {
      fichiersVus++
      ancres += (fs.readFileSync(f, "utf8").match(/<a\b[^>]*href=\{/g) ?? []).length
    }
    expect(fichiersVus, "des vues publiques").toBeGreaterThan(80)
    expect(ancres, "et des ancres dedans").toBeGreaterThan(40)
  })
})
