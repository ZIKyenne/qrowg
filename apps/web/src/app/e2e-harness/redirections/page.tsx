// Banc d'essai de « Redirections » (captures, tests) : monte l'écran client sans la garde
// d'auth, avec des données de démonstration clairement fictives. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import RedirectsPanel from "@/app/dashboard/redirects/RedirectsPanel"

export const dynamic = "force-dynamic"

// ?vide=1 : aucune redirection — et, plus parlant encore, aucun domaine à qui
// en attacher une : c'est l'état du compte qui découvre l'écran.
export default async function E2ERedirectionsPage({ searchParams }: { searchParams?: Promise<{ vide?: string }> }) {
  if (!harnessAutorise()) notFound()
  const vide = ((await searchParams) ?? {}).vide === "1"

  const il_y_a = (j: number) => new Date(Date.now() - j * 864e5).toISOString()
  const redirects = [
    { id: "demo-r1", from_domain: "ancien-bistrot.fr", from_path: "/", to_url: "https://carte.bistrot-horizon.fr", redirect_type: 301 as const, label: "Ancien site", enabled: true, hit_count: 342, last_hit_at: il_y_a(0), created_at: il_y_a(60) },
    { id: "demo-r2", from_domain: "carte.bistrot-horizon.fr", from_path: "/menu-ete", to_url: "https://carte.bistrot-horizon.fr/menu", redirect_type: 302 as const, label: "Menu d'été (fini)", enabled: false, hit_count: 18, last_hit_at: il_y_a(30), created_at: il_y_a(90) },
  ]
  return <ToastProvider><ConfirmProvider><RedirectsPanel userDomains={vide ? [] : ["carte.bistrot-horizon.fr", "avis.bistrot-horizon.fr"]} initialRedirects={vide ? [] : redirects} /></ConfirmProvider></ToastProvider>
}
