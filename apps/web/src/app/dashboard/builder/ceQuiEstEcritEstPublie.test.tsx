// Ce que le commerçant écrit, la page le montre — garde de classe.
//
// ── Un axe que la série n'avait pas regardé ───────────────────────────────
//
// Les lots v166 à v173 ont réglé une question : le bloc disparaît-il, et le
// dit-on ? Il en restait une autre, plus discrète : **le bloc reste, et une
// partie de ce qui a été écrit n'arrive pas.**
//
// Relevé du 23 septembre, en écrivant une marque reconnaissable dans chaque
// champ de texte déclaré — première ligne uniquement, deux cent huit sondes —
// et en cherchant cette marque dans ce que la page publie :
//
//     product_catalog.p1_name     écrit, et introuvable sur la page
//     favorite_links.link_1_label idem
//
// Les deux ont la même cause, et elle est exactement l'inverse des lots
// précédents : **le modèle garde l'item, la vue le jette.**
//
//     const items = extractIndexed(…, cc => texteUtile(cc[`p${i}_name`]) ? {…} : null)
//     …
//     {items.filter(p => p.link.href).map(…)}      ← la vue, plus loin
//
// Le détecteur, lui, demande `productCatalogViewModel(c).visible` — donc
// « plein ». L'éditeur montrait le produit, la liste d'avant publication se
// taisait, et la page ne publiait rien. Un catalogue de six produits sans
// adresse : six lignes dans l'éditeur, une page blanche pour le client.
//
// ── Deux réponses, parce que les deux blocs ne disent pas la même chose ────
//
// `product_catalog` est un CATALOGUE : un produit sans lien reste un produit —
// il a un nom, une photo, un prix. La vue le publie, sans le rendre cliquable.
// Le dedans est écrit une seule fois et partagé par les deux cadres, pour que
// l'aperçu dise exactement la même chose.
//
// `favorite_links` est une liste de LIENS : sans adresse, il n'y a pas de lien.
// Le modèle ne le garde plus — donc `visible` dit la vérité, l'éditeur montre
// son état vide, et la liste d'avant publication le nomme.

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"
import { BLOCK_DEFS } from "./blockDefs"
import { hasPublishableContent } from "./blockEmptyState"
import { productCatalogViewModel } from "./shared-renderer/models/productCatalog"
import { favoriteLinksViewModel } from "./shared-renderer/models/favoriteLinks"

const RACINE = path.join(__dirname, "shared-renderer")
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
async function page(chemin: string, nom: string, contenu: Record<string, unknown>): Promise<string> {
  const mod = (await import(/* @vite-ignore */ `./shared-renderer/blocks/${chemin}`)) as Record<string, ComponentType<never>>
  const C = mod[nom]
  if (!C) return ""
  try { return renderToStaticMarkup(createElement(C as never, { content: contenu, ctx } as never)) } catch { return "" }
}

const MARQUE = "ZQMARQUEZQ"

/**
 * Ce qu'un champ écrit peut légitimement ne PAS faire apparaître tel quel, et
 * pourquoi. La liste ne doit que rétrécir : chaque entrée est une chose que le
 * commerçant écrit sans la retrouver sur sa page.
 */
const RAISONS: Record<string, string> = {
  // Un libellé de bouton sans destination n'est pas publié — c'est la règle du
  // 7 septembre, et la liste d'avant publication l'annonce déjà, nommément.
  "promo_banner.cta_label": "un bouton sans destination n'est pas publié (et l'alerte le dit)",
  "event_info.cta_label": "un bouton sans destination n'est pas publié (et l'alerte le dit)",
  "availability.cta_label": "un bouton sans destination n'est pas publié (et l'alerte le dit)",
  // Le contenu est bien publié, mais transformé : ce n'est pas une perte.
  "anchor_target.name": "le nom devient l'identifiant de l'ancre (`qf-…`), pas un texte",
  "progress_bars.b1_value": "le chiffre devient un pourcentage et une largeur de jauge",
  "steps_horizontal.s1_emoji": "une émoticône est rendue comme telle, pas comme du texte",
  "shape_divider.height": "une hauteur dessine une forme, elle ne s'écrit pas",
  "decor_line.width": "une largeur dessine un trait",
  "decor_line.thickness": "une épaisseur dessine un trait",
  "decor_line.space": "une marge dessine un espace",
  "color_band.height": "une hauteur dessine une bande",
  "color_band.angle": "un angle incline une bande",
  "color_band.overlay": "un voile assombrit une bande",
  // Les onglets d'un menu : la première section n'est publiée qu'avec un item.
  "menu_tabs.sec1_title": "une section d'onglets n'est publiée qu'avec au moins un produit",
  "menu_tabs.sec1_items": "le format des items est `nom|prix`, pas du texte libre",
  "avatar_row.name1": "le nom sert d'initiale dans la pastille, il ne s'écrit pas",
}

const estChampDeTexte = (f: { key: string; type?: string }) =>
  f.type !== "select" && f.type !== "url" && !/(^|_)(img|image|photo|cover|avatar|logo|color|url)\d*$/.test(f.key)

describe("garde de classe : rien d'écrit ne disparaît sans raison écrite", () => {
  it("balayage : chaque champ de texte de la première ligne se retrouve sur la page", async () => {
    const perdus: string[] = []
    let sondes = 0
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      for (const f of ((BLOCK_DEFS as Record<string, { fields?: { key: string; type?: string }[] }>)[type]?.fields ?? [])) {
        const idx = f.key.match(/(\d+)/)
        if (idx && Number(idx[1]) !== 1) continue      // la ligne 2 n'existe pas encore
        if (!estChampDeTexte(f)) continue
        const contenu = { [f.key]: MARQUE }
        if (!hasPublishableContent(type, contenu)) continue   // le produit annonce déjà qu'il ne publiera rien
        sondes++
        if (!(await page(chemin, nom, contenu)).includes(MARQUE) && !RAISONS[`${type}.${f.key}`])
          perdus.push(`${type}.${f.key}`)
      }
    }
    expect(sondes, "des champs de texte sondés").toBeGreaterThan(150)
    expect(perdus, "écrit par le commerçant, absent de sa page, et sans raison écrite").toEqual([])
  }, 300_000)

  it("chaque raison écrite en est une — et le champ existe vraiment", () => {
    for (const [cle, raison] of Object.entries(RAISONS)) {
      const [type, champ] = cle.split(".")
      const champs = ((BLOCK_DEFS as Record<string, { fields?: { key: string }[] }>)[type]?.fields ?? []).map(f => f.key)
      expect(champs, `${cle} : le champ est bien déclaré`).toContain(champ)
      expect(raison.length, `${cle} : sa raison est écrite`).toBeGreaterThan(24)
    }
  })

  it("le balayage sait dire non — sinon il ne dirait jamais oui", async () => {
    // Sans ce plancher, une marque introuvable PARTOUT passerait pour une page
    // parfaite. On vérifie qu'un texte écrit se retrouve bien, lui.
    const a = adaptersPublics()
    expect(await page(...a["about"], { title: MARQUE }), "about.title").toContain(MARQUE)
    expect(await page(...a["frame_box"], { text: MARQUE }), "frame_box.text").toContain(MARQUE)
    expect(await page(...a["checklist"], { i1: MARQUE }), "checklist.i1").toContain(MARQUE)
  })
})

describe("les deux trouvés, et la réponse propre à chacun", () => {
  it("`product_catalog` : un produit sans lien reste un produit", async () => {
    const a = adaptersPublics()
    const sansLien = { p1_name: "Le classique", p1_price: "12 €", p1_desc: "Pain au levain" }
    const html = await page(...a["product_catalog"], sansLien)
    expect(html, "le nom est publié").toContain("Le classique")
    expect(html, "son prix aussi").toContain("12 €")
    expect(html, "et sa description").toContain("Pain au levain")
    expect(html, "mais il n'est pas cliquable").not.toContain("<a ")
    // Le modèle ne promet plus un lien qu'il n'a pas.
    expect(productCatalogViewModel(sansLien).items[0].link.visible, "pas de lien annoncé").toBe(false)
    // Avec une adresse, il redevient une ancre — rien n'a été retiré.
    const avec = await page(...a["product_catalog"], { ...sansLien, p1_url: "https://exemple.fr/pain" })
    expect(avec, "cliquable").toContain('href="https://exemple.fr/pain"')
    expect(avec, "…et toujours son nom").toContain("Le classique")
  })

  it("`favorite_links` : sans adresse, il n'y a pas de lien — et le produit le dit", async () => {
    const a = adaptersPublics()
    expect(favoriteLinksViewModel({ link_1_label: "Mon site" }).items, "aucun item").toEqual([])
    expect(hasPublishableContent("favorite_links", { link_1_label: "Mon site" }),
      "le détecteur ne le croit plus plein").toBe(false)
    expect(await page(...a["favorite_links"], { link_1_label: "Mon site" }), "et la page ne publie rien").toBe("")
    // Avec l'adresse, tout revient.
    const avec = await page(...a["favorite_links"], { link_1_label: "Mon site", link_1_url: "https://exemple.fr" })
    expect(avec, "le libellé").toContain("Mon site")
    expect(avec, "et le lien").toContain('href="https://exemple.fr"')
  })

  it("aucun modèle ne garde un item que sa vue jette", () => {
    // La cause, en une phrase : une vue qui filtre ce que le modèle a gardé
    // rend le `visible` du modèle faux. On lit les vues à deux vues.
    const dossier = path.join(RACINE, "blocks")
    const fautifs: string[] = []
    let vus = 0
    for (const nom of fs.readdirSync(dossier).sort()) {
      const d = path.join(dossier, nom)
      if (!fs.statSync(d).isDirectory()) continue
      for (const f of fs.readdirSync(d).sort().filter(x => /^Public.*\.tsx$/.test(x))) {
        vus++
        const src = fs.readFileSync(path.join(d, f), "utf8")
        for (const m of src.matchAll(/items\s*\.filter\(([^)]*)\)/g)) fautifs.push(`${nom} : items.filter(${m[1]})`)
      }
    }
    expect(vus, "des vues publiques lues").toBeGreaterThan(40)
    expect(fautifs, "ce que le modèle garde, la vue le publie").toEqual([])
  })
})
