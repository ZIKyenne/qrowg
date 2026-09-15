// Une fenêtre qui s'annonce modale doit l'être — garde de classe.
//
// Relevé du 15 septembre. `useDialogue` existe et fait tout ce qui fait une
// fenêtre : rôle annoncé, Échap qui ferme, tabulation qui tourne en rond dedans,
// focus posé à l'ouverture et rendu au bouton qui l'a ouverte, page derrière qui
// ne défile plus. Son propre commentaire raconte que quatre fenêtres écrites à
// la main l'ont adopté.
//
// L'adoption s'est arrêtée là. **Douze autres fenêtres écrivaient leur
// `role="dialog"` elles-mêmes** — et aucune ne retenait la tabulation, aucune ne
// rendait le focus ; quatre ne se fermaient même pas sur Échap.
//
//   components/EnTeteSite.tsx            menu mobile            ni Échap ni aria-modal
//   components/MobileNav.tsx             « Toutes les sections » ni Échap
//   app/homeSections/Features.tsx        détail d'une promesse   ni Échap
//   app/dashboard/builder/PublishedScreen.tsx  premier publié    ni Échap
//   … et huit autres avec Échap seul.
//
// Le pire est sur la page publiée. La visionneuse de photos annonce
// `aria-modal="true"` : un lecteur d'écran cache alors tout le reste de la page.
// Mais la tabulation en sortait — droit dans un contenu qu'on venait d'annoncer
// comme absent — et le focus ne revenait jamais à la photo. **Annoncer une
// fenêtre sans en être une est pire que ne rien annoncer.**
//
// Et la tuile qui l'ouvre était un `<div onClick>` : personne, au clavier, ne
// pouvait ouvrir cette fenêtre.
//
// Enfin `components/Dialogue.tsx` — le composant écrit pour remplacer
// `prompt/confirm/alert` — **réécrivait le même geste une deuxième fois** : son
// propre sélecteur de focusables, son propre écouteur de touches, son propre gel
// du défilement. Deux endroits pour décider ce que « être une fenêtre » veut
// dire, donc deux endroits pour diverger. Ses deux raffinements (entrer sur le
// premier champ de saisie, ignorer les éléments masqués) sont remontés dans le
// crochet ; il délègue.
//
// La classe : **une fenêtre qui s'annonce modale doit l'être, et il n'y a qu'une
// façon de l'être.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const SRC = path.join(__dirname, "../..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

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

/** Le seul endroit du produit qui a le droit d'écrire ce que « fenêtre » veut dire. */
const LA_SOURCE = "components/ui/useDialogue.ts"

/** Les lignes de code, commentaires écartés — un commentaire qui cite la règle n'est pas une infraction. */
const code = (src: string) => src.split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n")

describe("il n'y a qu'une façon d'être une fenêtre", () => {
  it("un seul fichier écrit le rôle, l'échappement, la boucle et le focus rendu", () => {
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f).split(path.sep).join("/")
      if (rel === LA_SOURCE) continue
      const src = code(fs.readFileSync(f, "utf8"))
      if (/role="dialog"|role={"dialog"}/.test(src)) fautes.push(`${rel} : écrit son propre role="dialog"`)
      if (/aria-modal/.test(src)) fautes.push(`${rel} : écrit son propre aria-modal`)
    }
    expect(fautes, "passer par useDialogue(ouvert, fermer, { label })").toEqual([])
  })

  it("et le crochet fait vraiment les cinq choses qu'il promet", () => {
    const src = lire(LA_SOURCE)
    expect(src, "le rôle").toContain('role: "dialog"')
    expect(src, "Échap ferme").toContain('if (e.key === "Escape")')
    expect(src, "la tabulation tourne en rond").toContain('if (e.key !== "Tab") return')
    expect(src, "le focus revient d'où il vient").toContain("focusPrecedent.current?.focus?.()")
    expect(src, "la page derrière ne défile plus").toContain('document.body.style.overflow = "hidden"')
  })

  it("il entre sur le premier champ, et ignore ce qui est masqué", () => {
    // Les deux raffinements que `Dialogue` avait pour lui seul. Un élément masqué
    // reste dans le DOM et répond au sélecteur : le focuser envoie le curseur
    // nulle part, et la boucle se referme sur du vide.
    const src = lire(LA_SOURCE)
    expect(src).toContain("el.offsetParent !== null")
    expect(src).toMatch(/querySelector<HTMLElement>\(CHAMP\)/)
    expect(src).toContain("input:not([type=hidden]),textarea,select")
  })

  it("Dialogue délègue au lieu de réécrire — une seule définition, pas deux", () => {
    const src = lire("components/Dialogue.tsx")
    expect(src).toContain('import { useDialogue } from "./ui/useDialogue"')
    const c = code(src)
    expect(c, "plus de second sélecteur de focusables").not.toMatch(/tabindex\]:not/)
    expect(c, "plus de second écouteur de touches").not.toMatch(/addEventListener\("keydown"/)
    expect(c, "plus de second gel du défilement").not.toMatch(/body\.style\.overflow = "hidden"/)
  })
})

describe("garde de classe : la fenêtre de la page publiée", () => {
  it("la visionneuse de photos est une vraie fenêtre, des deux côtés du rendu", () => {
    for (const f of [
      "app/[slug]/blocsPublics.tsx",
      "app/dashboard/builder/shared-renderer/blocks/gallery/index.tsx",
    ]) {
      const src = lire(f)
      expect(src, `${f} : la visionneuse passe par le crochet`).toContain("useDialogue(")
      // Échap appartient au crochet : le laisser aussi dans l'écouteur local
      // ferait deux propriétaires pour la même touche.
      expect(code(src), `${f} : Échap est géré deux fois`).not.toContain('e.key === "Escape"')
    }
  })

  it("et la tuile qui l'ouvre s'atteint au clavier", () => {
    // Un `<div onClick>` : la fenêtre existait, s'annonçait modale — et personne
    // au clavier ne pouvait l'ouvrir.
    const galerie = lire("app/dashboard/builder/shared-renderer/blocks/gallery/index.tsx")
    expect(galerie).toContain('<button type="button" onClick={ouvrir}')
    expect(galerie, "et elle dit ce qu'elle ouvre").toContain("Agrandir : ")
    expect(galerie, "dans le canvas, une photo se sélectionne — elle ne s'agrandit pas")
      .toContain("if (!agrandissable) return <div style={style}>{children}</div>")
    const legacy = lire("app/[slug]/blocsPublics.tsx")
    expect(legacy).toContain("Agrandir : ")
  })

  it("le balayage voit bien les fenêtres — sinon il ne prouve rien", () => {
    let adoptantes = 0
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f).split(path.sep).join("/")
      if (rel === LA_SOURCE) continue
      if (/useDialogue\(/.test(fs.readFileSync(f, "utf8"))) adoptantes++
    }
    expect(adoptantes, "des fenêtres dans le produit, et toutes par le même chemin").toBeGreaterThan(10)
    expect(lire(LA_SOURCE).length, "et une source qui dit vraiment quelque chose").toBeGreaterThan(1500)
  })
})
