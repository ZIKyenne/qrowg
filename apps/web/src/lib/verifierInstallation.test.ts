import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { installationsAVerifier, fenetrePublication, JOUR_DE_VERIFICATION } from "./verifierInstallation"
import { installationHtml } from "./emailInstallation"
import { texteDeLEmail } from "./emailLayout"

// Audit F : « page publiée, aucun scan → vérification de l'installation ». Un
// seul envoi, le 3e jour civil après la publication, à qui n'a pas coupé les
// alertes de scans.
const NOW = new Date("2026-11-16T09:40:00Z")
const pub = (jour: string) => `${jour}T15:00:00Z`
const page = (o: Partial<any> = {}) => ({ id: "p1", user_id: "u1", title: "Red Fish", slug: "red-fish", status: "published", published_at: pub("2026-11-13"), scans: 0, ...o })
const moi = { id: "u1", email: "proprio@exemple.fr", nom: "Emma Durand", preferences: {} }

describe("qui reçoit « votre QR n'a pas encore été scanné »", () => {
  it("une page publiée il y a 3 jours civils, jamais scannée", () => {
    const r = installationsAVerifier([page()], [moi], NOW)
    expect(r).toHaveLength(1)
    expect(r[0].pages.map(p => p.id)).toEqual(["p1"])
    expect(JOUR_DE_VERIFICATION).toBe(3)
  })
  it("ni la veille, ni le lendemain : un seul jour, donc un seul envoi", () => {
    expect(installationsAVerifier([page({ published_at: pub("2026-11-14") })], [moi], NOW)).toEqual([])
    expect(installationsAVerifier([page({ published_at: pub("2026-11-12") })], [moi], NOW)).toEqual([])
  })
  it("pas une page déjà scannée, ni un brouillon", () => {
    expect(installationsAVerifier([page({ scans: 1 })], [moi], NOW)).toEqual([])
    expect(installationsAVerifier([page({ status: "draft" })], [moi], NOW)).toEqual([])
  })
  it("pas à qui a coupé les alertes de scans, ni sans adresse", () => {
    expect(installationsAVerifier([page()], [{ ...moi, preferences: { scan_alert: false } }], NOW)).toEqual([])
    expect(installationsAVerifier([page()], [{ ...moi, email: null }], NOW)).toEqual([])
  })
  it("un seul e-mail par propriétaire, même avec deux pages", () => {
    const r = installationsAVerifier([page(), page({ id: "p2", title: "Carte du soir" })], [moi], NOW)
    expect(r).toHaveLength(1)
    expect(r[0].pages).toHaveLength(2)
  })
  it("la fenêtre SQL couvre exactement ce jour civil", () => {
    expect(fenetrePublication(NOW)).toEqual({ depuis: "2026-11-13T00:00:00.000Z", jusqua: "2026-11-14T00:00:00.000Z" })
  })
})

describe("l'e-mail", () => {
  const html = installationHtml({ proprietaire: moi, pages: [page()] }, "https://qrowg.com")
  const texte = texteDeLEmail(html)
  it("nomme la page, dit les trois vérifications, mène au QR de CETTE page", () => {
    expect(texte).toMatch(/«\s?Red Fish\s?»/u)   // espaces insécables posés par la mise en page
    expect(texte).toMatch(/scannez-le vous-même/)
    expect(html).toContain("https://qrowg.com/dashboard/qr-codes?page=p1")
  })
  it("porte un lien de sortie et promet un seul envoi", () => {
    expect(html).toContain("https://qrowg.com/dashboard/settings")
    expect(texte).toMatch(/qu'une fois par page/)
  })
  it("échappe le titre de la page", () => {
    expect(installationHtml({ proprietaire: moi, pages: [page({ title: "<b>x</b>" })] }, "https://qrowg.com")).not.toContain("<b>x</b>")
  })
})

describe("la tâche est planifiée et gardée", () => {
  it("vercel.json l'appelle chaque jour ; la route passe par gardeCron et le journal", () => {
    const racine = join(__dirname, "../../../..")
    const crons: { path: string }[] = JSON.parse(readFileSync(join(racine, "vercel.json"), "utf8")).crons
    expect(crons.map(c => c.path)).toContain("/api/cron/installation")
    // Garde, journal et scans de robots écartés : JOUÉ depuis v413 (app/api/cron/bancEnvoisAutomatiques.test.ts).
  })
})
