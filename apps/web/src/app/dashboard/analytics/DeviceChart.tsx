"use client"

import { useEffect, useRef } from "react"

type DeviceData = { name: string; value: number }

const DEVICE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  mobile:  { icon: "📱", color: "#C9A84C", label: "Mobile" },
  desktop: { icon: "💻", color: "#39FF8F", label: "Desktop" },
  tablet:  { icon: "📟", color: "#7B61FF", label: "Tablette" },
  unknown: { icon: "❓", color: "#A8A190", label: "Inconnu" },
}

function ProgressRing({ value, max, color, size = 64 }: { value: number; max: number; color: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pct = max === 0 ? 0 : value / max

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2, cy = size / 2, r = size / 2 - 5
    const start = -Math.PI / 2
    const end = start + pct * 2 * Math.PI

    // Track
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(255,255,255,0.06)"
    ctx.lineWidth = 5
    ctx.stroke()

    // Progress
    if (pct > 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, start, end)
      ctx.strokeStyle = color
      ctx.lineWidth = 5
      ctx.lineCap = "round"
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.stroke()
    }
  }, [value, max, color, size, pct])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: "block" }}
    />
  )
}

export default function DeviceChart({ data }: { data: DeviceData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const max = sorted[0]?.value || 1

  if (total === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
        <p style={{ color: "#A8A190", fontSize: 14 }}>Pas encore de données</p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sorted.map((d) => {
        const cfg = DEVICE_CONFIG[d.name.toLowerCase()] || DEVICE_CONFIG.unknown
        const pct = total === 0 ? 0 : Math.round((d.value / total) * 100)

        return (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Ring */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ProgressRing value={d.value} max={max} color={cfg.color} size={52} />
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18
              }}>
                {cfg.icon}
              </div>
            </div>

            {/* Bar + label */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600 }}>{cfg.label}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: cfg.color, fontSize: 13, fontWeight: 700 }}>{pct}%</span>
                  <span style={{ color: "#A8A190", fontSize: 12 }}>{d.value} scans</span>
                </div>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${cfg.color}99, ${cfg.color})`,
                  borderRadius: 3,
                  boxShadow: `0 0 8px ${cfg.color}60`,
                  transition: "width 1s ease"
                }} />
              </div>
            </div>
          </div>
        )
      })}

      {/* Total */}
      <div style={{
        marginTop: 4, paddingTop: 12,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span style={{ color: "#A8A190", fontSize: 12 }}>Total scans trackés</span>
        <span style={{ color: "#C9A84C", fontSize: 16, fontWeight: 700, fontFamily: "Cormorant Garamond, serif" }}>{total}</span>
      </div>
    </div>
  )
}
