import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

// Lot 2 « appli » (18 nov.) : UN menu « ⋯ » dans le produit. La leçon du 5
// octobre — une primitive sans garde disparaît — vaut ici : ce test vérifie que
// les écrans l'UTILISENT, et qu'aucune feuille faite main ne revient.

const SRC = path.join(__dirname, "..", "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function fichiers(dir: string, out: string[] = []): string[] {
  for (const n of fs.readdirSync(path.join(SRC, dir)).sort()) {
    const rel = `${dir}/${n}`
    if (fs.statSync(path.join(SRC, rel)).isDirectory()) { if (n !== "e2e-harness") fichiers(rel, out); continue }
    if (/\.tsx$/.test(n) && !/\.test\./.test(n)) out.push(rel)
  }
  return out
}

describe("le menu « ⋯ » est la feuille d'actions, partout", () => {
  it("les quatre menus d'actions l'utilisent", () => {
    for (const f of [
      "app/dashboard/DashboardClient.tsx",          // Accueil : une page
      "app/dashboard/assets/page.tsx",              // Médias : un fichier
      "app/dashboard/builder/BuilderV4.tsx",        // Éditeur : un bloc
      "app/dashboard/qr-codes/QRStudioZero.tsx",    // Studio QR, au doigt
    ]) expect(lire(f), f).toContain("<ActionSheet ")
  })

  it("elle est bâtie sur LA feuille : geste, retour, focus hérités", () => {
    const src = lire("components/mobile/ActionSheet.tsx")
    expect(src).toContain('import { MobileSheet } from "./MobileSheet"')
    expect(src).toContain("hauteurAuContenu")
    // Le destructif à part, en bas.
    expect(src).toContain("const dangereuses = actions.filter(a => a.danger)")
    // Au doigt : 52 px par ligne.
    expect(src).toContain("minHeight: 52")
  })

  it("le Studio QR garde UNE liste d'entrées pour la souris et le doigt", () => {
    const src = lire("app/dashboard/qr-codes/QRStudioZero.tsx")
    expect(src).toContain("function entreesDuMenu(q: QRCode)")
    expect(src.match(/entreesDuMenu\(/g)?.length, "définition + menu flottant + feuille").toBe(3)
  })
})

describe("les feuilles de la barre du bas sont LA feuille", () => {
  // Lot 5 « appli » (18 nov.) : faites main, elles ne se tiraient pas vers le
  // bas, ne se fermaient pas au bouton retour, ne verrouillaient pas le fond.
  it("« Créer » (coquille) et « Plus » (barre) utilisent MobileSheet", () => {
    expect(lire("app/dashboard/DashboardShell.tsx")).toMatch(/<MobileSheet open=\{isMobile && !hideMobileNav && createOpen\}/)
    expect(lire("components/MobileNav.tsx")).toMatch(/<MobileSheet open=\{moreOpen\}/)
  })
})

describe("aucune feuille faite main ne revient", () => {
  // Une poignée dessinée à la main = une feuille recopiée. Celles qui restent ne
  // sont pas des listes d'actions (navigation « Plus », grille « Créer »,
  // sélecteur d'image, modèles, atelier) : nommées, et la liste ne fait que
  // rétrécir. Trois sont parties au lot 2 (Accueil, Médias, éditeur) ; deux au
  // lot 5 (« Créer » et « Plus » de la barre du bas, bâties sur MobileSheet).
  const RESTANTES = [
    "app/dashboard/builder/ImageUpload.tsx",
    "app/dashboard/print-studio/PrintStudioClient.tsx",
    "app/dashboard/templates/page.tsx",
  ]
  it("les poignées dessinées à la main sont celles de la liste, pas une de plus", () => {
    const POIGNEE = /width: ?40, ?height: ?4, ?borderRadius: ?4/
    const trouvees = [...fichiers("app"), ...fichiers("components")]
      .filter(f => f !== "components/mobile/MobileSheet.tsx" && POIGNEE.test(lire(f)))
    expect(trouvees.sort()).toEqual([...RESTANTES].sort())
  })
})
