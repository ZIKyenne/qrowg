// Une adresse fabriquée n'est pas une adresse — garde de classe.
//
// ── La phrase existait, et son test aussi ──────────────────────────────────
//
// Le lot du 15 septembre (`lienQuiMeneQuelquePart`) a écrit, noir sur blanc :
//
//     « une adresse au schéma inconnu est une absence, pas une adresse
//       fabriquée »
//
// et l'a même éprouvée : `destinationUtile("javascript:alert(1)")` rend `null`.
// Le modèle `appDownload` porte la raison en tête de fichier, du même jour :
//
//     « Le lien passait par `extHref`, qui NORMALISE mais ne juge pas : « # »
//       en ressort tel quel, et le bouton « App Store » partait vers nulle
//       part. Il passe par `destinationUtile`, la règle qui décide si une
//       adresse mène quelque part. »
//
// Trois modèles ont été convertis ce jour-là. **Dix-neuf autres ont continué
// d'appeler `extHref`** — et huit d'entre eux écrivaient en commentaire « href
// durci via extHref », c'est-à-dire exactement le contraire de ce que le
// produit venait de découvrir. La phrase était juste ; elle n'avait pas fini de
// s'appliquer.
//
// ── Ce que la page publiait, mesuré ────────────────────────────────────────
//
// En posant `ftp://exemple.fr/x` dans chaque champ d'adresse déclaré, et en
// rendant les cinquante-neuf blocs partagés qui en ont un :
//
//     treize blocs publiaient  <a href="https://ftp://exemple.fr/x">
//
// `extHref` ne refuse rien : ce qui n'a pas de schéma admis se voit préfixer
// « https:// ». Le lien n'est pas exécutable — c'est ce que le lot v159 avait
// vérifié — mais il ne mène nulle part, et il est publié comme un vrai bouton.
//
// ── La contradiction, et c'est elle qui rend le défaut visible ─────────────
//
// `boutonsSansLien`, la liste d'avant publication, appelle `destinationUtile`
// depuis toujours. Elle annonçait donc au commerçant :
//
//     « Le bouton « Réserver » n'a pas de lien : il ne sera pas publié. »
//
// …et la page le publiait quand même. Le produit se contredisait, et c'était
// l'alerte qui disait vrai. Les deux côtés disent enfin la même chose.
//
// ── Où la règle est posée ──────────────────────────────────────────────────
//
// Le produit a TROIS primitives de lien. Deux jugeaient depuis toujours —
// `LienPublic` (rendu legacy) et `PublicCtaLink` (blocs d'action). La
// troisième, `SmartCta`, ne jugeait pas : elle dessinait une ancre dès que la
// chaîne reçue n'était pas vide. Elle juge maintenant, une fois, pour que
// personne n'ait à y penser — et les modèles rendent une adresse déjà jugée,
// de sorte que le filet du composant ne serve qu'aux étourderies à venir.

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"
import { BLOCK_DEFS } from "./blockDefs"
import { boutonsSansLien } from "./boutonSansLien"
import { destinationUtile } from "./types"
import { SHARED_RENDERER_BLOCKS } from "./shared-renderer/architecture"

const RACINE = path.join(__dirname, "shared-renderer")
const MODELES = path.join(RACINE, "models")
const REG = fs.readFileSync(path.join(RACINE, "publicRegistry.tsx"), "utf8")

function adaptersPublics(): Record<string, [string, string]> {
  const parNom: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/const (Public\w+) = dynamic\(\(\) => import\("\.\/blocks\/([^"]+)"\)\.then\(m => m\.(\w+)\)\)/g))
    parNom[m[1]] = [m[2], m[3]]
  const out: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/^\s{2}([a-z0-9_]+): (Public\w+),/gm)) if (parNom[m[2]]) out[m[1]] = parNom[m[2]]
  return out
}

const theme: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const ctx: any = { theme, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {} }

async function rendu(chemin: string, nom: string, contenu: Record<string, unknown>): Promise<string> {
  const mod = (await import(/* @vite-ignore */ `./shared-renderer/blocks/${chemin}`)) as Record<string, ComponentType<never>>
  const C = mod[nom]
  if (!C) return ""
  try { return renderToStaticMarkup(createElement(C as never, { content: contenu, ctx } as never)) } catch { return "" }
}

/** Une adresse que le produit refuse, et qui ne ressemble pas à une absence. */
const REFUSEE = "ftp://exemple.fr/x"
/** La même, mais réelle : sans elle, un produit qui ne publierait plus AUCUN
 *  lien passerait ce balayage avec les honneurs. */
const ADMISE = "https://exemple.fr/reserver"

const estChampDAdresse = (k: string) => /url$/.test(k) || /link$/.test(k) || k === "src" || k === "href"
const garniture = (k: string, adresse: string) => estChampDAdresse(k) ? adresse
  : /(^|_)(img|image|photo|cover|avatar|logo)\d*$/.test(k) ? "https://exemple.supabase.co/a.png"
  : /(^|_)(emoji|icon)\d*$/.test(k) ? "★" : "Réel"

function contenuGarni(type: string, adresse: string): Record<string, string> | null {
  const champs = ((BLOCK_DEFS as Record<string, { fields?: { key: string }[] }>)[type]?.fields ?? []).map(f => f.key)
  if (!champs.some(estChampDAdresse)) return null
  const out: Record<string, string> = {}
  for (const k of champs) out[k] = garniture(k, adresse)
  return out
}

describe("garde de classe : aucun bloc partagé ne publie une adresse fabriquée", () => {
  it("balayage exécuté : un schéma refusé ne devient jamais un href", async () => {
    const fautifs: string[] = []
    let sondes = 0
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      const contenu = contenuGarni(type, REFUSEE)
      if (!contenu) continue
      sondes++
      const html = await rendu(chemin, nom, contenu)
      const fabriquees = html.match(/href="[^"]*ftp:[^"]*"/g) ?? []
      if (fabriquees.length) fautifs.push(`${type} : ${fabriquees.length} × ${fabriquees[0]}`)
    }
    expect(sondes, "des blocs qui déclarent une adresse").toBeGreaterThan(50)
    expect(fautifs, "« https://ftp://… » n'est pas une adresse, c'en est la fabrication").toEqual([])
  }, 180_000)

  it("…et le balayage n'est pas aveugle : les mêmes blocs publient une VRAIE adresse", async () => {
    // Le plancher du lot. Sans lui, le test précédent serait vert sur un produit
    // qui aurait cessé de publier le moindre lien — et c'est arrivé pendant ce
    // lot : un premier relevé, passé par `next/dynamic`, ne rendait rien du tout
    // et annonçait « zéro lien mort » avec aplomb.
    let liens = 0, blocsAvecLien = 0
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      const contenu = contenuGarni(type, ADMISE)
      if (!contenu) continue
      const n = ((await rendu(chemin, nom, contenu)).match(/href="https:\/\/exemple\.fr\/reserver"/g) ?? []).length
      liens += n
      if (n) blocsAvecLien++
    }
    expect(blocsAvecLien, "des blocs qui publient vraiment un lien").toBeGreaterThan(15)
    expect(liens, "et des ancres dedans").toBeGreaterThan(25)
  }, 180_000)

  it("exécuté : l'alerte et la page disent enfin la même chose", async () => {
    // Le défaut se voyait là : la liste d'avant publication annonçait que le
    // bouton ne partirait pas, et la page le publiait. Les deux côtés sont
    // maintenant interrogés sur le même contenu.
    const CAS: [string, string, string, Record<string, string>][] = [
      ["free_section", "free_section", "PublicFreeSection", { title: "Nos offres", cta_label: "Réserver", cta_url: REFUSEE }],
      ["image_text", "image_text", "PublicImageText", { title: "L'atelier", cta_label: "Voir", cta_url: REFUSEE }],
      ["overlay_card", "overlay_card", "PublicOverlayCard", { title: "Promo", cta_label: "En profiter", cta_url: REFUSEE }],
      ["banner_strip", "banner_strip", "PublicBannerStrip", { text: "Soldes", cta_label: "Voir", cta_url: REFUSEE }],
      ["split_panel", "split_panel", "PublicSplitPanel", { l_title: "Gauche", l_cta_label: "Aller", l_cta_url: REFUSEE }],
      ["stack_cards", "stack_cards", "PublicStackCards", { c1_title: "Carte", c1_label: "Ouvrir", c1_url: REFUSEE }],
    ]
    for (const [nom, chemin, comp, contenu] of CAS) {
      const html = await rendu(chemin, comp, contenu)
      expect(boutonsSansLien(chemin, contenu).length, `${nom} : l'alerte le signale`).toBeGreaterThan(0)
      expect(html, `${nom} : et la page ne le publie pas`).not.toContain("<a ")
      // Le libellé, lui, reste visible : rien n'est retiré au commerçant.
      expect(html, `${nom} : le bouton reste dessiné, inerte`).toContain(contenu[Object.keys(contenu).find(k => /label$/.test(k))!])
    }
  }, 120_000)
})

describe("la règle est posée là où on ne peut pas l'oublier", () => {
  const lire = (p: string) => fs.readFileSync(p, "utf8")

  it("les trois primitives de lien demandent au juge", () => {
    const PRIMITIVES: [string, string][] = [
      [path.join(RACINE, "primitives/LayoutSurface.tsx"), "SmartCta"],
      [path.join(RACINE, "primitives/BlockCtaLink.tsx"), "PublicCtaLink"],
      [path.join(__dirname, "..", "..", "[slug]", "renduLegacy.tsx"), "LienPublic"],
    ]
    for (const [f, quoi] of PRIMITIVES) {
      const src = lire(f)
      expect(src, `${quoi} appelle destinationUtile`).toMatch(/destinationUtile\(href\)/)
      expect(src, `${quoi} ne publie rien sans destination`).toMatch(/if \(!cible\)|\|\| !cible\)/)
    }
  })

  it("aucun modèle ne fabrique plus une adresse de lien", () => {
    const fautifs: string[] = []
    let vus = 0
    for (const n of fs.readdirSync(MODELES).sort()) {
      if (!n.endsWith(".ts") || /\.test\./.test(n)) continue
      vus++
      const src = lire(path.join(MODELES, n))
      for (const [i, l] of src.split("\n").entries()) {
        if (/^\s*(\/\/|\*)/.test(l)) continue          // les commentaires racontent l'histoire
        if (/\bextHref\(/.test(l)) fautifs.push(`${n}:${i + 1}`)
      }
    }
    expect(vus, "des modèles balayés").toBeGreaterThan(40)
    expect(fautifs, "`extHref` construit une adresse ; il n'en juge aucune").toEqual([])
  })

  it("le balayage sait dire non — sinon il ne dirait jamais oui", () => {
    // `extHref` existe toujours, et il a son usage : fabriquer l'adresse APRÈS
    // le jugement. C'est `destinationUtile` qui l'appelle, et c'est le seul.
    const types = lire(path.join(__dirname, "types.ts"))
    expect(types, "le juge fabrique, une fois qu'il a admis").toMatch(/const h = extHref\(u\)/)
    expect(destinationUtile("ftp://exemple.fr"), "un schéma hors liste").toBeNull()
    expect(destinationUtile("javascript:alert(1)")).toBeNull()
    expect(destinationUtile("#"), "une ancre vide").toBeNull()
    expect(destinationUtile("exemple.fr/page"), "…et une vraie adresse est fabriquée").toBe("https://exemple.fr/page")
    expect(destinationUtile("/mentions-legales"), "un chemin interne reste interne").toBe("/mentions-legales")
    expect(destinationUtile("#tarifs"), "une ancre nommée reste une ancre").toBe("#tarifs")
  })
})

describe("deux promesses trouvées par le même balayage", () => {
  it("`card_link` : pas de lien, pas de flèche", async () => {
    // Son en-tête dit « une grande carte entièrement cliquable ». Sans adresse,
    // la page publiait la carte, son cadre, son accent — et sa flèche, qui ne
    // menait nulle part. Le texte reste ; la promesse s'en va.
    const sans = await rendu("card_link", "PublicCardLink", { title: "Notre carte", text: "À découvrir" })
    expect(sans, "la carte est publiée").toContain("Notre carte")
    expect(sans, "aucune flèche").not.toContain("›")
    expect(sans, "et aucune ancre").not.toContain("<a ")
    const refusee = await rendu("card_link", "PublicCardLink", { title: "Notre carte", url: REFUSEE })
    expect(refusee, "un schéma refusé ne fait pas une flèche non plus").not.toContain("›")
    const avec = await rendu("card_link", "PublicCardLink", { title: "Notre carte", url: ADMISE })
    expect(avec, "avec une adresse, la flèche revient").toContain("›")
    expect(avec, "…et la carte est vraiment cliquable").toContain(`href="${ADMISE}"`)
  })

  it("`progress_bars` : aucun pourcentage que le commerçant n'a écrit", async () => {
    // `clampInt(raw, 0, 100, 0)` transformait « pas de chiffre » en ZÉRO : une
    // étiquette seule publiait « Taux de satisfaction — 0 % ». Le produit
    // affirmait à la place du commerçant, ce que la règle du 6 septembre
    // interdit (`availability` annonçait « Disponible »).
    // On regarde ce que le VISITEUR lit, pas le style : « width:0% » est un
    // trait de dessin, « 0 % » est une affirmation. Ma première rédaction les
    // confondait et s'interdisait à elle-même de passer.
    const lu = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    const sans = await rendu("progress_bars", "PublicProgressBars", { b1_label: "Taux de satisfaction" })
    expect(lu(sans), "l'étiquette est publiée").toContain("Taux de satisfaction")
    expect(lu(sans), "aucun chiffre inventé").not.toContain("%")
    expect(sans, "et la jauge reste vide").toContain("width:0%")
    const avec = await rendu("progress_bars", "PublicProgressBars", { b1_label: "Taux de satisfaction", b1_value: "92" })
    expect(lu(avec), "le chiffre écrit est publié").toContain("92%")
    expect(avec, "…et la jauge le suit").toContain("width:92%")
    // Un zéro ÉCRIT reste un zéro publié : c'est une réponse, pas une absence.
    expect(lu(await rendu("progress_bars", "PublicProgressBars", { b1_label: "Objectif", b1_value: "0" }))).toContain("0%")
  })
})

describe("le cliquet : le rendu legacy n'a pas encore fini", () => {
  it("sept blocs legacy fabriquent encore leur adresse", async () => {
    // `renduLegacy` porte `LienPublic`, qui juge — et l'utilise trente fois.
    // Mais une trentaine d'ancres y sont écrites à la main, `<a href={extHref(…)}>`,
    // et sept blocs en publient encore. Les convertir demande de rouvrir un
    // fichier de deux mille trois cents lignes bloc par bloc : c'est un lot, pas
    // une ligne. Le nombre ne peut que descendre.
    const { RenduLegacy } = await import("../../[slug]/renduLegacy")
    const themeLegacy: any = { primary: "#C9A84C", muted: "#8A8478", text: "#F5F0E8", surface: "#111009", fontDisplay: "Fraunces", fontBody: "DM Sans" }
    const fautifs: string[] = []
    let sondes = 0
    for (const type of Object.keys(BLOCK_DEFS)) {
      if (SHARED_RENDERER_BLOCKS.has(type)) continue
      const contenu = contenuGarni(type, REFUSEE)
      if (!contenu) continue
      sondes++
      let html = ""
      try {
        html = renderToStaticMarkup(createElement(RenduLegacy as never,
          { block: { id: "b1", type, content: contenu, visible: true }, theme: themeLegacy, pageId: "p1" } as never))
      } catch { continue }
      if (/href="[^"]*ftp:[^"]*"/.test(html)) fautifs.push(type)
    }
    expect(sondes, "des blocs legacy avec une adresse").toBeGreaterThan(12)
    expect(fautifs.length, `legacy : ${fautifs.join(", ")}`).toBeLessThanOrEqual(7)
    expect(fautifs.length, "il en reste — sinon ce cliquet n'aurait plus de sens").toBeGreaterThan(0)
  }, 120_000)
})
