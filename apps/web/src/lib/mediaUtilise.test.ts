// « Si », là où le produit peut regarder — garde de classe.
//
// Relevé du 14 septembre, en balayant les confirmations du produit. Trois
// disent « si » d'une chose que la base sait :
//
//   assets/page.tsx:64  « Cette action est définitive. Si ces médias sont
//                         utilisés sur des pages publiées, ils n'y
//                         apparaîtront plus. »
//   assets/page.tsx:90  « Si ce média est utilisé sur une page publiée, il n'y
//                         apparaîtra plus. »
//   FileUpload.tsx:52   « S'il est utilisé sur une page publiée, le lien ne
//                         fonctionnera plus. »
//
// Le produit a les pages, les blocs et l'URL. Il peut répondre « Utilisé sur
// 2 pages, dont 1 publiée : Le Comptoir, Menu midi. »
//
// Deux autres formulations disent « peut-être » et ont RAISON : personne ne sait
// si un autocollant est collé sur une table.
//
//   suppressionDePage.ts « Ce code est peut-être déjà collé ou distribué »
//   qr-link/page.tsx     « Si ce QR est déjà imprimé quelque part »
//
// La classe : « peut-être » est permis sur ce qui vit DEHORS, jamais sur ce que
// la base sait.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  nomDeFichierDeUrl, contientLeMedia, pagesUtilisantLeMedia,
  phraseUtilisation, phraseSuppressionMedia, phraseSuppressionLot,
} from "./mediaUtilise"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

const URL_MEDIA = "https://xyz.supabase.co/storage/v1/object/public/page-assets/u1/blocks-vitrine-1699999999.png"
const NOM = "blocks-vitrine-1699999999.png"

const PAGES = [
  { id: "p1", title: "Le Comptoir", status: "published", theme: { background: "#000" } },
  { id: "p2", title: "Menu midi", status: "published", theme: {} },
  { id: "p3", title: "Brunch", status: "draft", theme: { imageFond: URL_MEDIA } },
  { id: "p4", title: "Ancienne carte", status: "draft", theme: {} },
]
const BLOCS = [
  { page_id: "p1", content: { avatar: URL_MEDIA, name: "Le Comptoir" } },
  { page_id: "p2", content: { gallery: { img1: "autre.png", img2: URL_MEDIA } } },
  { page_id: "p4", content: { text: "rien à voir" } },
]

describe("retrouver un média dans ce que le produit stocke", () => {
  it("le nom de fichier se lit, quelles que soient les décorations de l'URL", () => {
    expect(nomDeFichierDeUrl(URL_MEDIA)).toBe(NOM)
    expect(nomDeFichierDeUrl(`${URL_MEDIA}?width=400`)).toBe(NOM)
    expect(nomDeFichierDeUrl("https://x/a/mon%20menu.pdf")).toBe("mon menu.pdf")
    expect(nomDeFichierDeUrl("")).toBe("")
    expect(nomDeFichierDeUrl(null)).toBe("")
  })

  it("on descend dans les objets et les tableaux — les champs image ont dix noms", () => {
    expect(contientLeMedia({ avatar: URL_MEDIA }, NOM)).toBe(true)
    expect(contientLeMedia({ a: { b: [{ src: URL_MEDIA }] } }, NOM)).toBe(true)
    expect(contientLeMedia({ src: "autre.png" }, NOM)).toBe(false)
    expect(contientLeMedia(null, NOM)).toBe(false)
    expect(contientLeMedia({ src: URL_MEDIA }, "")).toBe(false)
  })

  it("une structure qui se référence elle-même ne fait pas boucler", () => {
    const a: any = { x: 1 }
    a.moi = a
    expect(() => contientLeMedia(a, NOM)).not.toThrow()
  })

  it("le cas du relevé : trois pages, dont une par son thème", () => {
    const u = pagesUtilisantLeMedia(PAGES, BLOCS, URL_MEDIA)
    expect(u.map(p => p.titre).sort()).toEqual(["Brunch", "Le Comptoir", "Menu midi"])
  })

  it("un média que personne n'utilise ne renvoie rien", () => {
    expect(pagesUtilisantLeMedia(PAGES, BLOCS, "https://x/inconnu.png")).toEqual([])
    expect(pagesUtilisantLeMedia(null, null, URL_MEDIA)).toEqual([])
    expect(pagesUtilisantLeMedia(PAGES, BLOCS, "")).toEqual([])
  })

  it("un bloc dont la page n'est pas au compte ne compte pas", () => {
    const sansTheme = PAGES.filter(p => p.id !== "p3")
    const u = pagesUtilisantLeMedia(sansTheme, [{ page_id: "pX", content: { src: URL_MEDIA } }], URL_MEDIA)
    expect(u).toEqual([])
  })
})

describe("la phrase remplace le « si » par un fait", () => {
  it("le cas du relevé : nommée, chiffrée, et les publiées distinguées", () => {
    const p = phraseUtilisation(pagesUtilisantLeMedia(PAGES, BLOCS, URL_MEDIA))!
    expect(p).toContain("3 pages")
    expect(p).toContain("dont 2 publiées")
    expect(p).toContain("Le Comptoir")
  })

  it("toutes publiées, ou aucune : on le dit sans tourner autour", () => {
    expect(phraseUtilisation([{ titre: "A", status: "published" }])).toContain("1 page publiée")
    expect(phraseUtilisation([{ titre: "A", status: "draft" }])).toContain("aucune publiée")
  })

  it("ne déborde pas quand il y en a beaucoup", () => {
    const many = ["a", "b", "c", "d", "e"].map(t => ({ titre: t, status: "published" }))
    const p = phraseUtilisation(many)!
    expect(p).toContain("5 pages")
    expect(p).toContain("et 2 de plus")
  })

  it("et se tait quand il n'y a rien à dire", () => {
    expect(phraseUtilisation([])).toBeNull()
    expect(phraseUtilisation(null)).toBeNull()
  })

  it("une page sans titre reste nommable", () => {
    expect(phraseUtilisation([{ titre: "  ", status: "published" }])).toContain("Page sans titre")
  })
})

describe("les deux confirmations disent ce qui est, pas ce qui pourrait être", () => {
  it("un média utilisé, et un média libre", () => {
    const utilise = phraseSuppressionMedia("vitrine.png", pagesUtilisantLeMedia(PAGES, BLOCS, URL_MEDIA))
    expect(utilise).toContain("vitrine.png")
    expect(utilise).toContain("Utilisé sur 3 pages")
    expect(utilise, "plus de condition").not.toMatch(/\bSi\b/)

    const libre = phraseSuppressionMedia("vitrine.png", [])
    expect(libre).toContain("aucune de vos pages")
    expect(libre).not.toMatch(/\bSi\b/)
  })

  it("le lot chiffre au lieu de supposer", () => {
    expect(phraseSuppressionLot([[], []])).toContain("Aucun n'est utilisé")
    expect(phraseSuppressionLot([[{ titre: "A", status: "published" }], []])).toContain("1 d'entre eux")
    const tous = phraseSuppressionLot([[{ titre: "A" }], [{ titre: "B" }]])
    expect(tous).toContain("Ils sont tous utilisés")
    expect(phraseSuppressionLot([])).toContain("Aucun n'est utilisé")
  })

  it("les écrans appliquent les deux phrases", () => {
    const assets = lire("app/dashboard/assets/page.tsx")
    expect(assets).toContain("phraseSuppressionMedia(")
    expect(assets).toContain("phraseSuppressionLot(")
    expect(assets).toContain("lireBibliotheque(")
    const upload = lire("app/dashboard/builder/FileUpload.tsx")
    expect(upload).toContain("phraseSuppressionMedia(")
    expect(upload).toContain("usagesDuMedia(")
  })

  it("et la lecture ne casse jamais la suppression", () => {
    const lecture = lire("app/dashboard/assets/usagesDesMedias.ts")
    expect(lecture).toContain("catch")
    expect(lecture).toContain('select("page_id, content")')
  })
})

describe("garde de classe : « peut-être » seulement sur ce qui vit dehors", () => {
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

  // Ce qui vit DEHORS : le produit ne peut pas savoir, et a le droit de le dire.
  const DEHORS = /imprim|collé|distribu|affiche|autocollant|papier|vitrine/i

  it("aucune confirmation ne suppose un usage que la base connaît", () => {
    const suppose = /\b(si|s')\s*(ce|cette|ces|il|elle|ils|elles)\b[^"'`]{0,80}(utilis|sert)/i
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (!/confirm\(\{|message:/.test(l)) continue
        if (!suppose.test(l)) continue
        expect(DEHORS.test(l), `${rel}:${i + 1} suppose un usage que la base sait — ${l.slice(0, 120)}`).toBe(true)
      }
    }
  })

  it("mais les phrases sur le monde physique gardent leur « peut-être »", () => {
    // Ce sont elles qui rendent la règle juste : sans elles, on croirait que le
    // produit doit tout savoir.
    const page = lire("lib/suppressionDePage.ts")
    expect(page).toContain("peut-être déjà collé")
    expect(DEHORS.test("Ce code est peut-être déjà collé ou distribué")).toBe(true)
  })
})
