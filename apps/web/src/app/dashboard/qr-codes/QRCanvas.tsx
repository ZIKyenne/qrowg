"use client"

// QRCanvas — vignette QR generee 100% en local (qr-code-styling), sans dependance
// a une API externe. Reutilisable partout ou l'on veut un apercu scannable.
import { useEffect, useRef } from "react"
import { createQR, updateQR, type QROptions } from "./qrRender"

export default function QRCanvas({
  value,
  size = 120,
  fg = "#080808",
  bg = "#FFFFFF",
}: {
  value: string
  size?: number
  fg?: string
  bg?: string
}) {
  const holder = useRef<HTMLDivElement>(null)
  const qr = useRef<ReturnType<typeof createQR> | null>(null)

  useEffect(() => {
    const opts: QROptions = { data: value || "https://qrfolio.app", fg, bg, ecc: "M", style: {}, size }
    if (!qr.current) {
      qr.current = createQR(opts)
      if (holder.current) {
        holder.current.innerHTML = ""
        qr.current.append(holder.current)
      }
    } else {
      updateQR(qr.current, opts)
    }
  }, [value, size, fg, bg])

  return <div ref={holder} style={{ width: size, height: size, lineHeight: 0 }} />
}
