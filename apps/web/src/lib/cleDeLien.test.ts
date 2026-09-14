// Le même lien, compté une fois — garde de classe.
//
// Relevé du 14 septembre. Les statistiques regroupent les clics ainsi :
//
//     key = `${c.block_id}::${c.click_target}`        TopLinksPanel:144
//
// et la clé émise par les boutons est, presque partout, l'ADRESSE elle-même :
//
//     u.trackClick(trackTarget ?? href)               LayoutSurface:59
//
// Sur les 52 blocs publics qui rendent un lien : 3 passent une clé stable
// (« download », « email », « whatsapp »), 11 passent `url || "repli"` — donc
// l'URL dès qu'elle existe — et les autres passent l'URL, ou rien, auquel cas
// SmartCta retombe sur le `href`.
//
// Pour un commerçant qui écrit puis corrige son lien Instagram :
//
//   https://instagram.com/lecomptoir                    clé A
//   https://www.instagram.com/lecomptoir                clé B
//   https://www.instagram.com/lecomptoir?utm_source=qr  clé C
//   https://www.instagram.com/lecomptoir/#bio           clé B
//
// Le même bouton apparaît trois fois dans « Top 10 liens », ses clics coupés en
// trois. Il croit que son lien Instagram marche mal ; il marche, il est compté
// en morceaux. Et ajouter un `?utm_source=` pour mesurer une campagne — le geste
// que le produit encourage — suffit à couper l'historique.
//
// Le produit l'avait écrit, dans `SmartCta` : « on conserve les clés historiques
// pour ne pas casser les statistiques déjà collectées ». Trois blocs sur
// cinquante-deux appliquent la phrase.
//
// La classe : **la clé d'un clic est normalisée au point unique qui l'écrit, et
// avec la même règle à la lecture** — de sorte que l'historique déjà collecté se
// rassemble de lui-même, sans toucher à la base.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { cleDeLien, cleDeRegroupement, memeLien, libelleDeCle, cleOuvrable } from "./cleDeLien"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

describe("le cas du relevé : quatre saisies, un lien", () => {
  const SAISIES = [
    "https://instagram.com/lecomptoir",
    "https://www.instagram.com/lecomptoir",
    "https://www.instagram.com/lecomptoir?utm_source=qrowg&utm_medium=qr",
    "https://www.instagram.com/lecomptoir/#bio",
    "https://Instagram.com/lecomptoir/",
  ]

  it("elles se rangent toutes sous la même clé", () => {
    const cles = new Set(SAISIES.map(cleDeLien))
    expect([...cles]).toEqual(["https://instagram.com/lecomptoir"])
  })

  it("et le regroupement des statistiques suit", () => {
    const cles = new Set(SAISIES.map(s => cleDeRegroupement("b1", s)))
    expect(cles.size).toBe(1)
    expect([...cles][0]).toBe("b1::https://instagram.com/lecomptoir")
  })

  it("mais un bloc différent reste un lien différent", () => {
    // Deux boutons vers la même adresse, sur deux blocs : le commerçant veut
    // savoir lequel est cliqué. Le bloc fait partie de la clé, comme avant.
    expect(cleDeRegroupement("b1", SAISIES[0])).not.toBe(cleDeRegroupement("b2", SAISIES[0]))
  })
})

describe("ce qui doit rester distinct", () => {
  it("deux pages du même site", () => {
    expect(cleDeLien("https://moncafe.fr/menu")).not.toBe(cleDeLien("https://moncafe.fr/carte"))
  })

  it("un paramètre qui change la page, lui, est gardé", () => {
    // `?lang=en` mène ailleurs. `?utm_source=` non : il décrit d'où vient le
    // visiteur, pas où il va.
    expect(cleDeLien("https://moncafe.fr/menu?lang=en")).toContain("lang=en")
    expect(cleDeLien("https://moncafe.fr/menu?lang=en&utm_source=qr")).toBe("https://moncafe.fr/menu?lang=en")
  })

  it("la casse du chemin compte — un serveur peut la distinguer", () => {
    expect(cleDeLien("https://moncafe.fr/Menu")).not.toBe(cleDeLien("https://moncafe.fr/menu"))
  })

  it("deux hôtes différents, deux liens", () => {
    expect(cleDeLien("https://moncafe.fr")).not.toBe(cleDeLien("https://moncafe.com"))
    // `www.` n'est pas un hôte différent pour un commerçant qui tape son site.
    expect(cleDeLien("https://www.moncafe.fr")).toBe(cleDeLien("https://moncafe.fr"))
  })

  it("et http n'est pas https", () => {
    expect(cleDeLien("http://moncafe.fr")).not.toBe(cleDeLien("https://moncafe.fr"))
  })
})

describe("les clés stables du produit traversent intactes", () => {
  it("les trois blocs qui avaient déjà raison", () => {
    for (const cle of ["download", "email", "whatsapp"]) {
      expect(cleDeLien(cle), `${cle} a été réécrite`).toBe(cle)
    }
  })

  it("et les autres clés historiques aussi", () => {
    for (const cle of ["cta_button", "ticket", "directions", "calendar:ics", "copy-address", "audio-download"]) {
      expect(cleDeLien(cle)).toBe(cle)
    }
  })

  it("elles se lisent en français dans le tableau, sans passer pour des liens", () => {
    expect(libelleDeCle("download")).toBe("Téléchargement")
    expect(libelleDeCle("whatsapp")).toBe("WhatsApp")
    expect(cleOuvrable("download")).toBe(false)
    // Une clé inconnue reste montrée telle quelle : mieux vaut un mot brut
    // qu'un nom inventé.
    expect(libelleDeCle("calendar:ics")).toBe("calendar:ics")
    expect(libelleDeCle("")).toBe("—")
  })

  it("une adresse, elle, reste une adresse et s'ouvre", () => {
    expect(libelleDeCle("https://moncafe.fr")).toBe("https://moncafe.fr")
    expect(cleOuvrable("https://moncafe.fr")).toBe(true)
    expect(cleOuvrable("mailto:x@y.fr"), "un mailto ne s'ouvre pas dans un onglet").toBe(false)
  })
})

describe("mailto, tel et les entrées bancales", () => {
  it("une adresse e-mail ne dépend pas de la casse", () => {
    expect(cleDeLien("mailto:Bonjour@MonCafe.FR")).toBe("mailto:bonjour@moncafe.fr")
  })

  it("un numéro ne dépend pas de ses espaces", () => {
    expect(cleDeLien("tel:+33 6 12 34 56 78")).toBe("tel:+33612345678")
    expect(cleDeLien("tel:06.12.34.56.78")).toBe("tel:0612345678")
  })

  it("rien de tout ça ne casse sur une entrée vide ou tordue", () => {
    expect(cleDeLien("")).toBe("")
    expect(cleDeLien(null)).toBe("")
    expect(cleDeLien(undefined)).toBe("")
    expect(cleDeLien(42)).toBe("")
    // Une URL illisible ressort telle quelle plutôt que de disparaître : un clic
    // compté sous une clé bizarre vaut mieux qu'un clic perdu.
    expect(cleDeLien("https://[pas une url")).toBe("https://[pas une url")
  })

  it("deux cibles se comparent avec la même règle", () => {
    expect(memeLien("https://www.moncafe.fr/", "https://moncafe.fr")).toBe(true)
    expect(memeLien("https://moncafe.fr/a", "https://moncafe.fr/b")).toBe(false)
    expect(memeLien("", "")).toBe(false)
  })
})

describe("les deux bouts sont branchés — c'est ce qui répare l'historique", () => {
  it("l'écriture : le point unique par lequel passent tous les clics", () => {
    const src = lire("lib/trackLinkClick.ts")
    expect(src).toContain('import { cleDeLien } from "./cleDeLien"')
    expect(src).toContain("const cible = cleDeLien(clickTarget) || clickTarget")
    expect(src).toContain("clickTarget: cible.slice(0, 500)")
  })

  it("la lecture : le même regroupement, donc les anciens clics se rassemblent", () => {
    const src = lire("app/dashboard/analytics/TopLinksPanel.tsx")
    expect(src).toContain("cleDeRegroupement(c.block_id, c.click_target)")
    expect(src).toContain("cleDeLien(c.click_target)")
    expect(src, "le tableau ne recompose plus la clé à la main").not.toContain("`${c.block_id}::${target}`")
  })

  it("et le tableau n'offre plus d'ouvrir ce qui n'est pas une adresse", () => {
    const src = lire("app/dashboard/analytics/TopLinksPanel.tsx")
    expect(src).toContain("cleOuvrable(row.target)")
    expect(src).not.toContain('row.target.startsWith("http")')
  })
})

describe("garde de classe : une seule règle, au point qui écrit", () => {
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

  it("aucun écran ne recompose une clé de clic dans son coin", () => {
    // Le motif du défaut : `${bloc}::${cible}` écrit à la main quelque part.
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/cleDeLien.ts") continue
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (/\}::\$\{|"::"\s*\+/.test(l)) fautes.push(`${rel}:${i + 1} — ${l.slice(0, 90)}`)
      }
    }
    expect(fautes, "la clé de regroupement se fabrique dans lib/cleDeLien").toEqual([])
  })

  it("et aucun clic ne part vers /api/track hors de trackLinkClick", () => {
    // Deux moteurs de rendu comptent des clics — le rendu unifié via le contexte
    // de `PublicPageClient`, et `renduLegacy` qui appelle `trackLinkClick`
    // directement, 87 fois. Les deux traversent la MÊME fonction : c'est ce qui
    // rend une normalisation posée là efficace partout. Ce qui la contournerait,
    // c'est un second endroit qui poste un « click » à la main.
    expect(lire("app/[slug]/PublicPageClient.tsx")).toContain("trackLinkClick(pageId, block.id, cible)")
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/trackLinkClick.ts") continue
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (/type:\s*["']click["']/.test(l)) fautes.push(`${rel}:${i + 1} — ${l.slice(0, 90)}`)
      }
    }
    expect(fautes, "un second chemin d'écriture contournerait la normalisation").toEqual([])
  })

  it("le balayage voit bien les clics du produit", () => {
    let vus = 0
    for (const f of fichiers()) {
      for (const l of fs.readFileSync(f, "utf8").split("\n")) {
        if (/trackClick\(/.test(l) && !l.trim().startsWith("//")) vus++
      }
    }
    expect(vus, "un balayage devenu aveugle ne prouve rien").toBeGreaterThan(20)
  })

  it("les trois blocs à clé stable la gardent — l'historique en dépend", () => {
    // Si l'un repassait à l'URL, ses clics d'hier seraient orphelins. La raison
    // est écrite dans SmartCta ; elle vaut toujours.
    expect(lire("app/dashboard/builder/shared-renderer/models/downloadFile.ts")).toContain('trackTarget: "download"')
    expect(lire("app/dashboard/builder/shared-renderer/models/emailButton.ts")).toContain('trackTarget: "email"')
    expect(lire("app/dashboard/builder/shared-renderer/models/whatsappButton.ts")).toContain('trackTarget: "whatsapp"')
    expect(lire("app/dashboard/builder/shared-renderer/primitives/LayoutSurface.tsx"))
      .toContain("pour ne pas casser les")
  })
})
