// Un écran qui tient une saisie non écrite le dit avant de la perdre — garde de classe.
//
// Relevé du 15 septembre. Treize écrans du produit tiennent une saisie et
// l'écrivent en base ou par une route. **Un seul prévenait avant de la perdre** :
// le builder, avec un `dirty` et un `beforeunload` enfermés dans son fichier.
//
//   print-studio/PrintStudioClient.tsx   45 réglages   —
//   qr-link/page.tsx                     23 réglages   —
//   builder/BuilderV4.tsx                20 réglages   oui
//   generateur-qr-code/GeneratorClient   18 réglages   —
//   qr-codes/QRStudio.tsx                18 réglages   —
//   profile/page.tsx                     15 réglages   —
//   settings/page.tsx                    10 réglages   —
//   qr-codes/QRStudioZero.tsx            10 réglages   (enregistre au fil)
//
// L'atelier d'impression est le pire cas : quarante-cinq réglages — mise en page,
// couleurs, logo, format, charte — composés pendant de longues minutes, et un
// clic sur « Mes QR codes » les efface sans un mot. Le commerçant ne sait même
// pas ce qu'il vient de perdre : rien ne lui avait dit qu'il y avait quelque
// chose à perdre.
//
// Et le plus frappant : **trois de ces écrans savaient déjà qu'ils étaient
// sales.** Le profil calcule `hasChanges` — pour allumer un bouton. Le
// générateur compare `downloaded` à la signature courante — pour afficher une
// pastille. Le signal existait ; il ne retenait rien.
//
// La classe : **un écran qui tient une saisie non écrite le dit avant de la
// perdre.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { empreinte, travailPerdu, PHRASE_TRAVAIL_PERDU } from "./travailNonEnregistre"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function fichiers(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

/**
 * Le seuil de l'atelier. En dessous, un formulaire court — un nom de domaine, une
 * invitation d'équipe — se resaisit en dix secondes, et un avertissement à chaque
 * sortie serait du bruit. Au-dessus, c'est une composition : on ne la refait pas.
 */
const SEUIL_ATELIER = 8

/** Les écrans qui composent : une saisie tenue en page, et une écriture quelque part. */
function ateliers(): { fichier: string; reglages: number; retient: boolean }[] {
  const out: { fichier: string; reglages: number; retient: boolean }[] = []
  for (const f of fichiers()) {
    const s = fs.readFileSync(f, "utf8")
    if (!s.slice(0, 80).includes('"use client"')) continue
    const ecrit = /\.(update|insert|upsert)\(/.test(s) || /method:\s*"(POST|PUT|PATCH)"/.test(s)
    if (!ecrit) continue
    const reglages = (s.match(/onChange=\{/g) ?? []).length
    if (reglages < SEUIL_ATELIER) continue
    out.push({
      fichier: path.relative(SRC, f).split(path.sep).join("/"),
      reglages,
      retient: /useRetenirLaSortie\(|useTravailNonEnregistre\(|useEcartAvecLEnregistre\(/.test(s),
    })
  }
  return out.sort((a, b) => b.reglages - a.reglages)
}

/**
 * Les ateliers qui n'ont pas à retenir la sortie, avec la raison écrite.
 * Une seule raison est recevable : **il n'y a rien à perdre** — l'écran écrit au
 * fil de la saisie, donc quitter n'emporte rien.
 */
const ENREGISTRE_AU_FIL: { fichier: string; raison: string }[] = [
  { fichier: "app/dashboard/qr-codes/QRStudioZero.tsx",
    raison: "Sauvegarde automatique après chaque réglage (effet debounce) : quitter n'emporte rien, et un avertissement mentirait." },
]

describe("ce qui est composé et pas encore écrit", () => {
  it("l'empreinte ignore l'ordre des clés — deux saisies identiques se ressemblent", () => {
    expect(empreinte({ a: 1, b: 2 })).toBe(empreinte({ b: 2, a: 1 }))
    expect(empreinte({ a: 1 })).not.toBe(empreinte({ a: 2 }))
    expect(empreinte({ x: { b: 1, a: 2 } })).toBe(empreinte({ x: { a: 2, b: 1 } }))
    expect(empreinte([1, 2]), "un tableau garde son ordre, lui").not.toBe(empreinte([2, 1]))
  })

  it("et elle ne lève jamais — une comparaison qui explose ferait pire que le défaut", () => {
    const cycle: Record<string, unknown> = {}
    cycle.soi = cycle
    expect(() => empreinte(cycle)).not.toThrow()
    expect(empreinte(cycle)).toBe("")
    expect(empreinte(undefined)).toBe("")
    expect(() => empreinte(() => {})).not.toThrow()
  })

  it("sans référence posée, on se tait — le silence d'avant, pas une alerte à tort", () => {
    expect(travailPerdu({ a: 1 }, null), "chargement pas terminé : rien à dire").toBe(false)
    expect(travailPerdu({ a: 1 }, empreinte({ a: 1 }))).toBe(false)
    expect(travailPerdu({ a: 2 }, empreinte({ a: 1 }))).toBe(true)
    expect(travailPerdu({ b: 1, a: 1 }, empreinte({ a: 1, b: 1 })), "le désordre n'est pas une modification").toBe(false)
  })

  it("la phrase du produit est écrite à un seul endroit", () => {
    expect(PHRASE_TRAVAIL_PERDU).toMatch(/pas enregistrées/)
    expect(PHRASE_TRAVAIL_PERDU.length).toBeGreaterThan(40)
  })

  it("le crochet garde une identité stable — sinon il reposerait une référence périmée", () => {
    const src = lire("lib/useTravailNonEnregistre.ts")
    expect(src, "la valeur passe par une ref, la fonction ne bouge pas").toContain("const marquerEnregistre = useCallback(() => { setReference(empreinte(actuelRef.current)) }, [])")
    expect(src, "une seule pose d'écouteur, partagée").toContain("export function useRetenirLaSortie")
    expect((src.match(/addEventListener\("beforeunload"/g) ?? []).length, "un seul endroit écoute").toBe(1)
  })
})

describe("garde de classe : un atelier ne perd pas le travail en silence", () => {
  it("chaque atelier retient la sortie, ou dit pourquoi il n'en a pas besoin", () => {
    const excuses = new Map(ENREGISTRE_AU_FIL.map(e => [e.fichier, e.raison]))
    const fautes = ateliers()
      .filter(a => !a.retient && !excuses.has(a.fichier))
      .map(a => `${a.fichier} (${a.reglages} réglages)`)
    expect(fautes, "passer par useRetenirLaSortie / useTravailNonEnregistre / useEcartAvecLEnregistre").toEqual([])
  })

  it("et la seule excuse recevable — « il n'y a rien à perdre » — est vérifiée", () => {
    for (const e of ENREGISTRE_AU_FIL) {
      expect(e.raison.length, `${e.fichier} : une raison trop courte n'en est pas une`).toBeGreaterThan(60)
      const src = lire(e.fichier)
      // L'écran doit VRAIMENT écrire au fil : un effet différé qui persiste.
      expect(src, `${e.fichier} : pas de sauvegarde automatique trouvée`).toMatch(/setTimeout\([\s\S]{0,200}?(save|persist)/i)
      expect(src, `${e.fichier} : et il ne doit pas non plus retenir la sortie, ce serait dire deux choses`)
        .not.toMatch(/useRetenirLaSortie\(/)
    }
    expect(ENREGISTRE_AU_FIL.length, "une seule exception, pas une de plus sans relevé").toBe(1)
  })

  it("le builder ne garde plus son geste pour lui", () => {
    const src = lire("app/dashboard/builder/BuilderV4.tsx")
    expect(src).toContain("useRetenirLaSortie(")
    expect(src, "le beforeunload a quitté ce fichier").not.toContain('addEventListener("beforeunload"')
  })

  it("les trois écrans qui savaient déjà s'en servent enfin", () => {
    // Le signal existait et n'allumait qu'un bouton ou une pastille.
    expect(lire("app/dashboard/profile/page.tsx")).toContain("useRetenirLaSortie(() => hasChanges)")
    expect(lire("app/generateur-qr-code/GeneratorClient.tsx")).toContain("downloaded !== sig")
    expect(lire("app/dashboard/settings/page.tsx")).toContain("useEcartAvecLEnregistre(notifs, notifsEnregistres)")
  })

  it("le balayage voit bien les ateliers — sinon il ne prouve rien", () => {
    const tous = ateliers()
    expect(tous.length, "des écrans de composition dans le produit").toBeGreaterThan(6)
    expect(tous[0].reglages, "et le plus gros en compte beaucoup").toBeGreaterThan(30)
    expect(tous.filter(a => a.retient).length, "et presque tous retiennent maintenant").toBeGreaterThan(5)
    // Le seuil ne doit pas être monté si haut qu'il ne garde plus personne.
    expect(SEUIL_ATELIER).toBeLessThan(12)
  })
})
