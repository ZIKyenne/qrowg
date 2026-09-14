// « Toutes les pages », sauf les vôtres — garde de classe.
//
// Relevé du 14 septembre, compte Business à 26 pages. Le tableau de bord charge
// `.limit(20)` pour sa liste de cartes, puis fait servir ces mêmes vingt
// identifiants de périmètre de mesure aux objectifs de conversion — qui, eux,
// annoncent « Toutes les pages » :
//
//     WhatsApp — vitrine   whatsapp · 90 j · Page
//          0 conv. | taux   —   |   0 % | en retard     (réel : 270 | 7,5 % | en bonne voie)
//     WhatsApp — partout   whatsapp · 90 j · Toutes les pages
//         90 conv. | taux  20 % |  90 % | en retard     (réel : 360 | 8,9 % | en bonne voie)
//
// Les pages qui tombent hors des vingt sont les PLUS ANCIENNES — celles qui ont
// de l'historique. Et le taux affiché est plus HAUT que le vrai : la page
// manquante pesait plus en vues qu'en clics.
//
// La classe : un total ne nomme jamais un périmètre plus large que celui qui a
// été lu. Soit on lit tout, soit on le dit.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  PAGES_LISTE, PAGES_MESUREES, FENETRE_OBJECTIFS_JOURS,
  perimetreLu, phrasePerimetreIncomplet, periodeMesuree, periodeTronquee,
  phrasePeriodeTronquee, nomDePageObjectif, objectifSansPage,
} from "./perimetreDeMesure"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

describe("le périmètre lu, et rien de plus", () => {
  it("le relevé : 26 pages, 20 lues, 6 manquantes", () => {
    expect(perimetreLu(20, 26)).toEqual({ complet: false, manquantes: 6 })
    expect(perimetreLu(26, 26)).toEqual({ complet: true, manquantes: 0 })
  })

  it("sans total connu, on ne réclame rien — mais on n'invente pas non plus", () => {
    expect(perimetreLu(20, null).complet).toBe(true)
    expect(perimetreLu(20, undefined).complet).toBe(true)
    expect(perimetreLu(20, NaN).complet).toBe(true)
  })

  it("un total inférieur au nombre lu ne produit pas de manquantes négatives", () => {
    expect(perimetreLu(20, 3).manquantes).toBe(0)
    expect(perimetreLu(-4, 10).manquantes).toBe(10)
  })

  it("la phrase ne s'affiche que s'il manque vraiment quelque chose", () => {
    expect(phrasePerimetreIncomplet(0)).toBeNull()
    expect(phrasePerimetreIncomplet(-3)).toBeNull()
    expect(phrasePerimetreIncomplet(1)).toContain("1 page n'entre pas")
    const p = phrasePerimetreIncomplet(6)!
    expect(p).toContain("6 pages n'entrent pas")
    expect(p, "la phrase doit dire jusqu'où va la mesure").toContain(String(PAGES_MESUREES))
  })
})

describe("la période affichée est celle qu'on a pu mesurer", () => {
  it("tant qu'elle tient dans la fenêtre, rien à signaler", () => {
    for (const j of [7, 30, 90]) {
      expect(periodeMesuree(j), `${j} j`).toBe(j)
      expect(periodeTronquee(j), `${j} j`).toBe(false)
      expect(phrasePeriodeTronquee(j), `${j} j`).toBeNull()
    }
  })

  it("au-delà, la carte le dit au lieu de laisser croire", () => {
    // L'API accepte period_days jusqu'à 365 (lib/bornes + api/goals).
    expect(periodeMesuree(365)).toBe(FENETRE_OBJECTIFS_JOURS)
    expect(periodeTronquee(365)).toBe(true)
    const p = phrasePeriodeTronquee(180)!
    expect(p).toContain(`${FENETRE_OBJECTIFS_JOURS} jours`)
    expect(p).toContain("ne sont pas chargées")
  })

  it("et la borne de l'API est bien celle qu'on suppose", () => {
    const route = lire("app/api/goals/route.ts")
    expect(route, "la borne de period_days a changé").toContain("entier(body?.period_days, 1, 365, 30)")
  })

  it("ne renvoie rien d'absurde sur une période absurde", () => {
    for (const v of [0, -12, NaN]) {
      expect(periodeMesuree(v as number), String(v)).toBe(0)
      expect(periodeTronquee(v as number), String(v)).toBe(false)
    }
  })
})

describe("le nom de la page d'un objectif, sans mensonge par défaut", () => {
  const pages = [{ id: "p1", title: "Le Comptoir — vitrine", slug: "le-comptoir" }, { id: "p2", title: "  ", slug: "menu-midi" }]

  it("trois cas, trois phrases vraies", () => {
    expect(nomDePageObjectif(null, pages)).toBe("Toutes les pages")
    expect(nomDePageObjectif("p1", pages)).toBe("Le Comptoir — vitrine")
    // Avant le lot : « Page », qui ne disait ni laquelle ni pourquoi c'était vide.
    expect(nomDePageObjectif("pX", pages)).toBe("Page supprimée")
  })

  it("sans titre, l'adresse de la page plutôt qu'un mot vide", () => {
    expect(nomDePageObjectif("p2", pages)).toBe("menu-midi")
    expect(nomDePageObjectif("p3", [{ id: "p3" }])).toBe("Page sans titre")
  })

  it("et on sait dire quand la page manque", () => {
    expect(objectifSansPage(null, pages)).toBe(false)
    expect(objectifSansPage("p1", pages)).toBe(false)
    expect(objectifSansPage("pX", pages)).toBe(true)
    expect(objectifSansPage("p1", null)).toBe(true)
  })
})

describe("le tableau de bord lit enfin ce qu'il annonce", () => {
  const page = lire("app/dashboard/page.tsx")

  it("la liste de cartes garde ses 20, la mesure prend toutes les pages", () => {
    expect(page).toContain("limit(PAGES_LISTE)")
    expect(page).toContain("limit(PAGES_MESUREES)")
    // Le périmètre de mesure ne vient plus de la liste affichée.
    expect(page).toContain("const ids = (pagesMesurees ?? [])")
    expect(page, "les identifiants de la liste servent encore de périmètre")
      .not.toContain("const ids = (pgs ?? []).map")
  })

  it("le rafraîchissement après une mutation compte sur le même périmètre", () => {
    const client = lire("app/dashboard/DashboardClient.tsx")
    expect(client).toContain("limit(PAGES_LISTE)")
    expect(client).toContain("limit(PAGES_MESUREES)")
    expect(client).toContain("const ids = (pagesMesurees ?? []).map(p => p.id)")
    expect(client, "le rendu serveur et le rafraîchissement ne compteraient plus pareil")
      .not.toContain("const ids = (pgs ?? []).map(p => p.id)")
  })

  it("et il sait combien de pages existent vraiment", () => {
    expect(page).toContain('select("id", { count: "exact", head: true })')
    expect(page).toContain("pagesTotal={pagesTotal ?? null}")
  })

  it("la fenêtre de données est celle que la carte compare", () => {
    expect(page).toContain("setDate(since90.getDate() - FENETRE_OBJECTIFS_JOURS)")
    expect(page, "la fenêtre est retapée en dur").not.toContain("since90.getDate() - 90")
  })

  it("l'écran des objectifs affiche le périmètre et l'état de la page", () => {
    const dash = lire("app/dashboard/analytics/GoalsDashboard.tsx")
    expect(dash).toContain("nomDePageObjectif(goal.page_id, pages)")
    expect(dash, "le nom de page repart d'un `?? \"Page\"`").not.toContain('pages.find(p => p.id === goal.page_id)?.title ?? "Page"')
    expect(dash).toContain("phrasePerimetreIncomplet(perimetreLu(pages.length, pagesTotal).manquantes)")
    expect(dash, "calculé mais jamais rendu").toContain("{pageAbsente")
    expect(dash).toContain("periodeRognee")
  })
})

describe("garde de classe : un périmètre annoncé est un périmètre lu", () => {
  function fichiers(): string[] {
    const out: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
    }
    marcher(SRC)
    return out
  }

  it("aucun écran ne fait servir un plafond d'affichage de périmètre de mesure", () => {
    // Une liste peut être bornée — c'est un choix d'écran. Ce qui est interdit,
    // c'est qu'un fichier borne ses pages par un nombre écrit à la main PUIS
    // compte des événements sur ces pages : le plafond devient alors le
    // périmètre du chiffre, sans que personne l'ait décidé ni ne le dise.
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      if (!/\.in\("page_id",/.test(src)) continue
      const rel = path.relative(SRC, f)
      for (const ligne of src.split("\n")) {
        if (!/from\("pages"\)/.test(ligne)) continue
        const m = ligne.match(/\.limit\((\d+)\)/)
        if (!m) continue
        expect.fail(`${rel} : plafond de pages écrit en dur (${m[1]}) dans un écran qui compte — ${ligne.trim()}`)
      }
    }
  })

  it("tout ce qui se compte sur le tableau de bord part du même périmètre", () => {
    for (const f of ["app/dashboard/page.tsx", "app/dashboard/DashboardClient.tsx"]) {
      const src = lire(f)
      // `.eq("page_id", …)` vise UNE page nommée : ce n'est pas un périmètre.
      const lignes = src.split("\n").filter(l => /from\("(?:block_clicks|page_views)"\)/.test(l) && /\.in\("page_id",/.test(l))
      expect(lignes.length, `${f} : aucune requête de comptage trouvée`).toBeGreaterThanOrEqual(3)
      for (const l of lignes) expect(l, `${f} : un comptage lit un autre périmètre`).toContain('.in("page_id", ids)')
    }
  })

  it("les trois constantes de périmètre sont cohérentes entre elles", () => {
    expect(PAGES_MESUREES).toBeGreaterThan(PAGES_LISTE)
    expect(FENETRE_OBJECTIFS_JOURS).toBeGreaterThanOrEqual(90)
  })
})
