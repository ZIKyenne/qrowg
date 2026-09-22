// Trois compteurs affichés, et ce qu'ils comptent vraiment — garde de classe.
//
// Relevé du 14 septembre, en lisant le schéma comme oracle.
//
//   QUI INCRÉMENTE `pages.total_views` ?
//      trigger on_scan_created          after insert on scans
//         update public.qr_codes set total_scans = total_scans + 1 …
//         update public.pages     set total_views = total_views + 1 …
//         update public.profiles  set total_scans = total_scans + 1 …
//      Trigger sur `page_views` : AUCUN
//
//   UNE PAGE, UN MOIS : 40 scans du QR en salle, 300 visites par lien Instagram.
//      Carte de la page (dashboard)   « 40 vues »    ← pages.total_views
//      Écran Statistiques             « 340 vues »   ← lignes page_views
//      Écart : 300 visites, soit 88 % du trafic de la page.
//
// Deux autres colonnes, elles, ne sont écrites NULLE PART :
// `pages.unique_views` — affichée en « Visiteurs uniq » avec l'infobulle
// « Visiteurs uniques (hors doublons) », donc zéro pour tout le monde, et
// exportée dans deux CSV — et `profiles.total_pages`, lue par quatre écrans.
//
// La classe : un compteur qu'on affiche est alimenté par quelque chose. Sinon
// on calcule le vrai, ou on se tait.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  FENETRE_VISITEURS_JOURS, COMPTEURS_PAR_TRIGGER, COLONNES_MORTES,
  vueACompterEnBase, estColonneMorte, visiteursUniques,
  libelleVisiteursUniques, infobulleVisiteursUniques, nombreDePages,
} from "./compteursDePage"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")
const SQL = fs.readFileSync(path.join(SRC, "../../../supabase/migrations/20260521200846_initial_schema.sql"), "utf8")

describe("ce que le schéma compte vraiment", () => {
  it("le trigger des compteurs écoute `scans`, et rien d'autre", () => {
    expect(SQL).toContain("create trigger on_scan_created\n  after insert on public.scans")
    expect(SQL, "un trigger sur page_views changerait la règle du lot")
      .not.toMatch(/after insert on public\.page_views/)
  })

  it("et il touche bien ces trois compteurs-là", () => {
    const fn = SQL.slice(SQL.indexOf("function public.increment_scan_counters"), SQL.indexOf("create trigger on_scan_created"))
    for (const c of COMPTEURS_PAR_TRIGGER) {
      const [table, colonne] = c.split(".")
      expect(fn, c).toMatch(new RegExp(`update public\\.${table}\\s+set ${colonne}`))
    }
  })

  it("une visite venue d'un QR est déjà comptée — on ne la compte pas deux fois", () => {
    expect(vueACompterEnBase(true)).toBe(false)
    // Tout le reste — lien partagé, moteur de recherche, bio Instagram — ne
    // l'était par personne.
    expect(vueACompterEnBase(false)).toBe(true)
    expect(vueACompterEnBase(null)).toBe(true)
    expect(vueACompterEnBase(undefined)).toBe(true)
  })

  it("et la route de suivi applique la règle", () => {
    const track = lire("app/api/track/route.ts")
    expect(track).toContain("vueACompterEnBase(scanProuve)")
    expect(track).toContain('update({ total_views:')
    // Le compteur ne doit jamais faire échouer le suivi.
    const i = track.indexOf("vueACompterEnBase(scanProuve)")
    expect(track.slice(i, i + 500)).toContain("catch")
  })
})

describe("les visiteurs uniques se mesurent au lieu de se lire", () => {
  it("une session distincte, un visiteur", () => {
    expect(visiteursUniques([{ session_id: "a" }, { session_id: "b" }, { session_id: "a" }])).toBe(2)
    expect(visiteursUniques([])).toBe(0)
    expect(visiteursUniques(null)).toBe(0)
  })

  it("une ligne sans session ne se rattache à personne", () => {
    expect(visiteursUniques([{ session_id: null }, { session_id: "  " }, {}, { session_id: "a" }] as any)).toBe(1)
  })

  it("le libellé porte sa fenêtre — un chiffre sans période ne veut rien dire", () => {
    expect(libelleVisiteursUniques()).toContain(String(FENETRE_VISITEURS_JOURS))
    expect(infobulleVisiteursUniques()).toContain("robots")
    expect(infobulleVisiteursUniques(30)).toContain("30 jours")
  })

  it("le profil mesure au lieu de lire la colonne", () => {
    const profil = lire("app/dashboard/profile/page.tsx")
    expect(profil, "la carte lisait une colonne que rien n'écrit").not.toContain("p.unique_views")
    // Le calcul vit dans son module — `profile/page.tsx` est tenu sous 3 000 lignes.
    expect(profil).toContain("compterVisiteursUniques(supabase")
    // Mesuré ne suffit pas : c'est CE chiffre que la carte doit afficher.
    expect(profil).toContain("const uniqueViews    = visiteursUniquesMesures")
    expect(profil).toContain("libelleVisiteursUniques()")
    const calcul = lire("app/dashboard/profile/visiteursUniquesDuCompte.ts")
    expect(calcul).toContain("visiteursUniques(data ?? [])")
    expect(calcul, "le compte de visiteurs doit exclure les robots, comme le reste").toContain("APPAREIL_ROBOT")
  })

  it("le nombre de pages vient de ce qu'on a sous la main", () => {
    expect(nombreDePages([1, 2, 3])).toBe(3)
    expect(nombreDePages([1, 2, 3], 26)).toBe(26)
    expect(nombreDePages(null)).toBe(0)
    expect(nombreDePages([1], -4)).toBe(1)
  })
})

describe("garde de classe : aucun écran ne lit un compteur que rien n'écrit", () => {
  function fichiers(): string[] {
    const out: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) marcher(p)
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
    }
    marcher(SRC)
    return out
  }

  // Lot v165 : ce balayage lit tout l'arbre du produit. Seul, il prend deux
  // secondes ; dans la suite complète, sur une machine chargée, il dépassait le
  // délai par défaut et la suite tombait — alors que rien n'était cassé. Un
  // délai explicite vaut mieux qu'un test qui échoue selon l'humeur de la
  // machine : une garde qui flanche au hasard cesse d'être crue.
  it("les colonnes mortes du relevé ont disparu du code", () => {
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/compteursDePage.ts") continue
      const src = fs.readFileSync(f, "utf8")
      for (const [i, ligne] of src.split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        for (const morte of COLONNES_MORTES) {
          expect(l.includes(morte), `${rel}:${i + 1} lit « ${morte} », que rien n'écrit — ${l}`).toBe(false)
        }
      }
    }
  }, 60_000)

  it("et elles sont bien mortes : le schéma ne les écrit nulle part", () => {
    for (const morte of COLONNES_MORTES) {
      expect(SQL, `${morte} est désormais écrite : la garde doit être revue`)
        .not.toMatch(new RegExp(`set ${morte}\\s*=`))
    }
    // La preuve par l'autre bout : celles du trigger, elles, sont bien écrites.
    for (const c of COMPTEURS_PAR_TRIGGER) {
      expect(SQL).toMatch(new RegExp(`set ${c.split(".")[1]}\\s*=`))
    }
  })

  it("tout compteur cumulé lu par un écran est écrit quelque part", () => {
    // La forme générale du défaut : une colonne `total_*` / `unique_*` lue dans
    // un `select`, que ni le schéma ni le code n'incrémente jamais.
    const ecrit = (col: string) =>
      new RegExp(`set ${col}\\s*=`).test(SQL) ||
      fichiers().some(f => new RegExp(`update\\(\\{[^}]*\\b${col}\\b`).test(fs.readFileSync(f, "utf8")))
    const lues = new Set<string>()
    for (const f of fichiers()) {
      for (const m of fs.readFileSync(f, "utf8").matchAll(/\.select\("([^"]*)"\)/g)) {
        for (const col of m[1].split(",").map(c => c.trim())) {
          if (/^(total|unique)_[a-z_]+$/.test(col)) lues.add(col)
        }
      }
    }
    expect(lues.size, "aucun compteur lu : le balayage ne mesure plus rien").toBeGreaterThan(0)
    for (const col of lues) expect(ecrit(col), `${col} est lue mais rien ne l'écrit`).toBe(true)
  })
})
