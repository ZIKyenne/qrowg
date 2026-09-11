// Banc d'essai de « Équipe » (captures, tests) : monte l'écran client sans la garde
// d'auth, avec des données de démonstration clairement fictives. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import TeamPage, { type TeamData } from "@/app/dashboard/team/page"

export const dynamic = "force-dynamic"

// ?vide=1 : le compte solo — aucun coéquipier, aucune invitation.
export default async function E2EEquipePage({ searchParams }: { searchParams?: Promise<{ vide?: string }> }) {
  if (!harnessAutorise()) notFound()
  const vide = ((await searchParams) ?? {}).vide === "1"
  const il_y_a = (j: number) => new Date(Date.now() - j * 864e5).toISOString()
  const data: TeamData = {
    team: { id: "demo-team", name: "Studio Horizon (démo)", ownerId: "demo-owner" },
    owner: { id: "demo-owner", email: "studio@exemple.fr", name: "Studio Horizon (démo)" },
    members: [
      { id: "demo-m1", user_id: "demo-u1", role: "admin", joined_at: il_y_a(40), profiles: { email: "lea@exemple.fr", full_name: "Léa Martin (démo)" } },
      { id: "demo-m2", user_id: "demo-u2", role: "editor", joined_at: il_y_a(12), profiles: { email: "karim@exemple.fr", full_name: "Karim B. (démo)" } },
    ],
    invitations: [{ id: "demo-i1", email: "nouvelle.recrue@exemple.fr", role: "editor", created_at: il_y_a(1) }],
    myRole: "owner", plan: "business", teamEnabled: true, teamLimit: 5, seatsUsed: 3,
  }
  return <ToastProvider><ConfirmProvider><TeamPage initialData={vide ? { ...data, members: [], invitations: [], seatsUsed: 1 } : data} /></ConfirmProvider></ToastProvider>
}
