import { describe, it, expect } from "vitest"
import { creerHistoriqueDesFeuilles } from "./historiqueDesFeuilles"

// Un faux navigateur fidèle à ce qui compte : `back()` est ASYNCHRONE. On
// sépare donc « le tour suivant » (tâches programmées) de « l'arrivée du
// retour » (son `popstate`), pour rejouer chaque ordre possible.
function banc() {
  let ici = 0                                // position dans l'historique (0 = l'écran)
  const ecouteurs: (() => void)[] = []
  const taches: (() => void)[] = []
  const retoursEnRoute: number[] = []
  const popstate = () => ecouteurs.forEach(f => f())
  const h = creerHistoriqueDesFeuilles({
    pousser: () => { ici++ },
    reculer: () => { retoursEnRoute.push(1) },
    ecouter: f => { ecouteurs.push(f) },
    plusTard: f => { taches.push(f) },
  })
  return {
    h,
    /** Le tour suivant : les retraits programmés partent. */
    tour: () => { while (taches.length) taches.shift()!() },
    /** Les retours lancés arrivent. */
    arriver: () => { while (retoursEnRoute.length) { retoursEnRoute.shift(); ici--; popstate() } },
    retourUtilisateur: () => { ici--; popstate() },
    pos: () => ici,
  }
}

describe("le bouton retour et les feuilles", () => {
  it("ouvrir pousse UNE entrée ; le retour de l'utilisateur ferme la feuille sans quitter l'écran", () => {
    const b = banc(); let fermee = 0
    const fermer = b.h.ouvrir(() => { fermee++; fermer() })
    expect(b.pos()).toBe(1)
    b.retourUtilisateur(); b.tour(); b.arriver()
    expect(fermee).toBe(1)
    expect(b.pos()).toBe(0)                  // l'écran, pas au-delà
  })

  it("fermer par la croix retire l'entrée", () => {
    const b = banc()
    b.h.ouvrir(() => {})()
    b.tour(); b.arriver()
    expect(b.pos()).toBe(0)
    expect(b.h.etat()).toEqual({ ouvertes: 0, entree: false, retoursInternes: 0 })
  })

  it("monter-démonter-remonter (React en développement) : la feuille RESTE ouverte, une seule entrée", () => {
    const b = banc(); let fermee = 0
    b.h.ouvrir(() => fermee++)()             // montage puis démontage immédiat
    b.h.ouvrir(() => fermee++)               // remontage, avant le tour suivant
    b.tour(); b.arriver()
    expect(fermee).toBe(0)
    expect(b.pos()).toBe(1)
  })

  it("rouvrir PENDANT que notre retour est en route : elle n'est pas refermée, son entrée est reposée", () => {
    const b = banc(); let fermee = 0
    b.h.ouvrir(() => {})()
    b.tour()                                 // le retrait part…
    b.h.ouvrir(() => fermee++)               // …on rouvre avant qu'il n'arrive
    b.arriver()                              // il arrive
    expect(fermee).toBe(0)
    expect(b.pos()).toBe(1)                  // une entrée pour la nouvelle feuille
    expect(b.h.etat()).toEqual({ ouvertes: 1, entree: true, retoursInternes: 0 })
  })

  it("après une fermeture, le VRAI retour suivant n'est pas avalé", () => {
    const b = banc(); let fermee = 0
    b.h.ouvrir(() => {})(); b.tour(); b.arriver()
    const f2 = b.h.ouvrir(() => { fermee++; f2() })
    b.retourUtilisateur(); b.tour(); b.arriver()
    expect(fermee).toBe(1)
    expect(b.pos()).toBe(0)
  })

  it("deux feuilles empilées : le retour ferme celle du dessus, l'autre reste fermable par retour", () => {
    const b = banc(); const fermees: string[] = []
    const fA = b.h.ouvrir(() => { fermees.push("A"); fA() })
    const fB = b.h.ouvrir(() => { fermees.push("B"); fB() })
    b.retourUtilisateur(); b.tour(); b.arriver()
    expect(fermees).toEqual(["B"])
    expect(b.h.etat()).toMatchObject({ ouvertes: 1, entree: true })
    b.retourUtilisateur(); b.tour(); b.arriver()
    expect(fermees).toEqual(["B", "A"])
    expect(b.pos()).toBe(0)
  })
})

describe("MobileSheet passe par le gestionnaire", () => {
  it("plus de marque dans history.state", async () => {
    const { readFileSync } = await import("node:fs")
    const { join } = await import("node:path")
    const src = readFileSync(join(__dirname, "MobileSheet.tsx"), "utf8")
    expect(src).toContain("historiqueDesFeuilles().ouvrir(")
    expect(src).not.toContain("feuilleMobile: true")
    // Le code, pas les commentaires (qui racontent l'ancien fonctionnement).
    const code = src.split(/\r?\n/).filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n")
    expect(code).not.toContain("history.back()")
    expect(code).not.toContain("history.pushState")
  })
})
