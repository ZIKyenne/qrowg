// Banc d'essai de « Mes pages » (audit C1/C2) : l'écran client, sans garde d'auth,
// avec des données clairement fictives. GATÉ : 404 en production. ?vide=1 : compte sans page.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import PagesClient from "@/app/dashboard/pages/PagesClient"

export const dynamic = "force-dynamic"

export default async function E2EMesPages({ searchParams }: { searchParams?: Promise<{ vide?: string }> }) {
  if (!harnessAutorise()) notFound()
  const { vide } = (await searchParams) ?? {}
  const il_y_a = (j: number) => new Date(Date.now() - j * 864e5).toISOString()
  const pages = vide === "1" ? [] : [
    { id: "demo-1", title: "Carte du bar (démo)", slug: "carte-bar-demo", status: "published", total_views: 384, updated_at: il_y_a(1), qr: "demo01" },
    { id: "demo-2", title: "Avis Google (démo)", slug: "avis-google-demo", status: "published", total_views: 1, updated_at: il_y_a(12), qr: "demo02" },
    { id: "demo-3", title: "Menu du soir — une page au titre assez long pour revenir à la ligne (démo)", slug: "menu-du-soir-demo", status: "draft", total_views: 0, updated_at: il_y_a(0.01), qr: null },
  ]
  return <PagesClient pages={pages} />
}
