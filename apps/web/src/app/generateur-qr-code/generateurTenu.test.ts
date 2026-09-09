import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { TYPES_QR } from "@/lib/stylesQr"

// Revue du 9 septembre (P0, « QR Studio » = le générateur public et son jumeau
// « QR vers un lien ») : l'outil se tient dans la hauteur de l'écran, aperçu +
// diagnostic + PNG/SVG toujours visibles ; réglages rangés Style · Couleurs ·
// Logo · Avancé ; statique / dynamique choisi d'abord ; un seul diagnostic ;
// pas de faux QR quand il n'y a rien à encoder ; mêmes types partout (SMS).

const gen = readFileSync(join(__dirname, "GeneratorClient.tsx"), "utf8")
const lien = readFileSync(join(__dirname, "../dashboard/qr-link/page.tsx"), "utf8")

describe("générateur public : tenu dans l'écran", () => {
  it("la colonne de réglages défile dans son cadre, l'aperçu et la barre d'action sont collants", () => {
    expect(gen).toContain("max-height:calc(100dvh - 32px);overflow-y:auto;")
    expect(gen).toContain(".gen-aside{position:sticky;top:16px}")
    expect(gen).toContain('<div className="gen-actions" style={{ display: "flex", gap: 10 }}>')
    // La barre d'action vit dans la colonne collante, juste après l'aperçu et l'erreur éventuelle.
    expect(gen.indexOf('className="gen-actions"')).toBeGreaterThan(gen.indexOf('className="gen-aside"'))
  })
  it("statique / dynamique se choisit avant tout le reste (groupe radio en tête de colonne)", () => {
    const radio = gen.indexOf('role="radiogroup" aria-label="Statique ou dynamique"')
    expect(radio).toBeGreaterThan(0)
    expect(radio).toBeLessThan(gen.indexOf("{TYPES_QR.map"))
    expect(gen).toContain('{ k: false, titre: "Statique", sous: "Téléchargement immédiat. Figé une fois imprimé, fonctionne hors ligne." }')
    expect(gen).toContain('{ k: true, titre: "Dynamique"')
    // Un type non redirigeable + dynamique : on le dit, on ne bloque pas en silence.
    expect(gen).toContain('{dyn && qrType !== "link" && (')
  })
  it("réglages rangés Style · Couleurs · Logo · Avancé, dans cet ordre, sans en perdre un", () => {
    const ordre = ['section("Style"', 'section("Couleurs"', 'section("Logo"', 'section("Avancé"']
    const pos = ordre.map(o => gen.indexOf(o))
    for (const [i, p] of pos.entries()) expect(p, ordre[i]).toBeGreaterThan(0)
    expect(pos).toEqual([...pos].sort((a, b) => a - b))
    for (const r of ["STYLES_QR.map", "ENCRES_QR.map", "FONDS_QR.map", "NIVEAUX_ECC.map", "Ajouter un logo"]) expect(gen).toContain(r)
  })
  it("un seul diagnostic à la fois, du plus bloquant au plus rassurant", () => {
    expect(gen).toContain("const diagnostic = !ready")
    for (const t of ["Contraste insuffisant — corriger", "Clair sur fond sombre — inverser", "Contraste limite — testez avant d'imprimer", "Excellente lisibilité"]) expect(gen).toContain(t)
    expect((gen.match(/\{diagnostic\}/g) ?? []).length).toBe(1)
    expect(gen).not.toContain("> Scannable<")
  })
  it("rien à encoder → pas de faux QR, et un emplacement plus petit qu'un QR généré", () => {
    expect(gen).toContain("{ready ? (")
    expect(gen).toContain('<div aria-hidden style={{ width: 140, height: 140, borderRadius: 12')
    // L'ancien aperçu vide encodait qrowg.com en clair : plus jamais rendu sans contenu.
    const vide = gen.slice(gen.indexOf(") : (\n            // Rien à encoder"), gen.indexOf("{diagnostic}"))
    expect(vide).not.toContain("<QRCanvas")
  })
})

describe("mêmes types de QR partout", () => {
  it("« QR vers un lien » propose tous les types de lib/stylesQr, SMS compris", () => {
    expect(lien).toContain('const TYPES = typesQr(["link", "wifi", "text", "contact", "phone", "email", "sms"])')
    for (const t of TYPES_QR) expect(lien, t.k).toContain(`"${t.k}"`)
    expect(lien).toContain('if (s.type === "sms") return buildSms(s.sms?.to ?? "", s.sms?.body)')
    expect(lien).toContain('aria-label="Numéro du destinataire SMS"')
    expect(lien).toContain('sms: MessageSquare')
  })
  it("le générateur public liste TYPES_QR tel quel", () => {
    expect(gen).toContain("{TYPES_QR.map(t => {")
  })
  it("l'aperçu vide de « QR vers un lien » est lui aussi plus petit qu'un QR", () => {
    expect(lien).toContain('<div aria-hidden style={{ width: 140, height: 140, borderRadius: 12')
  })
})
