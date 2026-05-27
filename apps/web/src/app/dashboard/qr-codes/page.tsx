import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import QRCustomizer from './QRCustomizer'

export const metadata: Metadata = { title: 'QR Codes' }

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

export default async function QRCodesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('*, pages(title, slug, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', fontFamily: 'DM Sans, sans-serif', color: '#F5F0E8' }}>

      {/* Sidebar */}
      <aside style={{
        width: '240px', background: '#0C0B09', borderRight: '1px solid rgba(201,168,76,0.1)',
        display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 300 }}>
            QR<span style={{ color: '#C9A84C', fontWeight: 600 }}>folio</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {[
            { icon: '▦', label: 'Mes pages', href: '/dashboard' },
            { icon: '◈', label: 'QR Codes', href: '/dashboard/qr-codes', active: true },
            { icon: '◎', label: 'Analytics', href: '/dashboard/analytics' },
            { icon: '◇', label: 'Domaines', href: '/dashboard/domains' },
          ].map(item => (
            <a key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 10px', borderRadius: '4px', marginBottom: '2px',
              textDecoration: 'none', fontSize: '13px',
              background: item.active ? 'rgba(201,168,76,0.08)' : 'transparent',
              color: item.active ? '#C9A84C' : '#8A8478',
              border: '1px solid ' + (item.active ? 'rgba(201,168,76,0.2)' : 'transparent'),
            }}>
              <span>{item.icon}</span> {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 300, marginBottom: '4px' }}>
            Mes <span style={{ color: '#C9A84C' }}>QR Codes</span>
          </h1>
          <p style={{ color: '#8A8478', fontSize: '14px' }}>
            {(qrCodes ?? []).length} QR code{(qrCodes ?? []).length > 1 ? 's' : ''} — permanents et personnalisables
          </p>
        </div>

        {(qrCodes ?? []).length === 0 ? (
          <div style={{ border: '1px dashed rgba(201,168,76,0.2)', borderRadius: '8px', padding: '64px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>◈</div>
            <p style={{ color: '#8A8478', marginBottom: '24px' }}>
              Créez votre première page pour générer un QR code
            </p>
            <a href="/dashboard/pages/new" style={{
              background: '#C9A84C', color: '#080808', padding: '12px 28px',
              borderRadius: '2px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            }}>
              Créer une page →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(qrCodes ?? []).map((qr: any) => {
              const page = qr.pages as any
              const qrUrl = `${appUrl}/q/${qr.short_code}`

              return (
                <div key={qr.id} style={{
                  background: '#111009', border: '1px solid rgba(201,168,76,0.12)',
                  borderRadius: '8px', padding: '28px',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '2px' }}>
                        {page?.title || 'Sans titre'}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#8A8478' }}>
                        <span style={{
                          display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                          background: page?.status === 'published' ? '#39FF8F' : '#8A8478',
                          marginRight: '6px', verticalAlign: 'middle',
                        }} />
                        {page?.status === 'published' ? 'Publiée' : 'Brouillon'} · {appUrl}/{page?.slug}
                      </div>
                    </div>
                    <a href={'/dashboard/builder/' + page?.id} style={{
                      border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C',
                      padding: '7px 16px', borderRadius: '2px', fontSize: '12px',
                      textDecoration: 'none',
                    }}>
                      Modifier la page
                    </a>
                  </div>

                  {/* QR Customizer */}
                  <QRCustomizer
                    value={qrUrl}
                    shortCode={qr.short_code}
                    totalScans={qr.total_scans || 0}
                    pageTitle={page?.title}
                  />
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
