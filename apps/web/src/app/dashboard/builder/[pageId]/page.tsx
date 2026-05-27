import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import BuilderClient from './BuilderClient'

async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}

export default async function BuilderPage({ params }: { params: { pageId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', params.pageId)
    .eq('user_id', user.id)
    .single()

  if (!page) notFound()

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('page_id', page.id)
    .order('position', { ascending: true })

  const BLOCK_ICONS: Record<string, string> = {
    profile: '👤', bio: '✍️', social_links: '🔗', gallery: '🖼️',
    cta_button: '⚡', contact_form: '✉️', google_maps: '📍',
    testimonials: '💬', visit_counter: '👁️', video: '▶️',
  }
  const BLOCK_LABELS: Record<string, string> = {
    profile: 'Profil', bio: 'Bio', social_links: 'Réseaux sociaux', gallery: 'Galerie',
    cta_button: 'Bouton CTA', contact_form: 'Formulaire', google_maps: 'Carte',
    testimonials: 'Témoignages', visit_counter: 'Compteur', video: 'Vidéo',
  }

  const initialBlocks = (blocks ?? []).map(b => ({
    ...b,
    icon: BLOCK_ICONS[b.type] ?? '📦',
    label: BLOCK_LABELS[b.type] ?? b.type,
  }))

  return <BuilderClient page={page} initialBlocks={initialBlocks} />
}
