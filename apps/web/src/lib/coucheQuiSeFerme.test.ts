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

/**
 * La première ligne du composant qui contient la ligne `i` : la dernière
 * déclaration d'un composant (un nom qui commence par une majuscule) au-dessus.
 * Un voile est rendu par le composant qui tient l'état de son ouverture ; c'est
 * là que doit être sa fermeture.
 */
const COMPOSANT = /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+[A-Z]\w*\s*[(<]|^\s*(?:export\s+)?const\s+[A-Z]\w*\s*(?::[^=]+)?=\s*(?:memo\(|forwardRef|\(|function|async|\w+\s*=>)/
function debutDuComposant(lignes: string[], i: number): number {
  for (let k = i; k >= 0; k--) if (COMPOSANT.test(lignes[k])) return k
  return 0
}

/** Chaque voile refermable du produit, et le crochet que son composant appelle. */
function voilesRefermables(): { tous: Voile[]; muets: Voile[] } {
  const tous: Voile[] = [], muets: Voile[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    if (rel in GRENIER) continue
    const r = voilesDuSource(rel, fs.readFileSync(f, "utf8"))
    tous.push(...r.tous); muets.push(...r.muets)
  }
  return { tous, muets }
}

/**
 * Les voiles d'un fichier, et ceux qui restent sourds.
 *
 * **Compté par composant (v387).** On demandait un crochet « quelque part dans
 * le fichier ». Le panneau « QR Code » de l'éditeur passait ainsi parce que
 * BuilderV4 ferme d'AUTRES couches à Échap ; il n'a montré qu'il en était sourd
 * qu'une fois sorti dans son propre fichier (v386). Chaque composant doit
 * désormais appeler au moins autant de crochets qu'il pose de voiles
 * refermables. Deux couches réellement empilées qui composent leur ordre en un
 * seul appel (l'aperçu et son calibrage, dans l'atelier) s'en tiennent quittes,
 * le même composant ayant un autre appel pour son menu.
 */
function voilesDuSource(rel: string, src: string): { tous: Voile[]; muets: Voile[] } {
  const tous: Voile[] = []
  const lignes = src.split("\n")
  const parComposant = new Map<number, { voiles: Voile[]; crochets: number }>()
  const du = (i: number) => {
    const k = debutDuComposant(lignes, i)
    if (!parComposant.has(k)) parComposant.set(k, { voiles: [], crochets: 0 })
    return parComposant.get(k)!
  }
  lignes.forEach((l, i) => {
    if (/^\s*(\/\/|\*)/.test(l)) return
    const n = (l.match(/use(?:FermetureEchap|FermetureModale|Dialogue)\(/g) ?? []).length
    if (n) du(i).crochets += n
    // Le style et le `onClick` tiennent parfois sur deux lignes.
    const paire = l + " " + (lignes[i + 1] ?? "")
    const avant = (lignes[i - 1] ?? "") + " " + l
    if (!estUnVoile(paire) && !estUnVoile(l)) return
    if (!FERME.test(paire) && !FERME.test(avant)) return
    // Un voile écrit sur deux lignes répond deux fois : il ne compte qu'une.
    if (tous.length > 0 && tous[tous.length - 1].ligne === i) return
    const v = { fichier: rel, ligne: i + 1, texte: l.trim().slice(0, 90) }
    tous.push(v)
    du(i).voiles.push(v)
  })
  const muets = [...parComposant.values()].filter(c => c.voiles.length > c.crochets).flatMap(c => c.voiles)
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

// Ce que font les trois crochets — Échap, gel de la page, focus rendu, boucle de
// tabulation, fermeture écrite en ligne — n'est plus lu ici mais JOUÉ, dans de
// vrais composants : `components/ui/fermetureDesCouches.test.tsx` (v387). Ces
// assertions citaient leur texte (« contient `}, [ouvert])` deux fois ») : elles
// cassaient à chaque réécriture, et se seraient tues devant un vrai défaut — le
// jeu en a trouvé deux qu'elles laissaient passer.
// Reste ici ce qu'aucun rendu ne peut dire : qui, dans tout le produit, pose
// une couche et l'oublie, et qui pose son propre écouteur d'Échap.

describe("il n'y a qu'un endroit qui dit ce qu'Échap fait", () => {
  it("et plus personne d'autre ne pose son écouteur d'Échap", () => {
    expect(proprietairesDEchap(),
      "passer par useFermetureEchap / useFermetureModale / useDialogue").toEqual([])
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
    expect(lire("app/dashboard/qr-codes/QRStudioZero.tsx")).toContain("useFermetureEchap(menuId !== null, () => setMenuId(null))")
    expect(lire("app/dashboard/print-studio/PrintStudioClient.tsx")).toContain("useFermetureEchap(moreMenu, () => setMoreMenu(false))")
    // Une couche pleine gèle la page derrière et rend le focus.
    expect(lire("app/dashboard/qr-codes/QRStudioZero.tsx")).toContain("useFermetureModale(dlOpen, () => setDlOpen(false))")
    expect(lire("app/dashboard/profile/page.tsx")).toContain("useFermetureModale(cropMode && cropSrc !== null,")
  })

  it("les vingt voiles du relevé portent chacun leur fermeture, nommément", () => {
    const attendu: [string, string][] = [
      // Lot 2 « appli » (18 nov.) : ces deux menus « ⋯ » sont devenus LA feuille
      // d'actions (components/mobile/ActionSheet), qui porte Échap, le piège de
      // focus, le bouton retour et le glisser. La fermeture est nommée là.
      ["app/dashboard/DashboardClient.tsx", "<ActionSheet open={menuPage !== null} titre={menuPage?.title ?? \"\"} onFermer={() => setMenuPage(null)}"],
      ["app/dashboard/assets/page.tsx", "<ActionSheet open={menuAsset !== null} titre={menuAsset ? pretty(menuAsset.name) : \"\"} onFermer={() => setMenuAsset(null)}"],
      ["app/dashboard/builder/BannerStudio.tsx", "useFermetureModale(true, onClose)"],
      ["app/dashboard/builder/FileUpload.tsx", "useFermetureModale(libOpen, () => setLibOpen(false))"],
      ["app/dashboard/builder/ImageCropModal.tsx", "useFermetureModale(true, onCancel)"],
      ["app/dashboard/builder/ImageUpload.tsx", "useFermetureModale(libOpen, () => setLibOpen(false))"],
      // Lot 6 « appli » : le choix de la source d'image est devenu la feuille d'actions.
      ["app/dashboard/builder/ImageUpload.tsx", "<ActionSheet open={pickerOpen} titre=\"Ajouter une image\" onFermer={() => setPickerOpen(false)}"],
      ["app/dashboard/builder/builderPanels.tsx", "useFermetureModale(helpOpen, () => setHelpOpen(false))"],
      ["app/dashboard/print-studio/PrintStudioClient.tsx", "useFermetureModale(fsOpen || calib,"],
      ["app/dashboard/print-studio/PrintStudioClient.tsx", "useFermetureEchap(moreMenu, () => setMoreMenu(false))"],
      // Le sélecteur de filtre est parti avec les champs de l'atelier (v382).
      ["app/dashboard/print-studio/champsDuStudio.tsx", "useFermetureEchap(open, () => setOpen(false))"],
      ["app/dashboard/profile/page.tsx", "useFermetureModale(cropMode && cropSrc !== null,"],
      ["app/dashboard/profile/page.tsx", "useFermetureModale(confirmRegen !== null || confirmRevoke !== null,"],
      // Les quatre de l'ancien QRStudio.tsx sont partis avec lui (18 nov.) ; son
      // menu « ⋯ » vit dans le Studio compact, avec la même fermeture.
      ["app/dashboard/qr-codes/QRStudioZero.tsx", "useFermetureEchap(menuId !== null, () => setMenuId(null))"],
      ["app/dashboard/qr-codes/QRStudioZero.tsx", "useFermetureModale(dlOpen, () => setDlOpen(false))"],
      ["app/dashboard/qr-codes/QRStudioZero.tsx", "useFermetureModale(allPresets, () => setAllPresets(false))"],
      ["app/dashboard/qr-codes/QRStudioZero.tsx", "useFermetureModale(fsPreview, () => setFsPreview(false))"],
    ]
    expect(attendu, "le relevé en comptait vingt ; l'ancien studio en emportait quatre, le compact en reprend un").toHaveLength(17)
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
    // …et le compte par composant voit le cas du panneau QR (v386) : deux voiles,
    // une seule fermeture, dans le même composant.
    const unPourDeux = [
      "export default function Editeur() {",
      "  useFermetureEchap(menu, () => setMenu(false))",
      "  return <>",
      `    {menu && ${nu}}`,
      `    {qr && ${nu.replace("setOpen", "setQr")}}`,
      "  </>",
      "}",
    ].join("\n")
    expect(voilesDuSource("x.tsx", unPourDeux).muets, "le second voile n'a personne pour lui").toHaveLength(2)
    // Deux composants dans un fichier : la fermeture de l'un ne couvre pas l'autre.
    const voisins = [
      "function Menu() {", "  useFermetureEchap(menu, () => setMenu(false))", `  return ${nu}`, "}",
      "export function Panneau() {", `  return ${nu}`, "}",
    ].join("\n")
    expect(voilesDuSource("x.tsx", voisins).muets, "le Panneau, seul").toHaveLength(1)
    expect(voilesDuSource("x.tsx", voisins.replace("export function Panneau() {", "export function Panneau() {\n  useFermetureEchap(o, f)")).muets).toEqual([])
    // …et le détecteur d'écouteurs sait reconnaître un écouteur global.
    const ecouteur = 'const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFsOpen(false) }\n    window.addEventListener("keydown", onKey)'
    expect(/"Escape"/.test(ecouteur) && /addEventListener\(\s*"keydown"/.test(ecouteur)).toBe(true)
  })
})
