// Ce que le produit garde, il doit savoir le rendre — garde de classe.
//
// Relevé du 15 septembre. Le schéma compte vingt-sept tables ; vingt et une
// portent les données d'un compte. L'export RGPD en lisait **cinq** :
// `profiles`, `pages`, `blocks`, `qr_codes`, `leads`.
//
// Ce qui manquait n'est pas accessoire, c'est ce pour quoi il paie :
//
//   scans, page_views, block_clicks, page_events   ses statistiques
//   instant_qrs, instant_scan_events               ses QR directs et leurs scans
//   conversion_goals · report_subscriptions        ses objectifs, ses rapports
//   domain_verifications / _redirects / _routes    ses domaines
//   print_presets, print_brand_kit                 ses impressions, sa charte
//   activity_logs, api_keys, api_usage             son journal, ses clés
//   team_members · subscriptions                   son équipe, son abonnement
//
// Un commerçant qui demande ses données repartait avec ses pages et ses
// messages, sans une seule ligne de mesure — sans ce qu'il a mis deux ans à
// construire. Le droit à la portabilité porte sur ce qu'il a fourni ET sur ce
// que le service a observé de lui.
//
// L'autre moitié est saine, et il faut le dire : la SUPPRESSION efface bien
// tout. `profiles.id` référence `auth.users(id) on delete cascade`, et chaque
// table du compte casse en cascade depuis `profiles` — `teams` est en
// `on delete restrict`, et c'est pour ça que la route le supprime d'abord.
// **Le produit savait effacer ce qu'il ne savait pas rendre.**
//
// La classe : **ce que le produit garde, il doit savoir le rendre.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  DONNEES_DU_COMPTE, tablesAExporter, tablesEcartees, sansLesSecrets,
  phraseExportCoupe, phraseDeLExport, FAMILLES, PLAFOND_PAR_TABLE,
} from "./donneesDuCompte"

const SRC = path.join(__dirname, "..")
const RACINE = path.join(SRC, "../../..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

const SQL = (() => {
  const dir = path.join(RACINE, "supabase/migrations")
  return fs.readdirSync(dir).filter(n => n.endsWith(".sql")).sort()
    .map(n => fs.readFileSync(path.join(dir, n), "utf8")).join("\n")
})()

/** Les tables réellement créées par les migrations. */
function tablesDuSchema(): string[] {
  const out = new Set<string>()
  for (const m of SQL.matchAll(/create table\s+(?:if not exists\s+)?(?:public\.)?([a-z_]+)/gi)) out.add(m[1])
  return [...out].sort()
}

/** Les colonnes d'une table, corps du `create table` et `add column` compris. */
function colonnesDe(table: string): string[] {
  let corps = ""
  for (const m of SQL.matchAll(/create table\s+(?:if not exists\s+)?(?:public\.)?([a-z_]+)\s*\(([\s\S]*?)\n\s*\);/gi)) {
    if (m[1] === table) corps += "\n" + m[2]
  }
  for (const m of SQL.matchAll(/alter table\s+(?:if exists\s+)?(?:public\.)?([a-z_]+)\s+add column\s+(?:if not exists\s+)?([a-z_]+)/gi)) {
    if (m[1] === table) corps += "\n" + m[2] + " "
  }
  return [...corps.matchAll(/^\s*([a-z_]+)\s+/gm)].map(m => m[1])
}

describe("ce qu'un compte possède", () => {
  it("chaque table du schéma est jugée : rendue, ou écartée avec sa raison", () => {
    // Pas d'échappatoire ici : les quatre tables qui ne portent les données de
    // personne figurent dans la liste AVEC leur raison écrite. « Sans propriétaire »
    // est une raison comme une autre — encore faut-il l'écrire.
    const connues = new Set(DONNEES_DU_COMPTE.map(t => t.table))
    const oubliees = tablesDuSchema().filter(t => !connues.has(t))
    expect(oubliees, "une table du schéma que la table du compte ignore").toEqual([])
  })

  it("et chaque table rendue se rattache par une colonne qui existe vraiment", () => {
    // Un rattachement par une colonne absente ne lève rien : la lecture échoue,
    // `data` est nul, la table repart vide — un export silencieusement amputé.
    const fautes: string[] = []
    for (const t of tablesAExporter()) {
      const attendue = t.rattachement.par
      if (!colonnesDe(t.table).includes(attendue)) fautes.push(`${t.table} n'a pas de colonne ${attendue}`)
    }
    expect(fautes, "une colonne de rattachement qui n'existe pas dans le schéma").toEqual([])
  })

  it("rien n'est écarté sans raison écrite", () => {
    for (const t of DONNEES_DU_COMPTE) {
      if (!t.raisonDAbsence) continue
      expect(t.raisonDAbsence.length, `${t.table} : la raison est trop courte pour en être une`).toBeGreaterThan(40)
    }
    // Et les raisons parlent de la même chose : les données de quelqu'un d'autre.
    expect(tablesEcartees().length).toBeGreaterThan(2)
    for (const e of tablesEcartees()) expect(e.quoi.length).toBeGreaterThan(3)
  })

  it("les statistiques — ce pour quoi il paie — sont rendues", () => {
    const rendues = new Set(tablesAExporter().map(t => t.table))
    for (const t of ["scans", "page_views", "block_clicks", "page_events",
                     "instant_qrs", "instant_scan_events", "conversion_goals"]) {
      expect(rendues.has(t), t).toBe(true)
    }
  })

  it("un secret n'est pas une donnée à rendre", () => {
    const cles = DONNEES_DU_COMPTE.find(t => t.table === "api_keys")
    expect(cles?.colonnesRetirees, "l'empreinte d'une clé ne repart pas dans un fichier").toContain("key_hash")
    const lignes = [{ id: "1", label: "Prod", key_hash: "secret", created_at: "x" }]
    const propre = sansLesSecrets(lignes, cles!.colonnesRetirees)
    expect(propre[0]).not.toHaveProperty("key_hash")
    expect(propre[0], "le reste est bien rendu").toMatchObject({ id: "1", label: "Prod" })
    expect(lignes[0], "l'original n'est pas modifié").toHaveProperty("key_hash")
    expect(sansLesSecrets(null, ["x"])).toEqual([])
    expect(sansLesSecrets([{ a: 1 }])).toEqual([{ a: 1 }])
  })

  it("un export coupé le dit", () => {
    expect(phraseExportCoupe([])).toBeNull()
    const p = phraseExportCoupe(["Les scans de vos QR"])
    expect(p).toContain("Les scans de vos QR")
    expect(p).toContain(PLAFOND_PAR_TABLE.toLocaleString("fr-FR"))
  })
})

describe("garde de classe : l'export rend ce qu'il garde", () => {
  const ROUTE = lire("app/api/account/export/route.ts")

  it("la route lit la table, elle ne liste plus les siennes", () => {
    expect(ROUTE).toContain("tablesAExporter()")
    // Cinq `from("…")` écrits à la main : c'était tout l'export.
    const enDur = [...ROUTE.matchAll(/\.from\("([a-z_]+)"\)/g)].map(m => m[1])
    expect(enDur, "une seule lecture nommée : les pages, qui servent de pivot").toEqual(["pages"])
  })

  it("et elle dit ce qu'elle n'a pas mis", () => {
    expect(ROUTE, "un export muet sur ses manques laisse croire qu'il est complet").toContain("non_exporte: tablesEcartees()")
    expect(ROUTE).toContain("phraseExportCoupe(coupees)")
  })

  it("chaque table rendue sait comment elle se rattache au compte", () => {
    const rattachements = new Set(["id", "user_id", "page_id", "qr_code_id", "instant_qr_id"])
    for (const t of tablesAExporter()) {
      expect(rattachements.has(t.rattachement.par), `${t.table}`).toBe(true)
      expect(t.quoi.length, `${t.table} : dire au propriétaire ce que c'est`).toBeGreaterThan(5)
    }
    // Et la route sait traiter chaque forme qu'elle déclare.
    for (const p of new Set([...tablesAExporter()].map(t => t.rattachement.par))) {
      expect(ROUTE, `la route ne sait pas lire « ${p} »`).toContain(`t.rattachement.par === "${p}"`)
    }
  })

  it("et l'écran promet ce que le fichier contient, pas les cinq tables d'avant", () => {
    // L'ancienne phrase — « profil, pages, blocs, QR codes et messages reçus » —
    // décrivait exactement les cinq tables qui étaient lues. Elle se fabrique
    // désormais depuis la même liste que l'export : la promesse ne peut plus
    // rester en arrière du contenu.
    const ecran = lire("app/dashboard/settings/page.tsx")
    expect(ecran, "la phrase est fabriquée, pas retapée").toContain("{phraseDeLExport()}")
    expect(ecran).not.toContain("profil, pages, blocs, QR codes et messages reçus")
    const phrase = phraseDeLExport()
    expect(phrase).toContain("statistiques")
    expect(phrase).toMatch(/ et [^,]+$/)

    const rendues = tablesAExporter().map(t => t.table)
    const nommees = FAMILLES.flatMap(f => f.tables)
    expect(nommees.filter(t => !rendues.includes(t)), "une famille promet une table que l'export ne rend pas").toEqual([])
    expect(rendues.filter(t => !nommees.includes(t)), "une table rendue qu'aucune famille ne nomme : le fichier en dirait plus que l'écran").toEqual([])
    expect(new Set(nommees).size, "une table nommée deux fois").toBe(nommees.length)
  })

  it("le balayage voit bien le schéma — sinon il ne prouve rien", () => {
    const tables = tablesDuSchema()
    expect(tables.length, "des tables dans les migrations").toBeGreaterThan(20)
    expect(tablesAExporter().length, "et beaucoup sont rendues").toBeGreaterThan(15)
    expect(tables).toContain("scans")
    expect(colonnesDe("scans"), "et le relevé des colonnes lit vraiment le SQL").toContain("page_id")
  })

  it("la suppression, elle, était déjà complète — et on dit pourquoi", () => {
    // Si la cascade disparaissait, l'effacement deviendrait partiel en silence.
    expect(SQL).toMatch(/references auth\.users\(id\) on delete cascade/i)
    expect(lire("lib/donneesDuCompte.ts"), "la raison est écrite là où elle se lit").toContain("on delete cascade")
  })
})
