#!/usr/bin/env node
/**
 * Budget JavaScript de la page publique (`/[slug]`) — audit UX v2, PERF-006.
 *
 * La page qu'ouvre le client qui scanne, souvent en 4G : ce qu'elle télécharge
 * AVANT tout bloc particulier (React, Next, le rendu commun des blocs). Mesuré
 * après `next build`, depuis les manifestes du build (déterministe, sans
 * navigateur) : rootMainFiles + entrées JS du layout + entrées JS de la page,
 * compressés gzip niveau 9.
 *
 * Mesure du 22 nov. 2026 : 13 fichiers, 717 Ko bruts, 221 Ko gzip — plafond 232.
 * PERF-003 (même jour) : la page ne juge plus elle-même si elle est vide (ça
 * importait les modèles des 146 blocs) → 628 Ko bruts, 193 Ko gzip — plafond 203.
 * Puis le moteur de l'animation d'entrée chargé à la demande → 613 Ko bruts,
 * 188 Ko gzip — plafond 197.
 * (En production, The Red Fish chargeait 281 Ko gzip : le socle + les blocs
 * qu'elle utilise, chargés à part.)
 *
 * CLIQUET : on ne relève JAMAIS le plafond pour faire passer une livraison ;
 * on l'abaisse, avec la raison, quand une optimisation le permet.
 *
 * Si les manifestes sont illisibles (format changé par une montée de Next), le
 * script le dit et n'échoue PAS : ne pas savoir mesurer n'est pas dépasser.
 */
import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"

export const PLAFOND_KO = 197

const NEXT = path.join(process.cwd(), ".next")
const MANIFESTE_PAGE = path.join(NEXT, "server", "app", "[slug]", "page_client-reference-manifest.js")
const MANIFESTE_BUILD = path.join(NEXT, "build-manifest.json")
const ENTREES = ["[project]/apps/web/src/app/layout", "[project]/apps/web/src/app/[slug]/page"]

function lireManifesteDePage() {
  const src = fs.readFileSync(MANIFESTE_PAGE, "utf8")
  const debut = src.indexOf("= {")
  if (debut < 0) throw new Error("affectation introuvable")
  return JSON.parse(src.slice(debut + 2).replace(/;\s*$/, ""))
}

export function mesurer() {
  const page = lireManifesteDePage()
  const build = JSON.parse(fs.readFileSync(MANIFESTE_BUILD, "utf8"))
  const fichiers = new Set(build.rootMainFiles || [])
  for (const e of ENTREES) for (const f of page.entryJSFiles?.[e] || []) fichiers.add(f.replace(/^\/?_next\//, ""))
  if (fichiers.size === 0) throw new Error("aucun fichier d'entrée")
  let brut = 0, gzip = 0
  for (const f of fichiers) {
    const contenu = fs.readFileSync(path.join(NEXT, f))
    brut += contenu.length
    gzip += zlib.gzipSync(contenu, { level: 9 }).length
  }
  return { fichiers: fichiers.size, brutKo: Math.round(brut / 1024), gzipKo: Math.round(gzip / 1024) }
}

const direct = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))
if (direct) {
  let m
  try { m = mesurer() } catch (e) {
    console.warn(`[budget page publique] mesure impossible (${e.message}) — manifestes de Next changés ? Budget NON vérifié.`)
    process.exit(0)
  }
  const ligne = `[budget page publique] ${m.fichiers} fichiers · ${m.brutKo} Ko bruts · ${m.gzipKo} Ko gzip (plafond ${PLAFOND_KO} Ko)`
  if (m.gzipKo > PLAFOND_KO) {
    console.error(`${ligne}\n✗ Le JavaScript de la page publique dépasse son budget. Allégez (next/dynamic, import de module serveur côté client…) — ne relevez pas le plafond.`)
    process.exit(1)
  }
  console.log(`${ligne} ✓`)
}
