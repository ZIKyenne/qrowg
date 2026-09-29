import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { PAGE_TEMPLATES } from "../builder/page-templates"
import { MiniApercu, blocsDeLaMiniature } from "./MiniApercu"

// ═══════════════════════════════════════════════════════════════════════════════
// L'APERÇU S'OUVRAIT EN BAS, LE FOCUS SUR UN LIEN INSTAGRAM.
//
// Constat d'un visiteur, le 29 septembre, sur « Bistrot français » puis sur
// « Freelance / Consultant » : ouvrir l'aperçu ne montrait pas le haut du modèle
// — la page simulée était déjà défilée jusqu'en bas, et le curseur clavier posé
// sur un lien « Instagram ».
//
// Deux causes, une seule histoire. `useDialogue` pose le focus, à l'ouverture,
// sur « le premier élément atteignable » de la fenêtre. Or la fenêtre CONTIENT
// une page complète : ses liens d'exemple (`https://instagram.com`) et ses
// boutons de bloc sont, pour le navigateur, des contrôles comme les autres. Le
// focus allait donc dans la maquette, et le navigateur faisait défiler le
// conteneur pour révéler l'élément focusé. Ensuite, ce conteneur étant réemployé
// d'un modèle à l'autre (même élément, contenu remplacé), il gardait la position
// du précédent.
//
// La règle tenue ici : **une maquette n'est pas un contrôle.** La page simulée
// est `inert` — hors du parcours au clavier et de l'arbre d'accessibilité — la
// fenêtre désigne où entrer (`data-focus-initial`), le focus ne fait défiler
// rien, et le défilement repart de zéro à chaque modèle.
//
// Et la même règle vaut pour la GALERIE : la miniature d'une carte est elle aussi
// une page dessinée en petit. Elle est inerte, et posée DERRIÈRE le bouton
// « Aperçu » plutôt que dedans — un bouton dans un bouton est interdit.
// ═══════════════════════════════════════════════════════════════════════════════

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const crochet = readFileSync(join(__dirname, "../../../components/ui/useDialogue.ts"), "utf8")
const modal = lire("TemplatePreviewModal.tsx")
const galerie = lire("page.tsx")
const mini = lire("MiniApercu.tsx")

describe("le crochet de fenêtre ne pose plus le focus dans une maquette", () => {
  it("les éléments d'un sous-arbre inerte ne comptent pas comme focusables", () => {
    expect(crochet).toContain('.filter(el => !el.closest("[inert]"))')
  })
  it("la fenêtre peut désigner où entrer", () => {
    expect(crochet).toContain('const FOCUS_INITIAL = "[data-focus-initial]"')
    expect(crochet).toContain("querySelector<HTMLElement>(FOCUS_INITIAL)")
  })
  it("le focus d'ouverture ne fait défiler personne", () => {
    expect(crochet).toContain("cible?.focus({ preventScroll: true })")
  })
  it("le focus revient toujours au bouton qui a ouvert (Échap compris)", () => {
    // Échap appelle `fermer`, l'appelant démonte la fenêtre, le nettoyage rend
    // le focus : un seul chemin de sortie, donc un seul comportement.
    expect(crochet).toContain("if (precedent && precedent.isConnected) precedent.focus()")
    expect(crochet).toContain('if (e.key !== "Escape") return')
  })

  it("le « focus précédent » est suivi au niveau du document, pas dans un cycle de rendu", () => {
    // Deux façons de se tromper, mesurées au navigateur :
    //  • dans l'EFFET, c'est trop tard — `autoFocus` s'applique avant, et la
    //    fenêtre gardait son propre champ comme « focus précédent » ;
    //  • pendant le RENDU, c'est trop fragile — un rendu concurrent peut être
    //    abandonné : cinq relèvements pour une ouverture, dont quatre sur <body>.
    expect(crochet).toContain("let dernierDeclencheur: HTMLElement | null = null")
    expect(crochet).toContain('document.addEventListener("focusin"')
    expect(crochet, "un focus posé DANS une fenêtre n'est pas un déclencheur")
      .toContain(`if (el.closest('[role="dialog"]')) return`)
    expect(crochet).toContain("focusPrecedent.current = dernierDeclencheur")
    expect(crochet, "le relèvement par `document.activeElement` est revenu")
      .not.toContain("focusPrecedent.current = document.activeElement")
  })
  it("la tabulation tourne toujours en rond dans la fenêtre", () => {
    expect(crochet).toContain("if (e.shiftKey && document.activeElement === premier)")
    expect(crochet).toContain("dernier.focus()")
  })
})

describe("l'aperçu d'un modèle s'ouvre en haut", () => {
  it("le CONTENU de la maquette est inerte — pas la coque, qui doit rester défilable", () => {
    // Posée sur la coque, l'inertie emportait le cadre de défilement qui vit
    // dedans : mesuré au navigateur sur le build de production, la page simulée
    // ne bougeait plus, ni au doigt ni à la molette (1332 px de page pour 590 px
    // de hublot). L'inertie descend donc d'un cran.
    expect(modal).toContain('import { inerte } from "@/lib/inerte"')
    expect(modal).toContain('<div {...inerte} style={{ minHeight: "100%" }}>')
    expect(modal, "l'inertie ne doit plus porter sur la colonne du téléphone")
      .not.toContain('<div aria-hidden="true" {...inerte} style={{ flex: "0 0 auto"')
    // Le cadre de défilement est AU-DESSUS du contenu inerte dans le fichier.
    const cadre = modal.indexOf('className="preview-scroll"')
    const contenuInerte = modal.indexOf('<div {...inerte} style={{ minHeight: "100%" }}>')
    expect(cadre).toBeGreaterThan(0)
    expect(contenuInerte, "le contenu inerte doit être DANS le cadre de défilement").toBeGreaterThan(cadre)
  })

  it("le cadre de défilement est une région nommée, atteignable au clavier", () => {
    expect(modal).toContain("tabIndex={0} role=\"group\" aria-label={`Aperçu de la page du modèle")
  })

  it("les ornements de la coque ne parlent pas aux lecteurs d'écran", () => {
    for (const bloc of ["{/* Notch */}", "{/* Boutons latéraux (déco) */}", "{/* Status bar */}", "{/* Home indicator */}"]) {
      const i = modal.indexOf(bloc)
      expect(i, bloc).toBeGreaterThan(0)
      expect(modal.slice(i, i + 200), `${bloc} sans aria-hidden`).toContain('aria-hidden="true"')
    }
  })
  it("la fenêtre désigne son cadre comme point d'entrée du focus", () => {
    expect(modal).toContain('data-focus-initial=""')
  })
  it("le défilement de la page simulée repart de zéro à chaque modèle", () => {
    const i = modal.indexOf("const el = scrollRef.current")
    expect(i).toBeGreaterThan(0)
    const bloc = modal.slice(i, i + 160)
    expect(bloc).toContain("el.scrollTop = 0")
    expect(bloc, "sans l'identifiant du modèle en dépendance, la position du précédent resterait").toContain("[template?.id]")
  })
  it("l'aperçu reste ouvrable et fermable : Échap, la croix, « Fermer »", () => {
    expect(modal).toContain("useDialogue(true, onClose")
    expect(modal).toContain("aria-label=\"Fermer l'aperçu\"")
  })
})

describe("la miniature d'une carte est une maquette, pas un contrôle", () => {
  it("elle est inerte et masquée aux lecteurs d'écran", () => {
    expect(mini).toContain('aria-hidden="true" {...inerte}')
    expect(mini).toContain('pointerEvents: "none"')
  })
  it("elle est posée DERRIÈRE le bouton « Aperçu », jamais dedans", () => {
    const carte = galerie.slice(galerie.indexOf('className="tpl-card"'), galerie.indexOf("</article>"))
    const iMini = carte.indexOf("<MiniApercu")
    const iBouton = carte.indexOf('className="tpl-vignette"')
    expect(iMini).toBeGreaterThan(0)
    expect(iBouton).toBeGreaterThan(iMini)
    // Entre l'ouverture du bouton et sa fermeture : aucun lien, aucun bouton.
    const corps = carte.slice(iBouton, carte.indexOf("</button>", iBouton))
    expect(corps).not.toContain("<MiniApercu")
    expect(corps).not.toContain("<button")
    expect(corps).not.toContain("<a ")
  })
})

describe("la miniature montre le VRAI rendu du modèle", () => {
  // Ce que ce fichier peut prouver, et ce qu'il ne peut pas.
  //
  // La miniature ne dessine RIEN au rendu serveur : elle rend de vrais blocs, et
  // certains écrivent un texte qui dépend de l'instant — mesuré sur le build de
  // production, la carte « Soirée / Événement » faisait lever une erreur React
  // #418 sur /creer, page publique, parce que son compte à rebours n'avait pas la
  // même valeur des deux côtés. Les blocs du rendu partagé passent en outre par
  // `next/dynamic`, qui ne résout rien hors de Next.
  //
  // Se vérifient donc ici : le CADRE et le CHOIX des blocs. Que le contenu
  // s'affiche pour de bon est vérifié au navigateur
  // (e2e/galerieDeModeles.spec.ts, qui lit le texte rendu d'une vignette).
  const rendu = (cle: string) => {
    const t = PAGE_TEMPLATES.find(x => x.key === cle)!
    return renderToStaticMarkup(<MiniApercu cle={t.key} theme={t.theme} blocs={t.blocks as any} hauteur={190} immediat />)
  }

  it("elle dessine un écran de téléphone aux couleurs du modèle", () => {
    const t = PAGE_TEMPLATES.find(x => x.key === "resto_bistrot")!
    const html = rendu("resto_bistrot")
    expect(html).toContain('data-mini-apercu="resto_bistrot"')
    expect(html.toLowerCase()).toContain((t.theme.primary || "").toLowerCase().slice(1, 7))
  })

  it("rien n'est dessiné au rendu serveur, même pour les premières cartes", () => {
    const html = rendu("event_soiree")
    expect(html).toContain('data-mini-dessine="0"')
    expect(html, "une page rendue sur le serveur = un risque d'écart à l'hydratation").not.toContain("width:390px")
  })

  it("deux modèles différents n'ont pas le même cadre", () => {
    expect(rendu("resto_bistrot")).not.toBe(rendu("biz_startup"))
  })

  it("elle ne garde que les cinq premiers blocs, et jamais un bloc à iframe ni à horloge", () => {
    const suspects: string[] = []
    for (const t of PAGE_TEMPLATES) {
      const choisis = blocsDeLaMiniature(t.blocks as any)
      if (choisis.length > 5) suspects.push(`${t.key}: ${choisis.length} blocs`)
      for (const b of choisis) {
        if (/embed|iframe|spotify|youtube|calendly|maps|video|deezer|soundcloud|podcast|countdown|visit_counter/i.test(b.type)) {
          suspects.push(`${t.key}: ${b.type}`)
        }
      }
      if (choisis.length === 0) suspects.push(`${t.key}: aucune miniature`)
    }
    expect(suspects).toEqual([])
  })

  it("le choix des blocs garde l'ordre du modèle", () => {
    const blocs = [{ type: "profile" }, { type: "google_maps_embed" }, { type: "countdown" }, { type: "bio" }, { type: "cta_button" }]
    expect(blocsDeLaMiniature(blocs).map(b => b.type)).toEqual(["profile", "bio", "cta_button"])
  })

  it("elle attend le montage, et l'observateur pour les cartes lointaines", () => {
    expect(mini).toContain("useState(false)")
    expect(mini).toContain("if (immediat) { setDessine(true); return }")
    expect(mini).toContain("IntersectionObserver")
    expect(mini).toContain("obs.disconnect()")
    expect(galerie).toContain("immediat={idx < CARTES_DESSINEES_DOFFICE}")
  })

  it("aucun modèle du catalogue ne fait échouer sa miniature", () => {
    const casses: string[] = []
    for (const t of PAGE_TEMPLATES) {
      try {
        renderToStaticMarkup(<MiniApercu cle={t.key} theme={t.theme} blocs={t.blocks as any} hauteur={128} immediat />)
      } catch (e) {
        casses.push(`${t.key}: ${(e as Error).message}`)
      }
    }
    expect(casses).toEqual([])
  })
})
