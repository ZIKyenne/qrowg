"use client"

import { useState } from "react"
import ImageUpload from "@/app/dashboard/builder/ImageUpload"

// Une image déjà posée : c'est alors que « Changer d'image… » ouvre le choix de
// la source — la feuille d'actions mesurée par e2e/choixDImage.spec.ts.
export default function BancImageUpload() {
  const [url, setUrl] = useState("/apercus/artisan_batiment.jpg")
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg, #0b0b0b)", color: "var(--ink, #eee)", padding: 16 }}>
      <h1 style={{ fontSize: 18 }}>Champ image (démo)</h1>
      <ImageUpload value={url} onChange={setUrl} label="Photo de couverture" />
    </div>
  )
}
