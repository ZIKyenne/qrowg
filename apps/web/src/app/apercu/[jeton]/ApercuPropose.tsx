"use client"

// Le rendu d'une proposition : le vrai renderer, un bandeau honnête, un bouton.
//
// ── Le bouton « Ce modèle me plaît » ───────────────────────────────────────
//
// Il ne crée pas de compte, ne demande pas d'e-mail, n'envoie rien. Il écrit
// la page dans le **brouillon invité** que le produit possède déjà
// (`builder/draftStore.ts`) et ouvre l'éditeur.
//
// Ce choix n'est pas un raccourci, c'est le parcours existant de QRowg : on
// compose d'abord, le compte est demandé au moment de publier. Le commentaire
// du dépôt le dit mieux que moi — « Jusqu'ici il fallait donner nom, email et
// mot de passe avant de voir la moindre page. Quatre étapes avant la première
// impression. On inverse. » Un moteur de croissance qui exigerait l'inscription
// pour toucher à la page irait contre son propre produit.
//
// La revendication FORMELLE — marquer l'aperçu comme repris par un compte —
// vient plus tard, au moment de la publication, quand une session existe. La
// possession du lien ne vaut pas identité, et ce bouton ne prétend pas le
// contraire : il donne une page modifiable, pas une page officielle.

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import PublicPageClient from "@/app/[slug]/PublicPageClient"
import { normalizePageTheme } from "@/app/dashboard/builder/types"
import { makeDraft, saveDraft, browserStorage } from "@/app/dashboard/builder/draftStore"
import type { ApercuStocke } from "@/lib/growth/depotApercus"

export function ApercuPropose({ apercu }: { apercu: ApercuStocke }) {
  const router = useRouter()
  const [enCours, setEnCours] = useState(false)

  const page = {
    id: `apercu-${apercu.id}`,
    title: apercu.nom,
    slug: `apercu-${apercu.id}`,
    theme: normalizePageTheme(apercu.rendu.theme as never),
    total_views: 0,
    profiles: { full_name: apercu.nom, plan: "pro" },
  }
  const blocks = apercu.rendu.blocs.map((b, i) => ({
    id: `apercu-${apercu.id}-${i}`,
    page_id: page.id,
    type: b.type,
    content: b.content,
    position: i,
    is_visible: true,
  }))

  const [echec, setEchec] = useState<string | null>(null)

  const reprendre = () => {
    setEnCours(true)
    setEchec(null)
    // L'API réelle du brouillon : `makeDraft` compose, `saveDraft` écrit, et
    // elle REND son résultat au lieu de lever. On le lit, plutôt que de
    // supposer que ça a marché.
    const brouillon = makeDraft({
      pageName: apercu.nom,
      theme: page.theme,
      blocks: apercu.rendu.blocs.map((b, i) => ({ type: b.type, content: b.content, position: i })),
      templateKey: apercu.modeleSource,
      now: Date.now(),
    })
    const resultat = saveDraft(browserStorage(), brouillon)
    if (!resultat.ok) {
      setEnCours(false)
      setEchec(resultat.reason === "too_big"
        ? "Ce modèle est trop lourd pour être repris ici. Écrivez-nous, on vous l'installe."
        : "Votre navigateur bloque le stockage local — en navigation privée, par exemple. Réessayez dans une fenêtre normale.")
      return
    }
    // `?draft=1` : l'éditeur restaure alors le brouillon D'OFFICE. Sans ce
    // paramètre il se contente de le PROPOSER, pour ne rien écraser — ce qui
    // est juste quand on revient par hasard, et faux ici : le visiteur vient
    // de cliquer « je le personnalise ».
    router.push("/dashboard/builder?draft=1")
  }

  return (
    <div data-testid="apercu-propose" data-modele={apercu.modeleSource}>
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
        {apercu.nom} n&apos;a pas approuvé cette page et n&apos;est pas client.
        {apercu.aCompleter.length > 0 && (
          <span style={{ display: "block", marginTop: 6, color: "#A8A190" }}>
            À compléter : {apercu.aCompleter.join(", ")}.
          </span>
        )}
      </aside>

      <PublicPageClient page={page as never} blocks={blocks as never} />

      <div
        style={{
          position: "sticky", bottom: 0, zIndex: 50,
          background: "linear-gradient(to top, #080808 65%, transparent)",
          padding: "20px 16px calc(20px + env(safe-area-inset-bottom, 0px))",
          display: "flex", justifyContent: "center",
        }}>
        {/* `Button`, pas un `<button>` écrit à la main : `unSeulBouton.test.ts`
            l'a repris dès le premier passage, et il a raison — un visiteur du
            site public doit voir partout le même vocabulaire. La primitive
            apporte aussi l'état de chargement et la cible tactile. */}
        <div style={{ maxWidth: 420, width: "100%" }}>
          <Button
            data-testid="reprendre-le-modele" size="lg" fullWidth
            loading={enCours} onClick={reprendre}>
            {enCours ? "Ouverture de l'éditeur…" : "Ce modèle me plaît — je le personnalise"}
          </Button>
        </div>
      </div>

      {echec && (
        <p role="alert" data-testid="echec-reprise" style={{ margin: 0, padding: "0 16px 20px", color: "#F0B6B6", fontSize: 14, textAlign: "center" }}>
          {echec}
        </p>
      )}
    </div>
  )
}
