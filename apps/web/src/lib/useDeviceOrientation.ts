"use client"

import { useEffect, useState } from "react"

export interface DeviceOrientation {
  width: number
  height: number
  isPortrait: boolean
  isMobile: boolean   // plus petit côté < 768px (= téléphone, peu importe l'orientation)
  isTouch: boolean    // pointeur grossier / écran tactile
}

function compute(): DeviceOrientation {
  if (typeof window === "undefined") {
    return { width: 0, height: 0, isPortrait: false, isMobile: false, isTouch: false }
  }
  const width = window.innerWidth
  const height = window.innerHeight
  const isTouch =
    (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) ||
    (navigator.maxTouchPoints ?? 0) > 0
  return {
    width,
    height,
    isPortrait: height >= width,
    isMobile: Math.min(width, height) < 768,
    isTouch,
  }
}

/**
 * Orientation & nature de l'appareil. SSR-safe (init paresseuse côté client),
 * écoute resize + orientationchange + screen.orientation, cleanup complet.
 */
export function useDeviceOrientation(): DeviceOrientation {
  const [state, setState] = useState<DeviceOrientation>(compute)

  useEffect(() => {
    const update = () => setState(compute())
    update() // resynchronise au montage (cas où l'init paresseuse a tourné en SSR)
    window.addEventListener("resize", update)
    window.addEventListener("orientationchange", update)
    const so = (screen as Screen & { orientation?: { addEventListener?: Function; removeEventListener?: Function } }).orientation
    so?.addEventListener?.("change", update)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("orientationchange", update)
      so?.removeEventListener?.("change", update)
    }
  }, [])

  return state
}
