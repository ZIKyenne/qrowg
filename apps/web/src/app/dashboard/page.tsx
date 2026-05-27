import type { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Dashboard' }

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: pages } = await supabase
    .from('pages')
    .select('*, qr_codes(short_code, total_scans)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalViews = (pages ?? []).reduce((sum, p) => sum + (p.total_views || 0), 0)
  const totalScans = (pages ?? []).reduce((sum, p) => sum + ((p.qr_codes as any)?.[0]?.total_scans || 0), 0)
  const publishedCount = (pages ?? []).filter(p => p.status === 'published').length

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', fontFamily: 'DM Sans, sans-serif', color: '#F5F0E8' }}>

      {/* Sidebar */}
      <aside style={{
        width: '240px', background: '#0C0B09', borderRight: '1px solid rgba(201,168,76,0.1)',
        display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 300, color: '#F5F0E8' }}>
            QR<span style={{ color: '#C9A84C', fontWeight: 600 }}>folio</span>
          </div>
          {profile?.full_name && (
            <div style={{ fontSize: '12px', color: '#8A8478', marginTop: '4px' }}>Bonjour, {profile.full_name.split(' ')[0]} 👋</div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {[
            { icon: '▦', label: 'Mes pages', href: '/dashboard', active: true },
            { icon: '◈', label: 'QR Codes', href: '/dashboard/qr-codes', active: false },
            { icon: '◎', label: 'Analytics', href: '/dashboard/analytics', active: false },
            { icon: '◇', label: 'Domaines', href: '/dashboard/domains', active: false },
            { icon: '⚙', label: 'Paramètres', href: '/dashboard/settings', active: false },
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

        {/* Plan */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '12px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '4px' }}>
              Plan {profile?.plan || 'Free'}
            </div>
            <div style={{ fontSize: '12px', color: '#8A8478', marginBottom: '8px' }}>
              {totalViews} / 500 vues ce mois
            </div>
            <a href="/upgrade" style={{
              display: 'block', background: '#C9A84C', color: '#080808',
              textAlign: 'center', padding: '7px', borderRadius: '2px',
              fontSize: '11px', fontWeight: 700, textDecoration: 'none',
            }}>
              Passer Pro
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 300, letterSpacing: '-0.5px', marginBottom: '4px' }}>
              Mes <span style={{ color: '#C9A84C' }}>Pages</span>
            </h1>
            <p style={{ color: '#8A8478', fontSize: '14px' }}>{(pages ?? []).length} page{(pages ?? []).length > 1 ? 's' : ''} créée{(pages ?? []).length > 1 ? 's' : ''}</p>
          </div>
          <a href="/dashboard/pages/new" style={{
            background: '#C9A84C', color: '#080808', padding: '11px 24px',
            borderRadius: '2px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
          }}>
            + Nouvelle page
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Pages publiées', value: publishedCount },
            { label: 'Scans ce mois', value: totalScans },
            { label: 'Vues totales', value: totalViews },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#111009', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '4px', padding: '20px 24px' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 300, color: '#C9A84C', lineHeight: 1, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#8A8478' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Pages list */}
        {(pages ?? []).length === 0 ? (
          <div style={{ border: '1px dashed rgba(201,168,76,0.2)', borderRadius: '8px', padding: '64px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>◈</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, marginBottom: '8px' }}>
              Votre première page vous attend
            </h3>
            <p style={{ color: '#8A8478', fontSize: '14px', marginBottom: '24px' }}>
              Créez votre landing page en quelques minutes
            </p>
            <a href="/dashboard/pages/new" style={{
              background: '#C9A84C', color: '#080808', padding: '12px 28px',
              borderRadius: '2px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            }}>
              Créer ma première page →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(pages ?? []).map((page: any) => (
              <div key={page.id} style={{
                background: '#111009', border: '1px solid rgba(201,168,76,0.1)',
                borderRadius: '6px', padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                {/* Status dot */}
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: page.status === 'published' ? '#39FF8F' : '#8A8478',
                  boxShadow: page.status === 'published' ? '0 0 8px rgba(57,255,143,0.5)' : 'none',
                }} />

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>{page.title}</div>
                  <div style={{ fontSize: '12px', color: '#8A8478' }}>
                    qrfolio.app/{page.slug} · {page.status === 'published' ? 'Publié' : 'Brouillon'} · {page.total_views || 0} vues
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {page.status === 'published' && (
                    <a href={'/' + page.slug} target="_blank" rel="noopener noreferrer" style={{
                      border: '1px solid rgba(57,255,143,0.3)', color: '#39FF8F',
                      padding: '6px 14px', borderRadius: '2px', fontSize: '12px',
                      textDecoration: 'none', background: 'rgba(57,255,143,0.05)',
                    }}>
                      Voir ↗
                    </a>
                  )}
                  <a href={'/dashboard/builder/' + page.id} style={{
                    border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C',
                    padding: '6px 14px', borderRadius: '2px', fontSize: '12px',
                    textDecoration: 'none', background: 'rgba(201,168,76,0.05)',
                  }}>
                    Modifier
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
