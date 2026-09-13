// Le nom du support qui ne sort jamais de l'écran des statistiques — garde de classe.
//
// Relevé du 13 septembre. Le produit demande au commerçant de nommer ses
// supports — c'est exactement le rôle de `api/qr-label` : « renomme un QR (nom
// du support pour l'attribution : « Vitrine », « Table 4 »…) » — et il affiche
// ces noms dans « Performance par support ».
//
// Partout ailleurs, `qr_codes.label` n'était pas lu :
//
//   · nom du fichier exporté :
//       expFilename.trim() || active?.pages?.title?.replace(…) || short_code
//   · liste de l'atelier d'impression :
//       .select("short_code, pages(title, slug)")   ← `label` pas même demandé
//       label: pg?.title || pg?.slug || "QR code"
//
// Depuis le lot v83, une page porte plusieurs supports pour de bon. Au moment
// précis où il faut les distinguer, l'atelier affiche « Le Comptoir » quatre
// fois, et quatre exports arrivent dans le dossier Téléchargements sous
// « le-comptoir.png », « le-comptoir (1).png »…
//
// La classe : un QR se nomme d'une seule façon dans tout le produit, et ce nom
// est celui qui DISTINGUE — pas celui de la page, qui est le même pour tous ses
// supports.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { nomDuQr, nomDuQrSitue, nomDeLigneQr, nomDeFichier, fichierDuQr } from "./nomDuQr"
import { nomDuSupport } from "./suppressionDePage"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

describe("un QR se nomme par ce qui le distingue", () => {
  it("le nom du support passe avant le titre de la page", () => {
    expect(nomDuQr({ label: "Vitrine", pageTitre: "Le Comptoir", short_code: "ab12" })).toBe("Vitrine")
  })

  it("à défaut, le titre de la page, puis le code", () => {
    expect(nomDuQr({ pageTitre: "Le Comptoir", short_code: "ab12" })).toBe("Le Comptoir")
    expect(nomDuQr({ short_code: "ab12" })).toBe("code ab12")
    expect(nomDuQr({})).toBe("QR sans nom")
    expect(nomDuQr(null)).toBe("QR sans nom")
  })

  it("les blancs ne comptent pas pour un nom", () => {
    expect(nomDuQr({ label: "   ", pageTitre: "Le Comptoir" })).toBe("Le Comptoir")
    expect(nomDuQr({ label: "   ", pageTitre: "  ", short_code: " ab12 " })).toBe("code ab12")
  })

  it("situé, il garde les deux : où, et lequel", () => {
    expect(nomDuQrSitue({ label: "Vitrine", pageTitre: "Le Comptoir" })).toBe("Le Comptoir — Vitrine")
    // Sans nom de support, rien à situer : on ne fabrique pas « Le Comptoir — Le Comptoir ».
    expect(nomDuQrSitue({ pageTitre: "Le Comptoir" })).toBe("Le Comptoir")
  })

  it("lit une ligne de la base, jointure en objet comme en tableau", () => {
    expect(nomDeLigneQr({ label: "Table 4", pages: { title: "Le Comptoir" } })).toBe("Le Comptoir — Table 4")
    expect(nomDeLigneQr({ label: "Table 4", pages: [{ title: "Le Comptoir" }] })).toBe("Le Comptoir — Table 4")
    expect(nomDeLigneQr({ pages: { slug: "le-comptoir" } })).toBe("le-comptoir")
    expect(nomDeLigneQr(null)).toBe("QR sans nom")
  })

  it("une seule règle dans le produit : la suppression de page l'utilise aussi", () => {
    expect(nomDuSupport({ label: "Vitrine", short_code: "ab12" })).toBe("Vitrine")
    expect(nomDuSupport({ label: "  ", short_code: "xk29" })).toBe("code xk29")
    expect(lire("lib/suppressionDePage.ts")).toContain("nomDuQr(")
  })
})

describe("quatre fichiers qu'on distingue dans un dossier", () => {
  it("le nom du support entre dans le nom du fichier", () => {
    const a = fichierDuQr({ label: "Vitrine", pageTitre: "Le Comptoir", short_code: "ab12" })
    const b = fichierDuQr({ label: "Table 4", pageTitre: "Le Comptoir", short_code: "cd34" })
    expect(a).toBe("vitrine-ab12")
    expect(b).toBe("table-4-cd34")
    expect(a).not.toBe(b)
  })

  it("deux supports du même nom restent distincts par leur code", () => {
    const a = fichierDuQr({ label: "Flyer", short_code: "ab12" })
    const b = fichierDuQr({ label: "Flyer", short_code: "cd34" })
    expect(a).not.toBe(b)
  })

  it("accents, ponctuation et longueurs ne cassent rien", () => {
    expect(nomDeFichier("Café de l'Été !")).toBe("cafe-de-l-ete")
    expect(nomDeFichier("   ")).toBe("qr")
    expect(nomDeFichier("")).toBe("qr")
    expect(nomDeFichier("x".repeat(200)).length).toBeLessThanOrEqual(60)
    expect(nomDeFichier("Vitrine", "AB-12")).toBe("vitrine-ab12")
  })

  it("jamais de nom de fichier vide, quoi qu'on lui donne", () => {
    for (const v of [null, undefined, "", "   ", "!!!", "——"]) {
      expect(nomDeFichier(v as any), String(v)).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

describe("le nom sort enfin des statistiques", () => {
  it("l'atelier d'impression demande le nom du support, et l'affiche", () => {
    const atelier = lire("app/dashboard/print-studio/PrintStudioClient.tsx")
    expect(atelier, "`label` n'est pas demandé à la base").toContain('select("short_code, label, pages(title, slug)")')
    expect(atelier).toContain("nomDuQrSitue(")
    expect(atelier, "la liste affiche encore le titre de la page seul").not.toContain('label: pg?.title || pg?.slug || "QR code"')
  })

  it("le fichier exporté porte le nom du support", () => {
    const studio = lire("app/dashboard/qr-codes/QRStudio.tsx")
    expect(studio).toContain("fichierDuQr(")
    expect(studio, "le nom de fichier repart du titre de page").not.toContain('active?.pages?.title?.replace(/[^a-z0-9]/gi, "-")')
  })

  it("la liste, la recherche et le tri parlent du support", () => {
    const studio = lire("app/dashboard/qr-codes/QRStudio.tsx")
    expect(studio).toContain("nomDeLigneQr(")
    // La recherche lit le nom du support EN PLUS du titre de la page.
    const recherche = studio.split("\n").find(l => l.includes("const t  ="))!
    expect(recherche, "la recherche ignore le nom du support").toContain("label")
    expect(recherche).toContain("pages?.title")
  })

  it("et le nom donné par le commerçant est bien celui que qr-label écrit", () => {
    const route = lire("app/api/qr-label/route.ts")
    expect(route).toContain("label")
    expect(route).toContain("qr_codes")
  })
})
