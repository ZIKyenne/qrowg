'use client'

import { useState } from 'react'

const BLOCK_TYPES = [
  { type: 'profile', icon: '👤', label: 'Profil' },
  { type: 'bio', icon: '✍️', label: 'Bio' },
  { type: 'social_links', icon: '🔗', label: 'Réseaux sociaux' },
  { type: 'gallery', icon: '🖼️', label: 'Galerie' },
  { type: 'cta_button', icon: '⚡', label: 'Bouton CTA' },
  { type: 'contact_form', icon: '✉️', label: 'Formulaire' },
  { type: 'google_maps', icon: '📍', label: 'Carte' },
  { type: 'testimonials', icon: '💬', label: 'Témoignages' },
  { type: 'visit_counter', icon: '👁️', label: 'Compteur' },
  { type: 'video', icon: '▶️', label: 'Vidéo' },
]

type Block = {
  id: string
  type: string
  icon: string
  label: string
}

export default function BuilderPage() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', type: 'profile', icon: '👤', label: 'Profil' },
    { id: '2', type: 'bio', icon: '✍️', label: 'Bio' },
    { id: '3', type: 'social_links', icon: '🔗', label: 'Réseaux sociaux' },
  ])
  const [selectedId, setSelectedId] = useState<string | null>('1')
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [pageName, setPageName] = useState('Ma Page')
  const [dragging, setDragging] = useState<string | null>(null)

  const addBlock = (type: string) => {
    const found = BLOCK_TYPES.find(b => b.type === type)
    if (!found) return
    const newBlock: Block = {
      id: Date.now().toString(),
      type: found.type,
      icon: found.icon,
      label: found.label,
    }
    setBlocks(prev => [...prev, newBlock])
    setSelectedId(newBlock.id)
  }

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const moveBlock = (id: string, dir: 'up' | 'down') => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column' }}>

      {/* Top Bar */}
      <div
        style={{
          height: '56px',
          background: '#0C0B09',
          borderBottom: '1px solid rgba(201,168,76,0.12)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <a
          href="/dashboard"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '20px',
            fontWeight: 300,
            color: '#F5F0E8',
            textDecoration: 'none',
            marginRight: '8px',
          }}
        >
          QR<span style={{ color: '#C9A84C', fontWeight: 600 }}>folio</span>
        </a>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)' }} />

        {/* Page name */}
        <input
          value={pageName}
          onChange={e => setPageName(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#F5F0E8',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            outline: 'none',
            width: '160px',
          }}
        />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Preview toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          {(['mobile', 'desktop'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              style={{
                background: previewMode === mode ? 'rgba(201,168,76,0.15)' : 'transparent',
                border: 'none',
                color: previewMode === mode ? '#C9A84C' : '#8A8478',
                padding: '6px 14px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {mode === 'mobile' ? '📱' : '🖥️'} {mode === 'mobile' ? 'Mobile' : 'Desktop'}
            </button>
          ))}
        </div>

        {/* Actions */}
        <button
          style={{
            background: 'transparent',
            border: '1px solid rgba(201,168,76,0.25)',
            color: '#C9A84C',
            padding: '8px 16px',
            borderRadius: '2px',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Aperçu
        </button>
        <button
          style={{
            background: '#C9A84C',
            border: 'none',
            color: '#080808',
            padding: '8px 20px',
            borderRadius: '2px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Publier →
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT — Blocs disponibles */}
        <div
          style={{
            width: '220px',
            background: '#0C0B09',
            borderRight: '1px solid rgba(201,168,76,0.1)',
            padding: '20px 12px',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#C9A84C',
              marginBottom: '12px',
              paddingLeft: '8px',
            }}
          >
            Blocs
          </div>
          {BLOCK_TYPES.map(block => (
            <button
              key={block.type}
              onClick={() => addBlock(block.type)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: '4px',
                color: '#8A8478',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                textAlign: 'left',
                marginBottom: '2px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.06)'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#F5F0E8'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.15)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#8A8478'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
              }}
            >
              <span style={{ fontSize: '16px' }}>{block.icon}</span>
              {block.label}
              <span style={{ marginLeft: 'auto', fontSize: '16px', opacity: 0.4 }}>+</span>
            </button>
          ))}
        </div>

        {/* CENTER — Canvas */}
        <div
          style={{
            flex: 1,
            background: '#0A0908',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '32px 24px',
            overflowY: 'auto',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#4A4640',
              marginBottom: '16px',
            }}
          >
            Canvas — {blocks.length} bloc{blocks.length > 1 ? 's' : ''}
          </div>

          {blocks.length === 0 && (
            <div
              style={{
                border: '1px dashed rgba(201,168,76,0.15)',
                borderRadius: '8px',
                padding: '60px 40px',
                textAlign: 'center',
                color: '#4A4640',
                fontSize: '14px',
                maxWidth: '400px',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>+</div>
              Cliquez sur un bloc à gauche pour l'ajouter
            </div>
          )}

          {blocks.map((block, idx) => (
            <div
              key={block.id}
              onClick={() => setSelectedId(block.id)}
              style={{
                width: '100%',
                maxWidth: '520px',
                background: selectedId === block.id ? 'rgba(201,168,76,0.05)' : '#111009',
                border: `1px solid ${selectedId === block.id ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.1)'}`,
                borderRadius: '4px',
                padding: '16px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{block.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#F5F0E8' }}>{block.label}</div>
                <div style={{ fontSize: '11px', color: '#4A4640', marginTop: '2px' }}>
                  Bloc #{idx + 1} · {block.type}
                </div>
              </div>

              {/* Controls */}
              <div
                style={{ display: 'flex', gap: '4px' }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => moveBlock(block.id, 'up')}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '3px',
                    width: '26px',
                    height: '26px',
                    color: '#8A8478',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  disabled={idx === 0}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveBlock(block.id, 'down')}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '3px',
                    width: '26px',
                    height: '26px',
                    color: '#8A8478',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  disabled={idx === blocks.length - 1}
                >
                  ↓
                </button>
                <button
                  onClick={() => removeBlock(block.id)}
                  style={{
                    background: 'rgba(255,82,82,0.08)',
                    border: '1px solid rgba(255,82,82,0.2)',
                    borderRadius: '3px',
                    width: '26px',
                    height: '26px',
                    color: '#FF5252',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — Preview */}
        <div
          style={{
            width: '320px',
            background: '#0C0B09',
            borderLeft: '1px solid rgba(201,168,76,0.1)',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#C9A84C',
              marginBottom: '20px',
            }}
          >
            Preview {previewMode}
          </div>

          {/* Phone frame */}
          <div
            style={{
              width: '240px',
              minHeight: '420px',
              background: '#080808',
              border: '6px solid #1A1812',
              borderRadius: '32px',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60px',
                height: '12px',
                background: '#1A1812',
                borderRadius: '0 0 8px 8px',
                zIndex: 10,
              }}
            />

            {/* Page preview */}
            <div style={{ padding: '24px 16px 16px', paddingTop: '28px' }}>
              {/* Header of the page */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'rgba(201,168,76,0.15)',
                    border: '2px solid rgba(201,168,76,0.3)',
                    borderRadius: '50%',
                    margin: '0 auto 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  👤
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#F5F0E8', marginBottom: '2px' }}>
                  {pageName}
                </div>
                <div style={{ fontSize: '11px', color: '#8A8478' }}>qrfolio.app/ma-page</div>
              </div>

              {/* Blocks preview */}
              {blocks.map(block => (
                <div
                  key={block.id}
                  style={{
                    background: selectedId === block.id ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedId === block.id ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '6px',
                    padding: '10px 12px',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{block.icon}</span>
                  <span style={{ fontSize: '11px', color: '#8A8478' }}>{block.label}</span>
                </div>
              ))}

              {/* QRfolio branding */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <div style={{ fontSize: '9px', color: '#4A4640', letterSpacing: '1px' }}>
                  Créé avec QRfolio
                </div>
              </div>
            </div>
          </div>

          {/* URL */}
          <div
            style={{
              marginTop: '16px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '11px',
              color: '#8A8478',
              fontFamily: 'JetBrains Mono, monospace',
              width: '100%',
              textAlign: 'center',
            }}
          >
            qrfolio.app/ma-page
          </div>
        </div>
      </div>
    </div>
  )
}
