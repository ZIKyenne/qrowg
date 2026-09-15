import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

// v55 — les six écrans du tableau de bord que la revue n'avait pas pu voir (données
// réelles nécessaires) ont maintenant un banc d'essai, et ce qu'on y a vu est corrigé :
// une erreur de chargement n'est plus déguisée en « aucun élément », une seule couleur
// d'accent sur Messages, un cockpit aligné sur l'accueil, le nom du plan depuis lib/plans.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

describe("bancs d'essai", () => {
  for (const h of ["accueil", "messages", "medias", "equipe", "domaines", "redirections"]) {
    it(`e2e-harness/${h} existe et est gardé (404 en production)`, () => {
      const p = join(__dirname, `../e2e-harness/${h}/page.tsx`)
      expect(existsSync(p)).toBe(true)
      expect(readFileSync(p, "utf8")).toContain("if (!harnessAutorise()) notFound()")
    })
  }
})

describe("une erreur de chargement n'est pas un état vide", () => {
  it("Médias : listAssets remonte l'erreur de stockage, l'écran la dit et propose de réessayer", () => {
    expect(lire("builder/useImageUpload.ts")).toContain('if (error) throw new Error(error.message || "Lecture des médias impossible")')
    const a = lire("assets/page.tsx")
    expect(a).toContain("setErreurChargement(")
    expect(a).toContain("Impossible de charger vos médias")
    expect(a).toContain(">Réessayer</button>")
    // et la bibliothèque de l'éditeur ne casse pas pour autant
    expect(lire("builder/ImageUpload.tsx")).toContain("listAssets().catch(() => [])")
  })
  // Réancré sur l'intention (lot v129). Les deux écrans écrivaient le même bloc
  // d'alerte à la main, chacun le sien ; ils passent maintenant par `lireDe` et
  // le bloc partagé `LectureRatee`. Ce qui est vérifié n'a pas changé : la
  // réponse est regardée, le refus est dit, et « Réessayer » est offert.
  for (const [f, quoi] of [["domains/DomainsPage.tsx", "domaines"], ["redirects/RedirectsPanel.tsx", "redirections"]] as const) {
    it(`${quoi} : une réponse en erreur est dite, avec « Réessayer »`, () => {
      const s = lire(f)
      expect(s).toMatch(/lireDe\("\/api\/\w+", "Vos \w+ n'ont pas pu être chargé/)
      expect(s, "le refus remplit l'état d'erreur, pas la liste").toContain("if (refus) setErreurChargement(refus)")
      expect(s).toContain("<LectureRatee message={erreurChargement} reessayer={() => { void charger() }} />")
    })
  }
  it("Équipe : « Réessayer » à côté du message", () => {
    expect(lire("team/page.tsx")).toContain('onClick={() => { setLoading(true); void load() }} className="da-btn-neutral da-btn-neutral--sm">Réessayer</button>')
  })
})

describe("écrans calmés", () => {
  it("Messages : plus de couleur par type, contacts en boutons neutres, filtres sur surface-2", () => {
    const l = lire("leads/LeadsClient.tsx")
    expect(l).not.toContain("TYPE_COLORS")
    expect(l).toContain('const tc = "var(--accent)"')
    expect(l).toContain('className="da-btn-neutral da-btn-neutral--sm" style={{ fontSize: 12.5 }}><Mail size={13} />')
    expect(l).toContain('className="da-btn-neutral da-btn-neutral--sm" style={{ fontSize: 12.5 }}><Phone size={13} />')
    expect(l).not.toContain('background: "var(--action-bg)"')
  })
  it("Accueil : quatre chiffres sur une grille, sparkline en couleur mélangée (plus de « var(--accent)55 » invalide)", () => {
    const d = lire("DashboardClient.tsx")
    expect(d).toContain('className="dash-kpis"')
    expect(d).toContain("`color-mix(in srgb, ${couleur} 35%, transparent)`")
    expect(d).not.toContain('s.color + "55"')
    expect(d).toContain('label: "Domaines personnalisés"')
    expect(d).not.toContain("booster")
    expect(d).toContain("{s.spark && !isMobile && weekViews.length === 7 && (")
  })
  it("Domaines : un seul état vide, nom du plan depuis lib/plans, plus de « registrar »", () => {
    const m = lire("domains/MultiBrandDomainsPanel.tsx")
    expect(m).toContain("{getPlan(plan).label} — {planInfo.label}")
    expect(m).not.toContain("plan?.toUpperCase()} —")
    expect(m).not.toContain(">Aucun domaine</p>")
    const d = lire("domains/DomainsPage.tsx")
    expect(d).toContain("Utilisez votre propre nom de domaine")
    expect(d).not.toContain("registrar")
  })
})
