// Export des donnees personnelles (droit RGPD a la portabilite). Le client
// est authentifie via la session : la RLS restreint naturellement chaque
// requete aux donnees de l'utilisateur (pas besoin du service-role).
//
// Il lisait CINQ tables sur les vingt et une qui portent les données d'un
// compte : le commerçant repartait avec ses pages et ses messages, sans une
// seule ligne de mesure — sans ce pour quoi il paie. La liste de ce qu'un compte
// possède vit désormais dans `lib/donneesDuCompte`, avec, pour chaque table
// écartée, la raison écrite (lot v119).
import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { aujourdHuiDuCommerce } from "@/lib/jourDuCommerce"
import {
  tablesAExporter, tablesEcartees, sansLesSecrets, phraseExportCoupe,
  PLAFOND_PAR_TABLE, type TableDuCompte,
} from "@/lib/donneesDuCompte"

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  const uid = user.id

  // Les pages d'abord : plusieurs tables ne se rattachent au compte qu'à
  // travers elles (blocs, scans, visites, clics, lecture).
  const { data: pagesData } = await supabase
    .from("pages").select("*").eq("user_id", uid).order("created_at", { ascending: true })
  const pages = pagesData ?? []
  const pageIds = pages.map((p: { id: string }) => p.id)

  const donnees: Record<string, unknown> = {}
  const coupees: string[] = []

  async function lire(t: TableDuCompte): Promise<void> {
    if (t.table === "pages") { donnees.pages = pages; return }
    let q = supabase.from(t.table).select("*").limit(PLAFOND_PAR_TABLE)
    if (t.rattachement.par === "id") q = q.eq("id", uid)
    else if (t.rattachement.par === "user_id") q = q.eq("user_id", uid)
    else if (t.rattachement.par === "page_id") {
      if (!pageIds.length) { donnees[t.table] = []; return }
      q = q.in("page_id", pageIds)
    }
    const { data } = await q
    const lignes = sansLesSecrets((data ?? []) as Record<string, unknown>[], t.colonnesRetirees)
    if (lignes.length >= PLAFOND_PAR_TABLE) coupees.push(t.quoi)
    donnees[t.table] = lignes
  }

  // Séquentiel : une trentaine de lectures en parallèle sur une seule session
  // Supabase sature le pool et fait échouer l'export au lieu de le ralentir.
  for (const t of tablesAExporter()) await lire(t)

  const profil = donnees.profiles
  const payload = {
    export_version: 2,
    generated_at: new Date().toISOString(),
    account: { id: uid, email: user.email, created_at: user.created_at },
    // `profiles` est une ligne unique : on la rend telle quelle, pas en tableau.
    profile: Array.isArray(profil) ? (profil[0] ?? null) : (profil ?? null),
    ...Object.fromEntries(Object.entries(donnees).filter(([k]) => k !== "profiles")),
    // Ce qui n'est pas là, et pourquoi : un export muet sur ses manques laisse
    // croire qu'il est complet.
    non_exporte: tablesEcartees(),
    ...(phraseExportCoupe(coupees) ? { note: phraseExportCoupe(coupees) } : {}),
  }

  const date = aujourdHuiDuCommerce()
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="qrowg-export-${date}.json"`,
      "Cache-Control": "no-store",
    },
  })
}
