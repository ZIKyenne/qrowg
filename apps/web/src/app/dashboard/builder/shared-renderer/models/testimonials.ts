// Modèle pur `testimonials`. items filtrés sur `name` (limite 3). `i` conservé (édition).
import { extractIndexed } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type Testimonial = { i: number; name: string; text?: string; stars?: string }
export type TestimonialsViewModel = { visible: boolean; items: Testimonial[] }

export function testimonialsViewModel(content: Record<string, any> | null | undefined): TestimonialsViewModel {
  const c = content || {}
  const items = extractIndexed<Testimonial>(c, plafondDesLignes("testimonials"), (cc, i) => cc[`name${i}`] ? { i, name: cc[`name${i}`], text: cc[`text${i}`], stars: cc[`stars${i}`] } : null)
  return { visible: items.length > 0, items }
}
