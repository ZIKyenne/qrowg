import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QRfolio — Créez votre page en minutes',
  description: 'La plateforme SaaS pour créer une landing page personnelle reliée à un QR code unique et dynamique.',
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-canvas overflow-hidden">
      {/* Background radial */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,168,76,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 300, color: '#F5F0E8' }}>
          QR<span style={{ color: '#C9A84C', fontWeight: 600 }}>folio</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/auth/login" style={{ color: '#8A8478', fontSize: '14px', textDecoration: 'none' }}>
            Connexion
          </a>
          <a
            href="/auth/signup"
            style={{
              background: '#C9A84C',
              color: '#080808',
              padding: '10px 24px',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Commencer gratuitement
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-8 pt-20 pb-32 max-w-5xl mx-auto">
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(201,168,76,0.3)',
            background: 'rgba(201,168,76,0.1)',
            color: '#C9A84C',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            padding: '6px 16px',
            borderRadius: '2px',
            marginBottom: '32px',
          }}
        >
          <span>●</span> Nouveau — QR codes dynamiques & brandés
        </div>

        {/* Titre */}
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(48px, 8vw, 96px)',
            fontWeight: 300,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            color: '#F5F0E8',
            marginBottom: '24px',
          }}
        >
          Votre identité digitale,<br />
          <span style={{ color: '#C9A84C' }}>en un scan.</span>
        </h1>

        {/* Sous-titre */}
        <p
          style={{
            color: '#8A8478',
            fontSize: '17px',
            lineHeight: 1.7,
            maxWidth: '520px',
            margin: '0 auto 40px',
          }}
        >
          Créez une landing page personnelle ou professionnelle en quelques minutes.
          Un QR code unique la relie à votre page — pour toujours.
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/auth/signup"
            style={{
              background: '#C9A84C',
              color: '#080808',
              padding: '14px 36px',
              borderRadius: '2px',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Créer ma page — Gratuit →
          </a>
          <a
            href="#demo"
            style={{
              border: '1px solid rgba(201,168,76,0.3)',
              color: '#8A8478',
              padding: '14px 36px',
              borderRadius: '2px',
              fontSize: '15px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Voir la démo
          </a>
        </div>

        {/* Social proof */}
        <p style={{ marginTop: '24px', color: '#4A4640', fontSize: '13px' }}>
          Gratuit · Aucune carte bancaire requise · Setup en 3 minutes
        </p>
      </section>

      {/* Features */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px 96px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2px',
          }}
        >
          {[
            {
              icon: '⚡',
              title: 'Builder drag & drop',
              desc: 'Éditeur visuel intuitif. Photo, bio, liens, galerie, formulaire — glissez, déposez, publiez.',
            },
            {
              icon: '◈',
              title: 'QR Code dynamique',
              desc: 'Votre QR code ne change jamais, même si vous modifiez votre page. Imprimez-le une fois, pour toujours.',
            },
            {
              icon: '◎',
              title: 'Analytics en temps réel',
              desc: 'Combien de scans ? Depuis où ? Quel appareil ? Toutes les réponses dans un dashboard épuré.',
            },
            {
              icon: '◇',
              title: '6 templates par métier',
              desc: 'Artiste, restaurant, freelance, événement, CV, boutique. Un point de départ parfait pour chaque profil.',
            },
            {
              icon: '◉',
              title: 'Domaine personnalisé',
              desc: 'Connectez votre propre domaine en quelques clics. SSL automatique inclus.',
            },
            {
              icon: '◈',
              title: 'Intégrations puissantes',
              desc: 'Stripe, Calendly, WhatsApp, Instagram Feed — tout ce dont vous avez besoin sur une seule page.',
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                background: '#111009',
                border: '1px solid rgba(201,168,76,0.12)',
                padding: '32px',
                transition: 'border-color 0.2s',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  marginBottom: '16px',
                  color: '#C9A84C',
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: '#8A8478', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px 96px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: '#C9A84C',
            marginBottom: '12px',
          }}
        >
          Tarifs
        </div>
        <h2
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 300,
            letterSpacing: '-0.02em',
            marginBottom: '48px',
          }}
        >
          Simple. Transparent.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            {
              name: 'Free',
              price: '0',
              desc: 'Pour démarrer',
              features: ['1 page', 'QR code standard', '500 vues/mois', 'Templates de base'],
              cta: 'Commencer',
              featured: false,
            },
            {
              name: 'Pro',
              price: '9,90',
              desc: 'Pour les pros',
              features: ['Pages illimitées', 'QR code premium', 'Domaine custom', 'Analytics avancés', 'Sans branding'],
              cta: 'Essai 14 jours gratuit',
              featured: true,
            },
            {
              name: 'Business',
              price: '24,90',
              desc: 'Pour les équipes',
              features: ['Tout Pro +', 'Multi-utilisateurs', 'API publique', 'Intégrations', 'Support prioritaire'],
              cta: 'Contacter',
              featured: false,
            },
          ].map((p, i) => (
            <div
              key={i}
              style={{
                background: p.featured ? 'linear-gradient(160deg, rgba(201,168,76,0.08) 0%, #111009 60%)' : '#111009',
                border: `1px solid ${p.featured ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.12)'}`,
                borderRadius: '4px',
                padding: '32px 24px',
                position: 'relative',
              }}
            >
              {p.featured && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#C9A84C',
                    color: '#080808',
                    fontSize: '9px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    padding: '3px 12px',
                    borderRadius: '2px',
                    fontWeight: 700,
                  }}
                >
                  Populaire
                </div>
              )}
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
              <div style={{ fontSize: '12px', color: '#8A8478', marginBottom: '16px' }}>{p.desc}</div>
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '48px',
                  fontWeight: 300,
                  color: '#C9A84C',
                  lineHeight: 1,
                  marginBottom: '4px',
                }}
              >
                {p.price}€
              </div>
              <div style={{ fontSize: '12px', color: '#8A8478', marginBottom: '24px' }}>/ mois</div>
              <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: '24px' }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ fontSize: '13px', color: '#8A8478', padding: '5px 0', paddingLeft: '16px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#39FF8F', fontSize: '10px' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/auth/signup"
                style={{
                  display: 'block',
                  background: p.featured ? '#C9A84C' : 'transparent',
                  border: `1px solid ${p.featured ? '#C9A84C' : 'rgba(201,168,76,0.3)'}`,
                  color: p.featured ? '#080808' : '#C9A84C',
                  padding: '11px',
                  borderRadius: '2px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(201,168,76,0.12)',
          padding: '32px',
          textAlign: 'center',
          color: '#4A4640',
          fontSize: '13px',
        }}
      >
        © 2025 QRfolio · Fait avec passion ·{' '}
        <a href="/legal" style={{ color: '#4A4640' }}>Mentions légales</a>
      </footer>
    </main>
  )
}
