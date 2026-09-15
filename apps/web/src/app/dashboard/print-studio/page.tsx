// Atelier d'impression (nouveau) — route dédiée. Page serveur : garde d'auth + plan.
// L'UI guidée « objets, pas outils » vit dans PrintStudioClient (îlot client).
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import PrintStudioClient from "./PrintStudioClient"
import { canPrintStudio } from "@/lib/plans"

export const metadata = { title: "Atelier d'impression" }

export default async function PrintStudioPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?redirect=/dashboard/print-studio")

  // Atelier d'impression est GRATUIT pour tous les plans (il n'y a plus de création de QR :
  // on réutilise ses propres QR existants ou on importe un PNG — aucune facturation).
  //
  // Cette décision vivait ici, et nulle part ailleurs : `caps.printStudio` valait
  // toujours `false` sur le gratuit, et la grille vendait l'atelier comme une
  // raison de payer. On passe donc par la capacité — elle vaut `true` partout, le
  // comportement ne change pas, mais la grille et la page disent enfin la même
  // chose, et une décision future se prendra à un seul endroit (lot v130).
  const { data: prof } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle()
  return <PrintStudioClient canAccess={canPrintStudio(prof?.plan)} />
}
