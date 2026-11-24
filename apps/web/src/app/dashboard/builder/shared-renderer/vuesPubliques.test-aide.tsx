// Aide de TEST (pas un test : le nom ne finit pas par `.test.tsx`).
//
// Depuis la suppression de l'ancien rendu (point 4 de la vague 4, 24 nov.),
// la page publiée n'a plus qu'un chemin : l'adaptateur public partagé de
// chaque bloc. Les gardes qui rendaient un bloc par `RenduLegacy` le rendent
// ici, par sa vraie vue. Le registre public charge ces vues à la demande
// (`next/dynamic`), illisible dans un test synchrone : on les charge
// directement depuis leurs fichiers, comme `cadreVide.test.tsx` le faisait.
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"

const MODULES = import.meta.glob("./blocks/*/{index,Public*}.tsx", { eager: true }) as Record<string, Record<string, unknown>>

/** type de bloc → son adaptateur public. */
export const VUES_PUBLIQUES: Record<string, ComponentType<any>> = (() => {
  const out: Record<string, ComponentType<any>> = {}
  for (const [chemin, mod] of Object.entries(MODULES)) {
    const type = chemin.split("/")[2]
    const vue = Object.entries(mod).find(([nom, v]) => typeof v === "function" && /^Public/.test(nom))?.[1]
    if (vue) out[type] = vue as ComponentType<any>
  }
  return out
})()

export const THEME_DE_TEST: any = { bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F", text: "#F5F0E8", muted: "#A8A190", fontDisplay: "Fraunces, serif", fontBody: "DM Sans, sans-serif" }
export const CTX_PUBLIC_DE_TEST: any = { theme: THEME_DE_TEST, G: THEME_DE_TEST.primary, TEXT: THEME_DE_TEST.text, MUTED: THEME_DE_TEST.muted, FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {}, courrielDuCompte: "a@b.co" }

/** Ce que la page publiée rend pour ce bloc. Un type sans vue partagée lève :
 *  il n'existe plus de repli qui rendrait « rien » en silence. */
export function rendrePublic(type: string, content: Record<string, any>, ctx: any = CTX_PUBLIC_DE_TEST): string {
  const Vue = VUES_PUBLIQUES[type]
  if (!Vue) throw new Error(`${type} : aucune vue publique partagée`)
  return renderToStaticMarkup(createElement(Vue, { content, ctx }))
}
