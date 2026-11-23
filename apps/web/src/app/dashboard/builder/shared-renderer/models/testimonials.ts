// Modèle pur `testimonials`. items filtrés sur `name` (limite 3). `i` conservé (édition).
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"
import { combien } from "@/lib/nombreDuContenu"

export type Testimonial = { i: number; name: string; text?: string; stars?: string }
export type TestimonialsViewModel = { visible: boolean; items: Testimonial[] }

/**
 * U8 (revue du 23 nov.) : un avis sans note recevait cinq étoiles. Une note que
 * le commerçant n'a pas saisie ne s'affiche pas — ni cinq, ni zéro : rien.
 */
export function etoilesDeLAvis(stars: unknown): number {
  return combien(stars, 0, 5)
}

export function testimonialsViewModel(content: Record<string, any> | null | undefined): TestimonialsViewModel {
  const c = content || {}
  const items = extractIndexed<Testimonial>(c, plafondDesLignes("testimonials"), (cc, i) => texteUtile(cc[`name${i}`]) ? { i, name: cc[`name${i}`], text: cc[`text${i}`], stars: cc[`stars${i}`] } : null)
  return { visible: items.length > 0, items }
}
