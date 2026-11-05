"use client"

// Aperçu d'une page générée — avec le VRAI renderer public.
//
// Pas une maquette, pas une capture : `PublicPageClient`, exactement celui qui
// s'affiche quand un client scanne un QR code. C'est l'exigence centrale des
// deux documents de mission, et c'est aussi la seule façon honnête de montrer
// une proposition : ce que le prospect voit ici est ce qu'il aura.
//
// Le bandeau du haut n'est pas décoratif. Les documents l'imposent, et le bon
// sens aussi : une page qui reprend le nom d'un restaurant sans son accord doit
// dire ce qu'elle est, avant tout le reste.

import PublicPageClient from "@/app/[slug]/PublicPageClient"
import { normalizePageTheme } from "@/app/dashboard/builder/types"
import { genererPageRestaurant } from "@/lib/growth/generateurRestaurant"
import { PROSPECTS_FICTIFS } from "@/lib/growth/prospectsFictifs"
import { valeurDe } from "@/lib/growth/profilEtablissement"

export function GrowthPreviewHarness({ prospect }: { prospect?: string }) {
  const cle = prospect && PROSPECTS_FICTIFS[prospect] ? prospect : "bistrot"
  const profil = PROSPECTS_FICTIFS[cle]()
  const generee = genererPageRestaurant(profil)

  if (!generee) {
    // Un profil trop pauvre ne produit pas de page. On le DIT, au lieu de
    // rendre un modèle vierge qui porterait son enseigne.
    return (
      <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#080808", color: "#F5F0E8" }}>
        <p style={{ maxWidth: 420, textAlign: "center", fontSize: 16, lineHeight: 1.6 }}>
          Pas assez d&apos;informations vérifiées sur {valeurDe(profil.nom) ?? "cet établissement"} pour
          proposer une page personnalisée. Aucune page n&apos;est générée.
        </p>
      </main>
    )
  }

  const nom = valeurDe(profil.nom) ?? "Établissement"
  const page = {
    id: "growth-preview",
    title: nom,
    slug: "growth-preview",
    theme: normalizePageTheme(generee.theme as never),
    total_views: 0,
    profiles: { full_name: nom, plan: "pro" },
  }
  const blocks = generee.blocs.map((b, i) => ({
    id: `growth-${i}`,
    page_id: "growth-preview",
    type: b.type,
    content: b.content,
    position: i,
    is_visible: true,
  }))

  return (
    <div data-testid="growth-preview" data-modele={generee.modeleSource} data-prospect={cle}>
      <aside
        data-testid="bandeau-non-officiel"
        // Une barre collante doit déclarer qu'elle surplombe, pour que la zone
        // qui défile réserve sa hauteur — sinon un élément qui reçoit le focus
        // s'arrête pile dessous (WCAG 2.4.11). Règle du dépôt, pas la mienne.
        data-barre-collante=""
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "#1A1407", borderBottom: "1px solid rgba(201,168,76,0.35)",
          color: "#F5F0E8", padding: "12px 16px", fontSize: 13, lineHeight: 1.5, textAlign: "center",
        }}>
        <strong style={{ color: "#C9A84C" }}>Proposition non officielle créée par QRowg.</strong>{" "}
        {nom} n&apos;a pas approuvé cette page et n&apos;est pas client.
        {generee.aCompleter.length > 0 && (
          <span style={{ display: "block", marginTop: 6, color: "#A8A190" }}>
            À compléter par l&apos;établissement : {generee.aCompleter.join(", ")}.
          </span>
        )}
      </aside>

      <PublicPageClient page={page as never} blocks={blocks as never} />
    </div>
  )
}
