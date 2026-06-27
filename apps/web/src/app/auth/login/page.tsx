
import type { Metadata } from 'next'
import { signIn } from '../actions'
import Particles from '@/components/Particles'

export const metadata: Metadata = { title: 'Connexion' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px', position: 'relative', isolation: 'isolate', overflow: 'hidden',
      backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
    }}>
      <Particles behind />
      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <a href="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 300, color: '#F5F0E8', textDecoration: 'none' }}>
            QR<span style={{ color: '#C9A84C', fontWeight: 600 }}>folio</span>
          </a>
          <p style={{ color: '#8A8478', fontSize: '14px', marginTop: '8px' }}>Bon retour parmi nous</p>
        </div>

        <div style={{ background: '#111009', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', padding: '36px' }}>

          {sp.error && (
            <div style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '4px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#FF8080' }}>
              {decodeURIComponent(sp.error)}
            </div>
          )}

          <form action={signIn}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#8A8478', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Email</label>
              <input type="email" name="email" placeholder="toi@email.com" required
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '12px 14px', color: '#F5F0E8', fontSize: '14px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#8A8478', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Mot de passe</label>
              <input type="password" name="password" placeholder="••••••••" required
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '12px 14px', color: '#F5F0E8', fontSize: '14px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
            <button type="submit" style={{ width: '100%', background: '#C9A84C', color: '#080808', border: 'none', borderRadius: '2px', padding: '13px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Se connecter
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#8A8478' }}>
          Pas encore de compte ?{' '}
          <a href="/auth/signup" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 500 }}>Créer un compte</a>
        </p>
      </div>
    </div>
  )
}
