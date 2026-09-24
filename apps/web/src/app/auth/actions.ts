'use server'

import { createServerClient } from '@supabase/ssr'
import { fetchBorne } from "@/lib/appelQuiNAttendPas"
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { destinationApresInscription, doitEnvoyerBienvenue, destinationInterne } from '@/lib/apresInscription'
import { doitEtreRefuse } from '@/lib/motDePasseCompromisServeur'
import { messageCompromis } from '@/lib/motDePasseCompromis'

async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

// Traduit les erreurs Supabase Auth (anglais) en messages FR courts pour le tunnel d'inscription.
function frAuthError(e: { message?: string } | null): string {
  const m = (e?.message || '').toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered')) return 'Cet email a déjà un compte. Connectez-vous.'
  if (m.includes('invalid login')) return 'Email ou mot de passe incorrect.'
  if (m.includes('email not confirmed')) return 'Confirmez votre email via le lien reçu par mail.'
  if (m.includes('password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (m.includes('unable to validate email') || m.includes('invalid email') || m.includes('invalid format')) return 'Adresse email invalide.'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('for security purposes')) return 'Trop de tentatives. Réessayez dans quelques minutes.'
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) return 'Les inscriptions sont momentanément indisponibles.'
  return 'Une erreur est survenue. Veuillez réessayer.'
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const ref = (formData.get('ref') as string | null)?.trim().toLowerCase() || null

  // La destination interne est calculée AVANT le contrôle : un refus doit
  // ramener sur le formulaire sans perdre le brouillon composé avant l'inscription
  // (même raison qu'en bas de cette fonction).
  const retour = destinationInterne((formData.get('redirect') as string | null) || '')

  // Mot de passe déjà présent dans une fuite connue : on refuse ici, avant même
  // d'appeler Supabase. Le contrôle que l'offre payante de Supabase propose
  // existe donc quand même — et le mot de passe ne sort pas du serveur, seuls
  // 5 caractères de son empreinte partent (voir lib/motDePasseCompromis.ts).
  // Si HIBP ne répond pas, on laisse passer : c'est écrit là-bas, et vérifié.
  const fuite = await doitEtreRefuse(password)
  if (fuite.refuse) {
    redirect('/auth/signup?error=' + encodeURIComponent(messageCompromis(fuite.occurrences)) + (retour ? '&redirect=' + encodeURIComponent(retour) : ''))
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // `referred_by_code` est lu par le trigger handle_new_user pour créer
    // l'enregistrement de parrainage (affiliation via lien ?ref=CODE).
    options: { data: ref ? { full_name, referred_by_code: ref } : { full_name } },
  })

  // L'e-mail de bienvenue ne part QUE si le compte est utilisable tout de suite.
  // Sans session, il arriverait avant le lien de confirmation — et `/auth/callback`
  // l'enverrait une seconde fois au moment où la personne clique (lot v99).
  if (!error && doitEnvoyerBienvenue(data)) {
    try {
      await fetchBorne(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': process.env.CRON_SECRET || '',
        },
        body: JSON.stringify({ email, name: full_name }),
      }, "ecran")
    } catch {}
  }
  // `retour` est calculée tout en haut et conservée AUSSI en cas d'erreur :
  // sans ça, un mot de passe mal tapé faisait perdre le brouillon composé avant
  // l'inscription.
  if (error) redirect('/auth/signup?error=' + encodeURIComponent(frAuthError(error)) + (retour ? '&redirect=' + encodeURIComponent(retour) : ''))
  // `data` était jeté : les trois réponses de Supabase — compte prêt, compte à
  // confirmer, adresse déjà inscrite — menaient toutes au tableau de bord, donc
  // deux fois sur trois à un écran de connexion sans explication (lot v99).
  redirect(destinationApresInscription(data, retour, email))
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  // Ce filtre était recopié à la main ici (`to.startsWith('/') && !to.startsWith('//')`),
  // pendant que `signUp` appelait `destinationInterne`. Deux copies d'une même
  // règle finissent par ne plus dire la même chose — celle-ci avait déjà perdu
  // le `trim()`. Une seule règle, dans la bibliothèque (lot v179).
  const retour = destinationInterne((formData.get('redirect') as string | null) || '')
  if (error) redirect('/auth/login?error=' + encodeURIComponent(frAuthError(error)) + (retour ? '&redirect=' + encodeURIComponent(retour) : ''))
  // Redirection interne sûre (ex. lien d'invitation, reprise d'un brouillon) ; sinon dashboard.
  redirect(retour || '/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
