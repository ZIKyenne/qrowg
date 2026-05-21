import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex' }}>

      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          background: '#0C0B09',
          borderRight: '1px solid rgba(201,168,76,0.1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 300, color: '#F5F0E8' }}>
            QR<span style={{ color: '#C9A84C', fontWeight: 600 }}>folio</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {[
            { icon: '▦', label: 'Mes pages', href: '/dashboard/pages', active: true },
            { icon: '◈', label: 'QR Codes', href: '/dashboard/qr-codes', active: false },
            { icon: '◎', label: 'Analytics', href: '/dashboard/analytics', active: false },
            { icon: '◇', label: 'Domaines', href: '/dashboard/domains', active: false },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '4px',
                marginBottom: '2px',
                textDecoration: 'none',
                fontSize: '13px',
                background: item.active ? 'rgba(201,168,76,0.08)' : 'transparent',
                color: item.active ? '#C9A84C' : '#8A8478',
                border: `1px solid ${item.active ? 'rgba(201,168,76,0.2)' : 'transparent'}`,
              }}
            >
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Plan badge */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <div
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '4px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '4px' }}>
              Plan Free
            </div>
            <div style={{ fontSize: '12px', color: '#8A8478', marginBottom: '8px' }}>
              0 / 500 vues ce mois
            </div>
            <a
              href="/upgrade"
              style={{
                display: 'block',
                background: '#C9A84C',
                color: '#080808',
                textAlign: 'center',
                padding: '7px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '0.5px',
              }}
            >
              Passer Pro
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '32px',
                fontWeight: 300,
                letterSpacing: '-0.5px',
                marginBottom: '4px',
              }}
            >
              Mes <span style={{ color: '#C9A84C' }}>Pages</span>
            </h1>
            <p style={{ color: '#8A8478', fontSize: '14px' }}>
              Gérez vos landing pages et leurs QR codes
            </p>
          </div>
          <a
            href="/dashboard/builder/new"
            style={{
              background: '#C9A84C',
              color: '#080808',
              padding: '11px 24px',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            + Nouvelle page
          </a>
        </div>

        {/* Empty state */}
        <div
          style={{
            border: '1px dashed rgba(201,168,76,0.2)',
            borderRadius: '8px',
            padding: '80px 40px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 20px',
            }}
          >
            ◈
          </div>
          <h3
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '22px',
              fontWeight: 400,
              marginBottom: '8px',
            }}
          >
            Votre première page vous attend
          </h3>
          <p style={{ color: '#8A8478', fontSize: '14px', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Créez votre landing page en quelques minutes. Choisissez un template, personnalisez, publiez.
          </p>
          <a
            href="/dashboard/builder/new"
            style={{
              background: '#C9A84C',
              color: '#080808',
              padding: '12px 28px',
              borderRadius: '2px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Créer ma première page →
          </a>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '32px',
          }}
        >
          {[
            { label: 'Pages publiées', value: '0' },
            { label: 'Scans ce mois', value: '0' },
            { label: 'Vues totales', value: '0' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: '#111009',
                border: '1px solid rgba(201,168,76,0.1)',
                borderRadius: '4px',
                padding: '20px 24px',
              }}
            >
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '36px',
                  fontWeight: 300,
                  color: '#C9A84C',
                  lineHeight: 1,
                  marginBottom: '4px',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#8A8478', letterSpacing: '0.5px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
