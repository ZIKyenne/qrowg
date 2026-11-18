import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { modeInstallation, etapesInstallation, inviterSurLAccueil, REPORT_JOURS } from "./installation"

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36"
const PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
const base = { standalone: false, offreNative: false, tactile: false }

const lire = (p: string) => readFileSync(join(__dirname, "..", p), "utf8")

describe("ce qu'on peut proposer, selon l'appareil", () => {
  it("ouvert depuis l'icône : rien à proposer, sur tout appareil", () => {
    for (const ua of [IPHONE, ANDROID, PC]) expect(modeInstallation({ ...base, ua, standalone: true, offreNative: true })).toBe("installee")
  })
  it("Android qui sait installer : un bouton, en un toucher", () => {
    expect(modeInstallation({ ...base, ua: ANDROID, offreNative: true })).toBe("native")
  })
  it("iPhone, et iPad qui se présente comme un Mac : les gestes de Safari", () => {
    expect(modeInstallation({ ...base, ua: IPHONE })).toBe("ios")
    expect(modeInstallation({ ...base, ua: IPAD, tactile: true })).toBe("ios")
    // Un vrai Mac, sans écran tactile, n'est pas un téléphone.
    expect(modeInstallation({ ...base, ua: IPAD, tactile: false })).toBe("aucun")
  })
  it("Android sans l'offre du système : les gestes du menu ⋮", () => {
    expect(modeInstallation({ ...base, ua: ANDROID })).toBe("android")
  })
  it("ordinateur : rien — la demande porte sur le téléphone", () => {
    expect(modeInstallation({ ...base, ua: PC })).toBe("aucun")
  })
})

describe("les gestes donnés", () => {
  it("iPhone : Partager, puis « Sur l'écran d'accueil »", () => {
    const e = etapesInstallation("ios")
    expect(e).toHaveLength(3)
    expect(e[0]).toContain("Partager")
    expect(e[1]).toContain("Sur l'écran d'accueil")
  })
  it("Android : le menu ⋮, puis « Installer l'application »", () => {
    expect(etapesInstallation("android").join(" ")).toContain("Installer l'application")
  })
  it("quand le système propose, ou qu'il n'y a rien à faire : aucune étape", () => {
    for (const m of ["native", "installee", "aucun"] as const) expect(etapesInstallation(m)).toEqual([])
  })
})

describe("l'Accueil invite au bon moment", () => {
  const maintenant = Date.UTC(2026, 10, 18)
  const ok = { mode: "ios" as const, pagesEnLigne: 1, reporteeLe: null, maintenant }
  it("avec une page en ligne, sur un téléphone qui n'a pas encore QRowg", () => {
    expect(inviterSurLAccueil(ok)).toBe(true)
  })
  it("pas sans page en ligne : rien encore à garder sous la main", () => {
    expect(inviterSurLAccueil({ ...ok, pagesEnLigne: 0 })).toBe(false)
  })
  it("pas une fois installé, ni sur ordinateur", () => {
    expect(inviterSurLAccueil({ ...ok, mode: "installee" })).toBe(false)
    expect(inviterSurLAccueil({ ...ok, mode: "aucun" })).toBe(false)
  })
  it("« Plus tard » range la carte un mois, puis elle revient", () => {
    const jour = 864e5
    expect(inviterSurLAccueil({ ...ok, reporteeLe: maintenant - 3 * jour })).toBe(false)
    expect(inviterSurLAccueil({ ...ok, reporteeLe: maintenant - (REPORT_JOURS + 1) * jour })).toBe(true)
  })
})

describe("branché, pas seulement écrit", () => {
  it("l'appli installée s'ouvre sur l'espace de travail, sous la même identité", () => {
    const m = lire("app/manifest.ts")
    expect(m).toContain('start_url: "/dashboard"')
    expect(m).toContain('id: "/"')
  })
  it("l'offre d'Android est écoutée dès l'entrée dans l'espace", () => {
    expect(lire("app/dashboard/DashboardShell.tsx")).toContain('import "@/lib/installation"')
    expect(lire("lib/installation.ts")).toContain('addEventListener("beforeinstallprompt"')
  })
  it("l'invitation apparaît après la première publication et sur l'Accueil", () => {
    expect(lire("app/dashboard/builder/PublishedScreen.tsx")).toContain("{mobile && <div style={{ margin: \"18px 0 6px\" }}><InviteInstallation /></div>}")
    expect(lire("app/dashboard/DashboardClient.tsx")).toContain("<InvitationAccueil pagesEnLigne={publishedCount} />")
  })
})
