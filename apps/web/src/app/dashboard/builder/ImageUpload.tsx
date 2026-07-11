"use client"

import { useRef, useState } from "react"
import { Upload, X, Image as ImageIcon, FolderOpen } from "lucide-react"
import { useImageUpload } from "./useImageUpload"

type Props = {
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: string
}

export default function ImageUpload({ value, onChange, label, hint }: Props) {
  const { uploadImage, uploading, listAssets } = useImageUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const [libOpen, setLibOpen] = useState(false)
  const [libAssets, setLibAssets] = useState<{ name: string; url: string }[] | null>(null)

  async function openLibrary() {
    setLibOpen(true)
    if (libAssets === null) setLibAssets(await listAssets())
  }

  async function handleFile(file: File) {
    setError("")
    if (!file.type.startsWith("image/")) { setError("Fichier invalide — image uniquement"); return }
    if (file.size > 5 * 1024 * 1024) { setError("Fichier trop lourd — max 5MB"); return }
    const url = await uploadImage(file, "blocks")
    if (url) onChange(url)
    else setError("Erreur upload — réessaie")
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const G = "#C9A84C"
  const MUTED = "#8A8478"

  return (
    <div>
      {label && <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 500 }}>{label}</label>}

      {value ? (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(201,168,76,0.3)" }}>
          <img src={value} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }} />
          <button onClick={() => onChange("")}
            style={{ position: "absolute", top: 8, right: 8, background: "rgba(8,8,8,0.8)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FF6B6B" }}>
            <X size={14} />
          </button>
          <button onClick={() => inputRef.current?.click()}
            style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(201,168,76,0.9)", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: "#080808", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            <Upload size={11} /> Changer
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{ border: `2px dashed ${dragOver ? G : "rgba(201,168,76,0.2)"}`, borderRadius: 10, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(201,168,76,0.05)" : "transparent", transition: "all 0.2s" }}>
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, border: "2px solid rgba(201,168,76,0.2)", borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>Upload en cours...</p>
            </div>
          ) : (
            <>
              <div style={{ width: 40, height: 40, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <ImageIcon size={18} color={G} />
              </div>
              <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Clique ou glisse une image</p>
              <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{hint || "JPG, PNG, WebP — max 5MB"}</p>
            </>
          )}
        </div>
      )}

      <button type="button" onClick={openLibrary}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 7, background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = G} onMouseLeave={e => e.currentTarget.style.color = MUTED}>
        <FolderOpen size={12} /> Choisir dans ma bibliothèque
      </button>

      {error && <p style={{ color: "#FF6B6B", fontSize: 11, margin: "6px 0 0" }}>{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }} />

      {/* Bibliothèque d'images : réutiliser une image déjà uploadée (pas de ré-upload) */}
      {libOpen && (
        <div onClick={() => setLibOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 620, maxHeight: "80vh", background: "#141414", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 9 }}>
              <FolderOpen size={16} color={G} />
              <p style={{ margin: 0, color: "#F5F0E8", fontSize: 14, fontWeight: 700, flex: 1 }}>Ma bibliothèque d&apos;images</p>
              <button onClick={() => setLibOpen(false)} aria-label="Fermer" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: MUTED, cursor: "pointer", width: 28, height: 28 }}><X size={14} /></button>
            </div>
            <div style={{ padding: 14, overflowY: "auto" }}>
              {libAssets === null
                ? <p style={{ color: MUTED, fontSize: 12, textAlign: "center", padding: "30px 0" }}>Chargement…</p>
                : libAssets.length === 0
                ? <div style={{ textAlign: "center", padding: "34px 0" }}>
                    <p style={{ fontSize: 26, margin: "0 0 6px" }}>🖼️</p>
                    <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>Aucune image pour l&apos;instant. Uploadez-en une, elle apparaîtra ici.</p>
                  </div>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
                    {libAssets.map(a => (
                      <button key={a.url} onClick={() => { onChange(a.url); setLibOpen(false) }} title={a.name}
                        style={{ padding: 0, border: value === a.url ? `2px solid ${G}` : "1px solid rgba(255,255,255,0.1)", borderRadius: 9, overflow: "hidden", cursor: "pointer", background: "#0A0A0A", aspectRatio: "1" }}>
                        <img src={a.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </button>
                    ))}
                  </div>}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
