'use client'

import { useState, useEffect, useCallback } from 'react'
import { saveBlocks, updatePage } from '../../../actions/pages'

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
  position: number
  content: Record<string, unknown>
  styles: Record<string, unknown>
  is_visible: boolean
}

type Page = {
  id: string
  title: string
  slug: string
  status: string
  theme: Record<string, string>
}

type BuilderClientProps = {
  page: Page
  initialBlocks: Block[]
}

export default function BuilderClient({ page, initialBlocks }: BuilderClientProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [pageName, setPageName] = useState(page.title)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [isPublishing, setIsPublishing] = useState(false)

  // Autosave toutes les 30 secondes
  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    const result = await saveBlocks(page.id, blocks.map((b, i) => ({
      type: b.type,
      position: i,
      content: b.content,
      styles: b.styles,
      is_visible: b.is_visible,
    })))
    if (!result.error) {
      setSaveStatus('saved')
    }
  }, [page.id, blocks])

  useEffect(() => {
    setSaveStatus('unsaved')
  }, [blocks, pageName])

  useEffect(() => {
    const timer = setInterval(handleSave, 30000)
    return () => clearInterval(timer)
  }, [handleSave])

  const handlePublish = async () => {
    setIsPublishing(true)
    await handleSave()
    await updatePage(page.id, {
      title: pageName,
      status: 'published',
    })
    setIsPublishing(false)
    window.open('/' + page.slug, '_blank')
  }

  const addBlock = (type: string) => {
    const found = BLOCK_TYPES.find(b => b.type === type)
    if (!found) return
    const newBlock: Block = {
      id: Date.now().toString(),
      type: found.type,
      icon: found.icon,
      label: found.label,
      position: blocks.length,
      content: {},
      styles: {},
      is_visible: true,
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
      ;[next[idx], next[swap]] = [next[swap]!, next[idx]!]
      return next
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column' }}>

      {/* Top Bar */}
      <div style={{
        height: '56px', background: '#0C0B09',
        borderBottom: '1px solid rgba(201,168,76,0.12)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', flexShrink: 0,
      }}>
        <a href="/dashboard" style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 300,
          color: '#F5F0E8', textDecoration: 'none',
        }}>
          QR<span style={{ color: '#C9A84C', fontWeight: 600 }}>folio</span>
        </a>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />

        <input
          value={pageName}
          onChange={e => setPageName(e.target.value)}
          onBlur={() => updatePage(page.id, { title: pageName })}
          style={{
            background: 'transparent', border: 'none', color: '#F5F0E8',
            fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none', width: '200px',
          }}
        />

        {/* Save status */}
        <div style={{ fontSize: '12px', color: saveStatus === 'saved' ? '#39FF8F' : saveStatus === 'saving' ? '#C9A84C' : '#8A8478' }}>
          {saveStatus === 'saved' ? '✓ Sauvegardé' : saveStatus === 'saving' ? '⏳ Sauvegarde...' : '● Modifications non sauvegardées'}
        </div>

        <div style={{ flex: 1 }} />

        {/* Preview toggle */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden',
        }}>
          {(['mobile', 'desktop'] as const).map(mode => (
            <button key={mode} onClick={() => setPreviewMode(mode)} style={{
              background: previewMode === mode ? 'rgba(201,168,76,0.15)' : 'transparent',
              border: 'none', color: previewMode === mode ? '#C9A84C' : '#8A8478',
              padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>
              {mode === 'mobile' ? '📱' : '🖥️'}
            </button>
          ))}
        </div>

        <button onClick={handleSave} style={{
          background: 'transparent', border: '1px solid rgba(201,168,76,0.25)',
          color: '#C9A84C', padding: '7px 14px', borderRadius: '2px',
          fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
        }}>
          Sauvegarder
        </button>

        <button onClick={handlePublish} disabled={isPublishing} style={{
          background: '#C9A84C', border: 'none', color: '#080808',
          padding: '8px 18px', borderRadius: '2px', fontSize: '13px',
          fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
        }}>
          {isPublishing ? '...' : 'Publier →'}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT — Blocs */}
        <div style={{
          width: '210px', background: '#0C0B09',
          borderRight: '1px solid rgba(201,168,76,0.1)',
          padding: '16px 10px', overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '10px', paddingLeft: '8px' }}>
            Ajouter un bloc
          </div>
          {BLOCK_TYPES.map(block => (
            <button key={block.type} onClick={() => addBlock(block.type)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', background: 'transparent', border: '1px solid transparent',
              borderRadius: '4px', color: '#8A8478', fontSize: '13px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', textAlign: 'left', marginBottom: '2px',
            }}>
              <span style={{ fontSize: '15px' }}>{block.icon}</span>
              {block.label}
              <span style={{ marginLeft: 'auto', opacity: 0.4 }}>+</span>
            </button>
          ))}
        </div>

        {/* CENTER — Canvas */}
        <div style={{
          flex: 1, background: '#0A0908', display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '24px 16px', overflowY: 'auto', gap: '3px',
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#4A4640', marginBottom: '12px' }}>
            {blocks.length} bloc{blocks.length > 1 ? 's' : ''}
            {page.status === 'published' && (
              <a href={'/' + page.slug} target="_blank" style={{ marginLeft: '12px', color: '#39FF8F', textDecoration: 'none' }}>
                ↗ Voir la page live
              </a>
            )}
          </div>

          {blocks.length === 0 && (
            <div style={{
              border: '1px dashed rgba(201,168,76,0.15)', borderRadius: '8px',
              padding: '60px 40px', textAlign: 'center', color: '#4A4640', fontSize: '14px',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>+</div>
              Ajoutez des blocs depuis le panneau gauche
            </div>
          )}

          {blocks.map((block, idx) => (
            <div key={block.id} onClick={() => setSelectedId(block.id)} style={{
              width: '100%', maxWidth: '520px',
              background: selectedId === block.id ? 'rgba(201,168,76,0.05)' : '#111009',
              border: '1px solid ' + (selectedId === block.id ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.1)'),
              borderRadius: '4px', padding: '14px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{block.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#F5F0E8' }}>{block.label}</div>
                <div style={{ fontSize: '10px', color: '#4A4640', marginTop: '1px' }}>Bloc #{idx + 1}</div>
              </div>
              <div style={{ display: 'flex', gap: '3px' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => moveBlock(block.id, 'up')} disabled={idx === 0} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '3px', width: '24px', height: '24px', color: '#8A8478',
                  cursor: 'pointer', fontSize: '11px',
                }}>↑</button>
                <button onClick={() => moveBlock(block.id, 'down')} disabled={idx === blocks.length - 1} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '3px', width: '24px', height: '24px', color: '#8A8478',
                  cursor: 'pointer', fontSize: '11px',
                }}>↓</button>
                <button onClick={() => removeBlock(block.id)} style={{
                  background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)',
                  borderRadius: '3px', width: '24px', height: '24px', color: '#FF5252',
                  cursor: 'pointer', fontSize: '12px',
                }}>×</button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — Preview */}
        <div style={{
          width: '300px', background: '#0C0B09',
          borderLeft: '1px solid rgba(201,168,76,0.1)',
          padding: '20px 16px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', flexShrink: 0, overflowY: 'auto',
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '16px' }}>
            Preview {previewMode}
          </div>

          {/* Phone frame */}
          <div style={{
            width: '220px', minHeight: '400px', background: '#080808',
            border: '5px solid #1A1812', borderRadius: '28px', overflow: 'hidden',
            boxShadow: '0 0 32px rgba(0,0,0,0.6)', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '52px', height: '10px', background: '#1A1812', borderRadius: '0 0 6px 6px', zIndex: 10,
            }} />
            <div style={{ padding: '20px 12px 12px' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{
                  width: '52px', height: '52px', background: 'rgba(201,168,76,0.15)',
                  border: '2px solid rgba(201,168,76,0.3)', borderRadius: '50%',
                  margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                }}>👤</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#F5F0E8' }}>{pageName}</div>
                <div style={{ fontSize: '10px', color: '#8A8478' }}>{appUrl}/{page.slug}</div>
              </div>
              {blocks.map(block => (
                <div key={block.id} style={{
                  background: selectedId === block.id ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid ' + (selectedId === block.id ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.05)'),
                  borderRadius: '5px', padding: '8px 10px', marginBottom: '4px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{ fontSize: '12px' }}>{block.icon}</span>
                  <span style={{ fontSize: '10px', color: '#8A8478' }}>{block.label}</span>
                </div>
              ))}
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <div style={{ fontSize: '8px', color: '#4A4640', letterSpacing: '0.5px' }}>Créé avec QRfolio</div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '12px', background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px',
            padding: '6px 10px', fontSize: '10px', color: '#8A8478',
            fontFamily: 'JetBrains Mono, monospace', width: '100%', textAlign: 'center',
          }}>
            {appUrl}/{page.slug}
          </div>
        </div>
      </div>
    </div>
  )
}
