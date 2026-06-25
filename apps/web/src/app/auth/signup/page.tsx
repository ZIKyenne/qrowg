
import type { Metadata } from 'next'
import { signUp } from '../actions'

export const metadata: Metadata = { title: 'Créer un compte' }

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ref?: string }>
}) {
  const sp = await searchParams
  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px',
      backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <a href="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 300, color: '#F5F0E8', textDecoration: 'none' }}>
            QR<span style={{ color: '#C9A84C', fontWeight: 600 }}>folio</span>
          </a>
          <p style={{ color: '#8A8478', fontSize: '14px', marginTop: '8px' }}>Gratuit · Setup en 3 minutes</p>
        </div>

        <div style={{ background: '#111009', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', padding: '36px' }}>

          {sp.error && (
            <div style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '4px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#FF8080' }}>
              {decodeURIComponent(sp.error)}
            </div>
          )}

          <form action={signUp}>
            {sp.ref && <input type="hidden" name="ref" value={sp.ref} />}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#8A8478', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Nom complet</label>
              <input type="text" name="full_name" placeholder="Emilien Lampson" required
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '12px 14px', color: '#F5F0E8', fontSize: '14px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#8A8478', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Email</label>
              <input type="email" name="email" placeholder="toi@email.com" required
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '12px 14px', color: '#F5F0E8', fontSize: '14px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#8A8478', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Mot de passe</label>
              <input type="password" name="password" placeholder="8 caractères minimum" required minLength={8}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '12px 14px', color: '#F5F0E8', fontSize: '14px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
            <button type="submit" style={{ width: '100%', background: '#C9A84C', color: '#080808', border: 'none', borderRadius: '2px', padding: '13px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Créer mon compte →
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#8A8478' }}>
          Déjà un compte ?{' '}
          <a href="/auth/login" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 500 }}>Se connecter</a>
        </p>
      </div>
    </div>
  )
}
