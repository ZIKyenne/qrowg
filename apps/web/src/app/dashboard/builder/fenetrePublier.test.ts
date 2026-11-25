import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// La fenêtre « Publier » était un panneau position:absolute de ~900 px, sans
// maxHeight ni overflow, dans un parent overflow:hidden : sur un écran de
// 700-768 px de haut, les supports d'impression étaient inatteignables. Ni rôle
// dialog, ni Échap.

// Depuis la découpe de BuilderV4 (vague 4, point 6), la fenêtre vit dans
// FenetrePublier.tsx ; l'éditeur l'ouvre et lui passe de quoi se fermer.
const editeur = readFileSync(join(__dirname, "BuilderV4.tsx"), "utf8")
const src = readFileSync(join(__dirname, "FenetrePublier.tsx"), "utf8")

describe("la fenêtre Publier", () => {
  it("passe par la primitive Modal (défilement, dialog, Échap, focus)", () => {
    const i = editeur.indexOf("{showPublishPopup && (")
    expect(i).toBeGreaterThan(-1)
    expect(editeur.slice(i, i + 200)).toContain("<FenetrePublier onClose={() => setShowPublishPopup(false)}")
    expect(src).toContain("<Modal open onClose={onClose} maxWidth={360}>")
    expect(src).toMatch(/^\s*import \{ Modal \} from "@\/components\/ui\/Modal"/m)
  })

  it("n'est plus un panneau absolu accroché sous le bouton", () => {
    for (const s of [editeur, src]) expect(s).not.toContain('top: "calc(100% + 12px)"')
  })

  it("la primitive défile bien et ferme à Échap", () => {
    const modal = readFileSync(join(__dirname, "../../../components/ui/Modal.tsx"), "utf8")
    expect(modal).toContain('maxHeight: "90dvh", overflowY: "auto"')
    // Échap, piège de focus et restitution vivent dans le hook partagé.
    expect(modal).toContain("useDialogue(open, onClose")
    // Réancré au lot v139 : même fichier, Échap y est descendu d'un cran.
    expect(readFileSync(join(__dirname, "../../../components/ui/useDialogue.ts"), "utf8")).toContain("useFermetureEchap(ouvert, fermer)")
  })
})
