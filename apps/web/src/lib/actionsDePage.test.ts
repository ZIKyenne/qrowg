import { describe, it, expect } from "vitest"
import { actionsDePage, filtrerPages, lienStatsDeLaPage, LIEN_MES_PAGES, separerActions, gesteDePause, qrEnPause, confirmationDePause, phraseApresPause } from "./actionsDePage"

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

// Le message de mise en pause (plan qui descend) dit « depuis Mes pages » :
// le geste qui rallume une page doit s'y trouver, pas trois écrans plus loin.
describe("pause et réactivation depuis Mes pages", () => {
  const cles = (x: { cle: string }[]) => x.map(a => a.cle)
  const avecQr = (qrStatut: string | null) => ({ ...enLigne, qr: "abc", qrId: "q1", qrStatut })

  it("n'est proposé que là où la route l'accepte", () => {
    expect(gesteDePause({ qrId: "q1", qrStatut: "active" })).toBe("pause")
    expect(gesteDePause({ qrId: "q1", qrStatut: null })).toBe("pause") // historique = actif
    expect(gesteDePause({ qrId: "q1", qrStatut: "paused" })).toBe("reactiver")
    for (const s of ["archived", "draft", "expired"]) expect(gesteDePause({ qrId: "q1", qrStatut: s }), s).toBeNull()
    expect(gesteDePause({ qrId: null, qrStatut: "active" }), "sans QR, rien à mettre en pause").toBeNull()
  })

  it("suit la machine à états du serveur", async () => {
    const { ALLOWED_TRANSITIONS } = await import("@/app/api/qr-status/qrStatus")
    expect(ALLOWED_TRANSITIONS.active).toContain("pause")
    expect(ALLOWED_TRANSITIONS.paused).toContain("activate")
  })

  it("une page en ligne se met en pause, en dernier geste", () => {
    expect(actionsDePage(avecQr("active")).at(-1)).toEqual({ cle: "pause", libelle: "Mettre en pause" })
  })

  it("une page en pause se réactive, et sur téléphone c'est le geste visible", () => {
    const a = actionsDePage(avecQr("paused"))
    expect(cles(a)).toContain("reactiver")
    expect(cles(a)).not.toContain("pause")
    expect(cles(separerActions(a).principales)).toEqual(["modifier", "reactiver"])
    // Même une page à carte : la rallumer passe avant ses produits épuisés.
    expect(cles(separerActions(actionsDePage({ ...avecQr("paused"), carte: true })).principales)).toEqual(["modifier", "reactiver"])
  })

  it("un brouillon ne se met pas en pause : il n'est pas en ligne", () => {
    expect(cles(actionsDePage({ ...brouillon, qrId: "q2", qrStatut: "active" }))).toEqual(["modifier"])
  })

  it("dit ce qui arrive au QR imprimé, et nomme la page", () => {
    expect(qrEnPause({ qrStatut: "paused" })).toBe(true)
    expect(qrEnPause({ qrStatut: null })).toBe(false)
    const c = confirmationDePause("Le Comptoir")
    expect(c.texte).toContain("« Le Comptoir »")
    expect(c.texte).toContain("Le code imprimé reste valable")
    expect(phraseApresPause("pause", "Le Comptoir")).toContain("en pause")
    expect(phraseApresPause("reactiver", "Le Comptoir")).toContain("réactivée")
  })

  it("l'écran passe par la route qui vérifie le quota, et lit l'état du QR", async () => {
    const { readFileSync } = await import("node:fs")
    const { join } = await import("node:path")
    const lire = (p: string) => readFileSync(join(__dirname, "..", p), "utf8")
    const client = lire("app/dashboard/pages/PagesClient.tsx")
    expect(client, "réactiver doit passer par changerStatut (quota vérifié serveur)").toContain('changerStatut(p.qrId, geste === "pause" ? "pause" : "activate")')
    expect(client, "l'écran ne doit changer qu'après accord du serveur").toMatch(/if \(!r\.ok\) \{ toast\.error\(r\.refus\); return \}/)
    expect(lire("app/dashboard/pages/page.tsx")).toContain("qr_codes(id, short_code, status, created_at)")
  })
})
