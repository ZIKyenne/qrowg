import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
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

  // Trouver le QR code par son short_code
  const { data: qr } = await supabase
    .from('qr_codes')
    .select('id, page_id, pages(slug, status)')
    .eq('short_code', code)
    .single()

  if (!qr || !qr.pages) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const page = qr.pages as any

  // Vérifier que la page est publiée
  if (page.status !== 'published') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Enregistrer le scan en arrière-plan
  const userAgent = request.headers.get('user-agent') || ''
  const device = detectDevice(userAgent)
  const os = detectOS(userAgent)
  const browser = detectBrowser(userAgent)
  const referrer = request.headers.get('referer') || null
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || ''
  const ipHash = ip ? simpleHash(ip) : null

  // Insert scan (non-bloquant)
  supabase.from('scans').insert({
    qr_code_id: qr.id,
    page_id: qr.page_id,
    device,
    os,
    browser,
    referrer,
    ip_hash: ipHash,
  }).then(() => {})

  // Rediriger vers la page publique
  return NextResponse.redirect(new URL('/' + page.slug, request.url))
}

function detectDevice(ua: string): string {
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  if (/windows|macintosh|linux/i.test(ua)) return 'desktop'
  return 'unknown'
}

function detectOS(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows'
  if (/macintosh|mac os/i.test(ua)) return 'macOS'
  if (/iphone|ipad/i.test(ua)) return 'iOS'
  if (/android/i.test(ua)) return 'Android'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Unknown'
}

function detectBrowser(ua: string): string {
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari'
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/edge/i.test(ua)) return 'Edge'
  return 'Unknown'
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}
