// POST /api/qr-support — ajouter un SUPPORT à une page existante.
//
// Un deuxième, troisième, quatrième QR qui mènent tous à LA MÊME page : la
// vitrine, les tables, les flyers. C'est ce que le produit demande de faire
// depuis le panneau « Performance par support » et depuis sa FAQ publique, et
// que rien ne permettait de faire : `api/qr-duplicate` duplique aussi la page
// (nouveau slug, retour en brouillon), ce qui casse justement la comparaison
// qu'on venait chercher. Relevé du 13 septembre, voir lib/supportImprime.ts.
//
// La règle de quota ne bouge pas : un QR de page ACTIF consomme un slot du plan
// (lib/quota). Elle est seulement dite avant, et le support arrive en brouillon
// plutôt que d'être refusé — comme la duplication le fait déjà.
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { erreurDeBase } from "@/lib/apiError"
import { NextRequest, NextResponse } from "next/server"
import { initialQrStatus } from "@/lib/quota"
import { uniqueShortCode } from "@/lib/shortCode"
import { nomDeSupportLibre } from "@/lib/supportImprime"
import { champBorne } from "@/lib/limitesDeSaisie"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { page_id, label } = await req.json().catch(() => ({} as any))
  if (!page_id || typeof page_id !== "string") return NextResponse.json({ error: "page_id requis" }, { status: 400 })

  // La page doit être la sienne : sans cette vérification, n'importe qui
  // fabriquerait des QR pointant vers la page d'un autre.
  const { data: page } = await supabase
    .from("pages").select("id").eq("id", page_id).eq("user_id", user.id).maybeSingle()
  if (!page) return NextResponse.json({ error: "Page introuvable" }, { status: 404 })

  // Les supports déjà posés sur cette page : pour nommer le suivant sans doublon.
  const { data: existants } = await supabase
    .from("qr_codes").select("id, label").eq("page_id", page_id).eq("user_id", user.id)

  const { data: prof } = await supabase.from("profiles").select("plan").eq("id", user.id).single()
  const statut = await initialQrStatus(supabase, user.id, prof?.plan as string)

  const nom = champBorne(label, "nomDeSupport")
    ?? nomDeSupportLibre((existants || []).map((q: any) => q.label))

  const ligne: Record<string, unknown> = {
    page_id,
    user_id: user.id,
    short_code: await uniqueShortCode(supabase),
    status: statut,
    label: nom,
  }

  const { data: cree, error } = await supabase
    .from("qr_codes").insert(ligne).select("*, pages(id, title, slug, status, total_views, updated_at)").single()
  if (error || !cree) return erreurDeBase("qr-support", error, "Le support n'a pas pu être créé.")

  return NextResponse.json({ ok: true, qr: cree, brouillon: statut === "draft" })
}
