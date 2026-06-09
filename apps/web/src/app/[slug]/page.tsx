<<<<<<< HEAD
import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { resolveTheme, fontsUrl, backgroundStyle, readableText, type PageTheme } from '../dashboard/builder/themes'
=======
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PublicPageClient from "./PublicPageClient"
import type { Metadata } from "next"
>>>>>>> 0975e2ee40b8d075e54661ca298f7f8228f45550

interface Props { params: { slug: string } }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qrfolio.app"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createServerSupabaseClient()
  const { data: page } = await supabase
    .from("pages")
    .select("title, seo_title, seo_description, og_image_url, slug, profiles(full_name, username)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single()

  if (!page) return { title: "Page introuvable" }

  const profile = page.profiles as any
  const title = page.seo_title || page.title
  const description = page.seo_description || `Decouvre la page de ${profile?.full_name || page.title} sur QRfolio`
  const image = page.og_image_url || `${APP_URL}/og-image.png`
  const url = `${APP_URL}/${page.slug}`

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      siteName: "QRfolio",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  }
}

export default async function PublicPage({ params }: Props) {
  const supabase = await createServerSupabaseClient()

  const { data: page } = await supabase
    .from("pages")
    .select("*, profiles(full_name, username, avatar_url)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single()

  if (!page) notFound()

<<<<<<< HEAD
  const blocks = (page.blocks ?? []).sort((a: any, b: any) => a.position - b.position)
  const theme = resolveTheme(page.theme)

  return (
    <div style={{
      minHeight: '100vh',
      ...backgroundStyle(theme),
      color: theme.text,
      fontFamily: `'${theme.font_body}', sans-serif`,
    }}>
      {/* Google Fonts */}
      <link href={fontsUrl(theme)} rel="stylesheet" />

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

function BlockRenderer({ block, theme }: { block: any; theme: PageTheme }) {
  const primary = theme.primary
  const accent = theme.accent
  const text = theme.text
  const muted = theme.muted
  const surface = theme.surface
  const onPrimary = readableText(primary)

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
              background: surface, border: '1px solid ' + accent + '33',
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
            display: 'inline-block', background: primary, color: onPrimary,
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
          <div style={{ background: surface, border: '1px solid ' + accent + '22', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: text }}>Me contacter</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="Votre nom" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid ' + muted + '44', borderRadius: '4px', padding: '10px 12px', color: text, fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              <input placeholder="Votre email" type="email" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid ' + muted + '44', borderRadius: '4px', padding: '10px 12px', color: text, fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              <textarea placeholder="Votre message" rows={4} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid ' + muted + '44', borderRadius: '4px', padding: '10px 12px', color: text, fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              <button style={{ background: primary, color: onPrimary, border: 'none', borderRadius: '4px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
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
=======
  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", page.id)
    .eq("is_visible", true)
    .order("position")

  // JSON-LD structured data
  const profile = page.profiles as any
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": page.title,
    "description": page.seo_description || `Page de ${profile?.full_name || page.title}`,
    "url": `${APP_URL}/${page.slug}`,
    "mainEntity": {
      "@type": "Person",
      "name": profile?.full_name || page.title,
      "url": `${APP_URL}/${page.slug}`,
      ...(profile?.avatar_url ? { "image": profile.avatar_url } : {}),
    }
  }

  // Track page view
  supabase.from("page_views").insert({
    page_id: page.id,
    source: "direct",
    device: "unknown",
  }).then(() => {})

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicPageClient page={page} blocks={blocks || []} />
    </>
  )
}
>>>>>>> 0975e2ee40b8d075e54661ca298f7f8228f45550
