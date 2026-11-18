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

// Relevé du 18 nov. : une feuille qui contient un lien se ferme parce qu'on a
// changé de page. Reculer alors ramenait sur l'écran qu'on venait de quitter.
describe("un lien suivi depuis une feuille ne ramène pas en arrière", () => {
  function bancAvecAdresse() {
    let adresse = "/studio"
    const reculs: number[] = []
    const taches: (() => void)[] = []
    const h = creerHistoriqueDesFeuilles({
      pousser: () => {},
      reculer: () => { reculs.push(1) },
      ecouter: () => {},
      plusTard: f => { taches.push(f) },
      adresse: () => adresse,
    })
    return { h, aller: (a: string) => { adresse = a }, tour: () => { while (taches.length) taches.shift()!() }, reculs }
  }

  it("fermée sur place : l'entrée est retirée, comme avant", () => {
    const b = bancAvecAdresse()
    const fermer = b.h.ouvrir(() => {})
    fermer(); b.tour()
    expect(b.reculs).toHaveLength(1)
  })

  it("fermée parce qu'on a changé de page : on ne recule pas", () => {
    const b = bancAvecAdresse()
    const fermer = b.h.ouvrir(() => {})
    b.aller("/upgrade?plan=pro")   // « Voir la formule » suivi
    fermer(); b.tour()
    expect(b.reculs).toHaveLength(0)
    expect(b.h.etat().entree).toBe(false)
    // …et la feuille suivante repart proprement.
    b.h.ouvrir(() => {})
    expect(b.h.etat().entree).toBe(true)
  })

  // Lot 5 « appli » (18 nov.), mesuré au navigateur : Next ne change l'adresse
  // qu'APRÈS avoir chargé l'écran suivant. Au tour suivant elle est encore
  // l'ancienne — le test d'adresse ne voyait rien, et le recul annulait le lien.
  it("lien suivi, adresse PAS encore changée : on ne recule pas", () => {
    const b = bancAvecAdresse()
    const fermer = b.h.ouvrir(() => {})
    b.h.lienSuivi()
    fermer(); b.tour()                 // l'adresse est toujours /studio
    expect(b.reculs).toHaveLength(0)
    expect(b.h.etat().entree).toBe(false)
  })

  it("l'intention ne survit pas : la feuille suivante, fermée sur place, retire son entrée", () => {
    const b = bancAvecAdresse()
    const f1 = b.h.ouvrir(() => {})
    b.h.lienSuivi(); f1(); b.tour()
    const f2 = b.h.ouvrir(() => {})
    f2(); b.tour()
    expect(b.reculs).toHaveLength(1)
  })

  it("le navigateur réel fournit bien l'adresse", async () => {
    const { readFileSync } = await import("node:fs")
    const { join } = await import("node:path")
    expect(readFileSync(join(__dirname, "historiqueDesFeuilles.ts"), "utf8")).toContain("adresse: () => location.href")
  })
})

describe("une couche qui se ferme en deux temps", () => {
  it("après un premier retour, ce qui reste ouvert garde le bouton retour", () => {
    let pousses = 0, reculs = 0
    const taches: (() => void)[] = []
    let popstate = () => {}
    const h = creerHistoriqueDesFeuilles({
      pousser: () => { pousses++ },
      reculer: () => { reculs++ },
      ecouter: f => { popstate = f },
      plusTard: f => { taches.push(f) },
    })
    let calibrage = true, pleinEcran = true
    // Une seule fermeture pour deux couches, comme l'atelier d'impression.
    h.ouvrir(() => { if (calibrage) calibrage = false; else pleinEcran = false })
    expect(pousses).toBe(1)
    popstate(); while (taches.length) taches.shift()!()
    expect(calibrage).toBe(false)
    expect(pleinEcran).toBe(true)
    expect(pousses, "l'entrée est reposée pour le plein écran").toBe(2)
    popstate(); while (taches.length) taches.shift()!()
    expect(pleinEcran).toBe(false)
    expect(reculs).toBe(0)
  })
})
