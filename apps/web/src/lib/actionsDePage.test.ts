import { describe, it, expect } from "vitest"
import { actionsDePage, filtrerPages, lienStatsDeLaPage, LIEN_MES_PAGES, separerActions } from "./actionsDePage"

const enLigne = { id: "p1", slug: "bistrot", status: "published", title: "Bistrot" }
const brouillon = { id: "p2", slug: "bar-red", status: "draft", title: "Red Fish" }

describe("actionsDePage", () => {
  it("une page en ligne : Modifier, Ouvrir, Partager, QR, Stats", () => {
    const a = actionsDePage(enLigne)
    expect(a.map(x => x.cle)).toEqual(["modifier", "ouvrir", "partager", "qr", "stats"])
    expect(a.find(x => x.cle === "ouvrir")).toMatchObject({ href: "/bistrot" })
    expect(a.find(x => x.cle === "qr")).toMatchObject({ href: "/dashboard/qr-codes?page=p1" })
    expect(a.find(x => x.cle === "stats")).toMatchObject({ href: "/dashboard/analytics?page=p1" })
  })
  it("avec son QR, une page en ligne s'imprime sur CE QR", () => {
    const a = actionsDePage({ ...enLigne, qr: "abc123" })
    expect(a.at(-1)).toEqual({ cle: "imprimer", libelle: "Imprimer", href: "/dashboard/print-studio?qr=abc123" })
    expect(actionsDePage({ ...brouillon, qr: "abc123" }).map(x => x.cle)).toEqual(["modifier"])
  })
  it("un brouillon : seulement Reprendre — pas d'adresse publique à ouvrir ni partager", () => {
    expect(actionsDePage(brouillon)).toEqual([{ cle: "modifier", libelle: "Reprendre", href: "/dashboard/builder/p2" }])
  })
  it("un statut absent n'est pas « en ligne »", () => {
    expect(actionsDePage({ id: "x", slug: "x", status: null }).map(a => a.cle)).toEqual(["modifier"])
  })
  it("encode l'identifiant", () => {
    expect(lienStatsDeLaPage("a b")).toBe("/dashboard/analytics?page=a%20b")
  })
})

describe("filtrerPages", () => {
  const pages = [enLigne, brouillon]
  it("filtre par état", () => {
    expect(filtrerPages(pages, "toutes")).toHaveLength(2)
    expect(filtrerPages(pages, "en_ligne")).toEqual([enLigne])
    expect(filtrerPages(pages, "brouillons")).toEqual([brouillon])
  })
  it("cherche dans le titre et l'adresse, sans casse", () => {
    expect(filtrerPages(pages, "toutes", "red")).toEqual([brouillon])
    expect(filtrerPages(pages, "toutes", "BISTR")).toEqual([enLigne])
    expect(filtrerPages(pages, "toutes", "  ")).toHaveLength(2)
  })
})

describe("destination commune (audit C1/C2)", () => {
  it("Pages et Tout voir mènent à la liste des projets", async () => {
    const { readFileSync } = await import("node:fs")
    const { join } = await import("node:path")
    const lire = (p: string) => readFileSync(join(__dirname, "..", p), "utf8")
    const shell = lire("app/dashboard/DashboardShell.tsx")
    const i = shell.indexOf('key: "pages"')
    expect(shell.slice(i, i + 500)).toContain('href: "/dashboard/pages"')
    expect(lire("app/dashboard/DashboardClient.tsx")).toContain("href={LIEN_MES_PAGES}")
    expect(LIEN_MES_PAGES).toBe("/dashboard/pages")
  })
})

describe("separerActions (téléphone : deux gestes, le reste sous « Plus »)", () => {
  const cles = (x: { cle: string }[]) => x.map(a => a.cle)
  it("page à carte : Modifier + Ma carte ; le reste replié, dans l'ordre", () => {
    const s = separerActions(actionsDePage({ ...enLigne, qr: "abc", carte: true }))
    expect(cles(s.principales)).toEqual(["modifier", "carte"])
    expect(cles(s.autres)).toEqual(["ouvrir", "partager", "qr", "stats", "imprimer"])
  })
  it("page sans carte : Modifier + Ouvrir", () => {
    const s = separerActions(actionsDePage({ ...enLigne, qr: "abc" }))
    expect(cles(s.principales)).toEqual(["modifier", "ouvrir"])
    expect(cles(s.autres)).toEqual(["partager", "qr", "stats", "imprimer"])
  })
  it("brouillon : une seule action, rien à replier ; aucune action perdue", () => {
    expect(separerActions(actionsDePage(brouillon))).toEqual({ principales: actionsDePage(brouillon), autres: [] })
    const toutes = actionsDePage({ ...enLigne, qr: "abc", carte: true })
    const s = separerActions(toutes)
    expect(s.principales.length + s.autres.length).toBe(toutes.length)
  })
})
