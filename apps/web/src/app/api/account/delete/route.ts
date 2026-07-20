// Suppression definitive du compte (obligation RGPD). Securise :
//  - le demandeur est authentifie via ses cookies de session ;
//  - il doit re-confirmer en tapant son propre email ;
//  - la suppression de l'utilisateur auth cascade sur profiles puis sur
//    toutes les donnees (pages, qr, blocks, leads, analytics...).
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  // 1. Authentifier le demandeur (session cookie) — jamais un id passe par le client.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })

  // 2. Double confirmation : l'email tape doit correspondre a celui du compte.
  let body: { email?: string } = {}
  try { body = await req.json() } catch {}
  const typed = (body.email ?? "").trim().toLowerCase()
  if (!typed || typed !== (user.email ?? "").toLowerCase()) {
    return NextResponse.json({ error: "Confirmation incorrecte." }, { status: 400 })
  }

  // Client service-role (non type : contourne les types generes potentiellement obsoletes).
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  const uid = user.id

  // 3. Lever les contraintes qui bloqueraient la suppression du profil :
  //    - profiles.referred_by (NO ACTION) : detacher les filleuls parraines.
  //    - teams.owner_id (RESTRICT) : supprimer les equipes possedees.
  await admin.from("profiles").update({ referred_by: null }).eq("referred_by", uid)
  await admin.from("teams").delete().eq("owner_id", uid)

  // 4. Supprimer l'utilisateur auth -> cascade sur profiles et toutes les donnees liees.
  const { error } = await admin.auth.admin.deleteUser(uid)
  if (error) {
    return NextResponse.json({ error: "La suppression a échoué. Réessayez ou contactez le support." }, { status: 500 })
  }

  // 5. Invalider la session locale (cookies) apres coup.
  try { await supabase.auth.signOut() } catch {}

  return NextResponse.json({ ok: true })
}
