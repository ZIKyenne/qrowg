// @vitest-environment jsdom
//
// Ce qu'une couche fait quand on la ferme — joué, pas lu.
//
// Ces trois crochets (`useFermetureEchap`, `useFermetureModale`, `useDialogue`)
// étaient gardés par `lib/coucheQuiSeFerme.test.ts` en relisant leur texte :
// « le fichier contient `if (e.key !== "Escape") return` », « il contient
// `}, [ouvert])` deux fois », « il contient `o.isConnected` »… Une garde qui
// cite le code casse quand on le réécrit sans rien changer, et se tait quand on
// change ce qu'il fait sans toucher à la phrase citée.
//
// Ici on monte de vrais composants React dans un DOM, on appuie sur les
// touches, on déplace le focus, et on regarde ce qui se passe. Point 7 de la
// vague 4 (docs/ROADMAP-PERFECTION.md), lot 1.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, useState, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { useFermetureEchap, useDialogue } from "./useDialogue"
import { useFermetureModale } from "@/lib/useFermetureModale"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom ne met rien en page : `offsetParent` y vaut toujours null, et
// `useDialogue` écarte justement les éléments masqués de sa boucle de
// tabulation. On dit « affiché » à tout ce qui est dans le document.
Object.defineProperty(HTMLElement.prototype, "offsetParent", {
  configurable: true,
  get(this: HTMLElement) { return this.isConnected ? this.parentElement : null },
})

let hote: HTMLDivElement
let racine: Root
beforeEach(() => {
  hote = document.createElement("div")
  document.body.appendChild(hote)
  racine = createRoot(hote)
})
afterEach(() => {
  act(() => racine.unmount())
  hote.remove()
  document.body.style.overflow = ""
})

const monter = (n: ReactNode) => act(() => racine.render(n))
const touche = (key: string, opts: KeyboardEventInit = {}, cible: Element = document.activeElement ?? document.body) =>
  act(() => { cible.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...opts })) })
const cliquer = (el: Element | null) => act(() => { (el as HTMLElement).click() })
const par = (id: string) => document.getElementById(id) as HTMLElement
// Le suivi du focus de `useDialogue` écoute `focusin` : jsdom l'émet sur `focus()`.
const focuser = (id: string) => act(() => { par(id).focus() })

// ── Les bancs : une couche de chaque sorte, ouverte par un bouton ─────────────

function Menu({ surSaisie }: { surSaisie?: () => void }) {
  const [ouvert, setOuvert] = useState(false)
  useFermetureEchap(ouvert, () => setOuvert(false))
  return <>
    <button id="ouvrir" onClick={() => setOuvert(true)}>⋯</button>
    {ouvert && <div id="couche"><input id="champ" onKeyDown={surSaisie} /></div>}
  </>
}

function Couche() {
  const [ouvert, setOuvert] = useState(false)
  const [texte, setTexte] = useState("")
  // Écrite en ligne : elle change d'identité à chaque rendu — le cas piège.
  useFermetureModale(ouvert, () => setOuvert(false))
  return <>
    <button id="ouvrir" onClick={() => setOuvert(true)}>Ouvrir</button>
    {ouvert && <div id="couche">
      <input id="champ" value={texte} onChange={e => setTexte(e.target.value)} />
      <button id="fermer" onClick={() => setOuvert(false)}>Fermer</button>
    </div>}
  </>
}

function Fenetre() {
  const [ouvert, setOuvert] = useState(false)
  const { ref, props } = useDialogue(ouvert, () => setOuvert(false), { label: "Renommer" })
  return <>
    <button id="ouvrir" onClick={() => setOuvert(true)}>Renommer</button>
    {ouvert && <div id="couche" ref={ref} {...props}>
      <button id="premier">Aide</button>
      <input id="champ" />
      <button id="dernier" onClick={() => setOuvert(false)}>OK</button>
    </div>}
  </>
}

/** Une couche dont le champ prend le focus tout seul — React l'applique AVANT les effets. */
function CoucheAutoFocus() {
  const [ouvert, setOuvert] = useState(false)
  useFermetureModale(ouvert, () => setOuvert(false))
  return <>
    <button id="ouvrir" onClick={() => setOuvert(true)}>Ouvrir</button>
    {ouvert && <div id="couche"><input id="champ" autoFocus /></div>}
  </>
}

/** Un menu « ⋯ » dont un article ferme le menu et ouvre une fenêtre à sa place. */
function MenuPuisFenetre() {
  const [menu, setMenu] = useState(false)
  const [fenetre, setFenetre] = useState(false)
  useFermetureModale(menu, () => setMenu(false))
  const { ref, props } = useDialogue(fenetre, () => setFenetre(false), { label: "Supprimer ?" })
  return <>
    <button id="ouvrir" onClick={() => setMenu(true)}>⋯</button>
    {menu && <div id="couche"><button id="article" onClick={() => { setMenu(false); setFenetre(true) }}>Supprimer</button></div>}
    {fenetre && <div id="fenetre" ref={ref} {...props}><button id="non" onClick={() => setFenetre(false)}>Non</button></div>}
  </>
}

/** Une couche qui en ouvre une autre PAR-DESSUS elle, et reste ouverte dessous. */
function CoucheEtSaConfirmation() {
  const [couche, setCouche] = useState(false)
  const [confirmer, setConfirmer] = useState(false)
  useFermetureModale(couche, () => setCouche(false))
  const { ref, props } = useDialogue(confirmer, () => setConfirmer(false), { label: "Sûr ?" })
  return <>
    <button id="ouvrir" onClick={() => setCouche(true)}>Réglages</button>
    {couche && <div id="couche"><button id="vider" onClick={() => setConfirmer(true)}>Vider</button></div>}
    {confirmer && <div id="fenetre" ref={ref} {...props}><button id="non" onClick={() => setConfirmer(false)}>Non</button></div>}
  </>
}

/** Même chose, depuis une vraie fenêtre : une confirmation sur « Renommer ». */
function FenetreEtSaConfirmation() {
  const [fenetre, setFenetre] = useState(false)
  const [confirmer, setConfirmer] = useState(false)
  const a = useDialogue(fenetre, () => setFenetre(false), { label: "Page" })
  const b = useDialogue(confirmer, () => setConfirmer(false), { label: "Sûr ?" })
  return <>
    <button id="ouvrir" onClick={() => setFenetre(true)}>Page</button>
    {fenetre && <div id="couche" ref={a.ref} {...a.props}><button id="vider" onClick={() => setConfirmer(true)}>Supprimer</button></div>}
    {confirmer && <div id="fenetre" ref={b.ref} {...b.props}><button id="non" onClick={() => setConfirmer(false)}>Non</button></div>}
  </>
}

// ── useFermetureEchap ──────────────────────────────────────────────────────────

describe("un menu se ferme à Échap, et seulement à Échap", () => {
  it("Échap ferme ; une autre touche ne fait rien", () => {
    monter(<Menu />)
    cliquer(par("ouvrir"))
    expect(par("couche")).not.toBeNull()
    touche("Enter")
    expect(par("couche"), "Entrée n'est pas Échap").not.toBeNull()
    touche("Escape")
    expect(par("couche")).toBeNull()
  })

  it("la touche est prise avant ce qu'elle aurait fait dessous", () => {
    // Échap dans un champ de la couche ne doit PAS aussi annuler la saisie,
    // désélectionner un bloc, etc. : fermer ne fait qu'une chose à la fois.
    const dessous = vi.fn()
    monter(<Menu surSaisie={dessous} />)
    cliquer(par("ouvrir"))
    focuser("champ")
    touche("Escape")
    expect(par("couche")).toBeNull()
    expect(dessous, "la saisie n'a pas vu la touche").not.toHaveBeenCalled()
  })

  it("fermé, il n'écoute plus rien", () => {
    const ailleurs = vi.fn()
    document.addEventListener("keydown", ailleurs)
    try {
      monter(<Menu />)
      touche("Escape", {}, document.body)
      expect(ailleurs, "Échap arrive au reste de l'écran").toHaveBeenCalledTimes(1)
      cliquer(par("ouvrir")); touche("Escape"); touche("Escape", {}, document.body)
      expect(ailleurs, "une fois refermé, le menu ne vole plus la touche").toHaveBeenCalledTimes(2)
    } finally { document.removeEventListener("keydown", ailleurs) }
  })
})

// ── useFermetureModale ─────────────────────────────────────────────────────────

describe("une couche pleine gèle la page et rend le focus", () => {
  it("Échap ferme, la page derrière ne défile plus pendant, et à nouveau après", () => {
    document.body.style.overflow = "auto"
    monter(<Couche />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    expect(document.body.style.overflow).toBe("hidden")
    touche("Escape")
    expect(par("couche")).toBeNull()
    expect(document.body.style.overflow, "le réglage d'avant, pas une valeur inventée").toBe("auto")
  })

  it("le focus revient au bouton qui l'a ouverte", () => {
    monter(<Couche />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    focuser("champ")
    touche("Escape")
    expect(document.activeElement).toBe(par("ouvrir"))
  })

  it("une fermeture écrite en ligne ne renvoie pas le curseur au bouton pendant qu'on tape", () => {
    // Le piège du lot v139 : chaque frappe re-rend l'écran, la fermeture change
    // d'identité, et un effet qui en dépendait se réinstallait — en rendant le
    // focus au bouton d'origine, au milieu de la saisie.
    monter(<Couche />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    focuser("champ")
    const champ = par("champ") as HTMLInputElement
    for (const lettre of "Bonjour") {
      act(() => {
        const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
        s.call(champ, champ.value + lettre)
        champ.dispatchEvent(new Event("input", { bubbles: true }))
      })
      expect(document.activeElement, `après « ${lettre} »`).toBe(champ)
    }
    expect(champ.value).toBe("Bonjour")
    expect(document.body.style.overflow, "toujours gelée").toBe("hidden")
  })

  it("un champ `autoFocus` dans la couche n'est pas pris pour l'origine", () => {
    // Mesuré le 29 septembre : relevé dans l'effet, le « focus précédent » était
    // déjà le champ de la couche, détruit à la fermeture — le focus tombait sur
    // <body>, tout en haut de la page.
    monter(<CoucheAutoFocus />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    expect(document.activeElement, "le champ a bien pris le focus").toBe(par("champ"))
    touche("Escape")
    expect(document.activeElement).toBe(par("ouvrir"))
  })

  it("un menu qui cède la place à une fenêtre : la fenêtre rend le focus au bouton « ⋯ »", () => {
    // L'article du menu part avec lui. Si le suivi du focus le retenait comme
    // déclencheur, la fenêtre n'aurait rien à qui rendre le focus en se fermant.
    monter(<MenuPuisFenetre />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    focuser("article"); cliquer(par("article"))
    expect(par("couche")).toBeNull()
    expect(document.activeElement, "la fenêtre a pris la main").toBe(par("non"))
    touche("Escape")
    expect(par("fenetre")).toBeNull()
    expect(document.activeElement).toBe(par("ouvrir"))
  })

  it("une confirmation posée sur une couche rend le focus DANS la couche, pas derrière", () => {
    monter(<CoucheEtSaConfirmation />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    focuser("vider"); cliquer(par("vider"))
    expect(document.activeElement).toBe(par("non"))
    cliquer(par("non"))
    expect(par("couche"), "la couche du dessous est toujours là").not.toBeNull()
    expect(document.activeElement, "le bouton qui a ouvert la confirmation, pas celui caché sous la couche").toBe(par("vider"))
  })

  it("si le bouton d'origine a disparu, le focus n'est pas « rendu » au vide", () => {
    // Un déclencheur hors de React (une barre qui se redessine, un écran qui
    // change) : le retenu est lui, et il disparaît avant la fermeture.
    const parti = document.createElement("button")
    document.body.appendChild(parti)
    monter(<Couche />)
    act(() => parti.focus())
    cliquer(par("ouvrir"))
    focuser("champ")
    parti.remove()
    const focus = vi.spyOn(parti, "focus")
    touche("Escape")
    expect(focus, "un élément détaché ne reçoit pas le focus").not.toHaveBeenCalled()
  })
})

// ── useDialogue ────────────────────────────────────────────────────────────────

describe("une fenêtre annonce son rôle, garde la tabulation, et rend le focus", () => {
  it("elle s'annonce, et entre sur son premier champ de saisie", () => {
    monter(<Fenetre />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    const f = par("couche")
    expect(f.getAttribute("role")).toBe("dialog")
    expect(f.getAttribute("aria-modal")).toBe("true")
    expect(f.getAttribute("aria-label")).toBe("Renommer")
    expect(document.activeElement, "le champ, pas le premier bouton").toBe(par("champ"))
    expect(document.body.style.overflow, "la page derrière ne défile plus").toBe("hidden")
  })

  it("une confirmation ouverte depuis une fenêtre rend le focus dans la fenêtre", () => {
    // Avant v387, le suivi ignorait ce qui se passait DANS une fenêtre : la
    // confirmation rendait le focus au bouton de la page, sous la fenêtre.
    monter(<FenetreEtSaConfirmation />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    focuser("vider"); cliquer(par("vider"))
    cliquer(par("non"))
    expect(document.activeElement).toBe(par("vider"))
  })

  it("Tab tourne en rond dedans, dans les deux sens", () => {
    monter(<Fenetre />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    focuser("dernier")
    touche("Tab")
    expect(document.activeElement, "après le dernier, le premier").toBe(par("premier"))
    touche("Tab", { shiftKey: true })
    expect(document.activeElement, "avant le premier, le dernier").toBe(par("dernier"))
  })

  it("Échap ferme et rend le focus au bouton — même si l'on a bougé dedans", () => {
    monter(<Fenetre />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    focuser("premier"); focuser("dernier")
    touche("Escape")
    expect(par("couche")).toBeNull()
    expect(document.activeElement, "le focus bougé DANS la fenêtre n'est pas pris pour l'origine").toBe(par("ouvrir"))
    expect(document.body.style.overflow).toBe("")
  })

  it("une couche sans `role=\"dialog\"` ne prend pas ses propres boutons pour l'origine", () => {
    // Le suivi du focus est en pause tant qu'une couche est ouverte : une couche
    // qui ne s'annonce pas `role="dialog"` rend elle aussi le focus au bon bouton.
    monter(<Couche />)
    focuser("ouvrir"); cliquer(par("ouvrir"))
    focuser("fermer"); focuser("champ")
    cliquer(par("fermer"))
    expect(document.activeElement, "pas « Fermer », touché pendant que la couche était ouverte").toBe(par("ouvrir"))
  })
})
