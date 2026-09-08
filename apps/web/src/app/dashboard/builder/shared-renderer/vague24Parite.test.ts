import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// ═══════════════════════════════════════════════════════════════════════════════
// VAGUE 24 — « MIGRÉ » NE VOULAIT PAS DIRE « IDENTIQUE ».
//
// Le renderer partagé existe pour qu'un bloc ne soit plus écrit deux fois. On
// comptait 146 blocs migrés et l'affaire semblait close pour eux. Elle ne l'était
// que pour 94 : ceux écrits en `index.tsx`, une seule vue pour les deux modes.
// Les 52 autres ont été migrés en DEUX fichiers — EditorX.tsx et PublicX.tsx —
// qui ne partagent que le modèle. Le modèle porte les données ; le TEXTE AFFICHÉ,
// lui, est resté écrit deux fois. Il pouvait donc diverger, et il divergeait :
//
//   spotify_player   l'aperçu disait « Écouter sur Spotify », la page publiait
//                    « Ecouter sur Spotify ». Le É manquait en ligne, chez tous
//                    les artistes qui ont posé ce bloc.
//   pdf_viewer       la page publiait toujours un bouton « Consulter le PDF » ;
//                    l'aperçu n'en dessinait un QUE si le commerçant avait écrit
//                    son propre libellé. Il ne voyait pas le bouton qu'il publiait.
//   audio_player     le réglage « téléchargement » ajoutait un lien « ↓ Télécharger »
//                    sur la page. L'aperçu ne l'a jamais montré : le commerçant
//                    offrait son fichier audio en téléchargement sans le savoir.
//
// Ce contrôle lit les deux fichiers de chaque bloc à deux vues et compare le texte
// qu'ils affichent. Il ne remplace pas la vue unique — il rend visible ce que la
// vue unique rendrait impossible.
// ═══════════════════════════════════════════════════════════════════════════════

const ICI = dirname(fileURLToPath(import.meta.url))
const BLOCS = join(ICI, "blocks")

/** Les textes qu'un fichier de vue AFFICHE : nœuds JSX et libellés de repli. */
export function textesAffiches(source: string): string[] {
  const src = source.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
  const out = new Set<string>()
  // Un nœud de texte JSX : entre « > » et « < », sans accolade ni balise.
  for (const m of src.matchAll(/>\s*([^<>{}\n][^<>{}\n]{0,60}?)\s*</g)) ajoute(out, m[1])
  // Un repli : c.titre || "Mon titre"
  for (const m of src.matchAll(/\|\|\s*"([^"\n]{1,60})"/g)) ajoute(out, m[1])
  // Un ternaire de texte : cond ? "Ouvert" : "Fermé"
  for (const m of src.matchAll(/\?\s*"([^"\n]{2,60})"\s*:\s*"([^"\n]{2,60})"/g)) { ajoute(out, m[1]); ajoute(out, m[2]) }
  return [...out].sort()
}

/** Écarte ce qui n'est pas une phrase montrée : CSS, nombres, fragments de code. */
const PAS_DU_TEXTE = /^(?:[\d.\s]+$|#|[a-z]+\(|linear-|repeat|1fr|[a-z]+(?:-[a-z]+)*$|[\d.]+px|\.|\/|,|\}|\{|:|\(|\)|return |&&|\|\|)/
function ajoute(out: Set<string>, brut: string) {
  const v = brut.trim()
  if (!v || v.length < 2) return
  if (PAS_DU_TEXTE.test(v)) return
  if (!/[A-Za-zÀ-ÿ]{2}/.test(v)) return      // « ▾ », « · » : décor, pas du texte
  out.add(v)
}

type Bloc = { nom: string; editeur: string; publique: string }
const aDeuxVues: Bloc[] = readdirSync(BLOCS).sort().flatMap(nom => {
  const d = join(BLOCS, nom)
  if (!statSync(d).isDirectory() || existsSync(join(d, "index.tsx"))) return []
  const fs = readdirSync(d).sort()
  const e = fs.find(f => /^Editor.*\.tsx$/.test(f))
  const p = fs.find(f => /^Public.*\.tsx$/.test(f))
  return e && p ? [{ nom, editeur: readFileSync(join(d, e), "utf8"), publique: readFileSync(join(d, p), "utf8") }] : []
})

// Ce que l'éditeur SEUL a le droit de dire : les invitations d'état vide. Elles
// s'adressent au commerçant, jamais au visiteur — c'est leur raison d'être.
const INVITE_EDITEUR = /^(?:Ajoutez|Collez|Aucune image|Aucun |Aperçu |Vidéo$|track \/ album)/

// Ce que la PAGE seule a le droit de dire, avec la raison. Cette liste ne doit
// que rétrécir : chaque entrée est une phrase que le commerçant publie sans
// l'avoir vue.
const PUBLIE_SANS_APERCU: Record<string, string[]> = {
  // Message adressé au visiteur qui ouvre un onglet de carte encore vide. Le
  // commerçant, lui, voit dans son aperçu l'invitation à remplir la section :
  // les deux phrases s'adressent à deux personnes différentes, à dessein.
  menu_tabs: ["Aucun produit dans cette section."],
}

describe("vague 24 - un bloc migre en deux fichiers dit la meme chose des deux cotes", () => {
  it("le releve porte bien sur les 52 blocs a deux vues", () => {
    expect(aDeuxVues.length, "si ce nombre s'effondre, le contrôle ne garde plus rien").toBeGreaterThan(40)
  })

  it("aucun texte affiche ne differe entre l'apercu et la page", () => {
    const ecarts: Record<string, { apercu: string[]; page: string[] }> = {}
    for (const b of aDeuxVues) {
      const e = textesAffiches(b.editeur), p = textesAffiches(b.publique)
      const apercu = e.filter(v => !p.includes(v) && !INVITE_EDITEUR.test(v))
      const page = p.filter(v => !e.includes(v) && !(PUBLIE_SANS_APERCU[b.nom] ?? []).includes(v))
      if (apercu.length || page.length) ecarts[b.nom] = { apercu, page }
    }
    expect(ecarts).toEqual({})
  })

  it("les exclusions restent etroites, pas un tapis", () => {
    expect(INVITE_EDITEUR.test("Ajoutez vos langues")).toBe(true)
    expect(INVITE_EDITEUR.test("Écouter sur Spotify"), "un libellé publié n'est pas une invite").toBe(false)
    expect(INVITE_EDITEUR.test("Consulter le PDF")).toBe(false)
    expect(Object.keys(PUBLIE_SANS_APERCU).length, "cette liste ne doit que rétrécir").toBeLessThan(3)
  })

  it("le detecteur sait lire un texte affiche", () => {
    const t = textesAffiches('<p style={{ color: "#fff" }}>Bonjour</p>{c.x || "Repli"}<span>{v}</span>')
    expect(t).toContain("Bonjour")
    expect(t).toContain("Repli")
    expect(t).not.toContain("#fff")
    // Le filtre écarte le CSS (« rotate(180deg) », « translateY(2px) »)…
    expect(textesAffiches('<div style={{ transform: o ? "rotate(180deg)" : "none" }} />')).toEqual([])
    // …mais surtout pas une phrase française, même commençant par une minuscule.
    expect(textesAffiches('<p>ou appelez directement</p>')).toContain("ou appelez directement")
    expect(textesAffiches('{c.x || "à partir de 12 €"}')).toContain("à partir de 12 €")
  })

  it("les trois ecarts trouves ce jour-la ne reviennent pas", () => {
    const lire = (b: string, f: string) => readFileSync(join(BLOCS, b, f), "utf8")
    expect(lire("spotify_player", "PublicSpotifyPlayer.tsx"), "l'accent d'Écouter").toContain("Écouter sur Spotify")
    expect(lire("pdf_viewer", "EditorPdfViewer.tsx"), "l'aperçu montre le bouton dès qu'il y a une adresse").toContain("{hasUrl && <EditorCtaShell")
    expect(lire("audio_player", "EditorAudioPlayer.tsx"), "l'aperçu montre le téléchargement").toContain("↓ Télécharger")
  })
})
