// Banc d'essai de « Pilotage » (audit F) : la vue, avec des données fictives. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { calculerPilotage } from "@/lib/pilotage"
import PilotageVue from "@/app/dashboard/pilotage/PilotageVue"

export const dynamic = "force-dynamic"

export default function E2EPilotage() {
  if (!harnessAutorise()) notFound()
  const il_y_a = (j: number) => new Date(Date.now() - j * 864e5).toISOString()
  const comptes = Array.from({ length: 14 }, (_, i) => ({ id: `u${i}`, inscritLe: il_y_a(5 + i * 5) }))
  const pages = comptes.slice(0, 11).map((c, i) => ({ id: `p${i}`, user_id: c.id, created_at: il_y_a(4 + i * 5), published_at: i < 7 ? il_y_a(3 + i * 5) : null }))
  const scans = pages.slice(0, 4).map(p => ({ page_id: p.id, scanned_at: il_y_a(2) }))
  const abonnements = [
    { user_id: "u0", status: "active", plan: "pro", cancel_at_period_end: false },
    { user_id: "u1", status: "active", plan: "starter", cancel_at_period_end: true },
  ]
  return <PilotageVue pilotage={calculerPilotage({ comptes, pages, scans, abonnements })} />
}
