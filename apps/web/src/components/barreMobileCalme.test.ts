import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 9 septembre — la barre du bas suit la maquette : plate sur --bg avec un filet,
// tuiles icône + nom comme le rail PC, tuile active sur surface-2 + contour
// d'accent, « Créer » en tuile pleine. L'ancienne « Liquid Nav » (bulle, gouttes,
// filtre goo, halo, éclaboussures) est retirée : rien ne bouge en boucle.
// La feuille « Plus » range toutes les sections par module, comme le rail.

const nav = readFileSync(join(__dirname, "MobileNav.tsx"), "utf8")
const shell = readFileSync(join(__dirname, "../app/dashboard/DashboardShell.tsx"), "utf8")
const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8")

describe("la barre du bas", () => {
  it("n'a plus de bulle liquide, de filtre goo, de halo ni d'éclaboussures", () => {
    for (const t of ["qrf-goo", "feGaussianBlur", "blob(", "burst", "notchMask", "Liquid Nav", "filter: 'blur"]) expect(nav, t).not.toContain(t)
    expect(css).not.toContain("qrf-burst")
  })
  it("est plate : --bg + filet, tuile active sur surface-2 avec contour d'accent", () => {
    expect(nav).toContain("background: 'var(--bg)', borderTop: '1px solid var(--line)'")
    expect(nav).toContain("background: isActive ? 'var(--surface-2)' : 'transparent'")
    expect(nav).toContain("color-mix(in srgb, var(--accent) 45%, transparent)")
  })
  it("« Créer » est la seule tuile pleine (accent + encre sombre)", () => {
    expect(nav).toContain("background: 'var(--accent)', color: 'var(--ink-on-accent)'")
    expect((nav.match(/'var\(--accent\)', color: 'var\(--ink-on-accent\)'/g) ?? []).length).toBe(1)
  })
  it("chaque tuile fait au moins 44 px et porte son nom", () => {
    expect(nav).toContain("minHeight: 52")
    expect(nav).toContain("<span style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap' }}>{tab.label}</span>")
  })
})

describe("la feuille « Plus »", () => {
  it("range les sections par module, dans l'ordre du rail PC", () => {
    const labels = [...nav.slice(nav.indexOf("export const MORE_GROUPS"), nav.indexOf("export const MORE_ITEMS")).matchAll(/\{ label: '([^']+)', items: \[/g)].map(m => m[1])
    expect(labels).toEqual(["Pages", "QR codes", "Impression", "Statistiques", "Réglages"])
    const rail = [...shell.slice(shell.indexOf("const NAV_GROUPS"), shell.indexOf("const GUEST_NAV")).matchAll(/label: "([^"]+)", kicker/g)].map(m => m[1])
    expect(rail.slice(1)).toEqual(labels)
  })
  it("MORE_ITEMS reste la liste à plat (badge, routes actives) et couvre chaque groupe", () => {
    expect(nav).toContain("export const MORE_ITEMS: { href: string; label: string; sub: string }[] = MORE_GROUPS.flatMap(g => g.items)")
    expect(nav).toContain("routes: MORE_ITEMS.map(m => m.href)")
  })
  it("est sur --surface avec un filet, sans flou ni contour doré", () => {
    const feuille = nav.slice(nav.indexOf("{/* Feuille « Plus »"))
    expect(feuille).toContain("background: 'var(--surface)'")
    expect(feuille).toContain("border: '1px solid var(--line-strong)'")
    expect(feuille).not.toContain("backdropFilter")
    expect(feuille).not.toContain("color-mix(in srgb, ${GOLD}")
  })
})

describe("la feuille « Créer »", () => {
  it("est sur --surface avec un filet, icônes sur surface-2, sans flou", () => {
    const feuille = shell.slice(shell.indexOf('aria-label="Créer"'), shell.indexOf("{/* BARRE DE NAVIGATION MOBILE"))
    expect(feuille).toContain('background: "var(--surface)", borderTopLeftRadius: 18')
    expect(feuille).toContain('background: "var(--surface-2)", border: "1px solid var(--line)"')
    expect(feuille).not.toContain("backdropFilter")
    expect(feuille).not.toContain("color-mix(in srgb, ${G} 14%")
  })
})
