// Une image d'aperçu demande la taille qu'elle affiche — garde de classe.
//
// Relevé du 15 septembre. Le rendu partagé (`shared-renderer`) avait déjà réglé
// ce défaut bloc par bloc, et ses propres commentaires le racontent : « l'aperçu
// rendait un <img> brut, donc l'original en pleine taille sur le téléphone de
// l'auteur, à chaque ouverture du canvas ». Deux écrans étaient restés en
// arrière, et ils portaient à eux seuls **soixante-huit** des images brutes :
//
//   app/dashboard/builder/builderPreview.tsx        36
//   app/dashboard/templates/TemplatePreviewModal.tsx 32
//
// Plus seize autres, dispersées : les logos de l'atelier d'impression et des
// générateurs, l'avatar du profil, les vignettes de la bibliothèque de médias,
// l'image de bannière, le fond de thème.
//
// Ce sont les médias téléversés par le commerçant — `c.avatar`, `c.cover`,
// `c.photo`, `c.before_img`, `c.logo_url` — rendus en 40, 52, 72, 120 px. Une
// photo de smartphone, même compressée à 1 600 px par l'envoi, pèse encore 200
// à 400 Ko : douze vignettes de galerie, ce sont plusieurs mégaoctets
// retéléchargés à chaque ouverture du canvas, sur le téléphone de celui qui
// construit sa page — et souvent sur sa connexion mobile, en boutique.
//
// La classe : **une image d'aperçu demande la taille qu'elle affiche.**
//
// `Vignette` ne rivalise pas avec `SmartImage` : il lui donne ce qui manquait
// aux appels en forme de `<img>` — les dimensions et `sizes` — et lui délègue
// tout le reste.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { tailleDeVignette, CADRE_APERCU } from "./Vignette"

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
 * Les `<img>` bruts qui restent, chacun avec sa raison écrite. Le point commun :
 * **il n'y a rien à retélécharger** — l'image est déjà dans le navigateur, ou
 * aucun composant React n'est rendu là.
 *
 * La clé est le fichier ET la source : un nouveau `<img>` dans un fichier déjà
 * nommé ici déclenche quand même la règle.
 */
const RIEN_A_RETELECHARGER: { fichier: string; source: string; raison: string }[] = [
  { fichier: "app/dashboard/qr-codes/QRStudio.tsx", source: "qrPng",
    raison: "Le PNG du QR est composé dans le navigateur puis converti en data: URL — il n'a jamais transité par le réseau." },
  { fichier: "app/dashboard/print-studio/PrintStudioClient.tsx", source: "qrPng",
    raison: "QR importé par l'utilisateur, lu en data: URL par FileReader : le fichier est déjà en mémoire." },
  { fichier: "app/dashboard/print-studio/PrintStudioClient.tsx", source: "qrImg",
    raison: "Même data: URL que ci-dessus, posée sur le support : rien à demander au serveur." },
  { fichier: "app/outils/testeur-qr-code/TesteurClient.tsx", source: "apercu",
    raison: "L'image testée est une blob: URL locale (URL.createObjectURL) — elle ne quitte pas l'appareil." },
  { fichier: "app/dashboard/profile/page.tsx", source: "cropSrc",
    raison: "L'aperçu du recadrage est la data: URL que FileReader vient de produire, avant tout envoi." },
  { fichier: "app/dashboard/builder/ImageCropModal.tsx", source: "url",
    raison: "Le recadrage travaille sur l'original en blob: URL : une version réduite dégraderait le résultat découpé." },
  { fichier: "app/[slug]/og/route.tsx", source: "avatarData",
    raison: "L'image Open Graph est dessinée par satori, qui ne rend aucun composant React et ne connaît que <img>." },
]

/** Les `<img>` bruts du produit, hors commentaires. */
function imagesBrutes(): { fichier: string; ligne: number; source: string }[] {
  const out: { fichier: string; ligne: number; source: string }[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    if (rel === "components/SmartImage.tsx") continue   // le repli natif, c'est lui
    fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(l)) return          // un commentaire qui en parle
      for (const m of l.matchAll(/<img\b[^>]*?src=\{([A-Za-z_$][\w$]*)/g)) {
        out.push({ fichier: rel, ligne: i + 1, source: m[1] })
      }
    })
  }
  return out
}

describe("une vignette demande la taille qu'elle affiche", () => {
  it("une taille fixe est demandée telle quelle", () => {
    expect(tailleDeVignette({ width: 44, height: 44 })).toEqual({ width: 44, height: 44, sizes: "44px" })
    expect(tailleDeVignette({ width: "52px", height: "52px" })).toEqual({ width: 52, height: 52, sizes: "52px" })
    expect(tailleDeVignette({ width: 120 }), "sans hauteur : un carré").toEqual({ width: 120, height: 120, sizes: "120px" })
  })

  it("une largeur fluide plafonne au cadre de l'aperçu, jamais à l'original", () => {
    const t = tailleDeVignette({ width: "100%", height: 90 })
    expect(t.width).toBe(CADRE_APERCU)
    expect(t.height, "la hauteur connue sert de rapport").toBe(90)
    expect(t.sizes, "sans ça le navigateur suppose la pleine largeur").toBe(`${CADRE_APERCU}px`)
  })

  it("une taille absente ou absurde ne fabrique pas de dimension négative", () => {
    for (const s of [undefined, {}, { width: "auto" }, { width: 0 }, { width: -40 }, { width: "50%" }, { width: "12rem" }]) {
      const t = tailleDeVignette(s as never)
      expect(t.width, JSON.stringify(s)).toBe(CADRE_APERCU)
      expect(t.height).toBeGreaterThan(0)
    }
  })

  it("Vignette délègue à SmartImage — il ne refait pas next/image", () => {
    const src = lire("components/Vignette.tsx")
    expect(src).toContain('import SmartImage from "./SmartImage"')
    const code = src.split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n")
    expect(code, "pas de second <img> dans le produit").not.toMatch(/<img\b/)
    expect(src).toContain("sizes={sizes ?? t.sizes}")
  })
})

describe("garde de classe : un aperçu ne retélécharge pas l'original", () => {
  it("chaque <img> brut restant a une raison écrite", () => {
    const permis = new Set(RIEN_A_RETELECHARGER.map(e => `${e.fichier}|${e.source}`))
    const fautes = imagesBrutes()
      .filter(i => !permis.has(`${i.fichier}|${i.source}`))
      .map(i => `${i.fichier}:${i.ligne} — src={${i.source}}`)
    expect(fautes, "passer par <Vignette> (ou SmartImage), qui demande la taille affichée").toEqual([])
  })

  it("et la liste des exceptions ne grandit pas en silence", () => {
    expect(RIEN_A_RETELECHARGER.length, "sept exceptions, pas une de plus sans relevé").toBe(7)
    for (const e of RIEN_A_RETELECHARGER) {
      expect(e.raison.length, `${e.fichier} : une raison trop courte n'en est pas une`).toBeGreaterThan(60)
      // Chaque exception doit exister : une ligne morte donnerait un permis à un
      // futur <img> qui, lui, irait bien chercher l'original sur le réseau.
      expect(lire(e.fichier), `${e.fichier} : l'exception ne correspond à rien`).toMatch(new RegExp(`<img\\b[^>]*?src=\\{${e.source}\\b`))
    }
  })

  it("les deux aperçus qui restaient en arrière sont passés au composant", () => {
    for (const [f, n] of [
      ["app/dashboard/builder/builderPreview.tsx", 36],
      ["app/dashboard/templates/TemplatePreviewModal.tsx", 32],
    ] as const) {
      const src = lire(f)
      expect(src, f).toContain('import Vignette from "@/components/Vignette"')
      expect((src.match(/<Vignette\b/g) ?? []).length, `${f} : ${n} images attendues`).toBe(n)
    }
  })

  it("le balayage voit bien les images — sinon il ne prouve rien", () => {
    let vignettes = 0
    let fichiersAvecImages = 0
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      const n = (src.match(/<Vignette\b/g) ?? []).length
      if (n) { vignettes += n; fichiersAvecImages++ }
    }
    expect(vignettes, "des vignettes dans le produit").toBeGreaterThan(70)
    expect(fichiersAvecImages, "et dans plusieurs écrans").toBeGreaterThan(8)
    expect(imagesBrutes().length, "et le balayage trouve encore les <img> bruts").toBeGreaterThan(5)
  })
})
