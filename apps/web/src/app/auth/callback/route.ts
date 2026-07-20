// Echange le code PKCE d'un lien email (recuperation de mot de passe,
// confirmation) contre une session, puis redirige vers `next`. Sans ce
// handler, les liens de reinitialisation ne peuvent pas ouvrir de session.
import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") || "/dashboard"

  // Derriere un proxy (Vercel), preferer l'hote transmis pour construire l'URL finale.
  const forwardedHost = req.headers.get("x-forwarded-host")
  const base = forwardedHost ? `https://${forwardedHost}` : origin
  // Ne rediriger que vers des chemins internes (evite les open redirects).
  const safeNext = next.startsWith("/") ? next : "/dashboard"

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${base}${safeNext}`)
  }

  const msg = "Lien invalide ou expiré. Merci de refaire une demande."
  return NextResponse.redirect(`${base}/auth/forgot-password?error=${encodeURIComponent(msg)}`)
}
