import type { Metadata } from 'next'
import QrowgLogo from '@/components/QrowgLogo'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata: Metadata = { title: 'Nouveau mot de passe' }

export default function ResetPasswordPage() {
  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'calc(24px + env(safe-area-inset-top)) 22px calc(24px + env(safe-area-inset-bottom))',
      position: 'relative', isolation: 'isolate', overflow: 'hidden',
    }}>
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/" aria-label="QRowg — accueil" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            <QrowgLogo size={26} />
          </a>
          <h1 style={{ color: '#F8F4EC', fontSize: 23, fontWeight: 700, margin: '18px 0 6px', fontFamily: 'Fraunces, serif' }}>Nouveau mot de passe</h1>
          <p style={{ color: '#C9C3B6', fontSize: 14.5, margin: 0 }}>Choisissez un mot de passe pour sécuriser votre compte.</p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--line-strong)', borderRadius: 14, padding: 'clamp(22px, 6vw, 30px)' }}>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  )
}
