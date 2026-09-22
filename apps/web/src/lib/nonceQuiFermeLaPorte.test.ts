// Le nonce ferme la porte que `'unsafe-inline'` laissait ouverte — garde de classe.
//
// Cinquième lot de la passe de sécurité, et la dernière marche de la politique.
//
// ── Le pas nommé deux fois, franchi ici ────────────────────────────────────
//
// **v162** a posé `script-src 'self' 'unsafe-inline'` et l'a dit sans
// l'enjoliver : un script EN LIGNE injecté s'exécuterait encore. Le retirer
// demande un nonce, et un nonce ne peut pas figurer dans un HTML déjà écrit —
// or quatre-vingt-dix pages du produit sont pré-rendues. Le lot a nommé le vrai
// blocage : *« la page qui rend du contenu d'utilisateur est déjà dynamique,
// mais le middleware ne sait pas la distinguer de `/features` sans recopier la
// table des routes »*.
//
// **v163** a posé cette distinction, pour une tout autre raison — huit routes
// manquaient à la liste des adresses réservées, et des commerçants pouvaient
// prendre une adresse jamais servie. La liste est désormais tenue par le dossier
// `app/` lui-même.
//
// **v164**, ici : une adresse d'un seul segment qui n'est pas réservée est une
// page de commerçant. Elle est rendue à la demande, donc un nonce n'y coûte
// rien — et c'est la seule page du produit où du contenu saisi par un tiers est
// affiché. C'est exactement là qu'il fallait fermer.
//
// ── Vérifié dans un navigateur, sur le produit construit ───────────────────
//
//                                  page publiée      page pré-rendue
//     script injecté sans nonce    REFUSÉ            exécuté
//     page hydratée par Next       oui               oui
//     erreurs de page              aucune            aucune
//
// Dix-huit scripts sur dix-huit portent le nonce sur la page publiée ; aucun sur
// `/features`, dont l'en-tête n'en porte pas non plus. La porte est fermée là où
// le contenu d'un tiers s'affiche, et rien n'a changé ailleurs.
//
// ── Pourquoi `'unsafe-inline' https:` restent dans la politique du nonce ───
//
// Ce n'est pas une contradiction : un navigateur qui comprend `'strict-dynamic'`
// **ignore** `'unsafe-inline'` et les sources d'hôte. Les garder ne change rien
// pour lui, et laisse un navigateur ancien — qui ignore le nonce — continuer à
// afficher la page plutôt que de la casser. C'est la recette documentée.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { NextRequest } from "next/server"
import { estUnePagePubliee, estFichierStatique, suite } from "../middleware"
import { ADRESSES_RESERVEES, SEGMENTS_SERVIS } from "./adressesReservees"

const SRC = path.join(__dirname, "..")

describe("garde de classe : le nonce va sur la page publiée, et nulle part ailleurs", () => {
  it("une adresse de commerçant est reconnue", () => {
    for (const bonne of ["/chez-marcel", "/le-comptoir", "/boulangerie-du-coin", "/guides-bordeaux", "/a1"])
      expect(estUnePagePubliee(bonne), bonne).toBe(true)
  })

  it("aucune route du produit n'en reçoit — c'est ce qui casserait la vitrine", () => {
    // Un nonce sur une page pré-rendue bloquerait ses propres scripts : son HTML
    // est écrit une fois pour toutes, sans nonce. Toutes les adresses réservées
    // sont donc exclues, y compris celles que le dossier `app/` impose.
    for (const reservee of ADRESSES_RESERVEES)
      expect(estUnePagePubliee(`/${reservee}`), `/${reservee} est au produit`).toBe(false)
    expect(SEGMENTS_SERVIS.length, "des segments servis").toBeGreaterThan(12)
    for (const servi of SEGMENTS_SERVIS)
      expect(estUnePagePubliee(`/${servi}`), `/${servi}`).toBe(false)
  })

  it("ni les chemins profonds, ni la racine, ni un fichier", () => {
    for (const autre of ["/", "/dashboard/analytics", "/guides/mon-guide", "/q/abc123",
                         "/chez-marcel/quelque-chose", "/robots.txt", "/image.png", "/sitemap.xml"])
      expect(estUnePagePubliee(autre), autre).toBe(false)
    // La règle des fichiers est celle du produit, pas une seconde écriture.
    expect(estFichierStatique("robots.txt")).toBe(true)
    expect(estFichierStatique("chez-marcel")).toBe(false)
  })

  it("la casse ne fait pas passer une route pour un commerce", () => {
    // Le produit enregistre les adresses en minuscules ; `adresseReservee`
    // normalise. Sans cela, `/Features` recevrait un nonce et la page casserait.
    for (const deguisee of ["/FEATURES", "/Guides", "/Dashboard", "/Q"])
      expect(estUnePagePubliee(deguisee), deguisee).toBe(false)
  })
})

describe("exécuté : la réponse elle-même, pas le tri qui la précède", () => {
  // Une mutation me l'a appris : je vérifiais que `estUnePagePubliee` sait
  // trier, mais pas que la réponse s'en sert. Retirer cette condition — donc
  // poser un nonce sur TOUTES les pages, y compris les pré-rendues, dont les
  // scripts ne le portent pas — ne faisait échouer aucun test. C'est pourtant la
  // mutation qui casserait la vitrine. On appelle donc la fonction.
  const requete = (chemin: string) => new NextRequest(new URL(chemin, "https://qrowg.com"))
  const politiqueDe = (chemin: string) => suite(requete(chemin), chemin).headers.get("Content-Security-Policy")

  it("une page de commerçant reçoit un nonce, tiré à chaque appel", () => {
    const a = politiqueDe("/chez-marcel"), b = politiqueDe("/chez-marcel")
    expect(a, "la politique est posée").toMatch(/^script-src 'nonce-[A-Za-z0-9+/=]{16,}' 'strict-dynamic'/)
    expect(a).not.toBe(b)   // un nonce réutilisé ne protège plus de rien
  })

  it("une route du produit n'en reçoit aucun — sinon ses scripts seraient bloqués", () => {
    for (const reservee of ADRESSES_RESERVEES)
      expect(politiqueDe(`/${reservee}`), `/${reservee}`).toBeNull()
    for (const autre of ["/", "/dashboard/analytics", "/guides/mon-guide", "/robots.txt"])
      expect(politiqueDe(autre), autre).toBeNull()
  })
})

describe("la politique du nonce : ce qu'elle porte, et où", () => {
  const mw = fs.readFileSync(path.join(SRC, "middleware.ts"), "utf8")

  it("le même nonce est posé sur la requête ET sur la réponse", () => {
    // Sur la REQUÊTE, c'est Next qui le lit pour en marquer ses propres scripts.
    // Sur la RÉPONSE, c'est le navigateur qui l'applique. Un seul des deux, et
    // soit rien n'est protégé, soit la page ne s'exécute plus.
    expect(mw, "un nonce par requête").toMatch(/crypto\.randomUUID\(\)/)
    expect(mw, "posé sur la requête").toMatch(/entetes\.set\("Content-Security-Policy", politique\)/)
    expect(mw, "et sur la réponse").toMatch(/res\.headers\.set\("Content-Security-Policy", politique\)/)
    expect(mw, "les deux portent la MÊME chaîne").toMatch(/const politique = `script-src 'nonce-\$\{nonce\}'/)
    expect(mw, "et Next reçoit la requête modifiée").toMatch(/NextResponse\.next\(\{ request: \{ headers: entetes \} \}\)/)
  })

  it("`'strict-dynamic'` est là — c'est lui qui fait ignorer `'unsafe-inline'`", () => {
    expect(mw).toContain("'strict-dynamic'")
    // Les deux repli pour un navigateur ancien, qui ignore le nonce : mieux vaut
    // une page qui s'affiche qu'une page blanche.
    expect(mw, "le repli des vieux navigateurs").toMatch(/'strict-dynamic' 'unsafe-inline' https:/)
  })

  it("la liste des adresses réservées est celle du lot v163, pas une copie", () => {
    expect(mw, "le middleware interroge la liste partagée").toContain('from "@/lib/adressesReservees"')
    expect(mw, "il ne réécrit pas de liste").not.toMatch(/const RESERVED|\["dashboard",/)
  })

  it("le nonce ne remplace pas la politique de base — il s'y ajoute", () => {
    // La politique du lot v162 s'applique à toutes les réponses (`/:path*`).
    // Celle-ci vient en plus, sur la page publiée : un navigateur applique les
    // deux, et un script doit satisfaire les deux. Vérifié dans le navigateur :
    // la page publiée s'hydrate normalement sous les deux à la fois.
    const config = fs.readFileSync(path.join(SRC, "..", "next.config.mjs"), "utf8")
    expect(config, "la politique de base est toujours là").toContain("script-src 'self' 'unsafe-inline'")
    expect(config, "…et couvre toutes les adresses").toContain('source: "/:path*"')
  })
})
