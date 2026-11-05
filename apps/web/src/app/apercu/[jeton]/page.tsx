// L'aperçu privé d'une proposition — `/apercu/<jeton>`.
//
// ── Ce que cette route doit garantir, et pourquoi chaque point ─────────────
//
// 1. **Introuvable par un moteur.** `robots: noindex, nofollow` dans les
//    métadonnées, et la route n'est dans aucun sitemap. Une proposition
//    commerciale indexée serait visible de l'établissement concerné, de ses
//    concurrents, et de n'importe qui cherchant son nom.
//
// 2. **Non énumérable.** Le jeton fait 43 caractères de hasard ; sa forme est
//    vérifiée avant toute requête SQL. Un balayage ne coûte donc pas une
//    requête par essai.
//
// 3. **Expirante.** Passé le délai, `lireApercu` rend `null` et la page répond
//    404 — le même 404 que pour un jeton inventé. Distinguer « expiré » de
//    « inexistant » apprendrait à un balayeur quels jetons sont valides.
//
// 4. **Annoncée pour ce qu'elle est.** Un bandeau, en haut, sans défilement :
//    proposition non officielle, l'établissement n'a pas approuvé cette page
//    et n'est pas client. C'est la demande des deux documents de mission, et
//    c'est surtout la seule façon honnête de présenter une page qui porte le
//    nom de quelqu'un d'autre.
//
// 5. **Le vrai produit.** Le rendu passe par `PublicPageClient`, exactement
//    comme une page publiée. Ce que le prospect voit ici est ce qu'il aura —
//    pas une maquette, pas une capture.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { lireApercu } from "@/lib/growth/depotApercus"
import { ApercuPropose } from "./ApercuPropose"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Proposition QRowg",
  // Hors de l'index, et aucun lien suivi : ni la page, ni ce qu'elle cite.
  robots: { index: false, follow: false, nocache: true },
}

export default async function PageApercu({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params
  const apercu = await lireApercu(jeton)
  // Jeton mal formé, introuvable ou expiré : la même réponse pour les trois.
  if (!apercu) notFound()
  return <ApercuPropose apercu={apercu} />
}
