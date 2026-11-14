"use client"

// GestionAbonnement — le bloc Facturation, un seul, pour Paramètres et /upgrade.
//
// Audit du 14 novembre 2026, A1 : « Gérer mon abonnement » menait à `/upgrade`,
// où le plan en cours n'est qu'un bouton désactivé. Factures, carte et
// résiliation n'étaient atteignables que depuis l'onglet Abonnement du Profil.
//
// Ici, quatre intentions, quatre chemins nommés (voir lib/gestionAbonnement) :
// changer de formule, factures et paiement, résilier en fin de période — et la
// suppression du compte reste dans sa zone de danger, qui n'est PAS une
// résiliation. Ce que la bascule au gratuit couperait est dit avant le clic.
//
// Tant que le plan n'est pas lu, rien ne s'affiche (A2 : les écrans montraient
// « Gratuit » un instant, puis le vrai plan).

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button, ButtonLink } from "@/components/ui/Button"
import { dynLimit, pageLimit } from "@/lib/plans"
import { pagesQuiSArretent, phrasePagesAvant } from "@/lib/pauseDesPages"
import { qrQuiSArretent, phraseAvantDeRetomber } from "@/lib/pauseDeQuota"
import { etatFacturation, LIBELLES_FACTURATION, type EtatFacturation } from "@/lib/gestionAbonnement"
import { effetDe, serveurAFait, refusDuServeur } from "@/lib/effetConfirme"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { attente } from "@/lib/reponseAttendue"

type Intention = "portail" | "paiement" | "resilier"

export default function GestionAbonnement({ retour, compact = false }: {
  /** Où le portail Stripe renvoie (liste fermée côté serveur). */
  retour: "/dashboard/settings" | "/upgrade" | "/dashboard/profile"
  /** Sur /upgrade : pas de bouton « Changer de formule », la grille est en dessous. */
  compact?: boolean
}) {
  const [etat, setEtat] = useState<EtatFacturation | null>(null)
  const [qrCoupes, setQrCoupes] = useState(0)
  const [pagesCoupees, setPagesCoupees] = useState(0)
  const [ouverture, setOuverture] = useState<Intention | null>(null)
  const [refus, setRefus] = useState("")

  useEffect(() => {
    const supabase = createClient()
    const a = attente()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: abo }] = await Promise.all([
        supabase.from("profiles").select("plan, stripe_customer_id").eq("id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("current_period_start,current_period_end,cancel_at_period_end,status").eq("user_id", user.id).maybeSingle(),
      ])
      if (!a.encoreAttendue()) return
      const e = etatFacturation({ plan: (prof as any)?.plan, abonnement: abo as any, clientStripe: !!(prof as any)?.stripe_customer_id })
      setEtat(e)
      if (e.plan.id !== "free") {
        const { data: liens } = await supabase
          .from("instant_qrs").select("id, status, expires_at, paused_reason, label")
          .eq("user_id", user.id).eq("dynamic", true).order("created_at", { ascending: true })
        if (a.encoreAttendue()) setQrCoupes(qrQuiSArretent((liens as any) || [], dynLimit("free")).length)
        const { data: qrsDePage } = await supabase
          .from("qr_codes").select("id, status, paused_reason")
          .eq("user_id", user.id).order("created_at", { ascending: true })
        if (a.encoreAttendue()) setPagesCoupees(pagesQuiSArretent((qrsDePage as any) || [], pageLimit("free")))
      }
    })()
    return a.abandonner
  }, [])

  async function ouvrir(intention: Intention) {
    if (ouverture) return
    setOuverture(intention); setRefus("")
    const r = await effetDe("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intention: intention === "portail" ? null : intention, retour }),
    })
    const d = (r.corps ?? {}) as { url?: string }
    if (serveurAFait(r) && d.url) { window.location.href = d.url; return }
    setRefus(refusDuServeur(r, "L'espace de facturation n'a pas pu s'ouvrir. Réessayez dans un instant.") ?? "L'espace de facturation n'a pas pu s'ouvrir.")
    setOuverture(null)
  }

  if (!etat) {
    return <div className="skeleton" aria-hidden="true" style={{ height: compact ? 64 : 96, borderRadius: 12 }} />
  }

  const avertissement = etat.statut === "actif" || etat.statut === "impaye" || etat.statut === "fin_programmee"
    ? [phrasePagesAvant(pagesCoupees), phraseAvantDeRetomber(qrCoupes)].filter(Boolean).join(" ") || null
    : null
  const enCours = (i: Intention) => ouverture === i

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} data-statut-facturation={etat.statut}>
      <div>
        <p style={{ color: "var(--ink)", fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>Plan {etat.plan.label}</p>
        {etat.echeance && (
          <p style={{ color: etat.statut === "impaye" ? "var(--danger)" : "var(--muted)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{etat.echeance}</p>
        )}
        {etat.statut === "hors_stripe" && (
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{LIBELLES_FACTURATION.horsStripe}</p>
        )}
        {etat.statut !== "gratuit" && etat.statut !== "hors_stripe" && (
          <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>Factures et reçus envoyés par e-mail à chaque paiement, et consultables ci-dessous.</p>
        )}
        {/* Dit AVANT, pas découvert après : ce qu'un retour au gratuit coupe. */}
        {avertissement && (
          <p style={{ color: "var(--warning, #FBBF24)", fontSize: 12, margin: "8px 0 0", lineHeight: 1.5, maxWidth: 520 }}>
            En cas de retour au plan gratuit : {avertissement} Rien n'est supprimé : vous choisissez ce qui reste actif depuis « QR de pages » et « QR vers un lien », et un plan supérieur rallume le reste.
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!compact && etat.monter && (
          <ButtonLink href="/upgrade" size="sm" variant={etat.statut === "gratuit" ? "primary" : "secondary"}>
            {etat.statut === "gratuit" ? "Découvrir les offres" : LIBELLES_FACTURATION.monter}
          </ButtonLink>
        )}
        {etat.portail && (
          <Button size="sm" variant="secondary" onClick={() => ouvrir(etat.statut === "impaye" ? "paiement" : "portail")} loading={enCours("portail") || enCours("paiement")} disabled={!!ouverture}>
            {LIBELLES_FACTURATION.portail}
          </Button>
        )}
        {etat.statut === "actif" && (
          <Button size="sm" variant="ghost" onClick={() => ouvrir("resilier")} loading={enCours("resilier")} disabled={!!ouverture}>
            {LIBELLES_FACTURATION.resilier}
          </Button>
        )}
        {etat.statut === "fin_programmee" && (
          <Button size="sm" variant="ghost" onClick={() => ouvrir("portail")} loading={enCours("portail")} disabled={!!ouverture}>
            {LIBELLES_FACTURATION.reprendre}
          </Button>
        )}
      </div>

      {refus && <p {...propsAnnonce("erreur")} style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{refus}</p>}
    </div>
  )
}
