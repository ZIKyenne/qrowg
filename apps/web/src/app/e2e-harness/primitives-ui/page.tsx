// Banc d'essai des primitives du design system (`components/ui/`). GATÉ : 404
// en production.
//
// Pourquoi il existe (M04, 5 octobre 2026) : `Modal` rend désormais une feuille
// montante sous la rupture `md` et sa boîte centrée au-dessus. Prouver cela
// demandait d'ouvrir une vraie fenêtre dans un vrai navigateur, à deux largeurs.
// Les neuf écrans qui l'utilisent sont tous derrière l'authentification ; la
// page de revue des primitives, elle, est autonome.
//
// Conséquence volontaire : ce banc entre d'office dans les deux gardes qui
// découvrent les bancs sur le disque — `bancsQuiDemarrent` (il doit répondre
// 200) et le volet « zone connectée » de `ciblesAuPouce` (ses commandes doivent
// tenir le plancher de 44 px). Le design system est le dernier endroit où l'on
// peut se permettre de ne pas le tenir.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import UiDemoPage from "@/app/dashboard/ui-demo/UiDemo"

export const dynamic = "force-dynamic"

export default function E2EPrimitivesUiPage() {
  if (!harnessAutorise()) notFound()
  return <UiDemoPage />
}
