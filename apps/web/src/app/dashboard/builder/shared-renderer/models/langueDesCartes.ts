// langueDesCartes.ts — la partie LÉGÈRE de la traduction des cartes (vague 2).
//
// Ce module part dans le premier chargement de la page publique (la barre de
// langues, PublicPageClient) : il ne doit tirer AUCUN modèle de carte. Relevé du
// 24 nov. : en important traductionDesCartes (qui lit menus, grande carte, carte
// illustrée, boissons, happy hour et le fichier de types du builder), la page
// publique est passée de 188 à 202 Ko gzip, au-delà de son budget (197) — et la
// production a cessé de se déployer à partir de v352.
// La demande de traduction, la répartition et la couverture restent dans
// traductionDesCartes (Ma carte, serveur), qui réexporte ce module. Module PUR.

import { texteUtile } from "./repeaterExtract"
import { LANGUES_PROPOSEES, languesCochees, lireTraduction, type CodeLangue, type Traduction } from "./traductionCarte"

export const BLOCS_TRADUISIBLES = ["menu_section", "menu_tabs", "carte_illustree", "carte_boissons", "happy_hour"] as const
const traduisible = (type: string) => (BLOCS_TRADUISIBLES as readonly string[]).includes(type)

const cle = (s: string) => s.normalize("NFC").trim().toLowerCase()
type BlocLu = { id: string; type: string; content: Record<string, any> | null; visible?: boolean | null }

/** Les langues qu'un bloc offre vraiment : cochées ET remplies. */
export function languesDuBloc(c: Record<string, any> | null | undefined): CodeLangue[] {
  return languesCochees(c ?? {}).filter(l => texteUtile((c ?? {})[`tr_${l}`]))
}
/** Les langues que la page offre : l'union de ses cartes, dans l'ordre de la liste. */
export function languesDeLaPage(blocs: readonly BlocLu[]): CodeLangue[] {
  const s = new Set<CodeLangue>()
  for (const b of blocs) if (b.visible !== false && traduisible(b.type)) for (const l of languesDuBloc(b.content)) s.add(l)
  return LANGUES_PROPOSEES.filter(l => s.has(l))
}

// ── Appliquer une traduction ────────────────────────────────────────────────
export function traductionDuBloc(c: Record<string, any> | null | undefined, langue: CodeLangue): Traduction | null {
  return langue === "fr" ? null : lireTraduction((c ?? {})[`tr_${langue}`])
}
export function nomTraduit(t: Traduction | null, nom: string): string { return (t && t.produits.get(cle(nom))?.nom) || nom }
export function descriptionTraduite(t: Traduction | null, nom: string, desc: string | undefined): string | undefined {
  return (t && t.produits.get(cle(nom))?.description) || desc
}
export function rubriqueTraduite(t: Traduction | null, r: string | undefined): string | undefined {
  return (r && t && t.categories.get(cle(r))) || r
}
