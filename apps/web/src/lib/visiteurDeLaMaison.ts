// visiteurDeLaMaison.ts — ne pas compter le commerçant dans ses propres chiffres.
//
// Le 16 novembre, le kit de démarchage a fait de The Red Fish une page de
// démonstration : chaque fois que le gérant la montre à un confrère et la
// scanne lui-même, ses statistiques gonflent. Un scan du propriétaire (ou d'un
// membre de son équipe) n'est pas un client.
//
// Le visiteur ordinaire n'a AUCUN cookie de session Qrowg : la réponse est alors
// immédiate, sans requête. Avec un cookie, on demande qui il est, puis on
// compare au propriétaire de la page et à son équipe. En cas de doute (réseau,
// jeton expiré), on COMPTE : mieux vaut un scan du gérant compté qu'un client
// perdu.

import { createServerClient } from "@supabase/ssr"

type Cookie = { name: string; value: string }

/** Un cookie de session Supabase (`sb-<projet>-auth-token`, éventuellement découpé en `.0`, `.1`…). */
export function aUneSessionQrowg(cookies: readonly Pick<Cookie, "name">[]): boolean {
  return cookies.some(c => /^sb-.+-auth-token(\.\d+)?$/.test(c.name))
}

/** L'utilisateur de la session portée par ces cookies, ou null. Ne lève jamais. */
export async function utilisateurDesCookies(cookies: readonly Cookie[]): Promise<string | null> {
  if (!aUneSessionQrowg(cookies)) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !cle) return null
  try {
    const sb = createServerClient(url, cle, { cookies: { getAll: () => [...cookies], setAll: () => {} } })
    const { data } = await sb.auth.getUser()
    return data.user?.id ?? null
  } catch { return null }
}

/** Propriétaire de la page, ou membre de son équipe. `admin` : client service. */
export async function estDeLaMaison(admin: any, userId: string | null, page: { user_id?: string | null; team_id?: string | null }): Promise<boolean> {
  if (!userId) return false
  if (page.user_id && page.user_id === userId) return true
  if (!page.team_id) return false
  try {
    const { data } = await admin.from("team_members").select("id").eq("team_id", page.team_id).eq("user_id", userId).limit(1).maybeSingle()
    return !!data
  } catch { return false }
}
