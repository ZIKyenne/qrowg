import type { Metadata } from 'next'
import { createPage } from '../../../actions/pages'

export const metadata: Metadata = { title: 'Nouvelle Page' }

const TEMPLATES = [
  { id: 'freelance', icon: '💼', name: 'Freelance', desc: 'Consultant, développeur, designer, coach' },
  { id: 'restaurant', icon: '🍽️', name: 'Restaurant', desc: 'Bar, café, cuisine, traiteur' },
  { id: 'artist', icon: '🎨', name: 'Artiste', desc: 'Photographe, illustrateur, musicien' },
  { id: 'event', icon: '🎪', name: 'Événement', desc: 'Concert, conférence, mariage, festival' },
  { id: 'cv', icon: '📄', name: 'CV Numérique', desc: 'Candidature, recrutement, stage' },
  { id: 'boutique', icon: '🛍️', name: 'Boutique', desc: 'Vente, artisan, créateur, shop' },
]

export default function NewPagePage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#080808', color: '#F5F0E8',
      fontFamily: 'DM Sans, sans-serif',
      backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(201,168,76,0.12)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <a href="/dashboard" style={{ color: '#A8A190', textDecoration: 'none', fontSize: '13px' }}>
          ← Dashboard
        </a>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: '13px', color: '#F5F0E8' }}>Nouvelle page</span>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 32px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-block',
            fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
            color: '#C9A84C', marginBottom: '12px',
          }}>
            Étape 1 sur 2
          </div>
          <h1 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: '36px', fontWeight: 300, letterSpacing: '-0.5px',
            marginBottom: '8px',
          }}>
            Choisissez un <span style={{ color: '#C9A84C' }}>template</span>
          </h1>
          <p style={{ color: '#A8A190', fontSize: '14px' }}>
            Vous pourrez tout personnaliser après
          </p>
        </div>

        {/* Template grid */}
        <form action={createPage}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginBottom: '32px',
          }}>
            {TEMPLATES.map((t, i) => (
              <label
                key={t.id}
                htmlFor={'tpl-' + t.id}
                style={{
                  background: '#111009',
                  border: '1px solid rgba(201,168,76,0.15)',
                  borderRadius: '6px',
                  padding: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'border-color 0.15s',
                }}
              >
                <input
                  type="radio"
                  id={'tpl-' + t.id}
                  name="template_id"
                  value={t.id}
                  defaultChecked={i === 0}
                  style={{ accentColor: '#C9A84C' }}
                />
                <span style={{ fontSize: '24px' }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: '#A8A190' }}>{t.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Page name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', fontSize: '11px', letterSpacing: '1.5px',
              textTransform: 'uppercase', color: '#A8A190', marginBottom: '8px',
            }}>
              Nom de la page
            </label>
            <input
              type="text"
              name="title"
              placeholder="Ex: Jean Dupont — Développeur Web"
              required
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px',
                padding: '14px 16px', color: '#F5F0E8', fontSize: '15px',
                outline: 'none', fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%', background: '#C9A84C', color: '#080808',
              border: 'none', borderRadius: '2px', padding: '14px',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.3px',
            }}
          >
            Créer ma page → Accéder au builder
          </button>
        </form>
      </div>
    </div>
  )
}
