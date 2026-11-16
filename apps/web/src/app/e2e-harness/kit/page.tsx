// Banc d'essai du kit de démarchage : la fiche réelle, une page de démonstration
// fictive, un code de parrainage fictif. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import KitClient from "@/app/dashboard/kit/KitClient"

export const dynamic = "force-dynamic"

export default function E2EKit() {
  if (!harnessAutorise()) notFound()
  return <KitClient refCode="demo-ref" appUrl="https://qrowg.com"
    demos={[{ id: "p1", title: "Red Fish (démo)", slug: "red-fish-demo", qr: "demo01" }]} />
}
