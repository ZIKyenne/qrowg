// Le bouton « Vérifier DNS » qui ne vérifiait plus rien — garde de classe.
//
// Relevé du 14 septembre, sur un domaine personnalisé déjà activé. Le
// commerçant a changé de registrar hier ; son site est hors ligne :
//
//     TXT     : (supprimé)
//     CNAME   : www.lecomptoir.fr → parking.registrar.com
//     A       : lecomptoir.fr     → 91.195.240.19  (page de parking)
//     HTTPS   : 403
//
// Ce que l'écran répondait :
//
//     ✓ txt      Propriété vérifiée
//     ✓ cname    CNAME configuré
//     ✓ arecord  A record configuré
//     ✓ http     Domaine actif et accessible        allOk = true
//
// Aucune résolution : `GET /api/domains/check` court-circuitait les quatre
// contrôles dès que `verified` valait true en base.
//
// Et quand il vérifiait vraiment, les comparaisons étaient des `includes` :
//
//     CNAME « vercel.parking-registrar.com  » → accepté
//     CNAME « cname.vercel-dns.com.evil.net » → accepté
//     A [91.195.240.19, 76.76.21.21]         → refusé (Vercel est là, en 2e)
//     TXT « v=spf1 include:abc123def.mail.fr ~all » attendu « abc123 » → accepté
//
// La classe : un écran de diagnostic mesure à chaque fois, et compare des noms
// d'hôte, pas des morceaux de chaîne.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  VERCEL_IPS, VERCEL_CNAME, DOMAINE_VERCEL_DNS, PREFIXE_TXT,
  hoteNormalise, valeurTxtAttendue, txtDuProduit, txtCorrespond,
  cnameCorrespond, aRecordCorrespond, ipAffichee,
  etatGlobal, phraseRegression, phraseDerniereVerification,
} from "./verificationDns"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

describe("la preuve de propriété est exacte, ou n'est pas", () => {
  it("le cas du relevé : un SPF qui contient le jeton n'est pas une preuve", () => {
    expect(txtCorrespond(["v=spf1 include:abc123def.mail.fr ~all"], "abc123")).toBe(false)
    expect(txtCorrespond([valeurTxtAttendue("abc123")], "abc123")).toBe(true)
  })

  it("guillemets, casse et espaces des gestionnaires DNS ne cassent rien", () => {
    for (const r of [' qrowg-verify=ABC123 ', '"qrowg-verify=abc123"', "QROWG-VERIFY=abc123"]) {
      expect(txtCorrespond([r], "abc123"), r).toBe(true)
    }
  })

  it("un jeton vide ne valide jamais rien", () => {
    expect(txtCorrespond([PREFIXE_TXT], "")).toBe(false)
    expect(txtCorrespond([valeurTxtAttendue("abc")], null)).toBe(false)
    expect(txtCorrespond(null, "abc")).toBe(false)
  })

  it("on sait dire « trouvé, mais faux » plutôt que « absent »", () => {
    expect(txtDuProduit(["v=spf1 ~all", "qrowg-verify=ancien"])).toBe("qrowg-verify=ancien")
    expect(txtDuProduit(["v=spf1 ~all"])).toBeNull()
    expect(txtDuProduit(null)).toBeNull()
  })
})

describe("le CNAME se compare comme un nom d'hôte", () => {
  it("le cas du relevé : deux domaines que quelqu'un d'autre contrôle", () => {
    expect(cnameCorrespond("vercel.parking-registrar.com")).toBe(false)
    expect(cnameCorrespond("cname.vercel-dns.com.evil.net")).toBe(false)
    expect(cnameCorrespond("monsite.vercel-dns.com.attaquant.fr")).toBe(false)
  })

  it("et la vraie cible passe, sous toutes ses formes", () => {
    for (const v of [VERCEL_CNAME, `${VERCEL_CNAME}.`, VERCEL_CNAME.toUpperCase(), `abc.${DOMAINE_VERCEL_DNS}`]) {
      expect(cnameCorrespond(v), String(v)).toBe(true)
    }
  })

  it("rien de vide ne passe", () => {
    for (const v of ["", "   ", null, undefined, 42]) expect(cnameCorrespond(v as any), String(v)).toBe(false)
  })
})

describe("le domaine racine se lit en entier", () => {
  it("le cas du relevé : Vercel présent mais en deuxième position", () => {
    expect(aRecordCorrespond(["91.195.240.19", VERCEL_IPS[0]])).toBe(true)
    // Et la ligne « trouvé » montre celui qui compte, pas le premier venu.
    expect(ipAffichee(["91.195.240.19", VERCEL_IPS[0]])).toBe(VERCEL_IPS[0])
  })

  it("une IP de parking seule reste une erreur", () => {
    expect(aRecordCorrespond(["91.195.240.19"])).toBe(false)
    expect(ipAffichee(["91.195.240.19"])).toBe("91.195.240.19")
    expect(aRecordCorrespond([])).toBe(false)
    expect(aRecordCorrespond(null)).toBe(false)
    expect(ipAffichee(null)).toBe("")
  })

  it("les deux IP publiées par Vercel sont acceptées", () => {
    for (const ip of VERCEL_IPS) expect(aRecordCorrespond([ip]), ip).toBe(true)
  })
})

describe("ce qu'on dit d'un domaine qui ne répond plus", () => {
  it("« en attente » et « cassé » ne sont pas la même chose", () => {
    expect(etatGlobal([{ status: "ok" }, { status: "ok" }])).toBe("ok")
    expect(etatGlobal([{ status: "ok" }, { status: "pending" }])).toBe("en_attente")
    expect(etatGlobal([{ status: "ok" }, { status: "error" }])).toBe("casse")
    expect(etatGlobal([])).toBe("en_attente")
    expect(etatGlobal(null)).toBe("en_attente")
  })

  it("la phrase dit depuis quand on croyait le domaine bon", () => {
    const p = phraseRegression("2026-09-04T10:00:00Z")!
    expect(p).toContain("4 septembre 2026")
    expect(p).toContain("ne répond plus")
    // Sans date, on ne l'invente pas.
    expect(phraseRegression(null)).toContain("ne répond plus")
    expect(phraseRegression("pas une date")).toContain("ne répond plus")
    expect(phraseRegression(null)).not.toMatch(/\d{4}/)
  })

  it("et quand tout va bien, on dit quand on l'a su", () => {
    expect(phraseDerniereVerification(new Date("2026-09-14T08:30:00Z"))).toContain("Vérifié à l'instant")
  })

  it("un nom d'hôte se normalise pareil partout", () => {
    expect(hoteNormalise(' "Cname.Vercel-DNS.com." ')).toBe("cname.vercel-dns.com")
    expect(hoteNormalise(null)).toBe("")
  })
})

describe("la route vérifie à chaque fois", () => {
  const route = lire("app/api/domains/check/route.ts")

  it("le court-circuit « déjà vérifié » a disparu", () => {
    expect(route, "quatre ✓ renvoyés sans résoudre quoi que ce soit")
      .not.toContain('status: "ok", message: "Domaine actif et accessible"')
    expect(route, "le raccourci est revenu").not.toMatch(/if \(rec\.verified\) \{\s*const checks/)
    // Les quatre contrôles partent toujours.
    expect(route).toContain("checkTxt(domain, rec.txt_record)")
    expect(route).toContain("checkCname(domain)")
    expect(route).toContain("checkARecord(domain)")
    expect(route).toContain("checkHttp(domain)")
  })

  it("elle compare par le module, plus par morceaux de chaîne", () => {
    expect(route).toContain("txtCorrespond(flat, expected)")
    expect(route).toContain("cnameCorrespond(found)")
    expect(route).toContain("aRecordCorrespond(records)")
    expect(route, "le CNAME acceptait tout ce qui contient « vercel »").not.toContain('found.includes("vercel")')
    expect(route, "seul le premier A record était lu").not.toContain('VERCEL_IPS.includes(found)')
  })

  it("et elle dit la régression sans couper le domaine", () => {
    expect(route).toContain("phraseRegression(rec.verified_at)")
    expect(route).toContain("regression")
    expect(route, "un incident DNS ne doit pas dé-vérifier le domaine").not.toContain("verified: false")
  })

  it("l'écran l'affiche", () => {
    const ui = lire("app/dashboard/domains/DnsChecker.tsx")
    expect(ui).toContain("result.regression")
    expect(ui).toContain("Ce domaine ne répond plus")
  })
})

describe("garde de classe : un écran de diagnostic mesure, il ne se souvient pas", () => {
  it("aucune route de vérification ne répond depuis un booléen enregistré", () => {
    // Le motif exact du défaut : sortir de la fonction sur la foi d'une colonne
    // d'état, avant d'avoir fait la mesure que la route promet.
    const routes = ["app/api/domains/check/route.ts", "app/api/domains/resolve/route.ts"]
    for (const f of routes) {
      const src = lire(f)
      const lignes = src.split("\n")
      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i].trim()
        if (!/^if \((?:rec|d|row|data)?\.?verified\)/.test(l)) continue
        const suite = lignes.slice(i, i + 8).join(" ")
        expect(/return/.test(suite), `${f} : sortie anticipée sur « verified » — ${l}`).toBe(false)
      }
    }
  })

  it("les IP et la cible Vercel ne sont plus recopiées ailleurs", () => {
    const marcher = (d: string, out: string[] = []): string[] => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p, out) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
      return out
    }
    for (const f of marcher(SRC)) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/verificationDns.ts") continue
      const src = fs.readFileSync(f, "utf8")
      for (const ligne of src.split("\n")) {
        if (ligne.trim().startsWith("//") || ligne.trim().startsWith("*")) continue
        expect(ligne.includes("76.76.21.21"), `${rel} : IP Vercel écrite en dur — ${ligne.trim()}`).toBe(false)
      }
    }
  })
})
