import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Lot 8 « appli » (18 nov.) : `.cible-doigt` / `.cible-doigt-carre` — les
// commandes denses de l'éditeur passent à 44 px SOUS LE DOIGT, et seulement là.
// Une primitive sans garde disparaît (leçon du 5 octobre) : celle-ci vérifie la
// règle ET ses usages. La mesure au navigateur reste e2e/ciblesAuPouce.

const SRC = join(__dirname, "..")
const lire = (p: string) => readFileSync(join(SRC, p), "utf8")

describe("la cible au doigt", () => {
  it("la règle vit dans la feuille globale, réservée aux appareils tactiles", () => {
    const css = lire("app/globals.css")
    const i = css.indexOf(".cible-doigt {")
    expect(i, "règle .cible-doigt absente").toBeGreaterThan(0)
    // Le bloc @media qui la contient est bien `(hover: none) and (pointer: coarse)` :
    // l'affichage dense de la souris ne bouge pas.
    const media = css.lastIndexOf("@media", i)
    expect(css.slice(media, i)).toContain("(hover: none) and (pointer: coarse)")
    expect(css.slice(i, i + 200)).toContain("min-height: var(--cible-pouce, 44px) !important")
    expect(css).toContain(".cible-doigt-carre { width: var(--cible-pouce, 44px) !important; height: var(--cible-pouce, 44px) !important; }")
  })

  it("le segmenteur de l'éditeur la porte, actif OU non", () => {
    const src = lire("app/dashboard/builder/builderPanels.tsx")
    expect(src).toContain('className={on ? "cible-doigt" : "da-seg-btn cible-doigt"}')
  })

  it("Monter / Descendre / Supprimer d'une liste répétée la portent (24 blocs)", () => {
    const src = lire("app/dashboard/builder/builderPanels.tsx")
    for (const nom of ["Monter", "Descendre", "Supprimer"])
      expect(src, nom).toMatch(new RegExp(`aria-label="${nom}" className="cible-doigt-carre"`))
  })

  it("les formats du recadrage la portent", () => {
    expect(lire("app/dashboard/builder/ImageCropModal.tsx")).toContain('className="cible-doigt" data-testid={"aspect-" + a.key}')
  })

  it("Domaines et Redirections : boutons au doigt, et rangés SOUS le texte au téléphone", () => {
    const css = lire("app/globals.css")
    expect(css).toContain(".ligne-actions__texte { flex: 1 1 calc(100% - 80px) !important; }")
    for (const f of ["app/dashboard/domains/DomainsPage.tsx", "app/dashboard/redirects/RedirectsPanel.tsx"]) {
      const src = lire(f)
      for (const c of ['className="ligne-actions"', 'className="ligne-actions__texte"', 'className="ligne-actions__actions"'])
        expect(src, `${f} : ${c}`).toContain(c)
      expect(src.match(/className="cible-doigt-carre"/g)?.length ?? 0, f).toBeGreaterThanOrEqual(3)
    }
    // Les deux commandes muettes des redirections ont un nom.
    expect(lire("app/dashboard/redirects/RedirectsPanel.tsx")).toContain('aria-label={r.enabled ? "Désactiver cette redirection" : "Réactiver cette redirection"}')
  })
})
