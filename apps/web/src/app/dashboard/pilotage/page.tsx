import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { estAdministrateur } from "@/lib/admin"
import { APPAREILS_HUMAINS } from "@/lib/robots"
import { calculerPilotage } from "@/lib/pilotage"
import PilotageVue from "./PilotageVue"

export const metadata = { title: "Pilotage — QRowg" }
export const dynamic = "force-dynamic"

// Pilotage — l'entonnoir de croissance, depuis la base seule (audit du 14
// novembre, lot F ; décision du 16 : pas d'outil d'analyse en plus).
//
// Même doctrine que /dashboard/croissance : `notFound()` pour qui n'est pas
// administrateur, `ADMIN_EMAILS` vide ⇒ personne. La lecture passe par le
// client service-role (tous les comptes), mais seuls des AGRÉGATS sortent de ce
// fichier : aucune adresse, aucun nom n'est transmis au navigateur.

const FENETRE_JOURS = 90
const PLAFOND = 50_000

export default async function PilotagePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  if (!estAdministrateur(user.email)) notFound()

  const admin = createAdminClient()
  const depuis = new Date(Date.now() - FENETRE_JOURS * 864e5).toISOString()
  const [comptes, pages, scans, abonnements] = await Promise.all([
    admin.from("profiles").select("id, created_at, referred_by").order("created_at", { ascending: true }).limit(PLAFOND),
    admin.from("pages").select("id, user_id, created_at, published_at").order("created_at", { ascending: true }).limit(PLAFOND),
    admin.from("scans").select("page_id, scanned_at").gte("scanned_at", depuis).in("device", APPAREILS_HUMAINS).order("scanned_at", { ascending: true }).limit(PLAFOND),
    admin.from("subscriptions").select("user_id, status, plan, cancel_at_period_end").order("created_at", { ascending: true }).limit(PLAFOND),
  ])
  const erreur = [comptes, pages, scans, abonnements].find(r => r.error)?.error
  if (erreur) return <PilotageVue pilotage={null} erreur="La base n'a pas répondu : les chiffres ne sont pas affichés plutôt que faux." />

  const pilotage = calculerPilotage({
    comptes: (comptes.data ?? []).map((c: any) => ({ id: c.id, inscritLe: c.created_at, parrain: c.referred_by ?? null })),
    pages: (pages.data ?? []) as any,
    scans: (scans.data ?? []) as any,
    abonnements: (abonnements.data ?? []) as any,
  }, Date.now(), FENETRE_JOURS, user.id)
  return <PilotageVue pilotage={pilotage} />
}
