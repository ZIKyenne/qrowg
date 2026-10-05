#!/usr/bin/env node
// search-console.mjs — lire les exports Search Console et en tirer des décisions.
//
// Pourquoi ce script. L'audit SEO s'est arrêté sur un constat : sans données de
// requête, impossible de savoir si une page ne rapporte rien parce qu'elle n'est
// pas indexée, parce que son titre ne donne pas envie, ou parce que personne ne
// cherche son sujet. Ce sont trois problèmes différents, avec trois corrections
// différentes, et les deviner ne sert à rien.
//
// Il ne remplace pas la Search Console : il lit ce qu'elle exporte, le croise
// avec les routes réelles du dépôt, et classe. Rien n'est inventé — s'il manque
// un fichier, il le dit et s'arrête là.
//
//   node scripts/search-console.mjs <dossier>
//
// Le dossier contient les CSV exportés (l'archive de Search Console se
// décompresse telle quelle). Noms reconnus, en français comme en anglais :
//
//   Requêtes.csv / Queries.csv
//   Pages.csv
//   Pays.csv / Countries.csv
//   Appareils.csv / Devices.csv
//
// Deux périodes ? Mettez-les dans deux dossiers et lancez-le deux fois : la
// comparaison se fait sur des totaux lisibles, jamais sur une position moyenne
// (voir l'avertissement en fin de sortie).

import fs from "node:fs"
import path from "node:path"

// ── Lecture ────────────────────────────────────────────────────────────────

/** Un CSV de Search Console : virgules, guillemets, en-tête sur la 1re ligne. */
function lireCsv(fichier) {
  const brut = fs.readFileSync(fichier, "utf8").replace(/^﻿/, "")
  const lignes = []
  let champ = "", ligne = [], dansGuillemets = false
  for (let i = 0; i < brut.length; i++) {
    const c = brut[i]
    if (dansGuillemets) {
      if (c === '"' && brut[i + 1] === '"') { champ += '"'; i++ }
      else if (c === '"') dansGuillemets = false
      else champ += c
      continue
    }
    if (c === '"') { dansGuillemets = true; continue }
    if (c === ",") { ligne.push(champ); champ = ""; continue }
    if (c === "\n") { ligne.push(champ); lignes.push(ligne); ligne = []; champ = ""; continue }
    if (c !== "\r") champ += c
  }
  if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne) }
  if (!lignes.length) return []
  const entetes = lignes[0].map(h => h.trim())
  return lignes.slice(1).filter(l => l.some(v => v.trim())).map(l =>
    Object.fromEntries(entetes.map((h, i) => [h, (l[i] ?? "").trim()])))
}

/** Search Console nomme ses colonnes en français ou en anglais selon le compte. */
const COLONNES = {
  cle: ["Requêtes les plus fréquentes", "Top queries", "Requête", "Query",
        "Pages les plus populaires", "Top pages", "Page",
        "Pays", "Country", "Appareil", "Device"],
  clics: ["Clics", "Clicks"],
  impressions: ["Impressions"],
  ctr: ["CTR"],
  position: ["Position", "Position moyenne", "Average position"],
}
const col = (ligne, genre) => {
  for (const nom of COLONNES[genre]) if (ligne[nom] !== undefined) return ligne[nom]
  return undefined
}
const nombre = v => {
  if (v === undefined || v === "") return 0
  const n = Number(String(v).replace(/\s| | /g, "").replace("%", "").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

function charger(dossier, noms) {
  for (const n of noms) {
    const f = path.join(dossier, n)
    if (fs.existsSync(f)) return { fichier: n, lignes: lireCsv(f) }
  }
  return null
}

// ── Les routes que le produit publie vraiment ──────────────────────────────

/** Extrait d'un fichier du dépôt la liste des slugs déclarés. */
function slugs(fichier, motif) {
  try {
    const s = fs.readFileSync(fichier, "utf8")
    const bloc = s.slice(s.indexOf(motif))
    return [...bloc.slice(0, bloc.indexOf("]")).matchAll(/"([a-z0-9-]+)"/g)].map(m => m[1])
  } catch { return [] }
}

function routesDuProduit() {
  const racine = path.join(process.cwd(), "apps/web/src/app")
  const usages = slugs(path.join(racine, "qr-code/verticals.ts"), "VERTICAL_ORDER")
  const guides = slugs(path.join(racine, "guides/guides.ts"), "GUIDE_ORDER")
  return {
    usages: usages.map(s => `/qr-code/${s}`),
    guides: guides.map(s => `/guides/${s}`),
    vitrine: ["/", "/features", "/upgrade", "/examples", "/creer", "/contact",
              "/security", "/privacy", "/terms", "/qr-code", "/guides", "/outils",
              "/outils/taille-qr-code", "/outils/testeur-qr-code",
              "/generateur-qr-code", "/generateur-qr-code-wifi"],
  }
}

// ── Sortie ─────────────────────────────────────────────────────────────────

const pct = n => `${n.toFixed(1)} %`
const tableau = (titre, lignes, colonnes) => {
  if (!lignes.length) return
  console.log(`\n${titre}`)
  const larg = colonnes.map(c => Math.max(c.nom.length, ...lignes.map(l => String(c.val(l)).length)))
  console.log("  " + colonnes.map((c, i) => c.nom.padEnd(larg[i])).join("  "))
  console.log("  " + larg.map(l => "─".repeat(l)).join("  "))
  for (const l of lignes) {
    console.log("  " + colonnes.map((c, i) =>
      (c.droite ? String(c.val(l)).padStart(larg[i]) : String(c.val(l)).padEnd(larg[i]))).join("  "))
  }
}

function main() {
  const dossier = process.argv[2]
  if (!dossier) {
    console.error("Usage : node scripts/search-console.mjs <dossier des CSV>")
    process.exit(2)
  }
  if (!fs.existsSync(dossier)) {
    console.error(`Dossier introuvable : ${dossier}`)
    process.exit(2)
  }

  const requetes = charger(dossier, ["Requêtes.csv", "Requetes.csv", "Queries.csv"])
  const pages = charger(dossier, ["Pages.csv"])
  const pays = charger(dossier, ["Pays.csv", "Countries.csv"])
  const appareils = charger(dossier, ["Appareils.csv", "Devices.csv"])

  const manquants = []
  if (!requetes) manquants.push("Requêtes.csv (ou Queries.csv)")
  if (!pages) manquants.push("Pages.csv")
  console.log(`Exports lus depuis ${path.resolve(dossier)}`)
  for (const [nom, d] of [["requêtes", requetes], ["pages", pages], ["pays", pays], ["appareils", appareils]]) {
    console.log(`  ${nom.padEnd(10)} ${d ? `${d.fichier} — ${d.lignes.length} lignes` : "ABSENT"}`)
  }
  if (manquants.length) {
    console.log(`\nIl manque : ${manquants.join(", ")}.`)
    console.log("Rien n'est déduit d'un fichier absent — ajoutez-le et relancez.")
    if (!pages && !requetes) process.exit(1)
  }

  // ── Les requêtes ─────────────────────────────────────────────────────────
  if (requetes) {
    const r = requetes.lignes.map(l => ({
      cle: col(l, "cle") ?? "", clics: nombre(col(l, "clics")),
      imp: nombre(col(l, "impressions")), pos: nombre(col(l, "position")),
    })).filter(x => x.cle)

    const totalClics = r.reduce((s, x) => s + x.clics, 0)
    const totalImp = r.reduce((s, x) => s + x.imp, 0)
    console.log(`\n── Requêtes ────────────────────────────────────────────`)
    console.log(`  ${r.length} requêtes · ${totalClics} clics · ${totalImp} impressions` +
      (totalImp ? ` · CTR global ${pct((totalClics / totalImp) * 100)}` : ""))
    // La médiane PONDÉRÉE par les impressions dit où se trouve vraiment la
    // majorité des apparitions. Une moyenne simple compte une requête vue une
    // fois comme une requête vue cent fois.
    const parPos = r.filter(x => x.pos > 0).sort((a, b) => a.pos - b.pos)
    const moitie = parPos.reduce((s, x) => s + x.imp, 0) / 2
    let cumul = 0, mediane = 0
    for (const x of parPos) { cumul += x.imp; if (cumul >= moitie) { mediane = x.pos; break } }
    if (mediane) console.log(`  Position médiane, pondérée par les impressions : ${mediane.toFixed(1)}`)

    // Le gisement le plus net : beaucoup vu, jamais cliqué, et pourtant bien placé.
    // Un titre ou une description qui ne donne pas envie — pas un problème de fond.
    const vuesSansClic = r.filter(x => x.imp >= 50 && x.clics === 0 && x.pos > 0 && x.pos <= 20)
      .sort((a, b) => b.imp - a.imp).slice(0, 15)
    tableau("  Vues sans jamais être cliquées (position ≤ 20) — travailler titre et description :",
      vuesSansClic, [
        { nom: "requête", val: x => x.cle },
        { nom: "impr.", val: x => x.imp, droite: true },
        { nom: "pos.", val: x => x.pos.toFixed(1), droite: true },
      ])

    // Troisième cas, et le seul qui parle d'un site JEUNE : une demande réelle,
    // mais une position si profonde que personne ne voit la page. Ce n'est ni un
    // problème de titre ni un problème de sujet — c'est que la page n'est pas
    // encore compétitive. Les deux autres tableaux restent vides sur un site qui
    // ne classe pas encore, et leur silence serait trompeur sans celui-ci.
    const demandeProfonde = r.filter(x => x.imp >= 10 && x.pos > 20)
      .sort((a, b) => b.imp - a.imp).slice(0, 15)
    tableau("  Demande réelle, mais position trop profonde pour être vue (> 20) :",
      demandeProfonde, [
        { nom: "requête", val: x => x.cle },
        { nom: "impr.", val: x => x.imp, droite: true },
        { nom: "pos.", val: x => x.pos.toFixed(1), droite: true },
      ])

    // Deuxième gisement : la deuxième page de résultats. Quelques places à gagner
    // valent beaucoup plus là qu'ailleurs.
    const auBord = r.filter(x => x.pos >= 8 && x.pos <= 20 && x.imp >= 20)
      .sort((a, b) => b.imp - a.imp).slice(0, 15)
    tableau("  Au bord de la première page (position 8–20) — le meilleur rapport effort/gain :",
      auBord, [
        { nom: "requête", val: x => x.cle },
        { nom: "impr.", val: x => x.imp, droite: true },
        { nom: "clics", val: x => x.clics, droite: true },
        { nom: "pos.", val: x => x.pos.toFixed(1), droite: true },
      ])
  }

  // ── Les pages, croisées avec les routes réelles ──────────────────────────
  if (pages) {
    const routes = routesDuProduit()
    const toutes = [...routes.usages, ...routes.guides, ...routes.vitrine]
    // On garde l'HÔTE. Réduire au chemin confondait l'apex avec ses miroirs
    // *.vercel.app — or une URL de miroir vue en résultat est exactement ce
    // qu'on cherche à détecter (SEO-09). Elle est donc comptée à part.
    const APEX = (process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com").replace(/^https?:\/\//, "").replace(/\/$/, "")
    const decoupe = u => {
      try {
        const { hostname, pathname, search } = new URL(u)
        return { hote: hostname, chemin: pathname.replace(/\/$/, "") || "/", params: search }
      } catch { return { hote: "", chemin: u, params: "" } }
    }

    const p = pages.lignes.map(l => ({
      url: col(l, "cle") ?? "", clics: nombre(col(l, "clics")),
      imp: nombre(col(l, "impressions")), pos: nombre(col(l, "position")),
    })).filter(x => x.url).map(x => ({ ...x, ...decoupe(x.url) }))

    const miroirs = p.filter(x => x.hote && x.hote !== APEX)
    // Une URL à paramètres vue en résultat est une URL de PLUS dans l'index, pour
    // la même page. On la compte à part : la fondre dans l'URL propre masquerait
    // exactement ce qu'il faut regarder.
    const avecParams = p.filter(x => (!x.hote || x.hote === APEX) && x.params)
    const surApex = p.filter(x => (!x.hote || x.hote === APEX) && !x.params)
    const vues = new Set(surApex.map(x => x.chemin))
    console.log(`\n── Pages ───────────────────────────────────────────────`)
    console.log(`  ${surApex.length} pages sur ${APEX}` + (miroirs.length ? ` · ${miroirs.length} sur un autre hôte` : ""))

    // LE constat que l'audit ne pouvait pas faire sans ces données : une page
    // publiée, au sitemap, et que Search Console ne mentionne pas du tout n'a
    // jamais été vue en résultat. C'est un problème d'indexation ou de sujet,
    // pas de titre — et ça ne se corrige pas de la même façon.
    const jamaisVues = toutes.filter(c => !vues.has(c))
    tableau("  Au sitemap, mais AUCUNE impression — vérifier l'indexation dans Search Console :",
      jamaisVues.slice(0, 40).map(c => ({ c })), [{ nom: "page", val: x => x.c }])
    if (jamaisVues.length > 40) console.log(`  … et ${jamaisVues.length - 40} autres.`)

    // Un miroir vu en résultat veut dire que le canonical n'a pas suffi : il
    // faut vérifier que l'en-tête `X-Robots-Tag: noindex` est bien servi, puis
    // demander le retrait de ces URL dans Search Console.
    tableau("  ⚠ URL d'un AUTRE hôte vues en résultat — un miroir est indexé :",
      miroirs.sort((a, b) => b.imp - a.imp).slice(0, 15), [
        { nom: "hôte", val: x => x.hote },
        { nom: "page", val: x => x.chemin },
        { nom: "impr.", val: x => x.imp, droite: true },
      ])
    if (!miroirs.length) console.log("\n  Aucun miroir vu en résultat : le canonical vers l'apex fait son travail.")

    // Les paramètres de campagne (utm_*) sur une URL vue en résultat : Google a
    // exploré et retenu l'adresse tracée, en plus de l'adresse propre. Le
    // canonical devrait consolider ; qu'elle apparaisse quand même se vérifie.
    tableau("  ⚠ URL à paramètres vues en résultat — un doublon par campagne :",
      avecParams.sort((a, b) => b.imp - a.imp).slice(0, 15), [
        { nom: "page", val: x => x.chemin },
        { nom: "paramètres", val: x => x.params.slice(0, 54) },
        { nom: "impr.", val: x => x.imp, droite: true },
      ])

    const faibles = surApex.filter(x => x.imp >= 30 && x.clics === 0).sort((a, b) => b.imp - a.imp).slice(0, 15)
    tableau("  Pages vues sans clic — titre, description, ou intention mal servie :",
      faibles, [
        { nom: "page", val: x => x.chemin },
        { nom: "impr.", val: x => x.imp, droite: true },
        { nom: "pos.", val: x => x.pos.toFixed(1), droite: true },
      ])

    const marchent = surApex.filter(x => x.clics > 0).sort((a, b) => b.clics - a.clics).slice(0, 10)
    tableau("  Ce qui marche déjà — à ne pas casser, et à imiter :",
      marchent, [
        { nom: "page", val: x => x.chemin },
        { nom: "clics", val: x => x.clics, droite: true },
        { nom: "impr.", val: x => x.imp, droite: true },
      ])

    // Des URL vues en résultat que le dépôt ne déclare pas : miroir indexé,
    // ancienne adresse, ou page cliente. À regarder une par une.
    const inconnues = surApex.filter(x => !toutes.includes(x.chemin) && !x.chemin.startsWith("/qr-code/")
      && !x.chemin.startsWith("/guides/")).sort((a, b) => b.imp - a.imp).slice(0, 15)
    tableau("  Pages hors routes connues — pages publiées par des clients, ou anciennes adresses :",
      inconnues, [
        { nom: "page", val: x => x.chemin },
        { nom: "impr.", val: x => x.imp, droite: true },
        { nom: "clics", val: x => x.clics, droite: true },
      ])
  }

  if (pays) {
    const t = pays.lignes.map(l => ({ cle: col(l, "cle"), clics: nombre(col(l, "clics")), imp: nombre(col(l, "impressions")) }))
      .sort((a, b) => b.imp - a.imp).slice(0, 8)
    tableau("\n── Pays ────────────────────────────────────────────────", t,
      [{ nom: "pays", val: x => x.cle }, { nom: "impr.", val: x => x.imp, droite: true }, { nom: "clics", val: x => x.clics, droite: true }])
  }
  if (appareils) {
    const t = appareils.lignes.map(l => ({ cle: col(l, "cle"), clics: nombre(col(l, "clics")), imp: nombre(col(l, "impressions")) }))
    tableau("\n── Appareils ───────────────────────────────────────────", t,
      [{ nom: "appareil", val: x => x.cle }, { nom: "impr.", val: x => x.imp, droite: true }, { nom: "clics", val: x => x.clics, droite: true }])
  }

  console.log(`
── Ce que ces chiffres ne disent pas ───────────────────────────────────
  · Une position moyenne mélange des requêtes et des pays très différents :
    la comparer d'une période à l'autre ne prouve pas un progrès.
  · Une page absente de l'export n'est pas forcément désindexée — elle peut
    n'avoir eu aucune impression. Le rapport « Indexation des pages » tranche.
  · Search Console échantillonne et anonymise les requêtes rares : les totaux
    par requête ne font jamais la somme du total global.
  · Rien ici ne mesure une cause. Une hausse peut venir d'une correction, d'un
    concurrent qui recule, d'une mise à jour de l'algorithme ou de la saison.
`)
}

main()
