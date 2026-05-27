'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { nanoid } from 'nanoid'

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

// ─── PAGES ────────────────────────────────────────────────────

export async function getMyPages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('pages')
    .select('*, qr_codes(short_code, total_scans)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getPageBySlug(slug: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pages')
    .select('*, blocks(*)')
    .eq('slug', slug)
    .single()

  return data
}

export async function getPageById(id: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pages')
    .select('*, blocks(*)')
    .eq('id', id)
    .single()

  return data
}

export async function createPage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const title = formData.get('title') as string || 'Ma Page'
  const templateId = formData.get('template_id') as string || 'freelance'

  // Générer un slug unique depuis le titre
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'ma-page'

  // Vérifier l'unicité du slug
  let slug = baseSlug
  let i = 1
  while (true) {
    const { data: existing } = await supabase
      .from('pages')
      .select('id')
      .eq('user_id', user.id)
      .eq('slug', slug)
      .single()

    if (!existing) break
    slug = baseSlug + '-' + i
    i++
  }

  const { data: page, error } = await supabase
    .from('pages')
    .insert({
      user_id: user.id,
      title,
      slug,
      template_id: templateId,
      status: 'draft',
    })
    .select()
    .single()

  if (error || !page) {
    redirect('/dashboard?error=create_failed')
  }

  // Créer les blocs par défaut selon le template
  const defaultBlocks = getDefaultBlocks(templateId, title)
  if (defaultBlocks.length > 0) {
    await supabase.from('blocks').insert(
      defaultBlocks.map((b, i) => ({
        page_id: page.id,
        type: b.type,
        position: i,
        content: b.content,
        styles: {},
      }))
    )
  }

  // Créer le QR code automatiquement
  const shortCode = nanoid(8)
  await supabase.from('qr_codes').insert({
    page_id: page.id,
    user_id: user.id,
    short_code: shortCode,
  })

  redirect('/dashboard/builder/' + page.id)
}

export async function updatePage(pageId: string, data: {
  title?: string
  slug?: string
  status?: 'draft' | 'published' | 'archived'
  seo_title?: string
  seo_description?: string
  theme?: Record<string, string>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const updateData: Record<string, unknown> = { ...data }
  if (data.status === 'published') {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('pages')
    .update(updateData)
    .eq('id', pageId)
    .eq('user_id', user.id)

  return { error: error?.message ?? null }
}

export async function deletePage(pageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId)
    .eq('user_id', user.id)

  if (!error) redirect('/dashboard')
  return { error: error?.message ?? null }
}

// ─── BLOCS ────────────────────────────────────────────────────

export async function saveBlocks(pageId: string, blocks: Array<{
  id?: string
  type: string
  position: number
  content: Record<string, unknown>
  styles: Record<string, unknown>
  is_visible: boolean
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier que la page appartient à l'utilisateur
  const { data: page } = await supabase
    .from('pages')
    .select('id')
    .eq('id', pageId)
    .eq('user_id', user.id)
    .single()

  if (!page) return { error: 'Page non trouvée' }

  // Supprimer les anciens blocs
  await supabase.from('blocks').delete().eq('page_id', pageId)

  // Insérer les nouveaux
  if (blocks.length > 0) {
    const { error } = await supabase.from('blocks').insert(
      blocks.map((b, i) => ({
        page_id: pageId,
        type: b.type,
        position: i,
        content: b.content,
        styles: b.styles,
        is_visible: b.is_visible,
      }))
    )
    if (error) return { error: error.message }
  }

  return { error: null }
}

// ─── HELPERS ──────────────────────────────────────────────────

function getDefaultBlocks(templateId: string, pageName: string) {
  const templates: Record<string, Array<{ type: string; content: Record<string, unknown> }>> = {
    freelance: [
      { type: 'profile', content: { name: pageName, title: 'Mon Métier', photo_placeholder: true } },
      { type: 'bio', content: { text: 'Décrivez votre expertise ici...' } },
      { type: 'social_links', content: { links: [{ platform: 'linkedin', url: '' }, { platform: 'github', url: '' }] } },
      { type: 'cta_button', content: { label: 'Me contacter', url: '#contact', style: 'primary' } },
      { type: 'contact_form', content: { fields: ['name', 'email', 'message'] } },
    ],
    restaurant: [
      { type: 'profile', content: { name: pageName, title: 'Restaurant · Ville', photo_placeholder: true } },
      { type: 'bio', content: { text: 'Notre histoire, notre passion...' } },
      { type: 'cta_button', content: { label: 'Réserver une table', url: '', style: 'primary' } },
      { type: 'google_maps', content: { address: '', zoom: 15 } },
    ],
    artist: [
      { type: 'profile', content: { name: pageName, title: 'Artiste', photo_placeholder: true } },
      { type: 'bio', content: { text: 'Ma vision créative...' } },
      { type: 'gallery', content: { items: [], layout: 'grid' } },
      { type: 'social_links', content: { links: [{ platform: 'instagram', url: '' }] } },
    ],
    event: [
      { type: 'profile', content: { name: pageName, title: 'Date · Lieu', photo_placeholder: true } },
      { type: 'bio', content: { text: 'Présentation de l\'événement...' } },
      { type: 'cta_button', content: { label: 'Je m\'inscris', url: '', style: 'primary' } },
      { type: 'google_maps', content: { address: '', zoom: 15 } },
    ],
    cv: [
      { type: 'profile', content: { name: pageName, title: 'Poste recherché', photo_placeholder: true } },
      { type: 'bio', content: { text: 'Mon parcours en quelques mots...' } },
      { type: 'cta_button', content: { label: 'Télécharger mon CV', url: '', style: 'primary' } },
      { type: 'social_links', content: { links: [{ platform: 'linkedin', url: '' }] } },
    ],
    boutique: [
      { type: 'profile', content: { name: pageName, title: 'Ma Boutique', photo_placeholder: true } },
      { type: 'bio', content: { text: 'Notre sélection...' } },
      { type: 'gallery', content: { items: [], layout: 'grid' } },
      { type: 'cta_button', content: { label: 'Voir la collection', url: '', style: 'primary' } },
    ],
  }

  return templates[templateId] ?? templates.freelance
}
