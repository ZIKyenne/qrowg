// cloisonnementQuiTientSansNom — audit de sécurité du 23 septembre 2026.
//
// ── Ce que cette garde surveille ───────────────────────────────────────────
//
// Certaines requêtes du produit interrogent une table AVEC LE CLIENT DU
// NAVIGATEUR et sans dire à qui les lignes appartiennent : pas de
// `.eq("user_id", …)`, pas de `.in(…)`. Elles sont écrites ainsi exprès —
// PrintStudio doit montrer les QR du commerçant ET ceux de ses équipes, une
// liste que le front ne sait pas calculer. Leur cloisonnement repose donc
// ENTIÈREMENT sur RLS, c'est-à-dire sur du SQL qui ne vit pas dans ce fichier.
//
// Le 23 septembre, c'est exactement là que ça s'est cassé. `qr_codes` portait
//
//     "Lecture QR publics"   for select   using (true)
//
// et `PrintStudioClient.tsx` lisait la table sans filtre en commentant « RLS
// scope automatiquement ». RLS ne scopait pas. Toute la table était lisible,
// y compris sans compte, avec la clé anon qui est publique par construction.
//
// ── Pourquoi la policy avait survécu ───────────────────────────────────────
//
// Parce qu'on l'avait déjà tuée — par son nom. `20260724120000_security_
// hardening.sql` fait, depuis juillet :
//
//     drop policy if exists "Lecture QR codes publics" on public.qr_codes;
//
// Ses deux sœurs sont bien mortes ce jour-là. Celle-ci est revenue sous le nom
// « Lecture QR publics », deux mots au lieu de trois, et le `if exists` par nom
// exact ne l'a plus jamais vue. Même cause que les lots v159, v170 et v175 :
// **une règle accrochée à un nom écrit à la main finit par ne plus désigner ce
// qu'elle visait.**
//
// ── Ce que cette garde NE voit PAS, et il faut le dire ─────────────────────
//
// Le dépôt, relu de bout en bout, est PROPRE : « Lecture QR codes publics » y
// est bien créée puis retirée. La policy trouvée en production s'appelait
// « Lecture QR publics » et n'apparaît dans AUCUNE migration — elle a été
// créée hors du dépôt (console, requête à chaud). Une garde qui relit les
// migrations ne peut pas voir ça, et deux mutations l'ont prouvé : retirer le
// marqueur ci-dessous, ou casser le bloc qu'il gage, ne fait rien échouer,
// parce que le corpus réel n'a rien à retirer.
//
// Cette garde couvre donc UNE moitié : la réintroduction PAR UNE MIGRATION —
// et la contre-épreuve du bas le prouve. L'autre moitié, la dérive de la
// production, ne peut être vue que depuis la base : c'est la vue
// `public.policies_trop_larges` (migration 20260923100300), à relire lors de
// chaque audit. Aucun fichier de test ne fermera cette moitié-là.
//
// ── Ce que la garde vérifie, et comment elle évite le même piège ───────────
//
// 1. Elle RELÈVE la population : toutes les lectures faites avec
//    `@/lib/supabase/client` sans filtre de propriété. Elle ne part pas d'une
//    liste écrite à la main — elle lit le produit.
// 2. Elle REJOUE les migrations dans l'ordre et calcule l'état final des
//    policies de lecture : créées, puis retirées par leur nom.
// 3. Elle EXIGE qu'aucune de ces tables ne garde une policy de lecture
//    `using (true)`.
// 4. Une migration peut retirer une telle policy SANS la nommer (le bon
//    remède : un balayage de `pg_policies`). Elle le déclare par un marqueur
//    `@retire-lecture-totale: <table>` — et la garde NE LE CROIT PAS : elle
//    vérifie que la migration marquée filtre bien sur cette table et sur
//    `qual = true`. Une dérogation qui ne se vérifie pas finit par mentir
//    (lot v175).

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const RACINE_SRC = path.resolve(__dirname, "..")
const RACINE_MIG = path.resolve(__dirname, "../../../../supabase/migrations")

function fichiersSources(): string[] {
  const out: string[] = []
  ;(function walk(d: string) {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p)
    }
  })(RACINE_SRC)
  return out
}

// ── 1. La population : lectures clientes sans filtre de propriété ──────────

const FILTRE = /\.(eq|in|match|or|filter|contains|neq|is)\s*\(/

export function lecturesSansFiltre(lire = (f: string) => fs.readFileSync(f, "utf8")): { fichier: string; ligne: number; table: string }[] {
  const trouvees: { fichier: string; ligne: number; table: string }[] = []
  for (const f of fichiersSources()) {
    const src = lire(f)
    if (!src.includes('from "@/lib/supabase/client"')) continue
    const re = /\.from\(\s*["'`]([a-z_]+)["'`]\s*\)([\s\S]{0,400})/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      const table = m[1], suite = m[2]
      if (!/\.select\(/.test(suite.slice(0, 80))) continue          // on ne juge que les lectures
      const chaine = suite.split(/\n\s*\n|\]\)|\)\s*$/)[0].slice(0, 300)
      if (FILTRE.test(chaine)) continue                              // elle dit à qui elle appartient
      trouvees.push({ fichier: path.relative(RACINE_SRC, f), ligne: src.slice(0, m.index).split("\n").length, table })
    }
  }
  return trouvees
}

// ── 2. L'état final des policies de lecture, rejoué depuis les migrations ──

type Etat = { table: string; nom: string; migration: string }

function migrations(): { nom: string; sql: string }[] {
  return fs.readdirSync(RACINE_MIG).filter(f => f.endsWith(".sql")).sort()
    .map(nom => ({ nom, sql: fs.readFileSync(path.join(RACINE_MIG, nom), "utf8") }))
}

// Une policy de lecture dont la condition est `true` : la table entière, pour
// qui la policy s'applique. C'est le motif qu'on traque.
const CREATE_TOTALE = /create\s+policy\s+"([^"]+)"\s+on\s+(?:public\.)?([a-z_]+)\s+for\s+(select|all)\b[\s\S]{0,400}?using\s*\(\s*true\s*\)/gi
const DROP_NOMME    = /drop\s+policy\s+(?:if\s+exists\s+)?"([^"]+)"\s+on\s+(?:public\.)?([a-z_]+)/gi
const MARQUEUR      = /@retire-lecture-totale:\s*([a-z_]+)/gi

export function lecturesTotalesSurvivantes(corpus = migrations()): Etat[] {
  let vivantes: Etat[] = []
  for (const { nom, sql } of corpus) {
    // hors commentaires : une ligne `-- create policy …` ne crée rien
    const code = sql.split("\n").filter(l => !/^\s*--/.test(l)).join("\n")

    let m: RegExpExecArray | null
    CREATE_TOTALE.lastIndex = 0
    while ((m = CREATE_TOTALE.exec(code))) vivantes.push({ table: m[2], nom: m[1], migration: nom })

    DROP_NOMME.lastIndex = 0
    while ((m = DROP_NOMME.exec(code))) {
      const [, cible, table] = m
      vivantes = vivantes.filter(v => !(v.nom === cible && v.table === table))
    }

    // Retrait SANS nom : le marqueur n'est cru que s'il est gagé par un bloc
    // qui filtre effectivement sur cette table ET sur `qual = true`.
    MARQUEUR.lastIndex = 0
    while ((m = MARQUEUR.exec(sql))) {
      const table = m[1]
      const gage = new RegExp(`tablename\\s*=\\s*'${table}'`, "i").test(code) && /qual[\s\S]{0,80}=\s*'true'/i.test(code)
      if (!gage) continue
      vivantes = vivantes.filter(v => v.table !== table)
    }
  }
  return vivantes
}

describe("le cloisonnement ne tient pas à un nom", () => {
  it("le relevé des lectures clientes sans filtre n'est pas vide (sinon la garde est aveugle)", () => {
    const pop = lecturesSansFiltre()
    expect(pop.length).toBeGreaterThan(0)
    // La lecture qui a révélé la faille est toujours là, et toujours sans filtre :
    // c'est elle qui rend la vérification ci-dessous nécessaire.
    expect(pop.map(p => p.table)).toContain("qr_codes")
  })

  it("aucune table lue sans filtre ne garde une policy de lecture `using (true)`", () => {
    const tables = new Set(lecturesSansFiltre().map(p => p.table))
    const coupables = lecturesTotalesSurvivantes().filter(v => tables.has(v.table))
    expect(
      coupables.map(c => `${c.table} ← "${c.nom}" (${c.migration})`),
      "une table lue sans filtre côté navigateur reste exposée en lecture totale",
    ).toEqual([])
  })

  it("le retrait sans nom est bien gagé : un marqueur seul ne suffit pas", () => {
    // Contre-épreuve : un marqueur qui ne s'appuie sur aucun balayage réel ne
    // doit rien effacer. Sinon la dérogation serait un simple mot-clé à écrire.
    const faux = [
      { nom: "a.sql", sql: `create policy "p" on public.qr_codes for select using (true);` },
      { nom: "b.sql", sql: `-- @retire-lecture-totale: qr_codes\nselect 1;` },
    ]
    expect(lecturesTotalesSurvivantes(faux).map(v => v.table)).toEqual(["qr_codes"])

    const vrai = [
      faux[0],
      { nom: "b.sql", sql: `-- @retire-lecture-totale: qr_codes\ndo $$ begin\n  perform 1 from pg_policies where tablename = 'qr_codes' and btrim(qual) = 'true';\nend $$;` },
    ]
    expect(lecturesTotalesSurvivantes(vrai)).toEqual([])
  })

  it("une lecture totale réintroduite plus tard est vue (contre-épreuve)", () => {
    const corpus = [
      ...migrations(),
      { nom: "99999999999999_rechute.sql", sql: `create policy "Lecture QR publics v3" on public.qr_codes for select using (true);` },
    ]
    const tables = new Set(lecturesSansFiltre().map(p => p.table))
    const coupables = lecturesTotalesSurvivantes(corpus).filter(v => tables.has(v.table))
    expect(coupables.map(c => c.table)).toContain("qr_codes")
  })
})
