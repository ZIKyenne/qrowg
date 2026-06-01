import type { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createCheckoutSession } from '../actions/stripe'

export const metadata: Metadata = { title: 'Passer Pro — QRfolio' }

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

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    desc: 'Pour démarrer',
    priceId: null,
    features: [
      '1 page',
      'QR code standard',
      '500 vues / mois',
      'Templates de base',
      'Branding QRfolio visible',
    ],
    featured: false,
    cta: 'Plan actuel',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9,90',
    desc: 'Pour les pros',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Pages illimitées',
      'QR code premium (couleur, logo)',
      'Vues illimitées',
      'Domaine personnalisé',
      'Analytics avancés',
      'Sans branding QRfolio',
      'Export HD pour impression',
      '14 jours gratuits',
    ],
    featured: true,
    cta: 'Essai gratuit 14 jours',
  },
  {
    id: 'business',
    name: 'Business',
    price: '24,90',
    desc: 'Pour les équipes',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    features: [
      'Tout Pro +',
      'Multi-utilisateurs',
      'API publique',
      'Intégrations Stripe, Calendly',
      'WhatsApp Business',
      'Support prioritaire',
      'SLA 99.9%',
    ],
    featured: false,
    cta: 'Commencer',
  },
]

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; feature?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user ? await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single() : { data: null }

  const currentPlan = profile?.plan || 'free'

  return (
    <div style={{
      minHeight: '100vh', background: '#080808', color: '#F5F0E8',
      fontFamily: 'DM Sans, sans-serif',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
    }}>
      {/* Nav */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(201,168,76,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/dashboard" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 300, color: '#F5F0E8', textDecoration: 'none' }}>
          QR<span style={{ color: '#C9A84C', fontWeight: 600 }}>folio</span>
        </a>
        <a href="/dashboard" style={{ color: '#8A8478', fontSize: '13px', textDecoration: 'none' }}>← Retour au dashboard</a>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '60px 32px' }}>

        {/* Success banner */}
        {params.success && (
          <div style={{
            background: 'rgba(57,255,143,0.08)', border: '1px solid rgba(57,255,143,0.3)',
            borderRadius: '8px', padding: '16px 24px', marginBottom: '32px',
            color: '#39FF8F', fontSize: '14px', textAlign: 'center',
          }}>
            🎉 Abonnement activé avec succès ! Bienvenue dans le plan Pro.
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px' }}>
            Tarifs
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 300, letterSpacing: '-1px', marginBottom: '12px' }}>
            Choisissez votre <span style={{ color: '#C9A84C' }}>plan</span>
          </h1>
          <p style={{ color: '#8A8478', fontSize: '15px' }}>
            14 jours gratuits sur Pro · Annulable à tout moment
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: plan.featured
                ? 'linear-gradient(160deg, rgba(201,168,76,0.08) 0%, #111009 60%)'
                : '#111009',
              border: '1px solid ' + (plan.featured ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.12)'),
              borderRadius: '8px', padding: '32px 24px',
              position: 'relative',
            }}>
              {plan.featured && (
                <div style={{
                  position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)',
                  background: '#C9A84C', color: '#080808', fontSize: '9px', letterSpacing: '2px',
                  textTransform: 'uppercase', padding: '3px 14px', borderRadius: '2px', fontWeight: 700,
                }}>
                  ⭐ Populaire
                </div>
              )}

              {currentPlan === plan.id && (
                <div style={{
                  position: 'absolute', top: '-11px', right: '16px',
                  background: '#39FF8F', color: '#080808', fontSize: '9px', letterSpacing: '1px',
                  textTransform: 'uppercase', padding: '3px 10px', borderRadius: '2px', fontWeight: 700,
                }}>
                  Actuel
                </div>
              )}

              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{plan.name}</div>
              <div style={{ fontSize: '12px', color: '#8A8478', marginBottom: '16px' }}>{plan.desc}</div>

              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', fontWeight: 300, color: '#C9A84C', lineHeight: 1, marginBottom: '4px' }}>
                {plan.price}€
              </div>
              <div style={{ fontSize: '12px', color: '#8A8478', marginBottom: '24px' }}>/ mois</div>

              <ul style={{ listStyle: 'none', marginBottom: '28px' }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#8A8478', padding: '5px 0', paddingLeft: '16px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#39FF8F', fontSize: '10px' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.priceId && currentPlan !== plan.id ? (
                <form action={createCheckoutSession.bind(null, plan.priceId)}>
                  <button type="submit" style={{
                    width: '100%',
                    background: plan.featured ? '#C9A84C' : 'transparent',
                    border: '1px solid ' + (plan.featured ? '#C9A84C' : 'rgba(201,168,76,0.3)'),
                    color: plan.featured ? '#080808' : '#C9A84C',
                    padding: '12px', borderRadius: '2px', fontSize: '13px',
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {plan.cta}
                  </button>
                </form>
              ) : (
                <div style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#8A8478', padding: '12px', borderRadius: '2px',
                  fontSize: '13px', textAlign: 'center',
                }}>
                  {currentPlan === plan.id ? '✓ Plan actuel' : plan.cta}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: '64px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '24px' }}>
            Questions fréquentes
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', textAlign: 'left' }}>
            {[
              { q: 'Puis-je annuler à tout moment ?', r: 'Oui, sans engagement. Vous gardez votre plan jusqu\'à la fin de la période.' },
              { q: 'Le QR code change-t-il si je change de plan ?', r: 'Non, votre QR code est permanent et ne change jamais, peu importe votre plan.' },
              { q: 'Que se passe-t-il à la fin du trial ?', r: 'Votre carte est débitée automatiquement. Vous pouvez annuler avant.' },
              { q: 'Puis-je passer de Pro à Business ?', r: 'Oui, depuis le portail client. La différence est calculée au prorata.' },
            ].map((faq, i) => (
              <div key={i} style={{ background: '#111009', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '6px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{faq.q}</div>
                <div style={{ fontSize: '13px', color: '#8A8478', lineHeight: 1.6 }}>{faq.r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
