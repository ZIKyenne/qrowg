import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  robotsAutorise, groupesRobots, estDuHtml,
  AGENT, NOM_AGENT, TAILLE_MAX, DELAI_MS, REDIRECTIONS_MAX,
} from "./allerChercher"
import { isPublicHttpUrl } from "@/lib/safeUrl"

describe("robots.txt est lu pour de vrai", () => {
  it("un fichier absent ou vide vaut autorisation", () => {
    // Refuser sur un fichier manquant reviendrait à ne jamais rien relever :
    // la plupart des sites de commerçants n'en ont pas.
    expect(robotsAutorise("", "/")).toBe(true)
    expect(robotsAutorise("# rien que des commentaires", "/")).toBe(true)
  })

  it("« Disallow: / » interdit tout", () => {
    expect(robotsAutorise("User-agent: *\nDisallow: /", "/")).toBe(false)
    expect(robotsAutorise("User-agent: *\nDisallow: /", "/carte")).toBe(false)
  })

  it("« Disallow: » vide n'interdit rien", () => {
    expect(robotsAutorise("User-agent: *\nDisallow:", "/carte")).toBe(true)
  })

  it("le motif le plus LONG gagne — sinon un site qui rouvre une section reste fermé", () => {
    // « tout est interdit, sauf /menu » est une forme courante. Lue à l'envers,
    // elle ferme un site qui nous invitait.
    const txt = "User-agent: *\nDisallow: /\nAllow: /menu"
    expect(robotsAutorise(txt, "/menu")).toBe(true)
    expect(robotsAutorise(txt, "/admin")).toBe(false)
  })

  it("à longueur égale, Allow l'emporte", () => {
    const txt = "User-agent: *\nDisallow: /a\nAllow: /a"
    expect(robotsAutorise(txt, "/a")).toBe(true)
  })

  it("le groupe qui NOUS nomme l'emporte entièrement sur le groupe *", () => {
    // On ne fusionne pas les deux : un site qui nous ouvre une porte fermée
    // aux autres doit être lu comme il l'a écrit.
    const txt = `User-agent: *\nDisallow: /\n\nUser-agent: ${NOM_AGENT}\nDisallow:`
    expect(robotsAutorise(txt, "/carte")).toBe(true)
  })

  it("…et dans l'autre sens aussi", () => {
    const txt = `User-agent: *\nDisallow:\n\nUser-agent: ${NOM_AGENT}\nDisallow: /`
    expect(robotsAutorise(txt, "/carte")).toBe(false)
  })

  it("plusieurs User-agent d'affilée partagent les mêmes règles", () => {
    const txt = `User-agent: GloutonBot\nUser-agent: ${NOM_AGENT}\nDisallow: /prive`
    expect(robotsAutorise(txt, "/prive")).toBe(false)
    expect(robotsAutorise(txt, "/carte")).toBe(true)
  })

  it("les jokers et l'ancrage sont compris", () => {
    expect(robotsAutorise("User-agent: *\nDisallow: /*.pdf$", "/carte.pdf")).toBe(false)
    expect(robotsAutorise("User-agent: *\nDisallow: /*.pdf$", "/carte.pdf.html")).toBe(true)
    expect(robotsAutorise("User-agent: *\nDisallow: /tmp/*/prive", "/tmp/x/prive")).toBe(false)
  })

  it("un fichier mal formé ne fait pas tomber la lecture", () => {
    // C'est la norme, pas l'exception : lignes sans deux-points, champs
    // inconnus, BOM, casse mélangée.
    const txt = "Sitemap: https://x.test/s.xml\nUSER-AGENT: *\nnimportequoi\nDISALLOW: /prive\nCrawl-delay: 10"
    expect(() => robotsAutorise(txt, "/")).not.toThrow()
    expect(robotsAutorise(txt, "/prive")).toBe(false)
    expect(robotsAutorise(txt, "/")).toBe(true)
  })

  it("le découpage en groupes voit bien ce qu'il lit — sinon il ne prouve rien", () => {
    const g = groupesRobots("User-agent: *\nDisallow: /a\nAllow: /b")
    expect(g).toHaveLength(1)
    expect(g[0]).toEqual({ agents: ["*"], autorise: ["/b"], interdit: ["/a"] })
  })
})

describe("les adresses qu'on refuse d'aller chercher", () => {
  it("tout ce qui pointe vers la machine ou le réseau interne", () => {
    for (const mauvaise of [
      "http://localhost/", "http://127.0.0.1/", "http://[::1]/",
      "http://169.254.169.254/latest/meta-data/",   // les identifiants de l'hébergeur
      "http://10.0.0.5/", "http://192.168.1.1/", "http://172.16.0.1/",
      "file:///etc/passwd", "ftp://x.test/", "javascript:alert(1)",
    ]) {
      expect(isPublicHttpUrl(mauvaise), mauvaise).toBe(false)
    }
  })

  it("et une adresse publique ordinaire passe", () => {
    expect(isPublicHttpUrl("https://chez-mariette.test/")).toBe(true)
  })
})

describe("le type de contenu", () => {
  it("seul du HTML est relevé", () => {
    expect(estDuHtml("text/html; charset=utf-8")).toBe(true)
    expect(estDuHtml("application/xhtml+xml")).toBe(true)
  })

  it("un PDF, une image ou rien du tout sont écartés", () => {
    // Un `hasMenu` pointe souvent vers un PDF : il n'y a rien à y relever.
    for (const t of ["application/pdf", "image/png", "application/json", "", null]) {
      expect(estDuHtml(t as string | null), String(t)).toBe(false)
    }
  })
})

describe("les gardes sont dans le code, pas seulement dans l'intention", () => {
  const BRUT = readFileSync(join(__dirname, "allerChercher.ts"), "utf8")

  /**
   * Le code, sans les commentaires.
   *
   * La première version de ces gardes lisait le fichier entier, et s'est
   * dénoncée elle-même : le module EXPLIQUE en commentaire pourquoi
   * `redirect: "follow"` serait dangereux, et la garde lisait cette explication
   * comme du code. Une garde qu'un commentaire fait crier apprend à ne plus
   * commenter — c'est le constat du lot v199, et il vaut aussi pour celle-ci.
   */
  const SRC = BRUT
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^[ \t]*\/\/.*$/gm, " ")

  it("les redirections ne sont JAMAIS suivies automatiquement", () => {
    // C'est la garde qu'on oublie : une adresse publique légitime peut
    // répondre 302 vers http://localhost/. Contrôler seulement l'URL de départ
    // ne protège de rien.
    expect(SRC, "le fetch doit poser redirect: manual").toContain('redirect: "manual"')
    expect(SRC, "aucun fetch ne doit suivre tout seul").not.toContain('redirect: "follow"')
  })

  it("chaque saut de redirection repasse l'examen anti-SSRF", () => {
    // `isPublicHttpUrl` doit être appelé DANS la boucle de suivi, pas une fois
    // avant elle.
    const boucle = SRC.slice(SRC.indexOf("async function suivre"), SRC.indexOf("async function lireBorne"))
    expect(boucle, "la boucle de redirection ne revérifie pas l'adresse").toContain("isPublicHttpUrl(url)")
  })

  it("l'agent se nomme, et son nom est celui que robots.txt peut bloquer", () => {
    // Un agent anonyme est un agent qu'on ne peut pas refuser.
    expect(AGENT).toContain("QRowgBot")
    expect(AGENT).toContain("https://qrowg.com")
    expect(AGENT.toLowerCase()).toContain(NOM_AGENT)
  })

  it("le délai et la taille maximale sont posés, et raisonnables", () => {
    expect(DELAI_MS).toBeGreaterThan(0)
    expect(DELAI_MS).toBeLessThanOrEqual(15_000)
    expect(TAILLE_MAX).toBeLessThanOrEqual(5 * 1024 * 1024)
    expect(REDIRECTIONS_MAX).toBeLessThanOrEqual(10)
  })

  it("la taille est contrôlée PENDANT la lecture, pas seulement sur l'en-tête", () => {
    // Un serveur qui annonce 10 ko et en envoie 80 Mo ne doit pas nous remplir
    // la mémoire. L'en-tête ne suffit donc pas.
    const lecture = SRC.slice(SRC.indexOf("async function lireBorne"))
    expect(lecture, "la lecture doit s'arrêter au dépassement").toContain("total > TAILLE_MAX")
    expect(lecture).toContain("lecteur.cancel()")
  })

  it("on ne parcourt qu'UNE page, et robots.txt", () => {
    // Le besoin est de relever un établissement, pas de copier son site. Deux
    // appels à `requete` : robots.txt et la page.
    const appels = [...SRC.matchAll(/await requete\(/g)].length
    expect(appels, "trois appels ou plus : ce n'est plus un relevé, c'est un parcours").toBeLessThanOrEqual(2)
  })

  it("rien n'est écrit en base depuis ce module", () => {
    for (const ecriture of [".insert(", ".upsert(", ".update(", "createAdminClient"]) {
      expect(SRC, `aller chercher une page ne doit rien enregistrer (${ecriture})`).not.toContain(ecriture)
    }
  })
})
