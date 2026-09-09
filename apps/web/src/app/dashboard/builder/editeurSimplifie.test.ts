import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { alertesPublication } from "./AlertesPublication"

// Revue du 9 septembre (P0, éditeur — simplifications) : un seul « Brouillon
// gardé », un seul mot pour la page, compteurs sans « Excellent », texte des
// panneaux lisible, et ce qui ne sera pas publié résumé près de « Publier ».

const v4 = readFileSync(join(__dirname, "BuilderV4.tsx"), "utf8")
const panels = readFileSync(join(__dirname, "builderPanels.tsx"), "utf8")

describe("doublons", () => {
  it("« Brouillon gardé » : une seule mention à la fois (barre du haut sur grand écran, bande sur mobile)", () => {
    expect(v4).not.toContain("Brouillon gardé ici")
    expect(v4).toContain('{guest && !isMobile && draftState === "saved" && <span')
    expect(v4).toContain('{guest && isMobile && draftState === "saved" && <span')
  })
  it("le bandeau du canevas dit « Page », pas « Votre page » (un seul mot partout)", () => {
    expect(v4).toContain(">Page</span>")
    expect(v4).not.toContain(">Votre page</span>")
  })
})

describe("compteurs de longueur", () => {
  it("plus de « Excellent ✓ » ni de « Bonne longueur ✓ » : un compteur, une alerte seulement si elle sert", () => {
    expect(panels).not.toContain("Excellent ✓")
    expect(panels).not.toContain("Bonne longueur ✓")
    expect(panels).toContain('const alerte = len < short ? ["Un peu court", "#F59E0B"] : len > max ? ["Trop long", "var(--danger)"] : null')
    expect(panels).toContain("{len}/{max}</span>")
  })
})

describe("texte des panneaux", () => {
  it("champs de l'inspecteur à 14 px, étiquettes ≥ 12 px, plus rien sous 12 px dans les aides", () => {
    expect(panels).toContain('padding: "10px 11px", color: "var(--ink)", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif" }')
    expect(panels).not.toMatch(/<label style=\{\{ color: MUTED, fontSize: (9|10|11),/)
    expect(panels).not.toContain("fontSize: 10.5")
    expect(v4).toContain('const labelStyle: React.CSSProperties = { color: MUTED, fontSize: 12, display: "block"')
  })
  it("onglets Contenu · Style · Effets : 40 px de haut sur grand écran, 44 sur mobile, texte 12,5 px", () => {
    expect(v4).toContain("minHeight: isMobile ? 44 : 40, padding: isMobile ? \"10px 3px\" : \"8px 3px\"")
    expect(v4).toContain("fontSize: isMobile ? 12.5 : 12.5,")
  })
})

describe("erreurs de publication près de « Publier »", () => {
  it("la fenêtre Publier résume les boutons sans lien des blocs visibles, chaque ligne ouvre le bloc", () => {
    expect(v4).toContain('<AlertesPublication blocks={blocks} onVoir={id => { setSelectedId(id); setRightTab("edit"); setShowPublishPopup(false)')
    // Placée dans la fenêtre Publier, après l'erreur serveur et avant « Voir la page ».
    const i = v4.indexOf("<AlertesPublication")
    expect(i).toBeGreaterThan(v4.indexOf("{/* Erreur publication */}"))
    expect(i).toBeLessThan(v4.indexOf("{/* Voir la page */}"))
  })
  it("alertesPublication : un bouton sans lien remonte, un bloc masqué non, un bouton avec lien non", () => {
    const blocs: any[] = [
      { id: "a", type: "cta_button", visible: true, content: { label: "Me contacter", url: "" } },
      { id: "b", type: "cta_button", visible: false, content: { label: "Caché", url: "" } },
      { id: "c", type: "cta_button", visible: true, content: { label: "Réserver", url: "https://exemple.fr" } },
    ]
    const a = alertesPublication(blocs)
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ blocId: "a", texte: "Bouton « Me contacter » sans lien" })
    expect(a[0].bloc).toBe("Bouton CTA")
  })
})
