"use client"

// AvisAbonnement — ce que l'accueil dit quand l'abonnement va s'arrêter.
//
// Audit du 14 novembre 2026 (C, états du tableau de bord) : « Abonnement en fin
// de période → Choisir les éléments conservés. » La résiliation programmée et
// le paiement refusé n'étaient visibles que dans Paramètres ; à l'échéance, des
// pages passaient en pause sans que l'accueil l'ait annoncé. Rien ne s'affiche
// dans les autres états. La phrase vient de lib/gestionAbonnement.

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button, ButtonLink } from "@/components/ui/Button"
import { effetDe, serveurAFait, refusDuServeur } from "@/lib/effetConfirme"
import { etatFacturation, type EtatFacturation } from "@/lib/gestionAbonnement"
import { attente } from "@/lib/reponseAttendue"

export default function AvisAbonnement() {
  const [etat, setEtat] = useState<EtatFacturation | null>(null)
  const [ouverture, setOuverture] = useState(false)
  const [refus, setRefus] = useState("")

  // Paiement refusé : DIRECTEMENT au formulaire de carte du portail Stripe, retour ici.
  // Avant (revue du 17 nov.) : un détour par Paramètres, puis un second bouton.
  async function mettreAJourLaCarte() {
    if (ouverture) return
    setOuverture(true); setRefus("")
    const r = await effetDe("/api/stripe/portal", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intention: "paiement", retour: "/dashboard" }),
    })
    const d = (r.corps ?? {}) as { url?: string }
    if (serveurAFait(r) && d.url) { window.location.href = d.url; return }
    setRefus(refusDuServeur(r, "L'espace de paiement n'a pas pu s'ouvrir. Réessayez, ou passez par Paramètres.") ?? "L'espace de paiement n'a pas pu s'ouvrir.")
    setOuverture(false)
  }

  useEffect(() => {
    const a = attente()
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: abo }] = await Promise.all([
        supabase.from("profiles").select("plan, stripe_customer_id").eq("id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("current_period_start,current_period_end,cancel_at_period_end,status").eq("user_id", user.id).maybeSingle(),
      ])
      if (!a.encoreAttendue()) return
      setEtat(etatFacturation({ plan: (prof as any)?.plan, abonnement: abo as any, clientStripe: !!(prof as any)?.stripe_customer_id }))
    })()
    return a.abandonner
  }, [])

  if (!etat || (etat.statut !== "fin_programmee" && etat.statut !== "impaye")) return null
  const fin = etat.statut === "fin_programmee"

  return (
    <section role="status" className="qd-carte" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", padding: "16px 20px", borderColor: fin ? "var(--line-strong)" : "color-mix(in srgb, var(--danger) 40%, transparent)" }}>
      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <p style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600, margin: 0 }}>
          {fin ? `Votre plan ${etat.plan.label} s'arrête bientôt` : "Paiement refusé"}
        </p>
        {etat.echeance && <p style={{ color: fin ? "var(--muted)" : "var(--danger)", fontSize: 13, margin: "2px 0 0", lineHeight: 1.5 }}>{etat.echeance}</p>}
        {!fin && <p style={{ color: "var(--muted)", fontSize: 13, margin: "2px 0 0", lineHeight: 1.5 }}>Le prélèvement est retenté automatiquement pendant quelques jours. Sans carte valide, votre compte repassera au plan gratuit et ce qui dépasse ses limites sera mis en pause.</p>}
        {refus && <p role="alert" style={{ color: "var(--danger)", fontSize: 13, margin: "4px 0 0" }}>{refus}</p>}
        {fin && <p style={{ color: "var(--muted)", fontSize: 13, margin: "2px 0 0", lineHeight: 1.5 }}>Au retour au plan gratuit, ce qui dépasse ses limites sera mis en pause. Choisissez dès maintenant ce qui reste actif.</p>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {fin && <ButtonLink href="/dashboard/qr-codes" variant="secondary" size="sm">Choisir ce qui reste actif</ButtonLink>}
        {fin
          ? <ButtonLink href="/dashboard/settings" size="sm">Gérer l&apos;abonnement</ButtonLink>
          : <Button size="sm" onClick={mettreAJourLaCarte} loading={ouverture} disabled={ouverture}>Mettre à jour ma carte</Button>}
      </div>
    </section>
  )
}
