import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: page } = await supabase
    .from('pages')
    .select('title, seo_title, seo_description, og_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!page) return { title: 'Page introuvable' }

  return {
    title: page.seo_title || page.title,
    description: page.seo_description || '',
    openGraph: {
      title: page.seo_title || page.title,
      description: page.seo_description || '',
      images: page.og_image_url ? [page.og_image_url] : [],
    },
  }
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('pages')
    .select('*, blocks(*), profiles(full_name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!page) notFound()

  const blocks = (page.blocks ?? []).sort((a: any, b: any) => a.position - b.position)
  const theme = page.theme as Record<string, string>

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.background || '#080808',
      color: theme.text || '#F5F0E8',
      fontFamily: `'${theme.font_body || 'DM Sans'}', sans-serif`,
    }}>
      {/* Google Fonts */}
      <link
        href={`https://fonts.googleapis.com/css2?family=${(theme.font_display || 'Cormorant+Garamond').replace(' ', '+')}:wght@300;400;600&family=${(theme.font_body || 'DM+Sans').replace(' ', '+')}:wght@400;500;600&display=swap`}
        rel="stylesheet"
      />

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 20px 80px' }}>
        {blocks.map((block: any) => (
          <BlockRenderer key={block.id} block={block} theme={theme} />
        ))}

        {/* QRfolio branding (Free plan) */}
        <div style={{ textAlign: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <a
            href={process.env.NEXT_PUBLIC_APP_URL || 'https://qrfolio.app'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', letterSpacing: '1px' }}
          >
            Créé avec QRfolio
          </a>
        </div>
      </div>
    </div>
  )
}

function BlockRenderer({ block, theme }: { block: any; theme: Record<string, string> }) {
  const primary = theme.primary || '#C9A84C'
  const text = theme.text || '#F5F0E8'
  const muted = 'rgba(255,255,255,0.5)'

  switch (block.type) {
    case 'profile': {
      const c = block.content as any
      return (
        <div style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '16px' }}>
          {c.photo_url ? (
            <img src={c.photo_url} alt={c.name} style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid ' + primary, marginBottom: '16px' }} />
          ) : (
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '2px solid ' + primary, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
              👤
            </div>
          )}
          {c.name && <h1 style={{ fontFamily: theme.font_display, fontSize: '28px', fontWeight: 300, marginBottom: '4px', color: text }}>{c.name}</h1>}
          {c.title && <p style={{ fontSize: '14px', color: primary, letterSpacing: '0.5px' }}>{c.title}</p>}
        </div>
      )
    }

    case 'bio': {
      const c = block.content as any
      return (
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: muted }}>{c.text}</p>
        </div>
      )
    }

    case 'social_links': {
      const c = block.content as any
      const ICONS: Record<string, string> = {
        instagram: '📸', twitter: '🐦', linkedin: '💼', github: '💻',
        tiktok: '🎵', youtube: '▶️', facebook: '📘', behance: '🎨',
        dribbble: '🏀', spotify: '🎧', custom: '🔗',
      }
      return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {(c.links || []).filter((l: any) => l.url).map((link: any, i: number) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px', padding: '8px 16px', textDecoration: 'none',
              color: text, fontSize: '13px',
            }}>
              <span>{ICONS[link.platform] || '🔗'}</span>
              {link.label || link.platform}
            </a>
          ))}
        </div>
      )
    }

    case 'cta_button': {
      const c = block.content as any
      return (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <a href={c.url || '#'} target={c.open_new_tab ? '_blank' : '_self'} rel="noopener noreferrer" style={{
            display: 'inline-block', background: primary, color: '#080808',
            padding: '14px 36px', borderRadius: '4px', textDecoration: 'none',
            fontSize: '15px', fontWeight: 600, letterSpacing: '0.3px',
          }}>
            {c.label || 'En savoir plus'}
          </a>
        </div>
      )
    }

    case 'contact_form': {
      return (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: text }}>Me contacter</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="Votre nom" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px 12px', color: text, fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              <input placeholder="Votre email" type="email" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px 12px', color: text, fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              <textarea placeholder="Votre message" rows={4} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px 12px', color: text, fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              <button style={{ background: primary, color: '#080808', border: 'none', borderRadius: '4px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )
    }

    case 'spacer':
      return <div style={{ height: '32px' }} />

    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '24px 0' }} />

    case 'heading': {
      const c = block.content as any
      return <h2 style={{ fontFamily: theme.font_display, fontSize: '24px', fontWeight: 400, marginBottom: '16px', color: text }}>{c.text || 'Titre'}</h2>
    }

    default:
      return null
  }
}
