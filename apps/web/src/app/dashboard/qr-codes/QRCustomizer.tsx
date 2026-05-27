'use client'

import { useEffect, useRef, useState } from 'react'

type QRCustomizerProps = {
  value: string
  shortCode: string
  totalScans?: number
  pageTitle?: string
}

export default function QRCustomizer({ value, shortCode, totalScans = 0, pageTitle = '' }: QRCustomizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fgColor, setFgColor] = useState('#080808')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [size, setSize] = useState(256)
  const [copied, setCopied] = useState(false)

  // Dessiner le QR code via une librairie CDN
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Utiliser l'API QR de Google Charts pour le dessin
    const img = new Image()
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&format=png&qzone=1`

    img.onload = () => {
      canvas.width = size
      canvas.height = size
      ctx.drawImage(img, 0, 0, size, size)
    }
    img.crossOrigin = 'anonymous'
    img.src = qrUrl
  }, [value, fgColor, bgColor, size])

  const downloadPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `qrfolio-${shortCode}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const downloadHD = () => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(value)}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&format=png&qzone=2`
    const link = document.createElement('a')
    link.download = `qrfolio-${shortCode}-HD.png`
    link.href = url
    link.target = '_blank'
    link.click()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>

      {/* QR Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{
          background: bgColor,
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(201,168,76,0.2)',
          boxShadow: '0 0 24px rgba(0,0,0,0.4)',
        }}>
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            style={{ display: 'block', width: '200px', height: '200px' }}
          />
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '16px', textAlign: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 300, color: '#C9A84C', lineHeight: 1 }}>
              {totalScans}
            </div>
            <div style={{ fontSize: '11px', color: '#8A8478', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>
              Scans
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 300, color: '#C9A84C', lineHeight: 1 }}>
              {shortCode}
            </div>
            <div style={{ fontSize: '11px', color: '#8A8478', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>
              Code
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={downloadPNG} style={{
            background: '#C9A84C', color: '#080808', border: 'none',
            padding: '8px 16px', borderRadius: '2px', fontSize: '12px',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}>
            ⬇ PNG
          </button>
          <button onClick={downloadHD} style={{
            background: 'transparent', color: '#C9A84C',
            border: '1px solid rgba(201,168,76,0.3)',
            padding: '8px 16px', borderRadius: '2px', fontSize: '12px',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}>
            ⬇ HD Print
          </button>
          <button onClick={copyLink} style={{
            background: 'transparent', color: copied ? '#39FF8F' : '#8A8478',
            border: '1px solid ' + (copied ? 'rgba(57,255,143,0.3)' : 'rgba(255,255,255,0.1)'),
            padding: '8px 16px', borderRadius: '2px', fontSize: '12px',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}>
            {copied ? '✓ Copié !' : '🔗 Copier le lien'}
          </button>
        </div>
      </div>

      {/* Customization */}
      <div style={{ flex: 1, minWidth: '240px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '20px' }}>
          Personnalisation
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Couleur QR */}
          <div>
            <label style={{ fontSize: '12px', color: '#8A8478', display: 'block', marginBottom: '6px' }}>
              Couleur du QR
            </label>
            <div style={{ display: 'flex', align: 'center', gap: '10px' }}>
              <input
                type="color"
                value={fgColor}
                onChange={e => setFgColor(e.target.value)}
                style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
              />
              <input
                type="text"
                value={fgColor}
                onChange={e => setFgColor(e.target.value)}
                style={{
                  flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px', padding: '8px 12px', color: '#F5F0E8',
                  fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Couleur fond */}
          <div>
            <label style={{ fontSize: '12px', color: '#8A8478', display: 'block', marginBottom: '6px' }}>
              Couleur de fond
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
              />
              <input
                type="text"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                style={{
                  flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px', padding: '8px 12px', color: '#F5F0E8',
                  fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Taille */}
          <div>
            <label style={{ fontSize: '12px', color: '#8A8478', display: 'block', marginBottom: '6px' }}>
              Taille aperçu : {size}px
            </label>
            <input
              type="range"
              min={128}
              max={400}
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#C9A84C' }}
            />
          </div>

          {/* Presets de couleurs */}
          <div>
            <label style={{ fontSize: '12px', color: '#8A8478', display: 'block', marginBottom: '8px' }}>
              Presets
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { fg: '#080808', bg: '#FFFFFF', label: 'Classic' },
                { fg: '#C9A84C', bg: '#080808', label: 'Gold' },
                { fg: '#39FF8F', bg: '#080808', label: 'Neon' },
                { fg: '#0078D4', bg: '#FFFFFF', label: 'Blue' },
                { fg: '#FF5252', bg: '#FFFFFF', label: 'Red' },
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => { setFgColor(preset.fg); setBgColor(preset.bg) }}
                  style={{
                    background: preset.bg, color: preset.fg,
                    border: '2px solid ' + preset.fg,
                    padding: '4px 10px', borderRadius: '3px',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* URL info */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '4px', padding: '12px',
          }}>
            <div style={{ fontSize: '10px', color: '#8A8478', marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              URL du QR Code
            </div>
            <div style={{ fontSize: '12px', color: '#C9A84C', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>
              {value}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
