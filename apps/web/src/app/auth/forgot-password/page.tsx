import type { Metadata } from 'next'
import { AlertTriangle } from 'lucide-react'
import Particles from '@/components/Particles'
import ForgotPasswordForm from './ForgotPasswordForm'

export const metadata: Metadata = { title: 'Mot de passe oublié' }

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  return (
    <div style={{
      minHeight: '100dvh', background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'calc(24px + env(safe-area-inset-top)) 22px calc(24px + env(safe-area-inset-bottom))',
      position: 'relative', isolation: 'isolate', overflow: 'hidden',
      backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
    }}>
      <Particles behind />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/" style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 300, color: '#F5F0E8', textDecoration: 'none' }}>
            QR<span style={{ color: '#C9A84C', fontWeight: 600 }}>folio</span>
          </a>
          <h1 style={{ color: '#F8F4EC', fontSize: 23, fontWeight: 700, margin: '18px 0 6px', fontFamily: 'Fraunces, serif' }}>Mot de passe oublié</h1>
          <p style={{ color: '#C9C3B6', fontSize: 14.5, margin: 0 }}>Entrez votre email : nous vous enverrons un lien pour en choisir un nouveau.</p>
        </div>

        <div style={{ background: '#141210', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 'clamp(22px, 6vw, 30px)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {sp.error && (
            <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 11, padding: '12px 14px', marginBottom: 18, fontSize: 13.5, color: 'var(--danger)', lineHeight: 1.45 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{decodeURIComponent(sp.error)}</span>
            </div>
          )}
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
