// Ce qui se ferme en cliquant à côté se ferme aussi avec Échap — garde de classe.
//
// Relevé du 20 septembre. Le produit pose **trente-trois** voiles : un
// `position: fixed; inset: 0` qui recouvre l'écran, sous un menu, une feuille,
// un aperçu, une fenêtre. **Vingt** d'entre eux portent un `onClick` qui ferme —
// c'est le produit lui-même qui écrit noir sur blanc que cette couche est
// refermable. **Aucun des vingt ne répondait à Échap.**
//
// Au clavier, la seule sortie était de tabuler jusqu'à la croix — quand il y en
// avait une. L'aperçu plein écran d'un QR, la bibliothèque d'images, la feuille
// de choix de mode sur téléphone, les deux fenêtres de confirmation du profil :
// ouvertes, elles se gardaient.
//
// **Et le geste existait deux fois.** `components/ui/useDialogue` (lot v122)
// disait déjà ce qu'Échap fait ; `lib/useFermetureModale` le réécrivait —
// même écouteur, même `stopPropagation`, même phase de capture — et
// `print-studio/PrintStudioClient` en tenait une troisième copie pour son
// aperçu plein écran et son calibrage. Trois endroits pour décider ce que
// « se fermer » veut dire, donc trois endroits où diverger. C'est le mot à mot
// de l'avertissement écrit dans `Dialogue.tsx` au lot v122 — et il s'était
// déjà réalisé ailleurs pendant qu'on l'écrivait.
//
// La classe : **ce qui se ferme en cliquant à côté se ferme aussi avec Échap, et
// il n'y a qu'un endroit qui dit ce qu'Échap fait.**
//
//   useFermetureEchap    Échap seul — pour ce qui N'EST PAS une fenêtre : un
//                        menu « ⋯ », un sélecteur. Lui poser `aria-modal`
//                        mentirait, lui piéger le focus l'enfermerait.
//   useFermetureModale   + gel du défilement + focus rendu — une couche pleine.
//   useDialogue          + rôle annoncé + piège de focus — une vraie fenêtre.
//
// **Trouvé en posant le lot.** Les trois crochets relançaient leur effet quand
// l'appelant passait une fermeture écrite en ligne — c'est-à-dire à chaque
// rendu. `useFermetureModale` rendait alors le focus au bouton d'origine
// pendant qu'on était encore DANS la fenêtre, et `useDialogue` replaçait le
// curseur sur son premier champ. Les appelants d'alors s'en sortaient parce
// qu'ils avaient tous pensé à `useCallback` ; le premier qui ne l'aurait pas
// fait l'aurait découvert en production. La fermeture vit maintenant dans une
// référence, et l'effet ne dépend plus que de `ouvert`.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

const LA_SOURCE = "components/ui/useDialogue.ts"

function fichiers(ext = /\.tsx$/): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (ext.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

/**
 * `homeSectionsRetirees.tsx` est un grenier : des sections retirées de l'accueil,
 * gardées pour mémoire et importées par personne — `accueilDecoupe.test.ts`
 * vérifie justement qu'aucun écran ne les charge. Du code qui ne s'affiche
 * jamais n'a pas de touche Échap à honorer.
 */
const GRENIER: Record<string, string> = {
  "app/homeSectionsRetirees.tsx": "sections retirées de l'accueil, importées nulle part",
}

/**
 * Un voile : `position` posé + `inset: 0`.
 *
 * Élargi au lot v140 : ce balayage ne lisait que `"fixed"` entre guillemets
 * doubles. La feuille « Plus » de la navigation mobile écrit `'fixed'` en
 * guillemets simples, et le fond d'une feuille du bas est `"absolute"` dans un
 * parent fixe — deux couches que la garde ne voyait pas. Elles portaient déjà
 * le geste (`useDialogue`), donc rien n'était cassé ; c'est le balayage qui
 * était aveugle, et une garde aveugle sur une moitié du produit ne garde rien.
 */
function estUnVoile(l: string): boolean {
  return /position\s*:\s*['"](?:fixed|absolute)['"]/.test(l) && /inset\s*:\s*['"]?0/.test(l)
}

/** …dont le clic ferme quelque chose. C'est le produit qui dit qu'il est refermable. */
const FERME = /on(?:Click|MouseDown)=\{(?:\(\)\s*=>\s*)?(?:on(?:Close|Cancel|Fermer)|fermer\w*|set\w+\((?:false|null)\))/

type Voile = { fichier: string; ligne: number; texte: string }

/** Chaque voile refermable du produit, et le crochet que son composant appelle. */
function voilesRefermables(): { tous: Voile[]; muets: Voile[] } {
  const tous: Voile[] = [], muets: Voile[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    if (rel in GRENIER) continue
    const src = fs.readFileSync(f, "utf8")
    const lignes = src.split("\n")
    // Un crochet de fermeture quelque part dans le fichier : le composant qui
    // porte le voile est celui qui tient l'état, donc le même fichier.
    const tenu = /use(?:FermetureEchap|FermetureModale|Dialogue)\(/.test(src)
    lignes.forEach((l, i) => {
      if (/^\s*(\/\/|\*)/.test(l)) return
      // Le style et le `onClick` tiennent parfois sur deux lignes.
      const paire = l + " " + (lignes[i + 1] ?? "")
      const avant = (lignes[i - 1] ?? "") + " " + l
      if (!estUnVoile(paire) && !estUnVoile(l)) return
      if (!FERME.test(paire) && !FERME.test(avant)) return
      // Un voile écrit sur deux lignes répond deux fois : il ne compte qu'une.
      if (tous.length > 0 && tous[tous.length - 1].fichier === rel && tous[tous.length - 1].ligne === i) return
      const v = { fichier: rel, ligne: i + 1, texte: l.trim().slice(0, 90) }
      tous.push(v)
      if (!tenu) muets.push(v)
    })
  }
  return { tous, muets }
}

/** Les écouteurs d'Échap posés sur `document`/`window` — il ne doit y en avoir qu'un. */
function proprietairesDEchap(): string[] {
  const out: string[] = []
  for (const f of [...fichiers(), ...fichiers(/\.ts$/)]) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    if (rel === LA_SOURCE) continue
    const lignes = fs.readFileSync(f, "utf8").split("\n")
    lignes.forEach((l, i) => {
      if (/^\s*(\/\/|\*)/.test(l)) return
      if (!/"Escape"/.test(l)) return
      // Un `onKeyDown` JSX agit sur l'élément qui a le focus : c'est un autre
      // geste (annuler une saisie, quitter un panneau), pas la fermeture d'une
      // couche. Seul l'écouteur global prétend parler pour tout l'écran.
      const bloc = lignes.slice(Math.max(0, i - 6), i + 3).join("\n")
      if (/addEventListener\(\s*"keydown"/.test(bloc)) out.push(`${rel}:${i + 1}`)
    })
  }
  return out
}

describe("il n'y a qu'un endroit qui dit ce qu'Échap fait", () => {
  it("le crochet de base ne fait que ça, et le dit", () => {
    const src = lire(LA_SOURCE)
    expect(src).toContain("export function useFermetureEchap(ouvert: boolean, fermer: () => void)")
    expect(src, "la touche").toContain('if (e.key !== "Escape") return')
    expect(src, "en capture, avant ce qu'elle aurait fait dessous").toContain('document.addEventListener("keydown", surTouche, true)')
    expect(src, "un menu n'est pas une fenêtre").not.toMatch(/useFermetureEchap[\s\S]{0,400}aria-modal/)
  })

  it("les deux autres l'appellent au lieu de le recopier", () => {
    const modale = lire("lib/useFermetureModale.ts")
    expect(modale).toContain('import { useFermetureEchap } from "@/components/ui/useDialogue"')
    expect(modale).toContain("useFermetureEchap(ouvert, onFermer)")
    expect(modale, "plus de second écouteur").not.toMatch(/addEventListener\(\s*"keydown"/)
    expect(modale, "il ne garde que ce qu'il ajoute").toContain('document.body.style.overflow = "hidden"')
    expect(lire(LA_SOURCE)).toContain("useFermetureEchap(ouvert, fermer)")
  })

  it("et plus personne d'autre ne pose son écouteur d'Échap", () => {
    expect(proprietairesDEchap(),
      "passer par useFermetureEchap / useFermetureModale / useDialogue").toEqual([])
  })

  it("une fermeture écrite en ligne ne réinstalle pas la couche", () => {
    // Le piège : l'effet dépendait de `fermer`, qui change d'identité à chaque
    // rendu quand l'appelant écrit `() => setX(false)`. Le focus repartait alors
    // au bouton d'origine pendant qu'on était encore dans la fenêtre.
    const src = lire(LA_SOURCE)
    expect(src).toContain("const fermerRef = useRef(fermer)")
    expect(src).toContain("fermerRef.current()")
    expect(src.match(/\}, \[ouvert\]\)/g) ?? [], "les deux effets du fichier").toHaveLength(2)
    expect(lire("lib/useFermetureModale.ts")).toContain("}, [ouvert])")
  })
})

describe("garde de classe : aucune couche refermable ne reste sourde", () => {
  it("chaque voile qui se ferme au clic se ferme aussi à Échap", () => {
    const { muets } = voilesRefermables()
    expect(muets.map(v => `${v.fichier}:${v.ligne} — ${v.texte}`),
      "au clavier, la seule sortie était de tabuler jusqu'à la croix").toEqual([])
  })

  it("l'atelier d'impression garde SON ordre : le calibrage, puis l'aperçu", () => {
    const src = lire("app/dashboard/print-studio/PrintStudioClient.tsx")
    expect(src, "deux couches empilées composent leur ordre en un seul appel")
      .toContain("useFermetureModale(fsOpen || calib, () => { if (calib) setCalib(false); else setFsOpen(false) })")
  })

  it("un menu prend Échap seul, une fenêtre prend le reste avec", () => {
    // Un menu « ⋯ » doit rester quittable à la tabulation : le piéger serait pire
    // que de ne rien faire.
    expect(lire("app/dashboard/qr-codes/QRStudio.tsx")).toContain("useFermetureEchap(menuId !== null, () => setMenuId(null))")
    expect(lire("app/dashboard/print-studio/PrintStudioClient.tsx")).toContain("useFermetureEchap(moreMenu, () => setMoreMenu(false))")
    // Une couche pleine gèle la page derrière et rend le focus.
    expect(lire("app/dashboard/qr-codes/QRStudio.tsx")).toContain("useFermetureModale(showModal, () => setShowModal(false))")
    expect(lire("app/dashboard/profile/page.tsx")).toContain("useFermetureModale(cropMode && cropSrc !== null,")
  })

  it("les vingt voiles du relevé portent chacun leur fermeture, nommément", () => {
    const attendu: [string, string][] = [
      ["app/dashboard/DashboardClient.tsx", "useFermetureModale(menuPage !== null, () => setMenuPage(null))"],
      ["app/dashboard/assets/page.tsx", "useFermetureModale(menuAsset !== null, () => setMenuAsset(null))"],
      ["app/dashboard/builder/BannerStudio.tsx", "useFermetureModale(true, onClose)"],
      ["app/dashboard/builder/FileUpload.tsx", "useFermetureModale(libOpen, () => setLibOpen(false))"],
      ["app/dashboard/builder/ImageCropModal.tsx", "useFermetureModale(true, onCancel)"],
      ["app/dashboard/builder/ImageUpload.tsx", "useFermetureModale(libOpen, () => setLibOpen(false))"],
      ["app/dashboard/builder/ImageUpload.tsx", "useFermetureModale(pickerOpen, () => setPickerOpen(false))"],
      ["app/dashboard/builder/builderPanels.tsx", "useFermetureModale(helpOpen, () => setHelpOpen(false))"],
      ["app/dashboard/print-studio/PrintStudioClient.tsx", "useFermetureModale(fsOpen || calib,"],
      ["app/dashboard/print-studio/PrintStudioClient.tsx", "useFermetureEchap(moreMenu, () => setMoreMenu(false))"],
      ["app/dashboard/print-studio/PrintStudioClient.tsx", "useFermetureEchap(open, () => setOpen(false))"],
      ["app/dashboard/profile/page.tsx", "useFermetureModale(cropMode && cropSrc !== null,"],
      ["app/dashboard/profile/page.tsx", "useFermetureModale(confirmRegen !== null || confirmRevoke !== null,"],
      ["app/dashboard/qr-codes/QRStudio.tsx", "useFermetureModale(modeSheet, () => setModeSheet(false))"],
      ["app/dashboard/qr-codes/QRStudio.tsx", "useFermetureModale(showModal, () => setShowModal(false))"],
      ["app/dashboard/qr-codes/QRStudio.tsx", "useFermetureModale(upsell !== null, () => setUpsell(null))"],
      ["app/dashboard/qr-codes/QRStudio.tsx", "useFermetureEchap(menuId !== null, () => setMenuId(null))"],
      ["app/dashboard/qr-codes/QRStudioZero.tsx", "useFermetureModale(dlOpen, () => setDlOpen(false))"],
      ["app/dashboard/qr-codes/QRStudioZero.tsx", "useFermetureModale(allPresets, () => setAllPresets(false))"],
      ["app/dashboard/qr-codes/QRStudioZero.tsx", "useFermetureModale(fsPreview, () => setFsPreview(false))"],
    ]
    expect(attendu, "le relevé en comptait vingt").toHaveLength(20)
    const manquants = attendu.filter(([f, appel]) => !lire(f).includes(appel)).map(([f, a]) => `${f} — ${a}`)
    expect(manquants, "un écran qui perd sa fermeture redevient une impasse au clavier").toEqual([])
  })

  it("le grenier est nommé, et il est vraiment vide de tout usage", () => {
    expect(Object.keys(GRENIER)).toEqual(["app/homeSectionsRetirees.tsx"])
    const importe = fichiers().filter(f => /homeSectionsRetirees/.test(fs.readFileSync(f, "utf8").match(/^\s*import[^\n]*$/gm)?.join("\n") ?? ""))
    expect(importe, "s'il redevenait vivant, il rejoindrait la classe").toEqual([])
  })

  it("le balayage voit bien les voiles — sinon il ne prouve rien", () => {
    const { tous } = voilesRefermables()
    expect(tous.length, "des couches refermables dans le produit").toBeGreaterThan(15)
    expect(new Set(tous.map(v => v.fichier)).size, "réparties sur beaucoup d'écrans").toBeGreaterThan(9)

    // Le détecteur sait dire oui — sinon il ne dirait jamais non.
    const nu = '<div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />'
    expect(estUnVoile(nu) && FERME.test(nu)).toBe(true)
    // …et non à un voile qui ne se ferme pas : l'attente d'une création de page.
    const bloquant = '<div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(8,8,8,0.72)" }}>'
    expect(estUnVoile(bloquant)).toBe(true)
    expect(FERME.test(bloquant), "rien ne le referme : c'est un écran d'attente").toBe(false)
    // …et le détecteur d'écouteurs sait reconnaître un écouteur global.
    const ecouteur = 'const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFsOpen(false) }\n    window.addEventListener("keydown", onKey)'
    expect(/"Escape"/.test(ecouteur) && /addEventListener\(\s*"keydown"/.test(ecouteur)).toBe(true)
  })
})
